import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';
import { 
  ContentCalendar, 
  MicroGoal, 
  TerritoryPlan, 
  Referral, 
  UserActivation, 
  PortalTrafficLog, 
  DailyRitual, 
  WeeklyReport 
} from '../types';

export const momentumOsService = {
  // 1. Akıllı İçerik Takvimi
  getContentCalendar: async (): Promise<ContentCalendar[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: true });
    if (error) throw error;
    return (data || []) as ContentCalendar[];
  },

  addContentCalendar: async (calendar: Partial<ContentCalendar>): Promise<ContentCalendar> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .insert([{ ...calendar, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as ContentCalendar;
  },

  updateContentCalendar: async (id: string, updates: Partial<ContentCalendar>): Promise<ContentCalendar> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as ContentCalendar;
  },

  // 2. Mikro Hedef Sistemi
  getMicroGoals: async (): Promise<MicroGoal[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });
    if (error) throw error;
    return (data || []) as MicroGoal[];
  },

  addMicroGoal: async (goal: Partial<MicroGoal>): Promise<MicroGoal> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .insert([{ ...goal, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as MicroGoal;
  },

  updateMicroGoal: async (id: string, updates: Partial<MicroGoal>): Promise<MicroGoal> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as MicroGoal;
  },

  // 3. Territory Planning
  getTerritoryPlans: async (): Promise<TerritoryPlan[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as TerritoryPlan[];
  },

  addTerritoryPlan: async (plan: Partial<TerritoryPlan>): Promise<TerritoryPlan> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .insert([{ ...plan, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as TerritoryPlan;
  },

  updateTerritoryPlan: async (id: string, updates: Partial<TerritoryPlan>): Promise<TerritoryPlan> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as TerritoryPlan;
  },

  // 4. Referral Engine
  getReferrals: async (): Promise<Referral[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as Referral[];
  },

  addReferral: async (referral: Partial<Referral>): Promise<Referral> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .insert([{ ...referral, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as Referral;
  },

  updateReferral: async (id: string, updates: Partial<Referral>): Promise<Referral> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as Referral;
  },

  // 5. İlk 7 Gün Aktivasyon Programı
  getUserActivation: async (): Promise<UserActivation> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('user_activations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    // Auto-create if not exists
    if (!data) {
      const { data: newData, error: newError } = await supabase
        .from('user_activations')
        .insert([{ user_id: userId, completed_steps: [] }])
        .select()
        .single();
      if (newError) throw newError;
      return newData as UserActivation;
    }
    return data as UserActivation;
  },

  updateUserActivation: async (updates: Partial<UserActivation>): Promise<UserActivation> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('user_activations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as UserActivation;
  },

  // 6. Sahip Portalı Trafik Motoru
  getPortalTrafficLogs: async (propertyId?: string): Promise<PortalTrafficLog[]> => {
    const userId = await getUserId();
    let query = supabase
      .from('portal_traffic_logs')
      .select('*, property:properties(title)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false });
      
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
      
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PortalTrafficLog[];
  },

  // 7 & 9. Gün Sonu Kapanış & Sabah 10 Dakika Planı
  getDailyRitual: async (dateStr?: string): Promise<DailyRitual> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr(); // YYYY-MM-DD
    
    const { data, error } = await supabase
      .from('daily_rituals')
      .select('*')
      .eq('user_id', userId)
      .eq('ritual_date', targetDate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      const { data: newData, error: newError } = await supabase
        .from('daily_rituals')
        .insert([{ user_id: userId, ritual_date: targetDate }])
        .select()
        .single();
      if (newError) throw newError;
      return newData as DailyRitual;
    }
    return data as DailyRitual;
  },

  saveMorningPlan: async (notes: string, dateStr?: string): Promise<DailyRitual> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    
    const { data, error } = await supabase
      .from('daily_rituals')
      .upsert({ 
        user_id: userId, 
        ritual_date: targetDate, 
        morning_notes: notes,
        morning_plan_completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, ritual_date' })
      .select()
      .single();
      
    if (error) throw error;
    return data as DailyRitual;
  },

  saveEveningClosing: async (notes: string, dateStr?: string): Promise<DailyRitual> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    
    const { data, error } = await supabase
      .from('daily_rituals')
      .upsert({ 
        user_id: userId, 
        ritual_date: targetDate, 
        evening_notes: notes,
        evening_closing_completed_at: new Date().toISOString()
      }, { onConflict: 'user_id, ritual_date' })
      .select()
      .single();
      
    if (error) throw error;
    return data as DailyRitual;
  },

  // 12. Haftalık İş Sonucu Panosu
  getWeeklyReports: async (): Promise<WeeklyReport[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false });
    if (error) throw error;
    return (data || []) as WeeklyReport[];
  }
};

