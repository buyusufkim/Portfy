import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { AdvisorCampaign } from '../types';

export interface Campaign90Report {
    campaignDay: number;
    reportType: 'day30' | 'day60' | 'day90' | 'regular';
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    earnedXp: number;
    gCompleted: number;
    pCompleted: number;
    aCompleted: number;
    leadsCreated: number;
    buyerLeads: number;
    ownerSellerLeads: number;
    followupActions: number;
    overdueFollowups: number;
    silentLeadCount: number;
    propertiesCreated: number;
    activeProperties: number;
    lowHealthProperties: number;
    fieldVisits: number;
    mapPins: number;
    strongestArea: string;
    weakestArea: string;
    mentorSummary: string;
    nextFocus: string;
}

export function useCampaign90Report(userId: string | undefined, campaign: AdvisorCampaign | null | undefined) {
    return useQuery({
        queryKey: ['campaign_90_report', userId, campaign?.id, campaign?.current_day],
        queryFn: async (): Promise<Campaign90Report | null> => {
            if (!userId || !campaign) return null;

            const startDateStr = campaign.start_date;
            
            let reportType: 'day30' | 'day60' | 'day90' | 'regular' = 'regular';
            if (campaign.current_day === 30) reportType = 'day30';
            else if (campaign.current_day === 60) reportType = 'day60';
            else if (campaign.current_day === 90) reportType = 'day90';

            const [
                cTasksResp,
                cScoresResp,
                leadsResp,
                tasksResp,
                propsResp,
                pinsResp
            ] = await Promise.all([
                supabase.from('campaign_tasks').select('*').eq('campaign_id', campaign.id),
                supabase.from('campaign_daily_scores').select('*').eq('campaign_id', campaign.id),
                supabase.from('leads').select('*').eq('user_id', userId).gte('created_at', startDateStr),
                supabase.from('tasks').select('*').eq('user_id', userId).gte('created_at', startDateStr),
                supabase.from('properties').select('*').eq('user_id', userId).gte('created_at', startDateStr),
                supabase.from('map_pins').select('*').eq('user_id', userId).gte('created_at', startDateStr)
            ]);

            const cTasks = cTasksResp.data || [];
            const cScores = cScoresResp.data || [];
            const leads = leadsResp.data || [];
            const tasks = tasksResp.data || [];
            const properties = propsResp.data || [];
            const pins = pinsResp.data || [];

            // Task completion
            const totalTasks = cTasks.length;
            const completedTasks = cTasks.filter(t => t.status === 'completed').length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const earnedXp = cTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.xp_reward || 0), 0);

            let gCompleted = 0;
            let pCompleted = 0;
            let aCompleted = 0;
            
            cScores.forEach(score => {
                gCompleted += (score.g_score || 0);
                pCompleted += (score.p_score || 0);
                aCompleted += (score.a_score || 0);
            });

            // CRM Leads
            const leadsCreated = leads.length;
            let buyerLeads = 0;
            let ownerSellerLeads = 0;
            let overdueFollowups = 0;
            let silentLeadCount = 0;

            const now = new Date();

            leads.forEach(l => {
                const temp = `${l.type} ${l.status}`.toLowerCase();
                if (temp.includes('alıcı') || temp.includes('buyer') || temp.includes('kiracı') || temp.includes('tenant')) {
                    buyerLeads++;
                } else if (temp.includes('satıcı') || temp.includes('seller') || temp.includes('mal sahibi') || temp.includes('mülk sahibi')) {
                    ownerSellerLeads++;
                }
                
                const nfa = l.next_followup_at ? new Date(l.next_followup_at) : null;
                if (nfa && nfa < now && l.status !== 'closed' && l.status !== 'lost') {
                    overdueFollowups++;
                }

                if ((l.silence_risk_level && l.silence_risk_level !== 'none') || (l.forget_protection_state && l.forget_protection_state !== 'safe')) {
                    silentLeadCount++;
                }
            });

            // Tasks/Appointments 
            const followupActions = tasks.filter(t => {
                const txt = `${t.title} ${t.type}`.toLowerCase();
                return txt.includes('takip') || txt.includes('arama') || txt.includes('followup');
            }).length;

            const fieldVisits = tasks.filter(t => {
                const txt = `${t.title} ${t.type}`.toLowerCase();
                return txt.includes('saha') || txt.includes('bölge') || txt.includes('randevu') || txt.includes('ziyaret');
            }).length;

            // Properties
            const propertiesCreated = properties.length;
            let activeProperties = 0;
            let lowHealthProperties = 0;

            properties.forEach(p => {
                const isActive = p.status === 'Yayında' || p.status === 'Yeni' || p.status === 'İlgi Var' || p.status === 'Pazarlık';
                if (isActive) activeProperties++;
                if (isActive && p.health_score !== null && p.health_score < 50) lowHealthProperties++;
            });

            // Maps
            const mapPins = pins.length;

            // Generate Insights
            let strongestArea = 'Henüz yeterli veri yok';
            let weakestArea = 'Henüz yeterli veri yok';
            let mentorSummary = 'Dengeli bir ilerleme var.';
            let nextFocus = 'Eğitimleri uygulamaya devam edin.';

            const isGWeak = gCompleted < (pCompleted + aCompleted) / 2;
            const isPWeak = pCompleted < (gCompleted + aCompleted) / 2;
            const isAWeak = aCompleted < (gCompleted + pCompleted) / 2;
            
            const isGStrong = gCompleted > (pCompleted + aCompleted) / 1.5;
            const isPStrong = pCompleted > (gCompleted + aCompleted) / 1.5;
            const isAStrong = aCompleted > (gCompleted + pCompleted) / 1.5;

            if (isGStrong) strongestArea = 'Gelir Getirici Aktiviteler (Arama/Takip)';
            else if (isPStrong) strongestArea = 'Portföy Üretimi (Ekleme/Düzenleme)';
            else if (isAStrong) strongestArea = 'Alan Uzmanlığı (Saha/Bölge)';

            if (isGWeak) weakestArea = 'Gelir Getirici Aktiviteler (Arama/Takip)';
            else if (isPWeak) weakestArea = 'Portföy Üretimi (Ekleme/Düzenleme)';
            else if (isAWeak) weakestArea = 'Alan Uzmanlığı (Saha/Bölge)';

            if (isGWeak) mentorSummary = "Gelir getirici aktivite (G) zayıf. Daha fazla kişiyle temas etmezseniz ileride portföysüz kalabilirsiniz.";
            else if (isPWeak) mentorSummary = "Portföy üretimi (P) geride kalıyor. Mevcut temasları yetki görüşmesine çevirmeye odaklanın.";
            else if (isAWeak) mentorSummary = "Alan uzmanlığı (A) eksik. Saha ve bölge çalışmalarınızı artırıp pazar hakimi olmalısınız.";
            else mentorSummary = "G, P ve A metrikleriniz dengeli ilerliyor. Bu çalışma disiplinini sistemli hale getirmelisiniz.";

            if (reportType === 'day90') {
                if (isGWeak) nextFocus = "Önümüzdeki 90 gün sabah prospecting bloğunu sabitle.";
                else if (isPWeak) nextFocus = "CMA ve yetki görüşmesi sayısını artır. İtiraz karşılama yeteneklerine odaklan.";
                else if (isAWeak) nextFocus = "Mikro bölge raporlarını ve ilan analizlerini artır.";
                else if (overdueFollowups > 5) nextFocus = "1-3-7-14-30 takip zincirini zorunlu hale getir.";
                else if (propertiesCreated < 5) nextFocus = "Yetkili ve doğru fiyatlı portföy hedefini netleştir.";
                else nextFocus = "Satılabilir fiyatlı portföyleri pazarlayıp yeni network edinme aşamasına geç.";
            }

            return {
                campaignDay: campaign.current_day,
                reportType,
                completedTasks,
                totalTasks,
                completionRate,
                earnedXp,
                gCompleted,
                pCompleted,
                aCompleted,
                leadsCreated,
                buyerLeads,
                ownerSellerLeads,
                followupActions,
                overdueFollowups,
                silentLeadCount,
                propertiesCreated,
                activeProperties,
                lowHealthProperties,
                fieldVisits,
                mapPins,
                strongestArea,
                weakestArea,
                mentorSummary,
                nextFocus
            };
        },
        enabled: !!userId && !!campaign
    });
}
