import { Response } from "express";
import { AuthRequest } from "./ai-api.js";
import { createClient } from "@supabase/supabase-js";
import { getTurkeyTodayISO } from "./time.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

export const safeErrorMessage = (error: unknown, fallback: string) =>
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : fallback;

export const handleAdminGetCampaignOverview = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    // We can fetch campaigns
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from("advisor_campaigns")
      .select("id, status, current_day, updated_at, metadata");

    if (campaignError) throw campaignError;

    let activeCampaigns = 0;
    let completedCampaigns = 0;
    let abandonedOrInactiveCampaigns = 0;
    let totalProgress = 0;
    let totalCurrentDay = 0;

    const todayStr = getTurkeyTodayISO(new Date());

    let startedTodayCount = 0;
    let closedTodayCount = 0;

    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    for (const c of (campaigns || [])) {
      if (c.status === 'active') {
        activeCampaigns++;
        totalCurrentDay += c.current_day;
        totalProgress += (c.current_day / 90) * 100;
        
        // Activity check
        const lastActivity = new Date(c.updated_at);
        if (now.getTime() - lastActivity.getTime() > SEVEN_DAYS_MS) {
           abandonedOrInactiveCampaigns++;
        }

        const md = c.metadata || {};
        if (md.last_day_started === todayStr) startedTodayCount++;
        if (md.last_day_closed === todayStr) closedTodayCount++;

      } else if (c.status === 'completed') {
        completedCampaigns++;
      } else {
        abandonedOrInactiveCampaigns++;
      }
    }

    const avgProgress = activeCampaigns > 0 ? (totalProgress / activeCampaigns) : 0;
    const avgCurrentDay = activeCampaigns > 0 ? (totalCurrentDay / activeCampaigns) : 0;

    // Get today's task completions
    const { count: tasksCompletedTodayCount, error: tasksError } = await supabaseAdmin
      .from("campaign_tasks")
      .select("*", { count: 'exact', head: true })
      .eq("status", "completed")
      .gte("updated_at", todayStr + "T00:00:00Z");

    if (tasksError) throw tasksError;

    res.json({
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns,
        completedCampaigns,
        abandonedOrInactiveCampaigns,
        startedTodayCount,
        closedTodayCount,
        tasksCompletedTodayCount: tasksCompletedTodayCount || 0,
        averageProgressPercent: Math.round(avgProgress),
        averageCurrentDay: Math.round(avgCurrentDay),
        riskUserCount: abandonedOrInactiveCampaigns
    });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Overview API hatası") });
  }
};

export const handleAdminGetCampaignUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    // Parse filters
    const statusFilter = req.query.statusFilter as string || 'all';
    const dayRange = req.query.dayRange as string || 'all';
    // const search = req.query.search as string || '';

    // Fetch campaigns
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from("advisor_campaigns")
      .select("*");

    if (campaignError) {
      if (campaignError.code === 'PGRST116' || campaignError.message.includes('relation "public.advisor_campaigns" does not exist')) {
        return res.json({ data: [] });
      }
      throw campaignError;
    }
    
    // Extract unique user_ids
    const userIds = Array.from(new Set((campaigns || []).map(c => c.user_id).filter(Boolean)));
    let profilesData: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profiles, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, email, phone, region, tier')
        .in('id', userIds);
      if (!pError && profiles) {
        profilesData = profiles;
      }
    }
    
    const profileMap = new Map(profilesData.map(p => [p.id, p]));
    
    const todayStr = getTurkeyTodayISO(new Date());
    const now = new Date();
    const results = [];

    // As optimization, we'll fetch all daily scores for active days optionally, but for MVP let's just 
    // fetch all scores to get completion rates (or use completed_tasks_count from daily_scores)
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from("campaign_daily_scores")
      .select("campaign_id, completed_tasks, total_tasks, score_date");
      
    if (scoresError) {
       console.error("Scores fetch error:", scoresError);
       // Do not throw, just use empty array for resilience
    }

    const scoresByCampaign = (scores || []).reduce((acc, score) => {
        if (!acc[score.campaign_id]) acc[score.campaign_id] = { total: 0, completed: 0, todayTotal: 0, todayCompleted: 0 };
        acc[score.campaign_id].total += score.total_tasks;
        acc[score.campaign_id].completed += score.completed_tasks;
        if (score.score_date === todayStr) {
           acc[score.campaign_id].todayTotal = score.total_tasks;
           acc[score.campaign_id].todayCompleted = score.completed_tasks;
        }
        return acc;
    }, {} as any);

    for (const c of (campaigns || [])) {
        const md = c.metadata || {};
        const profile = profileMap.get(c.user_id) || {};
        const scoreData = scoresByCampaign[c.id] || { total: 0, completed: 0, todayTotal: 0, todayCompleted: 0 };
        
        const currentDay = c.current_day || 1;
        let completionPercent = scoreData.total > 0 ? (scoreData.completed / scoreData.total) * 100 : 0;
        
        // Risk Logic
        let riskLevel = 'healthy';
        let riskReasons: string[] = [];
        
        const lastActivityMs = c.updated_at ? new Date(c.updated_at).getTime() : now.getTime();
        const daysSinceActivity = (now.getTime() - lastActivityMs) / (1000 * 3600 * 24);
        
        if (c.status === 'active') {
             if (daysSinceActivity > 7) {
                 riskLevel = 'critical';
                 riskReasons.push('7+ gündür kamp aktivitesi yok');
             } else if (daysSinceActivity > 4) {
                 riskLevel = 'risk';
                 riskReasons.push('5+ gündür aktivite yok');
             } else if (daysSinceActivity > 2) {
                 riskLevel = 'watch';
             }

             if (currentDay > 10 && completionPercent < 20) {
                 riskLevel = riskLevel === 'critical' ? 'critical' : 'risk';
                 riskReasons.push('Görev tamamlama oranı çok düşük (<%20)');
             } else if (currentDay > 10 && completionPercent < 40 && riskLevel !== 'critical') {
                 riskLevel = riskLevel === 'risk' ? 'risk' : 'watch';
                 riskReasons.push('Görev tamamlama oranı düşük (<%40)');
             }
             
             if (md.last_day_started !== todayStr) {
                 if (riskLevel === 'healthy') riskLevel = 'watch';
                 riskReasons.push('Bugün kamp başlatılmamış');
             }
        } else if (c.status === 'completed') {
             riskLevel = 'healthy';
        } else {
             riskLevel = 'critical';
             riskReasons.push('Kampanya durumu aktif değil');
        }

        results.push({
            campaign_id: c.id,
            user_id: c.user_id,
            display_name: profile.display_name || 'İsimsiz',
            email: profile.email || '',
            phone: profile.phone || '',
            region: c.region || profile.region || '-',
            campaign_status: c.status || 'inactive',
            start_date: c.start_date,
            current_day: currentDay,
            progress_percent: Math.min(100, Math.round((currentDay / 90) * 100)),
            overall_completion_percent: Math.round(completionPercent),
            completed_tasks_count: scoreData.completed || 0,
            total_tasks_count: scoreData.total || 0,
            today_tasks_total: scoreData.todayTotal || 0,
            today_tasks_completed: scoreData.todayCompleted || 0,
            last_activity_at: c.updated_at,
            today_started: md.last_day_started === todayStr,
            today_closed: md.last_day_closed === todayStr,
            risk_level: riskLevel,
            risk_reasons: riskReasons,
            tier: profile.tier || 'free'
        });
    }

    // Apply filters
    let filtered = results;
    if (statusFilter === 'active') filtered = filtered.filter(f => f.campaign_status === 'active');
    else if (statusFilter === 'completed') filtered = filtered.filter(f => f.campaign_status === 'completed');
    else if (statusFilter === 'inactive_7d') filtered = filtered.filter(f => f.risk_level === 'critical');
    else if (statusFilter === 'no_start_today') filtered = filtered.filter(f => f.campaign_status === 'active' && !f.today_started);
    else if (statusFilter === 'low_completion') filtered = filtered.filter(f => f.campaign_status === 'active' && f.overall_completion_percent < 40);

    if (dayRange === '1-30') filtered = filtered.filter(f => f.current_day >= 1 && f.current_day <= 30);
    else if (dayRange === '31-60') filtered = filtered.filter(f => f.current_day >= 31 && f.current_day <= 60);
    else if (dayRange === '61-90') filtered = filtered.filter(f => f.current_day >= 61);

    // Simple textual search in client instead of db
    // Just sort so critical and risk are on top for active
    filtered.sort((a,b) => {
        const rMap: any = { 'critical': 4, 'risk': 3, 'watch': 2, 'healthy': 1 };
        return rMap[b.risk_level] - rMap[a.risk_level];
    });

    res.json({ data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Users API hatası") });
  }
};
