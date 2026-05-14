import { describe, it, expect, vi, beforeEach } from 'vitest';
import { campaign90Service } from '../../../src/services/campaign90Service';
import { getTodayStr } from '../../../src/services/core/utils';

const mocks = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
            auth: {
                onAuthStateChange: vi.fn()
            }
        }
    };
});

vi.mock('@supabase/supabase-js', async () => {
    const actual = await vi.importActual('@supabase/supabase-js');
    return {
        ...actual as any,
        createClient: vi.fn(() => mocks.mockSupabase)
    };
});

vi.mock('../../../src/lib/supabase', () => {
    return {
        supabase: mocks.mockSupabase
    };
});

describe('Campaign 90 Tasks Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch today’s campaign tasks based on current_day, not due_date', async () => {
        const mockCampaign = { id: 'c-1', current_day: 5, user_id: 'u-1', start_date: '2026-05-01' };
        
        // Mock getActiveCampaign
        const spyGetActive = vi.spyOn(campaign90Service, 'getActiveCampaign').mockResolvedValue(mockCampaign as any);
        const spyEnsure = vi.spyOn(campaign90Service, 'ensureTodayCampaignTasks').mockResolvedValue(true as any);

        const mockEq3 = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 't-1' }] }) });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq2 });

        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'campaign_tasks') {
                return { select: mockSelect } as any;
            }
            return {} as any;
        });

        const today = getTodayStr(new Date());
        const result = await campaign90Service.getTodayCampaignTasks('u-1', today);

        expect(spyGetActive).toHaveBeenCalledWith('u-1');
        expect(mockEq2).toHaveBeenCalledWith('campaign_id', 'c-1');
        expect(mockEq3).toHaveBeenCalledWith('day_number', 5);
        expect(result).toHaveLength(1);
    });

    it('should ignore start_date calendar difference and rely strictly on current_day', async () => {
        const mockCampaign = { id: 'c-1', current_day: 5, user_id: 'u-1', start_date: '2026-01-01' }; // Started 4 months ago
        
        const spyGetActive = vi.spyOn(campaign90Service, 'getActiveCampaign').mockResolvedValue(mockCampaign as any);
        const spyEnsure = vi.spyOn(campaign90Service, 'ensureTodayCampaignTasks').mockResolvedValue(true as any);

        const mockEq3 = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 't-1' }] }) });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq2 });

        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'campaign_tasks') {
                return { select: mockSelect } as any;
            }
            return {} as any;
        });

        const today = getTodayStr(new Date());
        await campaign90Service.getTodayCampaignTasks('u-1', today);

        expect(mockEq3).toHaveBeenCalledWith('day_number', 5); // Should still use day 5, despite date diff
    });

    it('should fetch updated tasks when current_day increments after day close', async () => {
        let mockCampaign = { id: 'c-1', current_day: 5, user_id: 'u-1', start_date: '2026-05-01' };
        
        const spyGetActive = vi.spyOn(campaign90Service, 'getActiveCampaign').mockImplementation(async () => mockCampaign as any);
        const spyEnsure = vi.spyOn(campaign90Service, 'ensureTodayCampaignTasks').mockResolvedValue(true as any);

        const mockEq3 = vi.fn().mockImplementation((col, val) => {
             return { order: vi.fn().mockResolvedValue({ data: [{ id: `t-${val}` }] }) };
        });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq2 });

        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'campaign_tasks') {
                return { select: mockSelect } as any;
            }
            return {} as any;
        });

        const today = getTodayStr(new Date());
        const res5 = await campaign90Service.getTodayCampaignTasks('u-1', today);
        expect(mockEq3).toHaveBeenCalledWith('day_number', 5);
        expect(res5[0].id).toBe('t-5');

        // Simulate day close backend increment
        mockCampaign.current_day = 6;
        
        const res6 = await campaign90Service.getTodayCampaignTasks('u-1', today);
        expect(mockEq3).toHaveBeenCalledWith('day_number', 6);
        expect(res6[0].id).toBe('t-6');
    });
});
