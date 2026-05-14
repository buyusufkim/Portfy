import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

const mocks = vi.hoisted(() => {
    return {
        mockSupabaseAdmin: {
            from: vi.fn(),
            rpc: vi.fn()
        },
        mockSupabase: {
            from: vi.fn(),
            auth: {
                onAuthStateChange: vi.fn(),
                getSession: vi.fn(),
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
            }
        }
    };
});

vi.mock('@supabase/supabase-js', async () => {
    const actual = await vi.importActual('@supabase/supabase-js');
    return {
        ...actual as any,
        createClient: vi.fn(() => mocks.mockSupabaseAdmin)
    };
});

vi.mock('../../lib/supabase', () => {
    return {
        supabase: mocks.mockSupabase
    };
});

// Setting env vars for creation
process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Must import AFTER mock
import { handleSaveDayClosure, handleEarnXP } from '../../../server/ai-api';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../services/profileService';

describe('Day Ritual Smoke Tests', () => {
    let mockReq: any;
    let mockRes: any;
    
    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            user: { id: 'test-user-id' },
            body: {}
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    describe('Day Start / Day Close Guard', () => {
        it('should block day close if the day has not started today', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { last_day_started_at: yesterday.toISOString() }
                                })
                            })
                        })
                    } as any;
                }
                return {} as any;
            });

            await handleSaveDayClosure(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Gün başlatılmadan Günü Kapatılamaz.' });
        });

        it('should block END_DAY XP if day has not started today', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            mockReq.body = { actionType: 'END_DAY', stats: {} };

            mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { last_day_started_at: yesterday.toISOString() }
                                })
                            })
                        })
                    } as any;
                }
                return {} as any;
            });

            await handleEarnXP(mockReq as any, mockRes as any);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Gün başlatılmadan bu aksiyon çalışmaz.' });
        });

        it('should allow day close if the day has started today', async () => {
             const today = new Date();

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { last_day_started_at: today.toISOString() }
                                })
                            })
                        })
                    } as any;
                 }
                 if (table === 'day_closure') {
                     return {
                         select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    maybeSingle: vi.fn().mockResolvedValue({ data: null })
                                })
                            })
                         }),
                         upsert: vi.fn().mockReturnValue({
                             select: vi.fn().mockReturnValue({
                                 single: vi.fn().mockResolvedValue({ data: { id: 'new-closure' }, error: null })
                             })
                         })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     return {
                         select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnValue({
                                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-1', current_day: 1 } })
                                })
                            })
                         }),
                         update: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: null, error: null })
                         })
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);

             expect(mockRes.status).not.toHaveBeenCalledWith(403);
             expect(mockRes.json).toHaveBeenCalledWith({ id: 'new-closure' });
        });
    });

    describe('Campaign 90 Progression', () => {
        it('should allow day close securely without campaign update if no campaign is active', async () => {
             const today = new Date();
             mockReq.body = {}; // No campaign_day, maybe it's not even a requirement
             
             const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }), // No closure yet
                         upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-closure' }, error: null }) }) })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     // No campaign active
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }),
                         update: updateSpy
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);
             
             // Update on advisor campaigns should never be called
             expect(updateSpy).not.toHaveBeenCalled();
             // Should successfully return the closure id
             expect(mockRes.json).toHaveBeenCalledWith({ id: 'new-closure' });
        });

        it('should increment campaign day on first successful day closure', async () => {
             const today = new Date();
             mockReq.body = { campaign_day: 1 };
             
             const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

             // First day closure (does not exist yet)
             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }), // No closure
                         upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-closure' }, error: null }) }) })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-1', current_day: 1 } }) }) }) }),
                         update: updateSpy
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);
             
             expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ current_day: 2, current_week: 1 }));
        });

        it('should NOT increment campaign day on second day closure (idempotency)', async () => {
             const today = new Date();
             mockReq.body = { campaign_day: 2 };
             
             const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

             // Second day closure (already exists)
             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'old-closure' } }) }) }) }), // Exists
                         upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'old-closure' }, error: null }) }) })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-1', current_day: 2 } }) }) }) }),
                         update: updateSpy
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);
             
             expect(updateSpy).not.toHaveBeenCalled();
        });
        it('should NOT increment campaign day if payload campaign_day is stale (backend authoritative)', async () => {
             const today = new Date();
             // Client sends an outdated campaign day
             mockReq.body = { campaign_day: 1 };
             
             const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                     // First closure of the day
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }),
                         upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-closure' }, error: null }) }) })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     return {
                         // But DB says current_day is already 2
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-1', current_day: 2 } }) }) }) }),
                         update: updateSpy
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);
             
             expect(updateSpy).not.toHaveBeenCalled();
        });

        it('should NOT increment campaign day past 90 (stays at 90)', async () => {
             const today = new Date();
             mockReq.body = { campaign_day: 90 };
             
             const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }), // Exists
                         upsert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'new-closure' }, error: null }) }) })
                     } as any;
                 }
                 if (table === 'advisor_campaigns') {
                     return {
                         select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-1', current_day: 90 } }) }) }) }),
                         update: updateSpy
                     } as any;
                 }
                 return {} as any;
             });

             await handleSaveDayClosure(mockReq as any, mockRes as any);
             
             // Check if it's updated with current_day: 90 (or not updated at all, but the math says it sends 90)
             expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ current_day: 90 }));
        });
    });

    describe('Day Close Partial Failure Guard', () => {
        it('should throw an error from profileService.endDay if XP service fails, preventing false success flow', async () => {
             // Mock auth to succeed
             const sessionMock = vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: { access_token: 'dummy' } } } as any);
             
             // Setup fetch to fail for END_DAY
             global.fetch = vi.fn().mockResolvedValue({
                 ok: false,
                 json: vi.fn().mockResolvedValue({ error: 'END_DAY failed due to previous closure' })
             });

             const stats = { completed_calls: 5 };
             await expect(profileService.endDay(stats)).rejects.toThrow('END_DAY failed due to previous closure');
             
             sessionMock.mockRestore();
        });
    });

    describe('RESCUE_SESSION_BONUS Idempotency & Security', () => {
        it('should return 403 if day is not started', async () => {
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             mockReq.body = { actionType: 'RESCUE_SESSION_BONUS', sessionId: 's-1' };

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: yesterday.toISOString() } }) }) }) } as any;
                 }
                 return {} as any;
             });

             await handleEarnXP(mockReq, mockRes);
             expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should return 403 if day is already closed', async () => {
             const today = new Date();
             mockReq.body = { actionType: 'RESCUE_SESSION_BONUS', sessionId: 's-1' };

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'closure-1' } }) }) }) }) } as any;
                 }
                 return {} as any;
             });

             await handleEarnXP(mockReq, mockRes);
             expect(mockRes.status).toHaveBeenCalledWith(403);
             expect(mockRes.json).toHaveBeenCalledWith({ error: "Gün kapatıldıktan sonra kurtarma seansı tamamlanamaz." });
        });

        it('should return 403 if the rescue session does not belong to the user', async () => {
             const today = new Date();
             mockReq.body = { actionType: 'RESCUE_SESSION_BONUS', sessionId: 's-1' };

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }) } as any;
                 }
                 if (table === 'rescue_sessions') {
                    // Returns session belonging to another user
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'another-user' } }) }) }) } as any;
                 }
                 return {} as any;
             });

             await handleEarnXP(mockReq, mockRes);
             expect(mockRes.status).toHaveBeenCalledWith(403);
             expect(mockRes.json).toHaveBeenCalledWith({ error: "Bu oturum size ait değil." });
        });

        it('should not award XP again for the same rescue session ID (per-session idempotency)', async () => {
             const today = new Date();
             mockReq.body = { actionType: 'RESCUE_SESSION_BONUS', sessionId: 's-1' };

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString() } }) }) }) } as any;
                 }
                 if (table === 'day_closure') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }) } as any;
                 }
                 if (table === 'rescue_sessions') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'test-user-id' } }) }) }) } as any;
                 }
                 if (table === 'user_activity_log') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [{ id: 'log-1' }] }) }) }) }) }) } as any;
                 }
                 return {} as any;
             });

             await handleEarnXP(mockReq, mockRes);
             expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: "XP already awarded", xp_awarded: 0 });
        });

        it('should award XP if ownership is valid and not already logged', async () => {
             const today = new Date();
             mockReq.body = { actionType: 'RESCUE_SESSION_BONUS', sessionId: 's-1' };

             const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });

             mocks.mockSupabaseAdmin.from.mockImplementation((table: string) => {
                 if (table === 'profiles') {
                    return { 
                        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { last_day_started_at: today.toISOString(), total_xp: 0 } }) }) }),
                        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
                    } as any;
                 }
                 if (table === 'day_closure') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }) } as any;
                 }
                 if (table === 'rescue_sessions') {
                    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'test-user-id' } }) }) }) } as any;
                 }
                 if (table === 'user_activity_log') {
                    return { 
                        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) }) }) }) }),
                        insert: insertSpy
                    } as any;
                 }
                 if (table === 'user_stats') {
                    return {
                        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }) }),
                        insert: vi.fn().mockResolvedValue({ data: null, error: null })
                    } as any;
                 }
                 return {} as any;
             });

             await handleEarnXP(mockReq, mockRes);
             expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'test-user-id', action_type: 'RESCUE_SESSION_BONUS', entity_id: 's-1' }));
             expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, xp_awarded: 100 }));
        });
    });
});
