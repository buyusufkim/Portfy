import { supabase } from '../lib/supabase';
import { AdvisorCampaign, CampaignTask } from '../types';
import { getTodayStr } from './core/utils';
import { CAMPAIGN_90_TEMPLATE } from '../data/campaign90Template';

export const campaign90Service = {
  getActiveCampaign: async (userId: string): Promise<AdvisorCampaign | null> => {
    const { data, error } = await supabase
      .from('advisor_campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (error) {
       if (error.code === 'PGRST205' || error.message.includes('PGRST205')) {
          console.warn('PGRST205: advisor_campaigns tablo bulunamadı. Migration gerekli.');
          return null;
       }
       console.error("getActiveCampaign error:", error);
    }
    return data;
  },

  startCampaign: async (payload: { region?: string; niche?: string; daily_contact_target?: number; weekly_contact_target?: number }): Promise<AdvisorCampaign> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Not authenticated');

    const todayStr = getTodayStr(new Date());

    const { data: existing, error: fetchError } = await supabase
      .from('advisor_campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (fetchError) {
       if (fetchError.code === 'PGRST205' || fetchError.message.includes('PGRST205')) {
           throw new Error('90 Gün Kampı tabloları veritabanında yok. SQL Migration uygulanmalı (PGRST205).');
       }
       throw fetchError;
    }

    if (existing) return existing;

    const { data, error } = await supabase
      .from('advisor_campaigns')
      .insert({
        user_id: userId,
        campaign_type: 'new_advisor_90',
        status: 'active',
        start_date: todayStr,
        current_day: 1,
        current_week: 1,
        region: payload.region,
        niche: payload.niche,
        daily_contact_target: payload.daily_contact_target || 20,
        weekly_contact_target: payload.weekly_contact_target || 100
      })
      .select()
      .single();

    if (error) {
       if (error.code === 'PGRST205' || error.message.includes('PGRST205')) {
           throw new Error('90 Gün Kampı tabloları veritabanında yok. SQL Migration uygulanmalı (PGRST205).');
       }
       throw error;
    }
    
    await campaign90Service.ensureTodayCampaignTasks(data);
    return data;
  },

  ensureTodayCampaignTasks: async (campaign: AdvisorCampaign): Promise<void> => {
    const todayStr = getTodayStr(new Date());
    const todayDate = new Date(todayStr);
    const startDate = new Date(campaign.start_date);
    
    // Safety clamp
    let diffTime = todayDate.getTime() - startDate.getTime();
    if (diffTime < 0) diffTime = 0;
    
    let current_day = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (current_day < 1) current_day = 1;
    if (current_day > 90) current_day = 90;
    
    let current_week = Math.ceil(current_day / 7);
    if (current_week > 13) current_week = 13;

    if (campaign.current_day !== current_day || campaign.current_week !== current_week) {
        await supabase.from('advisor_campaigns').update({ current_day, current_week }).eq('id', campaign.id);
        campaign.current_day = current_day;
        campaign.current_week = current_week;
    }
    
    const weekData = CAMPAIGN_90_TEMPLATE.find(w => w.week_number === current_week);
    if (!weekData) return;
    
    const targetDayInWeek = ((current_day - 1) % 7);
    let t = weekData.daily_tasks[targetDayInWeek];
    
    if (!t) {
       t = {
           task_key: `w${current_week}_rest_${targetDayInWeek}`,
           task_type: 'learning',
           title: 'Bugün için planlama yap',
           description: 'Hafta sonu veya planlanmamış gün değerlendirmesi.',
           gpa_bucket: 'A',
           xp_reward: 10
       };
    }

    const dailyTasks = [
      {
        ...t,
        task_key: `campaign90_day_${current_day}_main`
      },
      {
        task_key: `campaign90_day_${current_day}_g_activity`,
        task_type: 'prospecting',
        title: 'Bugünün gelir getirici aktivitesini tamamla',
        description: 'En az 5 yeni kişiyle iletişim kur.',
        gpa_bucket: 'G' as const,
        xp_reward: 20
      },
      {
        task_key: `campaign90_day_${current_day}_gpa_close`,
        task_type: 'gpa',
        title: 'Bugünün GPA kapanışını yap',
        description: 'Aktivitelerini CRM üzerine kaydet ve değerlendir.',
        gpa_bucket: 'A' as const,
        xp_reward: 20
      }
    ];

    for (const dTask of dailyTasks) {
      const { data: existing } = await supabase
          .from('campaign_tasks')
          .select('id')
          .eq('campaign_id', campaign.id)
          .eq('task_key', dTask.task_key)
          .eq('due_date', todayStr)
          .maybeSingle();

      if (!existing) {
          await supabase.from('campaign_tasks').insert({
              campaign_id: campaign.id,
              user_id: campaign.user_id,
              day_number: current_day,
              week_number: current_week,
              task_key: dTask.task_key,
              task_type: dTask.task_type,
              title: dTask.title,
              description: dTask.description,
              gpa_bucket: dTask.gpa_bucket,
              xp_reward: dTask.xp_reward,
              status: 'pending',
              due_date: todayStr
          });
      }
    }
  },

  getTodayCampaignTasks: async (userId: string, dateStr: string): Promise<CampaignTask[]> => {
    const campaign = await campaign90Service.getActiveCampaign(userId);
    if (!campaign) return [];
    
    if (dateStr === getTodayStr(new Date())) {
       await campaign90Service.ensureTodayCampaignTasks(campaign);
    }

    const { data, error } = await supabase
      .from('campaign_tasks')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('due_date', dateStr)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },
  
  completeCampaignTask: async (taskId: string): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const jwt = sessionData.session?.access_token;
    if (!jwt) throw new Error('Not authenticated');

    const res = await fetch('/api/ai/complete-campaign-task', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ taskId })
    });
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to complete task');
    }
    
    // Upsert daily score
    await campaign90Service.recalcDailyScores(taskId);
  },
  
  skipCampaignTask: async (taskId: string): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return;
    
    await supabase.from('campaign_tasks').update({ status: 'skipped' }).eq('id', taskId).eq('user_id', sessionData.session.user.id);
    
    // Upsert daily score
    await campaign90Service.recalcDailyScores(taskId);
  },
  
  recalcDailyScores: async (taskId: string): Promise<void> => {
     // Retrieve task to get campaignId and due_date
     const { data: task } = await supabase.from('campaign_tasks').select('campaign_id, due_date, user_id').eq('id', taskId).single();
     if (!task) return;
     
     const { data: tasksDay } = await supabase.from('campaign_tasks').select('*')
        .eq('campaign_id', task.campaign_id)
        .eq('due_date', task.due_date);
        
     const g = tasksDay?.filter(t => t.gpa_bucket === 'G' && t.status === 'completed').length || 0;
     const p = tasksDay?.filter(t => t.gpa_bucket === 'P' && t.status === 'completed').length || 0;
     const a = tasksDay?.filter(t => t.gpa_bucket === 'A' && t.status === 'completed').length || 0;
     const completed = tasksDay?.filter(t => t.status === 'completed').length || 0;
     const totalScore = (g * 3) + (p * 5) + (a * 2);
     
     // Note: if campaign_daily_scores exists, we upsert. Otherwise safe fail.
     try {
         const { data: existingScore } = await supabase.from('campaign_daily_scores')
             .select('id')
             .eq('user_id', task.user_id)
             .eq('campaign_id', task.campaign_id)
             .eq('score_date', task.due_date)
             .maybeSingle();

         if (existingScore) {
             await supabase.from('campaign_daily_scores').update({
                 g_score: g,
                 p_score: p,
                 a_score: a,
                 total_score: totalScore,
                 completed_tasks: completed,
                 total_tasks: tasksDay?.length || 0,
             }).eq('id', existingScore.id);
         } else {
             await supabase.from('campaign_daily_scores').insert({
                 user_id: task.user_id,
                 campaign_id: task.campaign_id,
                 score_date: task.due_date,
                 g_score: g,
                 p_score: p,
                 a_score: a,
                 total_score: totalScore,
                 completed_tasks: completed,
                 total_tasks: tasksDay?.length || 0,
             });
         }
     } catch(e) {
        console.error("Score table error", e);
     }
  },

  getCampaignProgress: async (campaignId: string): Promise<{g:number, p:number, a:number, completed:number, total:number, gpaScore:number}> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return {g:0,p:0,a:0,completed:0,total:0,gpaScore:0};

      const { data: tasks } = await supabase.from('campaign_tasks')
           .select('*')
           .eq('campaign_id', campaignId)
           .eq('user_id', userId);
      
      const g = tasks?.filter(t => t.gpa_bucket === 'G' && t.status === 'completed').length || 0;
      const p = tasks?.filter(t => t.gpa_bucket === 'P' && t.status === 'completed').length || 0;
      const a = tasks?.filter(t => t.gpa_bucket === 'A' && t.status === 'completed').length || 0;
      const completed = tasks?.filter(t => t.status === 'completed').length || 0;
      
      const gpaScore = (g * 3) + (p * 5) + (a * 2);

      return { g, p, a, completed, total: tasks?.length || 0, gpaScore };
  }
};
