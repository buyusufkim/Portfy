import { supabase } from '../lib/supabase';
import { getTodayStr, getUserId } from './core/utils';
import { GamifiedTask, UserStats, GamifiedTaskCategory } from '../types';

export const gamificationService = {
  getDailyGamifiedTasks: async (forceRefresh: boolean = false) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const today = getTodayStr();
    
    // 🔥 OTOMATİK SERİ (STREAK), GÜNLÜK GİRİŞ VE CEZA KONTROLÜ 🔥
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile && profile.last_active_date !== today) {
      const lastActiveDateStr = profile.last_active_date;
      let newStreak = profile.current_streak || 0;
      let newTotalXp = profile.total_xp || 0;
      
      if (lastActiveDateStr) {
        const lastActiveDate = new Date(lastActiveDateStr);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1; // Dün de girmiş, seriyi bozmadan devam et
        } else if (diffDays > 1) {
          newStreak = 0; // 24 saatten fazla boşluk, seri sıfırlandı!
        }
      } else {
        newStreak = 1; // İlk defa giriyor
      }

      await supabase.from('profiles').update({
        last_active_date: today,
        current_streak: newStreak,
        total_xp: newTotalXp
      }).eq('id', userId);
    }

    // Görevleri getir
    let { data: tasks } = await supabase
      .from('gamified_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    // Eğer bugün hiç görev yoksa varsayılan görevleri oluştur
    if (!tasks || tasks.length === 0) {
      const defaultTasks = [
        { user_id: userId, title: 'Güne Erken Başla (Sabah Ritüelini Tamamla)', reward_points: 100, category: 'routine', date: today, is_completed: false },
        { user_id: userId, title: 'Bugün 3 Yeni Lead Ekle', reward_points: 150, category: 'lead', date: today, is_completed: false },
        { user_id: userId, title: 'Bugün 1 Yeni Portföy Ekle', reward_points: 300, category: 'portfolio', date: today, is_completed: false },
        { user_id: userId, title: 'Akşam Gün Kapanışını (Ritüeli) Tamamla', reward_points: 100, category: 'routine', date: today, is_completed: false },
        { user_id: userId, title: '1 Kişisel Görev Tamamla', reward_points: 50, category: 'routine', date: today, is_completed: false },
        { user_id: userId, title: 'Peş peşe girişini sürdür', reward_points: 50, category: 'routine', date: today, is_completed: false }
      ];
      
      const { data: newTasks, error: insertError } = await supabase.from('gamified_tasks').insert(defaultTasks).select();
      if (!insertError && newTasks) {
         tasks = newTasks;
      }
    }

    return (tasks || []) as GamifiedTask[];
  },

  completeGamifiedTask: async (taskId: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: task } = await supabase.from('gamified_tasks').select('*').eq('id', taskId).single();
    if (!task || task.is_completed) return; // Zaten tamamlanmış

    const { error } = await supabase
      .from('gamified_tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', taskId);
      
    if (error) throw error;

    // Ödül puanını ver
    if (task.reward_points > 0) {
      await gamificationService.earnXP('COMPLETE_GAMIFIED_TASK', taskId, { points: task.reward_points });
    }
  },

  updateGamifiedTask: async (id: string, data: Partial<GamifiedTask>) => {
    const { error } = await supabase.from('gamified_tasks').update(data).eq('id', id);
    if (error) throw error;
  },

  verifyGamifiedTask: async (task: GamifiedTask) => {
    const title = task.title.toLowerCase();
    const todayStr = getTodayStr();
    const userId = await getUserId();
    
    if (task.is_completed) return { verified: false, message: "Bu görevi bugün zaten tamamladın." };

    try {
      if (title.includes("peş peşe girişini sürdür")) {
        return { verified: true };
      }

      if (title.includes("müşteri") || title.includes("lead")) {
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', `${todayStr}T00:00:00`);
        
        const match = title.match(/(\d+)/);
        const target = match ? parseInt(match[1]) : 1;
        
        if ((count || 0) >= target) return { verified: true };
        return { verified: false, message: `Bugün ${count || 0}/${target} müşteri ekledin. ${target - (count || 0)} kişi daha eklemelisin!` };
      }

      if (title.includes("portföy")) {
        const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', `${todayStr}T00:00:00`);
        
        const match = title.match(/(\d+)/);
        const target = match ? parseInt(match[1]) : 1;
        
        if ((count || 0) >= target) return { verified: true };
        return { verified: false, message: `Bugün ${count || 0}/${target} portföy ekledin. ${target - (count || 0)} portföy daha eklemelisin!` };
      }
      
      if (title.includes("görev")) {
        const { count } = await supabase.from('personal_tasks').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).eq('is_completed', true).gte('updated_at', `${todayStr}T00:00:00`);
        
        const match = title.match(/(\d+)/);
        // "1 kişisel görev" - check for numbers
        const target = match ? parseInt(match[1]) : 1;

        if ((count || 0) >= target) return { verified: true };
        return { verified: false, message: `Bugün ${count || 0}/${target} kişisel görev tamamladın!` };
      }

      if (title.includes("sabah ritüeli") || title.includes("erken başla")) {
         const profile = await supabase.from('profiles').select('morning_ritual_completed').eq('id', userId).single();
         if (profile.data?.morning_ritual_completed) return { verified: true };
         return { verified: false, message: "Sabah ritüelini henüz tamamlamadın." };
      }

      if (title.includes("akşam ritüeli") || title.includes("kapanış")) {
         const profile = await supabase.from('profiles').select('evening_ritual_completed').eq('id', userId).single();
         if (profile.data?.evening_ritual_completed) return { verified: true };
         return { verified: false, message: "Gün kapanışını henüz yapmadın." };
      }
    } catch(e) {
      console.error("verify error:", e);
    }
    
    // Fallback: If it's a generic task, just verify
    return { verified: true };
  },

  earnXP: async (actionType: string, entityId?: string, stats?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_action_type: actionType,
      p_entity_id: entityId || null,
      p_stats: stats || {}
    });
    
    if (error) throw error;
    return data;
  },

  getGamifiedStats: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return {
      points: profile.total_xp || 0,
      points_today: 0,
      streak: profile.current_streak || 0,
      momentum: 0,
      level: profile.broker_level || 1,
      level_name: 'Junior',
      next_level_points: 1000,
      daily_progress: 0,
      tasks_completed_today: 0,
      total_tasks_today: 10
    };
  }
};
