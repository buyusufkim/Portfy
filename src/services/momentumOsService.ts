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
  WeeklyReport,
  DailyPlan,
  DayClosure,
  LeadActivityLog,
  LeadAlert,
  PortfolioBlocker,
  OwnerPortalEvent,
  Lead
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
  getOwnerPortalEventsSummary: async (propertyId?: string): Promise<{ property_id: string; views: number; last_seen: string }[]> => {
    const userId = await getUserId();
    let query = supabase
      .from('owner_portal_events')
      .select('property_id, created_at')
      .eq('user_id', userId)
      .eq('event_type', 'view')
      .order('created_at', { ascending: false });
    
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
      
    const { data, error } = await query;
    if (error) throw error;
    
    const summaryMap: Record<string, { property_id: string; views: number; last_seen: string }> = {};
    (data || []).forEach(event => {
      const pid = event.property_id;
      if (!summaryMap[pid]) {
        summaryMap[pid] = { property_id: pid, views: 0, last_seen: event.created_at };
      }
      summaryMap[pid].views += 1;
    });

    return Object.values(summaryMap);
  },

  // Momentum OS Core Methods
  getDailyPlan: async (dateStr?: string): Promise<DailyPlan | null> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    const { data, error } = await supabase
      .from('daily_plan')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', targetDate)
      .maybeSingle();
    if (error) throw error;
    return data as DailyPlan | null;
  },

  saveDailyPlan: async (payload: Partial<DailyPlan>, dateStr?: string): Promise<DailyPlan> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    const { data, error } = await supabase
      .from('daily_plan')
      .upsert({ ...payload, user_id: userId, plan_date: targetDate, updated_at: new Date().toISOString() }, { onConflict: 'user_id, plan_date' })
      .select()
      .single();
    if (error) throw error;
    return data as DailyPlan;
  },

  getDayClosure: async (dateStr?: string): Promise<DayClosure | null> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    const { data, error } = await supabase
      .from('day_closure')
      .select('*')
      .eq('user_id', userId)
      .eq('closure_date', targetDate)
      .maybeSingle();
    if (error) throw error;
    return data as DayClosure | null;
  },

  saveDayClosure: async (payload: Partial<DayClosure>, dateStr?: string): Promise<DayClosure> => {
    const userId = await getUserId();
    const targetDate = dateStr || getTodayStr();
    const { data, error } = await supabase
      .from('day_closure')
      .upsert({ ...payload, user_id: userId, closure_date: targetDate, updated_at: new Date().toISOString() }, { onConflict: 'user_id, closure_date' })
      .select()
      .single();
    if (error) throw error;
    return data as DayClosure;
  },

  logLeadActivity: async (payload: Partial<LeadActivityLog>): Promise<LeadActivityLog> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('lead_activity_log')
      .insert([{ ...payload, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as LeadActivityLog;
  },

  getLeadActivity: async (leadId: string): Promise<LeadActivityLog[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('lead_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .eq('user_id', userId)
      .order('happened_at', { ascending: false });
    if (error) throw error;
    return (data || []) as LeadActivityLog[];
  },

  getLeadAlerts: async (): Promise<LeadAlert[]> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('lead_alerts')
      .select('*, lead:leads(*)')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('triggered_at', { ascending: false });
    if (error) throw error;
    return (data || []) as LeadAlert[];
  },

  refreshLeadAlerts: async (): Promise<void> => {
    const userId = await getUserId();
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Aday') // Only for active candidate leads
      .not('status', 'in', '("Kapalı", "Pasif")');
    
    if (leadError || !leads) return;

    const now = new Date();
    const alertsToUpsert = [];

    for (const lead of (leads as Lead[])) {
      const lastContact = new Date(lead.last_contacted_at || lead.created_at || now);
      const hoursDiff = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60);
      const daysDiff = hoursDiff / 24;

      let alertType = '';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (lead.temperature === 'hot' && hoursDiff >= 48) {
        alertType = 'hot_48h_silence';
        severity = 'critical';
      } else if (daysDiff >= 14) {
        alertType = 'stale_14d';
        severity = 'high';
      } else if (daysDiff >= 7) {
        alertType = 'stale_7d';
        severity = 'medium';
      } else if (daysDiff >= 3) {
        alertType = 'stale_3d';
        severity = 'low';
      }

      if (alertType) {
        alertsToUpsert.push({
          user_id: userId,
          lead_id: lead.id,
          alert_type: alertType,
          severity,
          status: 'open',
          triggered_at: now.toISOString()
        });
      }
    }

    if (alertsToUpsert.length > 0) {
      await supabase.from('lead_alerts').upsert(alertsToUpsert, { onConflict: 'user_id, lead_id, alert_type, status' });
    }
  },

  createOrUpdatePortfolioBlocker: async (payload: Partial<PortfolioBlocker>): Promise<PortfolioBlocker> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('portfolio_blockers')
      .upsert({ ...payload, user_id: userId, created_at: new Date().toISOString(), is_active: true })
      .select()
      .single();
    if (error) throw error;
    return data as PortfolioBlocker;
  },

  getPortfolioBlockers: async (propertyId?: string): Promise<PortfolioBlocker[]> => {
    const userId = await getUserId();
    let query = supabase
      .from('portfolio_blockers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (propertyId) query = query.eq('property_id', propertyId);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PortfolioBlocker[];
  },

  resolvePortfolioBlocker: async (id: string): Promise<void> => {
    const userId = await getUserId();
    await supabase
      .from('portfolio_blockers')
      .update({ is_active: false, resolved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
  },

  createOwnerPortalEvent: async (payload: Partial<OwnerPortalEvent>): Promise<OwnerPortalEvent> => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('owner_portal_events')
      .insert([{ ...payload, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as OwnerPortalEvent;
  },

  createPortalToken: async (propertyId: string): Promise<{ token: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/portal/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ propertyId }),
    });
    if (!response.ok) throw new Error('Portal oluşturulamadı');
    return await response.json();
  },

  revokePortalToken: async (token: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/portal/revoke`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error('Portal iptal edilemedi');
  },

  // 7 & 9. Gün Sonu Kapanış & Sabah 10 Dakika Planı (Legacy support)
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

