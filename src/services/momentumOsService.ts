import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';

export const momentumOsService = {
  // 1. Akıllı İçerik Takvimi
  getContentCalendar: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: true });
    if (error) throw error;
    return data;
  },

  addContentCalendar: async (calendar: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .insert([{ ...calendar, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateContentCalendar: async (id: string, updates: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('content_calendar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 2. Mikro Hedef Sistemi
  getMicroGoals: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });
    if (error) throw error;
    return data;
  },

  addMicroGoal: async (goal: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .insert([{ ...goal, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateMicroGoal: async (id: string, updates: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('micro_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 3. Territory Planning
  getTerritoryPlans: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addTerritoryPlan: async (plan: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .insert([{ ...plan, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTerritoryPlan: async (id: string, updates: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('territory_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 4. Referral Engine
  getReferrals: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addReferral: async (referral: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .insert([{ ...referral, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateReferral: async (id: string, updates: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('referrals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 5. İlk 7 Gün Aktivasyon Programı
  getUserActivation: async () => {
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
      return newData;
    }
    return data;
  },

  updateUserActivation: async (updates: any) => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('user_activations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 6. Sahip Portalı Trafik Motoru
  getPortalTrafficLogs: async (propertyId?: string) => {
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
    return data;
  },

  // 7 & 9. Gün Sonu Kapanış & Sabah 10 Dakika Planı
  getDailyRitual: async (dateStr?: string) => {
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
      return newData;
    }
    return data;
  },

  saveMorningPlan: async (notes: string, dateStr?: string) => {
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
    return data;
  },

  saveEveningClosing: async (notes: string, dateStr?: string) => {
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
    return data;
  },

  // 12. Haftalık İş Sonucu Panosu
  getWeeklyReports: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false });
    if (error) throw error;
    return data;
  }
};
