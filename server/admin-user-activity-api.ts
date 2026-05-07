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

export const handleAdminGetUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(503).json({ error: "Privileged service unavailable" });

    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    // 1. Fetch user profile
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, email, phone, tier, subscription_type, subscription_end_date, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error("Kullanıcı bulunamadı");

    // 2. Fetch all relevant data concurrently
    const [
      { data: properties },
      { data: leads },
      { data: aiLogs },
      { data: packageRequests },
      { data: campaigns },
      { data: supportTickets }
    ] = await Promise.all([
      supabaseAdmin.from('properties').select('id, created_at, title').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('leads').select('id, created_at, name').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('ai_request_logs').select('id, created_at, feature_key, total_tokens').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('package_requests').select('id, created_at, status, requested_tier').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('advisor_campaigns').select('id, created_at, status, current_day').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('support_tickets').select('id, created_at, subject, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    ]);

    // Format events for timeline
    let timeline: any[] = [];

    // Account creation
    if (user.created_at) {
        timeline.push({
            id: `signup-${user.id}`,
            type: 'account_created',
            title: 'Kullanıcı Kaydı',
            description: 'Sisteme kayıt olundu',
            created_at: user.created_at,
            severity: 'info'
        });
    }

    (properties || []).forEach(p => {
        timeline.push({
            id: `prop-${p.id}`,
            type: 'property_created',
            title: 'Portföy Eklendi',
            description: p.title ? (p.title.length > 30 ? p.title.substring(0, 30) + '...' : p.title) : 'Yeni portföy oluşturuldu',
            created_at: p.created_at,
            severity: 'success'
        });
    });

    (leads || []).forEach(l => {
        timeline.push({
            id: `lead-${l.id}`,
            type: 'lead_created',
            title: 'Lead/Müşteri Eklendi',
            description: l.name ? (l.name.substring(0, 3) + '***') : 'Yeni müşteri kaydı',
            created_at: l.created_at,
            severity: 'success'
        });
    });

    let aiTokensUsed = 0;
    (aiLogs || []).forEach(ai => {
        aiTokensUsed += ai.total_tokens || 0;
        timeline.push({
            id: `ai-${ai.id}`,
            type: 'ai_used',
            title: 'AI Kullanımı',
            description: `${ai.feature_key || 'AI Özelliği'} kullanıldı (${ai.total_tokens || 0} token)`,
            created_at: ai.created_at,
            severity: 'info'
        });
    });

    (packageRequests || []).forEach(pr => {
        timeline.push({
            id: `pkg-${pr.id}`,
            type: 'package_request_created',
            title: 'Paket Talebi',
            description: `${pr.requested_tier || 'Paket'} talebi oluşturuldu (${pr.status})`,
            created_at: pr.created_at,
            severity: pr.status === 'approved' ? 'success' : (pr.status === 'rejected' ? 'danger' : 'warning')
        });
    });

    (campaigns || []).forEach(c => {
        timeline.push({
            id: `camp-${c.id}`,
            type: 'campaign_started',
            title: '90 Gün Kampı',
            description: `Kampanya durumu: ${c.status}, Gün: ${c.current_day}`,
            created_at: c.created_at,
            severity: 'info'
        });
    });

    (supportTickets || []).forEach(t => {
        timeline.push({
            id: `ticket-${t.id}`,
            type: 'support_ticket_created',
            title: 'Destek Talebi',
            description: t.subject || 'Destek talebi açıldı',
            created_at: t.created_at,
            severity: 'warning'
        });
    });

    // Sort timeline DESC and take top 50
    timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    timeline = timeline.slice(0, 50);

    // Calculate Last Activity Date
    const allDates = timeline.map(t => new Date(t.created_at).getTime());
    let lastActiveDate = user.created_at;
    if (allDates.length > 0) {
       const maxDateStr = new Date(Math.max(...allDates)).toISOString();
       lastActiveDate = maxDateStr;
    }

    const userWithActivity = {
        ...user,
        last_active_date: lastActiveDate
    };

    // Accounts Stats
    const now = new Date();
    const accountAgeDays = user.created_at ? Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 3600 * 24)) : 0;
    const daysSinceLastActive = lastActiveDate ? Math.floor((now.getTime() - new Date(lastActiveDate).getTime()) / (1000 * 3600 * 24)) : 0;

    const propertiesCount = (properties || []).length;
    const leadsCount = (leads || []).length;
    
    let usageScore = 0;
    if (propertiesCount > 0) usageScore += 20;
    if (leadsCount > 0) usageScore += 20;
    if ((aiLogs || []).length > 0) usageScore += 15;
    if ((campaigns || []).length > 0) usageScore += 15;
    if ((packageRequests || []).length > 0 || user.tier === 'master' || user.tier === 'pro' || user.tier === 'elite') usageScore += 10;
    if (daysSinceLastActive <= 7) usageScore += 20;

    let churnRiskLevel = 'healthy';
    let churnRiskReasons: string[] = [];

    const isPaidTier = user.tier === 'pro' || user.tier === 'elite' || user.tier === 'master';
    
    if (propertiesCount === 0) churnRiskReasons.push("Hiç portföy eklememiş");
    if (leadsCount === 0) churnRiskReasons.push("Hiç müşteri kaydı yok");
    if ((aiLogs || []).length === 0) churnRiskReasons.push("AI özelliklerini kullanmamış");

    if (isPaidTier && daysSinceLastActive > 14) {
        churnRiskLevel = 'critical';
        churnRiskReasons.push("Ücretli paket olmasına rağmen 14+ gündür aktif değil");
    } else if (isPaidTier && propertiesCount === 0 && leadsCount === 0) {
        churnRiskLevel = 'critical';
        churnRiskReasons.push("Ücretli paket ama hiç portföy/müşteri yok");
    } else if (daysSinceLastActive > 14) {
        churnRiskLevel = 'risk';
        churnRiskReasons.push("14+ gündür aktif değil");
    } else if (daysSinceLastActive > 7) {
        churnRiskLevel = 'watch';
        if (propertiesCount === 0 || leadsCount === 0) {
            churnRiskLevel = 'risk';
        }
    } else if (propertiesCount === 0 && leadsCount === 0 && accountAgeDays > 3) {
        churnRiskLevel = 'watch';
        churnRiskReasons.push("Sadece kayıt olmuş, aksiyon yok");
    }

    res.json({
        user: userWithActivity,
        summary: {
           accountAgeDays,
           daysSinceLastActive,
           propertiesCount,
           leadsCount,
           aiRequestsCount: (aiLogs || []).length,
           aiTokensUsed,
           packageRequestsCount: (packageRequests || []).length,
           supportTicketsCount: (supportTickets || []).length,
           campaignCurrentDay: campaigns && campaigns.length > 0 ? campaigns[0].current_day : 0,
           campaignProgressPercent: 0, // MVP
           usageScore,
           churnRiskLevel,
           churnRiskReasons
        },
        timeline
    });

  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, "Activity API hatası") });
  }
};
