import { UserProfile, DashboardStats, Property, Task, Lead, DailyStats, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { taskService } from './taskService';
import { gamificationService } from './gamificationService';

export const profileService = {
  getProfile: async (): Promise<UserProfile | null> => {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', userId)
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('uid', uid);
    if (error) throw error;
  },

  completeMorningRitual: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const now = new Date().toISOString();
    const today = getTodayStr();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_day_started_at: now,
        last_active_date: today
      })
      .eq('uid', user.id);
    
    if (error) {
      console.warn("Morning ritual profile update error:", error);
      localStorage.setItem(`day_started_${user.id}_${today}`, now);
      
      try {
        await supabase.from('profiles').update({ last_active_date: today }).eq('uid', user.id);
      } catch (e) {
        // Ignore
      }
    }
    
    await gamificationService.earnXP(50);
  },

  completeEveningRitual: async (stats: { tasksCompleted?: number, tasks_completed?: number, revenue: number, calls: number, visits: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const today = getTodayStr();
    const tasksCompleted = stats.tasksCompleted !== undefined ? stats.tasksCompleted : (stats.tasks_completed || 0);
    
    try {
      try {
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('id')
          .eq('agent_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (existingStats) {
          await supabase
            .from('user_stats')
            .update({
              tasks_completed: tasksCompleted,
              potential_revenue_handled: stats.revenue,
              calls_made: stats.calls,
              visits_made: stats.visits
            })
            .eq('id', existingStats.id);
        } else {
          await supabase
            .from('user_stats')
            .insert({
              agent_id: user.id,
              date: today,
              tasks_completed: tasksCompleted,
              potential_revenue_handled: stats.revenue,
              calls_made: stats.calls,
              visits_made: stats.visits,
              xp_earned: 100
            });
        }
      } catch (statsError) {
        console.error("user_stats table error:", statsError);
      }

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', user.id)
        .single();
      
      if (profileFetchError) throw profileFetchError;

      if (profile) {
        const lastActive = profile.last_active_date;
        const todayDate = new Date().toISOString().split('T')[0];
        let newStreak = profile.current_streak || 0;
        
        if (lastActive !== todayDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        await supabase
          .from('profiles')
          .update({ 
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, profile.longest_streak || 0),
            last_active_date: todayDate,
            last_ritual_completed_at: new Date().toISOString()
          })
          .eq('uid', user.id);
      }

      await gamificationService.earnXP(100);

      return { success: true };
    } catch (error) {
      console.error("Critical error in completeEveningRitual:", error);
      throw error;
    }
  },

  getDailyStats: async (days: number = 7): Promise<DailyStats[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    try {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .order('date', { ascending: false })
        .limit(days);
      
      return (data || []) as DailyStats[];
    } catch (e) {
      console.error("user_stats error in getDailyStats:", e);
      return [];
    }
  },

  startDay: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const today = getTodayStr();

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_day_started_at: now,
          last_active_date: today
        })
        .eq('uid', userId);
      
      if (profileError) {
        try {
          await supabase.from('profiles').update({ last_active_date: today }).eq('uid', userId);
        } catch (e) {
          // Ignore
        }
      }
      
      localStorage.setItem(`day_started_${userId}_${today}`, now);

      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (stats) {
        await supabase
          .from('user_stats')
          .update({ day_started_at: now })
          .eq('id', stats.id);
      } else {
        await supabase
          .from('user_stats')
          .insert({
            agent_id: userId,
            date: today,
            day_started_at: now,
            tasks_completed: 0,
            potential_revenue_handled: 0,
            calls_made: 0,
            visits_made: 0,
            xp_earned: 0
          });
      }
    } catch (err) {
      console.error("Critical error in startDay:", err);
      localStorage.setItem(`day_started_${userId}_${today}`, now);
    }
    
    return { success: true };
  },

  endDay: async (stats: any) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const today = getTodayStr();

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_ritual_completed_at: now,
          last_active_date: today
        })
        .eq('uid', userId);
      
      if (profileError) {
        try {
          await supabase.from('profiles').update({ last_active_date: today }).eq('uid', userId);
        } catch (e) {
          // Ignore
        }
      }

      localStorage.setItem(`day_ended_${userId}_${today}`, now);

      const { data: dailyStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (dailyStats) {
        await supabase
          .from('user_stats')
          .update({ 
            day_ended_at: now,
            tasks_completed: stats.tasks_completed,
            calls_made: stats.calls,
            visits_made: stats.visits,
            potential_revenue_handled: stats.revenue
          })
          .eq('id', dailyStats.id);
      } else {
        await supabase
          .from('user_stats')
          .insert({
            agent_id: userId,
            date: today,
            day_ended_at: now,
            tasks_completed: stats.tasks_completed,
            calls_made: stats.calls,
            visits_made: stats.visits,
            potential_revenue_handled: stats.revenue,
            xp_earned: 150
          });
      }
    } catch (err) {
      console.error("Critical error in endDay:", err);
      localStorage.setItem(`day_ended_${userId}_${today}`, now);
    }
    
    return { success: true };
  }
};
