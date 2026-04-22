import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('owner_portal_tokens')
      .select('property_id, expires_at, revoked_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }

    if (tokenData.revoked_at || new Date(tokenData.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Bu bağlantının süresi dolmuş veya iptal edilmiş.' });
    }

    // Update view count and last_viewed_at without blocking the rest
    supabaseAdmin
      .from('owner_portal_tokens')
      .update({ last_viewed_at: new Date().toISOString() }) // For simplicity, just update last_viewed_at, or if we want +1 we must do it via RPC. We will just set last_viewed_at.
      .eq('token', token)
      .then();

    const propertyId = tokenData.property_id;

    // Fetch minimal property data
    const { data: property, error: propError } = await supabaseAdmin
      .from('properties')
      .select(`
        id,
        title,
        status,
        price,
        sale_probability,
        address,
        user_id
      `)
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return res.status(404).json({ error: 'Mülk bulunamadı.' });
    }

    // Fetch agent info
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('display_name, phone')
      .eq('id', property.user_id)
      .single();
      
    // Fetch stats
    const { data: tasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('type, time, title, completed')
      .eq('property_id', propertyId)
      .eq('completed', true)
      .order('time', { ascending: false });

    // Calculate generic stats
    const visits = tasks?.filter(t => t.type === 'Randevu').length || 0;
    const calls = tasks?.filter(t => t.type === 'Arama').length || 0;

    const recentActivities = tasks?.slice(0, 5).map(t => ({
      id: Math.random().toString(), // fake ID since we only need display info
      title: t.title,
      type: t.type,
      time: t.time
    })) || [];

    // Calculate days on market (just a rough estimate if we don't have created_at pulled)
    // Actually let's fetch created_at of property
    const { data: propWithDate } = await supabaseAdmin
      .from('properties')
      .select('created_at')
      .eq('id', propertyId)
      .single();
      
    const createdDate = propWithDate?.created_at ? new Date(propWithDate.created_at) : new Date();
    const daysOnMarket = Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));

    // Return strictly minimal payload
    res.json({
      property: {
        title: property.title,
        status: property.status,
        price: property.price,
        sale_probability: property.sale_probability,
        address: property.address,
        notes: "Portföyünüzün pazarlama süreci aktif olarak devam etmektedir. Tüm kanallardan gelen talepler titizlikle değerlendirilmektedir."
      },
      agent: agent || null,
      stats: {
        calls,
        visits,
        daysOnMarket
      },
      recentActivities
    });

  } catch (error: any) {
    console.error("Portal API Error:", error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};
