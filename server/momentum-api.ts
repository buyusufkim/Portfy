import { Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "./ai-api.js";

export const handleMaintenanceRun = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       return res.status(503).json({ error: "Missing DB configuration" });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- 1) refreshLeadAlerts logic ---
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['Aday', 'Sıcak', 'Takipte']);
    
    if (!leadError && leads) {
      const now = new Date();
      const alertsToUpsert = [];

      for (const lead of leads) {
        const lastContact = new Date(lead.last_contacted_at || lead.created_at || now);
        const hoursDiff = (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60);
        const daysDiff = hoursDiff / 24;
        const isHot = lead.temperature === 'hot' || lead.status === 'Sıcak';

        let alertType = '';
        let severity = 'low';

        if (isHot && hoursDiff >= 48) {
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
        await supabaseAdmin.from('lead_alerts').upsert(alertsToUpsert, { onConflict: 'user_id, lead_id, alert_type, status' });
      }
    }

    // --- 2) generateWeeklyReport logic ---
    const now = new Date();
    const day = now.getDay() || 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - day + 1);
    startOfWeek.setHours(0,0,0,0);
    const weekDateStr = startOfWeek.toISOString().split('T')[0];

    const { data: plans } = await supabaseAdmin
      .from('daily_plan')
      .select('completed_calls, completed_portfolio_actions')
      .eq('user_id', userId)
      .gte('plan_date', weekDateStr);

    let dp_calls = 0;
    let property_visits = 0;
    if (plans) {
      plans.forEach((p: any) => {
        dp_calls += (p.completed_calls || 0);
        property_visits += (p.completed_portfolio_actions || 0);
      });
    }

    const { count: activity_calls } = await supabaseAdmin
      .from('lead_activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_type', 'call')
      .gte('happened_at', startOfWeek.toISOString());

    let calls_made = activity_calls || dp_calls;

    const { count: meetings } = await supabaseAdmin
      .from('lead_activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('result', ['meeting_set', 'appointment'])
      .gte('happened_at', startOfWeek.toISOString());

    const { count: referrals_received } = await supabaseAdmin
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString());

    const { count: leads_acquired } = await supabaseAdmin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString());

    const { count: silent_leads } = await supabaseAdmin
      .from('lead_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open');

    const { count: active_blockers } = await supabaseAdmin
      .from('portfolio_blockers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: propertiesData } = await supabaseAdmin
      .from('properties')
      .select('price')
      .eq('user_id', userId)
      .in('status', ['Satıldı', 'Kapandı'])
      .gte('updated_at', startOfWeek.toISOString());
      
    let closes = 0;
    let closed_volume = 0;
    if (propertiesData) {
      closes = propertiesData.length;
      propertiesData.forEach((p: any) => {
        closed_volume += (Number(p.price) || 0);
      });
    }

    const metrics = {
      calls_made,
      property_visits,
      meetings: meetings || 0,
      authorities: 0,
      closes,
      leads_acquired: leads_acquired || 0,
      referrals_received: referrals_received || 0,
      silent_leads: silent_leads || 0,
      active_blockers: active_blockers || 0,
      closed_volume
    };
    
    await supabaseAdmin
      .from('weekly_reports')
      .upsert({
        user_id: userId,
        week_start_date: weekDateStr,
        metrics,
        generated_at: new Date().toISOString()
      }, { onConflict: 'user_id, week_start_date' });

    res.json({ success: true });
  } catch (err) {
    console.error("Maintenance run error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
