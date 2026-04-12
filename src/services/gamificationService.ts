import { UserProfile, GamifiedTask, UserStats, Lead } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';
import { leadService } from './leadService';

export const gamificationService = {
  earnXP: async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', user.id).single();
    if (!profile) return;

    const newXP = Number(profile.total_xp || 0) + amount;
    let newLevel = 1;
    if (newXP >= 15000) newLevel = 4;
    else if (newXP >= 5000) newLevel = 3;
    else if (newXP >= 1000) newLevel = 2;

    await supabase
      .from('profiles')
      .update({ 
        total_xp: newXP,
        broker_level: newLevel
      })
      .eq('uid', user.id);

    const today = getTodayStr();
    try {
      const { data: daily } = await supabase.from('user_stats').select('*').eq('agent_id', user.id).eq('date', today).maybeSingle();
      if (daily) {
        await supabase.from('user_stats').update({ xp_earned: (daily.xp_earned || 0) + amount }).eq('id', daily.id);
      } else {
        await supabase.from('user_stats').insert({ agent_id: user.id, date: today, xp_earned: amount });
      }
    } catch (e) {
      console.error("user_stats error in earnXP:", e);
    }
  },

  getDailyGamifiedTasks: async (force: boolean = false): Promise<GamifiedTask[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const agentId = user.id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('uid')
        .eq('uid', agentId)
        .maybeSingle();
      
      if (!profile) {
        await supabase.from('profiles').insert({
          uid: agentId,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || 'İsimsiz Danışman',
          role: 'agent'
        });
      }
      
      const today = getTodayStr();
      const { data: existingTasksData } = await supabase
        .from('gamified_tasks')
        .select('*')
        .eq('agent_id', agentId)
        .eq('date', today);
      
      let existingTasks = (existingTasksData || []) as GamifiedTask[];

      const coreTasks = [
        { title: "Peş peşe girişini sürdür", points: 10, category: 'sweet' as const },
        { title: "Bugün 100 puan kazan", points: 20, category: 'sweet' as const }
      ];

      if (existingTasks.length > 0 && !force) {
        const missingCore = coreTasks.filter(ct => !existingTasks.find(et => et.title === ct.title));
        if (missingCore.length > 0) {
          for (const ct of missingCore) {
            const newTask = { agent_id: agentId, ...ct, is_completed: false, date: today };
            const { data: created } = await supabase.from('gamified_tasks').insert(newTask).select().single();
            if (created) existingTasks.push(created as any);
          }
        }
        return existingTasks;
      }

      if (force && existingTasks.length > 0) {
        await supabase
          .from('gamified_tasks')
          .delete()
          .eq('agent_id', agentId)
          .eq('date', today);
        existingTasks = [];
      }

      const sweetTemplates = [
        "Bugünkü hedefini belirle",
        "Cevapsız mesajlarını temizle",
        "1 müşteriye dönüş yap",
        "1 portföy notu güncelle",
        "Gün sonu raporunu tamamla",
        "Eski bir müşterini ara",
        "Bölge haberlerini oku"
      ];
      const mainTemplates = [
        "5 malik araması yap",
        "1 saha ziyareti kaydet",
        "1 yeni portföy ekle",
        "2 müşteri takibi yap",
        "1 randevu oluştur",
        "Bölge esnafı ziyareti",
        "İlan fiyat analizi yap"
      ];
      
      const tasks: any[] = [];
      tasks.push({ agent_id: agentId, title: "Peş peşe girişini sürdür", points: 10, category: 'sweet', is_completed: false, date: today });
      tasks.push({ agent_id: agentId, title: "Bugün 100 puan kazan", points: 20, category: 'sweet', is_completed: false, date: today });

      const shuffledSweet = [...sweetTemplates].sort(() => 0.5 - Math.random());
      shuffledSweet.slice(0, 3).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 10, category: 'sweet', is_completed: false, date: today }));

      const shuffledMain = [...mainTemplates].sort(() => 0.5 - Math.random());
      shuffledMain.slice(0, 2).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 50, category: 'main', is_completed: false, date: today }));

      const leads = await leadService.getLeads();
      const neglectedLeads = leads.filter(l => {
        const lastContact = new Date(l.last_contact);
        const diffDays = Math.floor((new Date().getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7 && l.status !== 'Pasif';
      });

      if (neglectedLeads.length > 0) {
        const targetLead = neglectedLeads[0];
        tasks.push({ 
          agent_id: agentId, 
          title: `"${targetLead.name}" isimli müşteriyi ara`, 
          points: 100, 
          category: 'smart', 
          is_completed: false, 
          date: today,
          ai_reason: `Bu müşteri ${targetLead.status} statüsünde ama uzun süredir temas kurulmadı.`
        });
      } else {
        tasks.push({ 
          agent_id: agentId, 
          title: "Bölgendeki yeni bir esnafla tanış", 
          points: 100, 
          category: 'smart', 
          is_completed: false, 
          date: today,
          ai_reason: "Tüm müşterilerinle güncel iletişimdesin, yeni bağlantılar kurma zamanı."
        });
      }

      const createdTasks: GamifiedTask[] = [];
      for (const task of tasks) {
        const { data: created } = await supabase.from('gamified_tasks').insert(task).select().single();
        if (created) createdTasks.push(created as any);
      }

      return createdTasks as GamifiedTask[];
    } catch (error) {
      console.error("Error in getDailyGamifiedTasks:", error);
      throw error;
    }
  },

  completeGamifiedTask: async (taskId: string, points: number) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const { error: taskError } = await supabase.from('gamified_tasks').update({ is_completed: true }).eq('id', taskId);
    if (taskError) throw taskError;

    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('uid', userId).maybeSingle();
    if (profile) {
      const currentPoints = profile.total_xp || 0;
      await supabase.from('profiles').update({ total_xp: currentPoints + points }).eq('uid', userId);
    }
    
    return { success: true };
  },

  verifyGamifiedTask: async (task: GamifiedTask): Promise<{ verified: boolean, message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTodayStr();

    if (task.is_completed) return { verified: true };

    try {
      const title = task.title.toLowerCase();

      if (title.includes("malik araması") || title.includes("5 malik araması")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 5) return { verified: true };
        return { verified: false, message: `Henüz ${count}/5 arama yaptın. 5 arama tamamlamalısın.` };
      }

      if (title.includes("saha ziyareti")) {
        const { data: visits } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Saha').eq('completed', true).gte('created_at', today);
        if (visits && visits.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz bir saha ziyareti tamamlamadın." };
      }

      if (title.includes("yeni portföy ekle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('created_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz yeni bir portföy eklemedin." };
      }

      if (title.includes("müşteri takibi")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Takip').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 2) return { verified: true };
        return { verified: false, message: `Henüz ${count}/2 takip yaptın.` };
      }

      if (title.includes("randevu oluştur")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Randevu').gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz bir randevu oluşturmadın." };
      }

      if (title.includes("peş peşe girişini sürdür")) {
        const { data: profile } = await supabase.from('profiles').select('current_streak').eq('uid', agentId).maybeSingle();
        if (profile && profile.current_streak > 0) return { verified: true };
        return { verified: false, message: "Bugün henüz giriş yapmamış görünüyorsun." };
      }

      if (title.includes("100 puan kazan")) {
        const { data: completedToday } = await supabase.from('gamified_tasks').select('points').eq('agent_id', agentId).eq('is_completed', true).eq('date', today);
        const totalPointsToday = completedToday?.reduce((acc, t) => acc + t.points, 0) || 0;
        if (totalPointsToday >= 100) return { verified: true };
        return { verified: false, message: `Bugün henüz ${totalPointsToday}/100 puan topladın.` };
      }

      if (title.includes("hedefini belirle")) {
        const { data: personalTasks } = await supabase.from('personal_tasks').select('id').eq('agent_id', agentId).gte('created_at', today);
        if (personalTasks && personalTasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir kişisel hedef (görev) belirlemedin." };
      }

      if (title.includes("portföy notu güncelle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('updated_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir portföy notu güncellemedin." };
      }

      if (title.includes("müşteriye dönüş yap")) {
        const { data: leads } = await supabase.from('leads').select('id').eq('agent_id', agentId).gte('last_contact', today);
        if (leads && leads.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir müşteriye dönüş yapmadın." };
      }

      if (title.includes("eski bir müşterini ara")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz eski bir müşterini aramadın." };
      }

      if (title.includes("isimli müşteriyi ara")) {
        const match = task.title.match(/"([^"]+)"/);
        if (match) {
          const leadName = match[1];
          const { data: lead } = await supabase.from('leads').select('id').eq('agent_id', agentId).eq('name', leadName).maybeSingle();
          if (lead) {
            const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
            if (tasks && tasks.length >= 1) return { verified: true };
          }
        }
        return { verified: false, message: "Belirtilen müşteriyi henüz aramadın." };
      }

      if (title.includes("gün sonu raporu")) {
        const { data: profile } = await supabase.from('profiles').select('last_ritual_completed_at').eq('uid', agentId).maybeSingle();
        if (profile?.last_ritual_completed_at && profile.last_ritual_completed_at.startsWith(today)) return { verified: true };
        return { verified: false, message: "Gün sonu ritüelini henüz tamamlamadın." };
      }

      if (title.includes("cevapsız mesaj")) {
        const { data: leads } = await supabase.from('leads').select('id').eq('agent_id', agentId).gte('last_contact', today);
        if (leads && leads.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir müşteriye dönüş yapmadın." };
      }

      if (title.includes("esnafı ziyareti") || title.includes("esnafla tanış")) {
        const { data: visits } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Saha').eq('completed', true).gte('created_at', today);
        if (visits && visits.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir esnaf ziyareti kaydetmedin." };
      }

      if (title.includes("fiyat analizi")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('updated_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir portföy analizi/güncellemesi yapmadın." };
      }

      return { verified: false, message: "Bu görev henüz tamamlanmamış görünüyor." };
    } catch (error) {
      console.error("Verification error:", error);
      return { verified: false, message: "Doğrulama sırasında bir hata oluştu." };
    }
  },

  updateGamifiedTask: async (taskId: string, data: Partial<GamifiedTask>) => {
    const dbData: any = {};
    if (data.is_completed !== undefined) dbData.is_completed = data.is_completed;
    if (data.ai_reason !== undefined) dbData.ai_reason = data.ai_reason;
    if (data.title !== undefined) dbData.title = data.title;
    if (data.points !== undefined) dbData.points = data.points;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.date !== undefined) dbData.date = data.date;
    if (data.notified !== undefined) dbData.notified = data.notified;
    if (data.reminder_time !== undefined) dbData.reminder_time = data.reminder_time;

    const { error } = await supabase
      .from('gamified_tasks')
      .update(dbData)
      .eq('id', taskId);
    if (error) throw error;
  },

  getGamifiedStats: async (): Promise<UserStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTodayStr();

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', agentId).maybeSingle();
    const points = profile ? (profile.total_xp || 0) : 0;

    const { data: tasksData } = await supabase
      .from('gamified_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today);
    
    const tasks = (tasksData || []).map((t: any) => ({
      ...t,
      agent_id: t.agent_id,
      is_completed: t.is_completed,
      ai_reason: t.ai_reason
    })) as GamifiedTask[];
    
    const completedTasks = tasks.filter(t => t.is_completed);
    const pointsToday = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const mainTasks = tasks.filter(t => t.category === 'main');
    const completedMainTasks = mainTasks.filter(t => t.is_completed);

    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) : 0;
    const mainCompletionRate = mainTasks.length > 0 ? (mainTasks.filter(t => t.is_completed).length / mainTasks.length) : 0;
    
    let streak = profile ? (profile.current_streak || 0) : 0;
    const lastActiveDate = profile ? profile.last_active_date : null;
    
    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        await supabase.from('profiles').update({ 
          current_streak: streak + 1,
          last_active_date: today
        }).eq('uid', agentId);
        streak += 1;
      } else if (diffDays > 1) {
        await supabase.from('profiles').update({ 
          current_streak: 1,
          last_active_date: today
        }).eq('uid', agentId);
        streak = 1;
      }
    } else {
      await supabase.from('profiles').update({ 
        current_streak: 1,
        last_active_date: today
      }).eq('uid', agentId);
      streak = 1;
    }
    const streakEffect = streak > 0 ? 20 : 0;

    const momentum = Math.round((completionRate * 50) + (mainCompletionRate * 30) + streakEffect);

    let level = 1;
    let level_name = "Başlangıç";
    let next_level_points = 1000;

    if (points > 15000) { level = 5; level_name = "Kapanışa Yakın"; next_level_points = 30000; }
    else if (points > 7000) { level = 4; level_name = "Saha Oyuncusu"; next_level_points = 15000; }
    else if (points > 3000) { level = 3; level_name = "Üretici"; next_level_points = 7000; }
    else if (points > 1000) { level = 2; level_name = "Aktif"; next_level_points = 3000; }

    return {
      points,
      points_today: pointsToday,
      streak,
      momentum,
      level,
      level_name,
      next_level_points,
      daily_progress: Math.round(completionRate * 100),
      tasks_completed_today: completedTasks.length,
      total_tasks_today: tasks.length
    };
  }
};
