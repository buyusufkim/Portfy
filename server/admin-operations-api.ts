import { Response } from "express";
import { AuthRequest } from "./ai-api.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
}) : null;

export const safeErrorMessage = (error: unknown, fallback: string) =>
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : fallback;

export const handleAdminOperationsOverview = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const [
      usersCount,
      propertiesResult,
      leadsResult,
      marketingCount,
      mapPinsCount
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('properties').select('id, user_id, status, price, images, address'),
      supabaseAdmin.from('leads').select('id, user_id, status'),
      supabaseAdmin.from('property_marketing_outputs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('map_pins').select('*', { count: 'exact', head: true })
    ]);

    if (usersCount.error) throw usersCount.error;
    if (propertiesResult.error) throw propertiesResult.error;
    if (leadsResult.error) throw leadsResult.error;
    
    const properties = propertiesResult.data || [];
    const leads = leadsResult.data || [];

    const totalUsers = usersCount.count || 0;
    const totalProperties = properties.length;
    const totalLeads = leads.length;
    
    let activeProperties = 0;
    let passiveProperties = 0;
    let propertiesMissingPhotos = 0;
    let propertiesMissingPrice = 0;
    let propertiesMissingLocation = 0;

    const userPropCount: Record<string, number> = {};
    
    for (const p of properties) {
       userPropCount[p.user_id] = (userPropCount[p.user_id] || 0) + 1;
       if (p.status?.toLowerCase().includes('satıldı') || p.status?.toLowerCase().includes('kiralandı') || p.status?.toLowerCase().includes('pasif')) {
          passiveProperties++;
       } else {
          activeProperties++;
       }

       if (!p.images || p.images.length === 0) propertiesMissingPhotos++;
       if (!p.price || p.price <= 0) propertiesMissingPrice++;
       
       let hasLocation = false;
       if (p.address && typeof p.address === 'object') {
          if (p.address.city || p.address.district) hasLocation = true;
       }
       if (!hasLocation) propertiesMissingLocation++;
    }

    let hotLeads = 0;
    let silentLeads = 0;
    const userLeadCount: Record<string, number> = {};

    for (const l of leads) {
       userLeadCount[l.user_id] = (userLeadCount[l.user_id] || 0) + 1;
       if (l.status === 'Sıcak' || l.status === 'Talepli') hotLeads++;
       else silentLeads++;
    }

    let usersWithNoProperties = 0;
    let usersWithNoLeads = 0;
    let usersWithNoCrmActivity = 0;
    let riskUsersCount = 0; // we will properly calculate this in /users endpoint, but here we can do a rough estimate

    // We need profiles to know total users who haven't entered anything
    const { data: allUserIds } = await supabaseAdmin.from('profiles').select('id');
    
    if (allUserIds) {
       for (const u of allUserIds) {
          const p = userPropCount[u.id] || 0;
          const l = userLeadCount[u.id] || 0;
          if (p === 0) usersWithNoProperties++;
          if (l === 0) usersWithNoLeads++;
          if (p === 0 && l === 0) usersWithNoCrmActivity++;
       }
       riskUsersCount = usersWithNoCrmActivity; // very rough baseline
    }

    res.json({
      totalUsers,
      totalProperties,
      activeProperties,
      passiveProperties,
      totalLeads,
      hotLeads,
      silentLeads,
      usersWithNoProperties,
      usersWithNoLeads,
      usersWithNoCrmActivity,
      propertiesMissingPhotos,
      propertiesMissingPrice,
      propertiesMissingLocation,
      marketingOutputsCount: marketingCount.count || 0,
      mapPinsCount: mapPinsCount.count || 0,
      fieldVisitsCount: 0, // Mock for MVP
      topCities: [], // Mock for MVP
      riskUsersCount
    });

  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Overview API hatası") });
  }
};

export const handleAdminOperationsUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const segment = req.query.segment as string || 'all';

    // To prevent overload on large DBs, we should ideally use a JOIN or a View. 
    // For this admin ops overview where user count might be < 1000, fetching in memory is fine for MVP.
    const [profilesRes, propertiesRes, leadsRes, marketingRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, display_name, email, phone, tier, subscription_type, subscription_end_date, city, district'),
      supabaseAdmin.from('properties').select('user_id, status, created_at, updated_at'),
      supabaseAdmin.from('leads').select('user_id, status, created_at, updated_at'),
      supabaseAdmin.from('property_marketing_outputs').select('user_id')
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (propertiesRes.error) throw propertiesRes.error;
    if (leadsRes.error) throw leadsRes.error;

    const properties = propertiesRes.data || [];
    const leads = leadsRes.data || [];
    const marketing = marketingRes.data || [];

    const now = new Date();

    const userStatsMap: Record<string, any> = {};

    profilesRes.data?.forEach(u => {
       userStatsMap[u.id] = {
           user_id: u.id,
           display_name: u.display_name,
           email: u.email,
           phone: u.phone,
           tier: u.tier,
           subscription_type: u.subscription_type,
           subscription_end_date: u.subscription_end_date,
           city: u.city,
           district: u.district,
           properties_count: 0,
           active_properties_count: 0,
           leads_count: 0,
           hot_leads_count: 0,
           silent_leads_count: 0,
           marketing_outputs_count: 0,
           last_property_at: null,
           last_lead_at: null,
           last_activity_at: null,
           map_pins_count: 0,
           field_visits_count: 0
       };
    });

    properties.forEach(p => {
       const user = userStatsMap[p.user_id];
       if (user) {
          user.properties_count++;
          if (p.status?.toLowerCase() !== 'pasif' && !p.status?.toLowerCase().includes('satıldı') && !p.status?.toLowerCase().includes('kiralandı')) {
             user.active_properties_count++;
          }
          if (!user.last_property_at || new Date(p.updated_at) > new Date(user.last_property_at)) {
             user.last_property_at = p.updated_at;
          }
          if (!user.last_activity_at || new Date(p.updated_at) > new Date(user.last_activity_at)) {
             user.last_activity_at = p.updated_at;
          }
       }
    });

    leads.forEach(l => {
       const user = userStatsMap[l.user_id];
       if (user) {
          user.leads_count++;
          if (l.status === 'Sıcak' || l.status === 'Talepli') user.hot_leads_count++;
          else user.silent_leads_count++;

          if (!user.last_lead_at || new Date(l.updated_at) > new Date(user.last_lead_at)) {
             user.last_lead_at = l.updated_at;
          }
           if (!user.last_activity_at || new Date(l.updated_at) > new Date(user.last_activity_at)) {
             user.last_activity_at = l.updated_at;
          }
       }
    });

    marketing.forEach(m => {
       const user = userStatsMap[m.user_id];
       if (user) {
          user.marketing_outputs_count++;
       }
    });

    const results = Object.values(userStatsMap).map(u => {
        let usage_score = 0;
        if (u.properties_count > 0) usage_score += 25;
        if (u.leads_count > 0) usage_score += 25;
        if (u.marketing_outputs_count > 0) usage_score += 10;
        
        const daysSinceActivity = u.last_activity_at ? (now.getTime() - new Date(u.last_activity_at).getTime()) / (1000 * 3600 * 24) : 999;
        
        if (daysSinceActivity <= 7) usage_score += 25;
        else if (daysSinceActivity <= 14) usage_score += 15;

        // Risk Logic calculation
        let risk_level = 'healthy';
        let risk_reasons: string[] = [];

        if (u.properties_count === 0) risk_reasons.push("Portföy yok");
        if (u.leads_count === 0) risk_reasons.push("Müşteri/Lead yok");

        if (u.properties_count === 0 && u.leads_count === 0) {
            risk_level = (u.tier === 'pro' || u.tier === 'elite' || u.tier === 'master') ? 'critical' : 'risk';
            risk_reasons.push("Hiçbir CRM/Portföy verisi girilmemiş");
        } else {
            if (daysSinceActivity > 14) {
               risk_level = 'risk';
               risk_reasons.push("14+ gündür CRM hareketsiz");
            } else if (daysSinceActivity > 7) {
               risk_level = 'watch';
               risk_reasons.push("7+ gündür aktivite yok");
            } else if (u.properties_count > 0 && u.leads_count === 0) {
               risk_level = 'watch';
               risk_reasons.push("Portföy var ama takip/lead yok");
            }
        }

        return {
            ...u,
            usage_score,
            risk_level,
            risk_reasons
        };
    });

    // Apply Segment Filter
    let filtered = results;
    if (segment === 'no_properties') filtered = filtered.filter(f => f.properties_count === 0);
    else if (segment === 'no_leads') filtered = filtered.filter(f => f.leads_count === 0);
    else if (segment === 'no_crm_activity') filtered = filtered.filter(f => f.properties_count === 0 && f.leads_count === 0);
    else if (segment === 'portfolio_active') filtered = filtered.filter(f => f.active_properties_count > 0);
    else if (segment === 'crm_active') filtered = filtered.filter(f => f.leads_count > 0);
    else if (segment === 'risk') filtered = filtered.filter(f => f.risk_level === 'risk' || f.risk_level === 'critical');

    // Sort by risk so critical ones are top
    filtered.sort((a,b) => {
        const rMap: any = { 'critical': 4, 'risk': 3, 'watch': 2, 'healthy': 1 };
        return rMap[b.risk_level] - rMap[a.risk_level];
    });

    res.json({ data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Users Ops API hatası") });
  }
};
