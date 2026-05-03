import { UserProfile, DashboardStats, Property, Task, Lead, DailyStats, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask, DayClosure, WorkDisciplineLog } from '../types';
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
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  updateProfile: async (id: string, data: Partial<UserProfile>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/ai/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Profile update failed');
    }
  },

  getDailyStats: async (days: number = 7): Promise<DailyStats[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    try {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days);
      
      return (data || []) as DailyStats[];
    } catch (e) {
      console.error("user_stats error in getDailyStats:", e);
      return [];
    }
  },

  getWorkDisciplineLogs: async (): Promise<WorkDisciplineLog[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('work_discipline_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("error fetching discipline logs:", e);
      return [];
    }
  },

  startDay: async (stats?: { early_start_reason?: string }) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Use server-side START_DAY action to update timestamps securely
    const res = await gamificationService.earnXP('START_DAY', undefined, stats);
    return res;
  },

  endDay: async (stats: Partial<DayClosure> & { early_close_reason?: string }) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Use server-side END_DAY action to update timestamps, stats, and award XP securely
    const res = await gamificationService.earnXP('END_DAY', undefined, {
      tasks_completed: stats.completed_calls || 0,
      calls_made: stats.completed_calls || 0,
      visits_made: stats.completed_portfolio_actions || 0,
      potential_revenue_handled: 0,
      early_close_reason: stats.early_close_reason
    });

    return res;
  }
};
