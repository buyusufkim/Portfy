import { Response } from "express";
import { AuthRequest } from "./ai-api.js";
import { createClient } from "@supabase/supabase-js";
import { getTurkeyTodayISO } from "./time.js";
import { calculateReflectionMetrics } from "../src/utils/campaign90ReflectionStatusHelpers.js";

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
      .select("id, user_id, status, current_day, updated_at, metadata");

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

    // Reflection Metrics
    const { data: allAnswersOverview } = await supabaseAdmin
       .from("campaign90_day_answers")
       .select("user_id, answered_at");

    let reflectionsTodayCount = 0;
    let missingReflectionsTodayCount = 0;
    let staleReflectionsCount = 0;

    const answersByUserOverview = (allAnswersOverview || []).reduce((acc, row) => {
        if (!acc[row.user_id]) acc[row.user_id] = [];
        acc[row.user_id].push(row);
        return acc;
    }, {} as Record<string, any[]>);

    for (const c of (campaigns || [])) {
      if (c.status === 'active') {
          const uAns = answersByUserOverview[c.user_id] || [];
          uAns.sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime());
          const lastA = uAns[0];
          
          const ansDay = lastA ? getTurkeyTodayISO(new Date(lastA.answered_at)) : null;
          if (ansDay === todayStr) {
             reflectionsTodayCount++;
          } else {
             missingReflectionsTodayCount++;
             const elapsedDays = lastA ? Math.floor((now.getTime() - new Date(lastA.answered_at).getTime())/(1000*3600*24)) : 999;
             if (elapsedDays >= 3) {
                staleReflectionsCount++;
             }
          }
      }
    }

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
        riskUserCount: abandonedOrInactiveCampaigns,
        reflectionsTodayCount,
        missingReflectionsTodayCount,
        staleReflectionsCount
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

    // Fetch Answers for users
    const { data: allAnswers } = await supabaseAdmin
      .from("campaign90_day_answers")
      .select("user_id, day_number, answered_at");

    const answersByUser = (allAnswers || []).reduce((acc, row) => {
        if (!acc[row.user_id]) acc[row.user_id] = [];
        acc[row.user_id].push(row);
        return acc;
    }, {} as Record<string, any[]>);

    // Fetch Followups for users
    const { data: allFollowups } = await supabaseAdmin
      .from("campaign90_admin_followups")
      .select("user_id, status, action_type, priority, created_at")
      .order("created_at", { ascending: false });
      
    const followupsByUser = (allFollowups || []).reduce((acc, row) => {
        if (!acc[row.user_id]) acc[row.user_id] = [];
        acc[row.user_id].push(row);
        return acc;
    }, {} as Record<string, any[]>);

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

        // Answers / Reflections Logic
        const uAns = answersByUser[c.user_id] || [];
        const metrics = calculateReflectionMetrics(uAns, c.status, todayStr, now.getTime(), getTurkeyTodayISO);
        
        // Followups Logic
        const uFollowups = followupsByUser[c.user_id] || [];
        const openFollowups = uFollowups.filter((f: any) => f.status === 'open' || f.status === 'in_progress');
        const latestF = uFollowups[0]; // descending by created_at

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
            tier: profile.tier || 'free',
            lastAnswerAt: metrics.lastAnswerAt,
            lastAnswerDayNumber: metrics.lastAnswerDayNumber,
            totalAnsweredDays: metrics.totalAnsweredDays,
            answeredToday: metrics.answeredToday,
            missingTodayAnswer: metrics.missingTodayAnswer,
            daysSinceLastAnswer: metrics.daysSinceLastAnswer,
            reflectionStatus: metrics.reflectionStatus,
            openFollowupCount: openFollowups.length,
            latestFollowupAt: latestF ? latestF.created_at : null,
            latestFollowupType: latestF ? latestF.action_type : null,
            latestFollowupPriority: latestF ? latestF.priority : null
        });
    }

    // Apply filters
    let filtered = results;
    if (statusFilter === 'active') filtered = filtered.filter(f => f.campaign_status === 'active');
    else if (statusFilter === 'completed') filtered = filtered.filter(f => f.campaign_status === 'completed');
    else if (statusFilter === 'inactive_7d') filtered = filtered.filter(f => f.risk_level === 'critical');
    else if (statusFilter === 'no_start_today') filtered = filtered.filter(f => f.campaign_status === 'active' && !f.today_started);
    else if (statusFilter === 'low_completion') filtered = filtered.filter(f => f.campaign_status === 'active' && f.overall_completion_percent < 40);
    else if (statusFilter === 'answered_today') filtered = filtered.filter(f => f.reflectionStatus === 'answered_today');
    else if (statusFilter === 'missing_today') filtered = filtered.filter(f => f.reflectionStatus === 'missing_today' && f.campaign_status === 'active');
    else if (statusFilter === 'stale_reflections') filtered = filtered.filter(f => f.reflectionStatus === 'stale');
    else if (statusFilter === 'no_reflections') filtered = filtered.filter(f => f.reflectionStatus === 'none' && f.campaign_status === 'active');

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

export const handleAdminGetCampaignUserDetail = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.params.userId;
    
    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("advisor_campaigns")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) return res.status(404).json({ error: "Kullanıcı kampanyası bulunamadı" });

    // Fetch profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email, phone, tier, region")
      .eq("id", userId)
      .maybeSingle();

    // Fetch scores
    const { data: scores } = await supabaseAdmin
      .from("campaign_daily_scores")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("score_date", { ascending: false });

    // Calculate score summary
    const scoreData = { total: 0, completed: 0 };
    if (scores) {
        scores.forEach(s => {
            scoreData.total += s.total_tasks || 0;
            scoreData.completed += s.completed_tasks || 0;
        });
    }

    const currentDay = campaign.current_day || 1;
    let completionPercent = scoreData.total > 0 ? (scoreData.completed / scoreData.total) * 100 : 0;
    
    // Risk Logic (same as list endpoint for consistency)
    const now = new Date();
    let riskLevel = 'healthy';
    let riskReasons: string[] = [];
    
    const lastActivityMs = campaign.updated_at ? new Date(campaign.updated_at).getTime() : now.getTime();
    const daysSinceActivity = (now.getTime() - lastActivityMs) / (1000 * 3600 * 24);
    
    if (campaign.status === 'active') {
         if (daysSinceActivity > 7) {
             riskLevel = 'critical';
             riskReasons.push(`${Math.floor(daysSinceActivity)} gündür pasif.`);
         } else if (daysSinceActivity > 3) {
             riskLevel = 'watch';
         }

         if (currentDay > 10 && completionPercent < 20) {
             riskLevel = riskLevel === 'critical' ? 'critical' : 'risk';
             riskReasons.push('Görev tamamlama oranı çok düşük (<%20)');
         } else if (currentDay > 10 && completionPercent < 40 && riskLevel !== 'critical') {
             riskLevel = riskLevel === 'risk' ? 'risk' : 'watch';
             riskReasons.push('Görev tamamlama oranı düşük (<%40)');
         }
    } else {
        riskLevel = 'inactive';
        riskReasons.push('Kampanya aktif değil.');
    }

    // Fetch recent answers
    const { data: answers } = await supabaseAdmin
      .from("campaign90_day_answers")
      .select("day_number, answered_at, answers")
      .eq("user_id", userId)
      .order("day_number", { ascending: false })
      .limit(15);

    const detail = {
        campaign_id: campaign.id,
        user_id: campaign.user_id,
        display_name: profile?.display_name || 'İsimsiz',
        email: profile?.email || '',
        phone: profile?.phone || '',
        region: campaign.region || profile?.region || '-',
        campaign_status: campaign.status || 'inactive',
        start_date: campaign.start_date,
        current_day: currentDay,
        progress_percent: Math.min(100, Math.round((currentDay / 90) * 100)),
        overall_completion_percent: Math.round(completionPercent),
        completed_tasks_count: scoreData.completed,
        total_tasks_count: scoreData.total,
        last_activity_at: campaign.updated_at,
        risk_level: riskLevel,
        risk_reasons: riskReasons,
        tier: profile?.tier || 'free',
        scores: scores || [],
        answers: answers || []
    };

    res.json({ data: detail });

  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "User detail fetch error") });
  }
};

export const handleAdminGetCampaignDayContents = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const { data: contents, error } = await supabaseAdmin
      .from("campaign90_day_contents")
      .select("*")
      .order("day_number", { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.campaign90_day_contents" does not exist')) {
        return res.json({ data: [] });
      }
      throw error;
    }

    res.json({ data: contents });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Day contents fetch hatası") });
  }
};

export const handleAdminGetCampaignDayContentByNumber = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const dayNumber = parseInt(req.params.dayNumber, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 90) {
      return res.status(400).json({ error: "Geçersiz gün numarası (1-90 arası olmalı)" });
    }

    const { data: content, error } = await supabaseAdmin
      .from("campaign90_day_contents")
      .select("*")
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (error) {
       if (error.code === 'PGRST116' || error.message.includes('relation "public.campaign90_day_contents" does not exist')) {
          return res.status(404).json({ error: "Tablo bulunamadı" });
       }
       throw error;
    }

    if (!content) {
       return res.json({ data: null });
    }

    res.json({ data: content });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Day content fetch hatası") });
  }
};

export const handleAdminUpdateCampaignDayContent = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const dayNumber = parseInt(req.params.dayNumber, 10);
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 90) {
      return res.status(400).json({ error: "Geçersiz gün numarası (1-90 arası olmalı)" });
    }

    const payload = req.body;
    
    let dailyQuestions = [];
    if (payload.daily_questions) {
       if (typeof payload.daily_questions === 'string') {
          // If plain string text area, split by newlines and trim
          dailyQuestions = payload.daily_questions.split('\n').map((q: string) => q.trim()).filter(Boolean);
       } else if (Array.isArray(payload.daily_questions)) {
          dailyQuestions = payload.daily_questions;
       }
    }

    const upsertData = {
        day_number: dayNumber,
        title: payload.title || `Gün ${dayNumber}`,
        short_summary: payload.short_summary || '',
        learning_content: payload.learning_content || '',
        mentor_message: payload.mentor_message || '',
        vocabulary_title: payload.vocabulary_title || '',
        vocabulary_content: payload.vocabulary_content || '',
        task_brief: payload.task_brief || '',
        daily_questions: dailyQuestions,
        video_title: payload.video_title || '',
        video_url: payload.video_url || '',
        video_duration_minutes: payload.video_duration_minutes ? parseInt(payload.video_duration_minutes) : null,
        status: payload.status || 'draft',
        updated_by_admin_id: req.user?.id
    };

    const { data, error } = await supabaseAdmin
      .from("campaign90_day_contents")
      .upsert(upsertData, { onConflict: "day_number" })
      .select()
      .single();

    if (error) throw error;

    res.json({ data, success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Day content update hatası") });
  }
};

export const handleAdminGetCampaignUserFollowups = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.params.userId;
    const { data: followups, error } = await supabaseAdmin
      .from("campaign90_admin_followups")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[C90] Admin get followups error:", error);
      return res.status(500).json({ error: "Veri alınamadı" });
    }

    res.json({ data: followups || [] });
  } catch (error: unknown) {
    console.error("[C90] Admin get followups catch:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Error fetching followups") });
  }
};

export const handleAdminCreateCampaignUserFollowup = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    
    const userId = req.params.userId;
    const adminId = req.user?.id;
    
    const { validateFollowupPayload } = await import("../src/utils/campaign90FollowupHelpers.ts");
    const validation = validateFollowupPayload(req.body);
    
    if (!validation.valid || !validation.data) {
        return res.status(400).json({ error: validation.error || "Geçersiz payload" });
    }

    // Try to get campaign_id to attach it if we have it
    let campaignId = null;
    const { data: campaign } = await supabaseAdmin
       .from("advisor_campaigns")
       .select("id")
       .eq("user_id", userId)
       .maybeSingle();
       
    if (campaign) {
        campaignId = campaign.id;
    }

    const payload = {
        user_id: userId,
        admin_id: adminId,
        campaign_id: campaignId,
        ...validation.data
    };

    if (payload.status === 'resolved' || payload.status === 'dismissed') {
         (payload as any).resolved_at = new Date().toISOString();
    }

    const { data: newFollowup, error } = await supabaseAdmin
        .from("campaign90_admin_followups")
        .insert(payload)
        .select()
        .single();
        
    if (error) {
         console.error("[C90] Create followup error:", error);
         return res.status(500).json({ error: "Not eklenemedi" });
    }

    res.json({ data: newFollowup, success: true });
  } catch (error: unknown) {
      console.error("[C90] Create followup catch:", error);
      res.status(500).json({ error: safeErrorMessage(error, "Error creating followup") });
  }
};

export const handleAdminUpdateCampaignFollowup = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    
    const followupId = req.params.followupId;
    
    // We only update specific fields
    const { status, priority, note, dueDate, dayNumber, actionType } = req.body;
    const updateData: any = {};
    
    // Optional selective validation, or we can just use the helper and override
    const { validateFollowupPayload } = await import("../src/utils/campaign90FollowupHelpers.ts");
    
    // fetch current first
    const { data: current, error: fetchErr } = await supabaseAdmin
       .from("campaign90_admin_followups")
       .select("*")
       .eq("id", followupId)
       .maybeSingle();
       
    if (fetchErr || !current) {
        return res.status(404).json({ error: "Kayıt bulunamadı" });
    }
    
    const validation = validateFollowupPayload({
        actionType: actionType || current.action_type,
        priority: priority || current.priority,
        status: status || current.status,
        note: (note !== undefined ? note : current.note),
        dueDate: (dueDate !== undefined ? dueDate : current.due_date),
        dayNumber: (dayNumber !== undefined ? dayNumber : current.day_number)
    });

    if (!validation.valid || !validation.data) {
        return res.status(400).json({ error: validation.error || "Geçersiz payload" });
    }
    
    const isNowResolved = (validation.data.status === 'resolved' || validation.data.status === 'dismissed') && current.status !== 'resolved' && current.status !== 'dismissed';
    const isNowUnresolved = (validation.data.status === 'open' || validation.data.status === 'in_progress') && (current.status === 'resolved' || current.status === 'dismissed');

    const updatePayload = {
        ...validation.data,
        resolved_at: isNowResolved ? new Date().toISOString() : (isNowUnresolved ? null : current.resolved_at)
    };

    const { data: updatedFollowup, error } = await supabaseAdmin
        .from("campaign90_admin_followups")
        .update(updatePayload)
        .eq("id", followupId)
        .select()
        .single();
        
    if (error) {
         console.error("[C90] Update followup error:", error);
         return res.status(500).json({ error: "Not güncellenemedi" });
    }

    res.json({ data: updatedFollowup, success: true });
  } catch (error: unknown) {
      console.error("[C90] Update followup catch:", error);
      res.status(500).json({ error: safeErrorMessage(error, "Error updating followup") });
  }
};

export const handleAdminSeedCampaignDayContents = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });
    
    // Dynamic import to avoid circular issues
    const { processDbCampaign90SeedDefaults } = await import('./campaign90-default-content-seed.js');
    
    const { mode } = req.body;
    if (mode !== 'missing_only' && mode !== 'fill_empty') {
      return res.status(400).json({ error: "Geçersiz mod işlemi" });
    }

    console.log(`[Admin] Seeding Campaign 90 contents via ${req.user?.id} in mode: ${mode}`);
    const summary = await processDbCampaign90SeedDefaults(supabaseAdmin, mode);
    
    if (summary.error) {
      return res.status(400).json({ error: summary.error });
    }
    
    res.json({ success: true, ...summary });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "İçerik tohumlama (seed) hatası") });
  }
};

export const handleAdminGenerateCampaignMentorInsight = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.params.userId;

    // 1. Fetch User Campaign & Check Activity
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("advisor_campaigns")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) return res.status(404).json({ error: "Kullanıcı kampanyası bulunamadı" });

    const currentDay = campaign.current_day || 1;
    const progressPercent = Math.min(100, Math.round((currentDay / 90) * 100));

    // 2. Fetch Latest 5 Reflection Answers
    const { data: answersData } = await supabaseAdmin
      .from("campaign90_day_answers")
      .select("day_number, answered_at, answers")
      .eq("user_id", userId)
      .order("day_number", { ascending: false })
      .limit(5);

    const recentAnswers = (answersData || []).map(a => ({
      dayNumber: a.day_number,
      answeredAt: a.answered_at,
      content: a.answers 
    }));

    // 3. Setup AI Request
    const { getGenerativeAI } = await import("./ai-api.js");
    const genAi = getGenerativeAI();
    if (!genAi) return res.status(503).json({ error: "AI Servisi başlatılamadı" });

    const { getFeatureConfig } = await import("./ai-features.js");
    const featureConfig = getFeatureConfig("campaign90_mentor_insight");

    const promptText = `
Mevcut Kamp Günü: ${currentDay}
İlerleme (%): ${progressPercent}
Durum: ${campaign.status}

Kullanıcının Son 5 Yansıma (Gün Sonu) Cevapları:
${JSON.stringify(recentAnswers, null, 2)}

Yukarıdaki verilere bakarak, sistem yöneticisi (admin) için kısa, net ve eyleme geçirilebilir bir "Mentor Yorumu" üret. Kullanıcının motivasyon seviyesini, ana engelini bul ve admine bir öneri sun.
`;

    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      systemInstruction: featureConfig.systemInstruction,
      responseSchema: featureConfig.responseSchema
    };

    const response = await genAi.models.generateContent({
      model: featureConfig.defaultModel,
      contents: promptText,
      config
    });

    const usageMetadata = response.usageMetadata;
    let cleanJson = response.text || "{}";
    if (typeof cleanJson !== "string") cleanJson = String(cleanJson);
    cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsedData = {};
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      return res.status(422).json({ error: "Model dönüşü JSON değil.", raw_output: cleanJson });
    }

    // usageMetadata'yı dönere tokenTrackerMiddleware'in yakalamasını sağlıyoruz
    res.json({
      success: true,
      data: parsedData,
      usage: usageMetadata
    });

  } catch (error: unknown) {
    console.error("Mentor Insight error:", error);
    res.status(500).json({ error: safeErrorMessage(error, "Yorum oluşturulurken hata oluştu") });
  }
};

