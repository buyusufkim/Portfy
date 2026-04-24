import { UserProfile, DashboardStats, Property, Task, Lead, DailyStats, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask, DayClosure } from '../types';
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

  startDay: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Use server-side START_DAY action to update timestamps securely
    await gamificationService.earnXP('START_DAY');
    
    return { success: true };
  },

  endDay: async (stats: Partial<DayClosure>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Use server-side END_DAY action to update timestamps, stats, and award XP securely
    await gamificationService.earnXP('END_DAY', null, {
      tasks_completed: stats.completed_calls || 0,
      calls_made: stats.completed_calls || 0,
      visits_made: stats.completed_portfolio_actions || 0,
      potential_revenue_handled: 0
    });

    return { success: true };
  }
};
