import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration. VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const handleGetPortalData = async (req: any, res: any) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Geçersiz parametre' });
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('owner_portal_tokens')
      .select('property_id, expires_at, revoked_at')
      .eq('token', token)
      .single();

    // Generic error for invalid/expired/revoked to prevent info leakage
    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }

    if (tokenData.revoked_at || new Date(tokenData.expires_at) < new Date()) {
      return res.status(404).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }

    // Update view count and last_viewed_at atomically
    supabaseAdmin
      .rpc('increment_portal_view', { token_val: token })
      .then(res => {
        if (res.error) console.error("Atomic increment failed:", res.error);
      });

    const propertyId = tokenData.property_id;

    // Fetch minimal property data (owner eklendi)
    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .select(`
        id,
        title,
        status,
        price,
        sale_probability,
        address,
        user_id,
        created_at,
        owner
      `)
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return res.status(404).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }

    // --- TRAFİK MOTORU (SİNYAL) ENTEGRASYONU ---
    // Mülk sahibi kimliği ve portföy başlığı ile spesifik görev oluşturuyoruz
    const ownerName = property.owner?.name || 'Mülk Sahibi';
    const propertyTitle = property.title || 'Portföyünüz';

    try {
      await supabaseAdmin.from('tasks').insert({
        user_id: property.user_id,
        property_id: propertyId,
        title: `🔥 ${ownerName}, Raporu İnceledi! (${propertyTitle})`,
        type: 'Arama',
        time: new Date().toISOString(),
        completed: false,
        is_drip: true, 
        ai_suggestion: `${ownerName}, "${propertyTitle}" için gönderdiğiniz şeffaflık raporunu tam şu an inceliyor. Müşteriyi hemen arayıp durum değerlendirmesi yapmak harika bir etki yaratacaktır!`
      });
    } catch (signalError) {
      console.error("Trafik motoru sinyal görevi oluşturulamadı:", signalError);
    }
    // ---------------------------------------------

    // Fetch agent info - Display name only
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', property.user_id)
      .single();
      
    // Fetch stats
    const { data: tasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('type, time, title, completed')
      .eq('property_id', propertyId)
      .eq('completed', true)
      .order('time', { ascending: false });

    // Calculate generic stats: Visits include both 'Randevu' and 'Saha'
    const visits = tasks?.filter(t => t.type === 'Randevu' || t.type === 'Saha').length || 0;
    const calls = tasks?.filter(t => t.type === 'Arama').length || 0;

    // Recent activities DTO (Safety first: no private info)
    const recentActivities = tasks?.slice(0, 5).map(t => ({
      title: t.title,
      type: t.type,
      time: t.time
    })) || [];

    const createdDate = property.created_at ? new Date(property.created_at) : new Date();
    const daysOnMarket = Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));

    // Minimal Address DTO
    const summaryAddress = property.address ? {
      city: property.address.city,
      district: property.address.district,
      neighborhood: property.address.neighborhood
    } : null;

    // Return strictly minimal payload
    res.json({
      property: {
        id: property.id,
        title: property.title,
        status: property.status,
        price: property.price,
        sale_probability: property.sale_probability,
        address: summaryAddress,
        created_at: property.created_at,
        notes: "Portföyünüzün pazarlama süreci aktif olarak devam etmektedir. Tüm kanallardan gelen talepler titizlikle değerlendirilmektedir."
      },
      agent: {
        display_name: agent?.display_name || 'Danışman'
      },
      stats: {
        calls,
        visits,
        daysOnMarket
      },
      recentActivities
    });

  } catch (error: any) {
    console.error("Portal API Error:", error);
    res.status(404).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
  }
};

export const handleCreatePortalToken = async (req: any, res: any) => {
  try {
    const { propertyId, expiresInDays = 30 } = req.body;
    const userId = req.user?.id;

    if (!propertyId || !userId) {
      return res.status(400).json({ error: 'Geçersiz parametreler' });
    }

    // Check if the property belongs to the user
    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .single();

    if (propError || !property) {
      return res.status(403).json({ error: 'Bu mülk için yetkiniz yok.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: tokenData, error: insertError } = await supabaseAdmin
      .from('owner_portal_tokens')
      .insert({
        property_id: propertyId,
        token: token,
        expires_at: expiresAt.toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (insertError || !tokenData) {
      console.error("Token insert error:", insertError);
      return res.status(500).json({ error: 'Token oluşturulamadı.' });
    }

    res.json({ token: tokenData.token, expires_at: tokenData.expires_at });
  } catch (error: any) {
    console.error("Create Portal Token Error:", error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

export const handleRevokePortalTokens = async (req: any, res: any) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user?.id;

    if (!propertyId || !userId) {
      return res.status(400).json({ error: 'Geçersiz parametreler' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('owner_portal_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('property_id', propertyId)
      .eq('created_by', userId)
      .is('revoked_at', null);

    if (updateError) {
      return res.status(500).json({ error: 'Token iptal edilemedi.' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Revoke Portal Token Error:", error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};