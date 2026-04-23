import { UserProfile, DashboardStats, Property, Task, Lead, DailyStats, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { taskService } from './taskService';
import { gamificationService } from './gamificationService';
import { momentumOsService } from './momentumOsService';

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

  completeMorningRitual: async (variables?: { morning_notes: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Save morning plan if notes are provided
    if (variables?.morning_notes) {
      await momentumOsService.saveMorningPlan(variables.morning_notes);
    }

    // Use server-side MORNING_RITUAL action to update timestamps and award XP securely
    await gamificationService.earnXP('MORNING_RITUAL');
  },

  completeEveningRitual: async (stats: { tasksCompleted?: number, tasks_completed?: number, revenue: number, calls: number, visits: number, evening_notes?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Save evening notes if provided
    if (stats.evening_notes) {
      await momentumOsService.saveEveningClosing(stats.evening_notes);
    }

    // Use server-side EVENING_RITUAL action to handle streaks, timestamps, and XP securely
    await gamificationService.earnXP('EVENING_RITUAL', null, {
      tasks_completed: stats.tasksCompleted !== undefined ? stats.tasksCompleted : (stats.tasks_completed || 0),
      potential_revenue_handled: stats.revenue,
      calls_made: stats.calls,
      visits_made: stats.visits
    });

    return { success: true };
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

  endDay: async (stats: any) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    // Use server-side END_DAY action to update timestamps, stats, and award XP securely
    await gamificationService.earnXP('END_DAY', null, {
      tasks_completed: stats.tasks_completed,
      calls_made: stats.calls,
      visits_made: stats.visits,
      potential_revenue_handled: stats.revenue
    });

    return { success: true };
  }
};
