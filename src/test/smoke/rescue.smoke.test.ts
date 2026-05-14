import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rescueService } from '../../../src/services/rescueService';
import { getTodayStr } from '../../../src/services/core/utils';

const mocks = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
            auth: {
                getUser: vi.fn(),
                onAuthStateChange: vi.fn()
            }
        }
    };
});

vi.mock('@supabase/supabase-js', async () => {
    return {
        createClient: vi.fn(() => mocks.mockSupabase)
    };
});

vi.mock('../../../src/lib/supabase', () => {
    return {
        supabase: mocks.mockSupabase
    };
});

describe('Rescue Smoke Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } });
    });

    it('should return existing active session instead of creating a new one', async () => {
        const today = getTodayStr();

        const mockEq3 = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [{ id: 's-1', status: 'active', date: today }] }) });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockEqProfile = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today } }) });
        
        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return { select: vi.fn().mockReturnValue({ eq: mockEqProfile }) } as any;
            }
            if (table === 'rescue_sessions') {
                return { select: vi.fn().mockReturnValue({ eq: mockEq2 }) } as any;
            }
            return {} as any;
        });

        const session = await rescueService.startRescueSession();

        expect(session).toEqual({ id: 's-1', status: 'active', date: today });
        // Make sure no insert was called
        expect(mocks.mockSupabase.from('rescue_sessions').insert).toBeUndefined(); // we didn't even mock it, but if it was called it would throw
    });
    
    it('should reactivate a cancelled session', async () => {
        const today = getTodayStr();

        const mockEq3 = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [{ id: 's-1', status: 'cancelled', date: today }] }) });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockEqProfile = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today } }) });
        const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 's-1', status: 'active', date: today } }) }) }) });

        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return { select: vi.fn().mockReturnValue({ eq: mockEqProfile }) } as any;
            }
            if (table === 'rescue_sessions') {
                return { 
                    select: vi.fn().mockReturnValue({ eq: mockEq2 }),
                    update: updateSpy
                } as any;
            }
            return {} as any;
        });

        const session = await rescueService.startRescueSession();
        expect(session.status).toBe('active');
        
        expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
    });

    it('should handle multiple existing sessions gracefully using limit(1)', async () => {
        const today = getTodayStr();

        // Simulate returning 1 item because of limit(1) even if there are theoretically multiple in DB
        const mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 's-1', status: 'cancelled', date: today }] });
        const mockEq3 = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
        const mockEqProfile = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today } }) });
        const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 's-1', status: 'active', date: today } }) }) }) });

        mocks.mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') {
                return { select: vi.fn().mockReturnValue({ eq: mockEqProfile }) } as any;
            }
            if (table === 'rescue_sessions') {
                return { 
                    select: vi.fn().mockReturnValue({ eq: mockEq2 }),
                    update: updateSpy
                } as any;
            }
            return {} as any;
        });

        const session = await rescueService.startRescueSession();
        expect(mockLimit).toHaveBeenCalledWith(1); // Ensures we are guarding against multiple rows crash
        expect(session.status).toBe('active');
    });
});
