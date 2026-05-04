import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getTodayStr } from '../services/core/utils';

export interface Campaign90Stats {
    missedFollowups: number;
    hotLeadsTouched: number;
    buyersTenantsAdded: number;
    silenceRiskCount: number;
    showingTasksToFollowUp: number;
    addedPropertiesToday: number;
    activePropertiesCount: number;
    lowHealthPropertiesCount: number;
    oldPropertiesCount: number;
    attentionNeededCount: number;
}

export function useCampaign90Stats(userId: string | undefined) {
    const todayStr = getTodayStr(new Date());

    return useQuery({
        queryKey: ['campaign_crm_stats', userId, todayStr],
        queryFn: async (): Promise<Campaign90Stats | null> => {
            if (!userId) return null;
            
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const [leadsResp, tasksResp, propertiesResp] = await Promise.all([
                supabase.from('leads').select('*').eq('user_id', userId),
                supabase.from('tasks').select('*').eq('user_id', userId),
                supabase.from('properties').select('*').eq('user_id', userId)
            ]);

            const leads = leadsResp.data || [];
            const allTasks = tasksResp.data || [];
            const properties = propertiesResp.data || [];

            let missedFollowups = 0;
            let hotLeadsTouched = 0;
            let buyersTenantsAdded = 0;
            let silenceRiskCount = 0;
            let showingTasksToFollowUp = 0;

            let addedPropertiesToday = 0;
            let activePropertiesCount = 0;
            let lowHealthPropertiesCount = 0;
            let oldPropertiesCount = 0; // Not updated for 30 days
            let attentionNeededCount = 0;

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            leads.forEach(l => {
                const nfa = l.next_followup_at ? new Date(l.next_followup_at) : null;
                if (nfa && nfa < startOfDay && l.status !== 'closed' && l.status !== 'lost') {
                    missedFollowups++;
                }

                if (l.last_contacted_at && new Date(l.last_contacted_at) >= startOfDay) {
                    const temp = `${l.temperature} ${l.status} ${l.type}`.toLowerCase();
                    if (temp.includes('hot') || temp.includes('sıcak') || temp.includes('sicak')) {
                        hotLeadsTouched++;
                    }
                }

                if (l.created_at && new Date(l.created_at) >= startOfDay && (l.type === 'buyer' || l.type === 'tenant' || l.type === 'investor' || (l.type || '').includes('alıcı'))) {
                    buyersTenantsAdded++;
                }

                if ((l.silence_risk_level && l.silence_risk_level !== 'none') || (l.forget_protection_state && l.forget_protection_state !== 'safe')) {
                   silenceRiskCount++;
                }
            });

            const fortyEightHoursAgo = new Date();
            fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
            
            allTasks.forEach(t => {
                if (!t.lead_id) return;
                const txt = `${t.title} ${t.notes} ${t.type}`.toLowerCase();
                if (txt.includes('gösterim') || txt.includes('yer gösterme') || txt.includes('showing')) {
                    const dateToCheck = t.completed_at ? new Date(t.completed_at) : (t.due_date ? new Date(t.due_date) : null);
                    if (dateToCheck && dateToCheck >= fortyEightHoursAgo && dateToCheck <= endOfDay) {
                        showingTasksToFollowUp++;
                    }
                }
            });

            properties.forEach(p => {
                if (p.created_at && new Date(p.created_at) >= startOfDay) addedPropertiesToday++;
                
                const isActive = p.status === 'published' || p.status === 'portfolio' || p.status === 'active';
                if (isActive) activePropertiesCount++;
                
                if (isActive && p.health_score !== null && p.health_score < 50) lowHealthPropertiesCount++;
                
                if (isActive && p.updated_at && new Date(p.updated_at) < thirtyDaysAgo) oldPropertiesCount++;
                
                if (isActive && p.unsold_reason) attentionNeededCount++;
            });

            return {
                missedFollowups,
                hotLeadsTouched,
                buyersTenantsAdded,
                silenceRiskCount,
                showingTasksToFollowUp,
                addedPropertiesToday,
                activePropertiesCount,
                lowHealthPropertiesCount,
                oldPropertiesCount,
                attentionNeededCount
            };
        },
        enabled: !!userId
    });
}
