import { Lead, Task, Building, Property, DashboardStats, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, PropertySyncLink, PriceHistory, GamifiedTask, UserStats, DailyMomentum, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask, DailyStats } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Cache user ID to avoid concurrent getUser() calls which cause "lock stolen" errors
let _cachedUserId: string | null = null;

// Listen for auth changes to keep cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    _cachedUserId = session?.user?.id || null;
  } else if (event === 'SIGNED_OUT') {
    _cachedUserId = null;
  }
});

const getUserId = async () => {
  if (_cachedUserId) return _cachedUserId;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    _cachedUserId = session.user.id;
    return _cachedUserId;
  }
  // Fallback to getUser if session is not available but might be valid
  const { data: { user } } = await supabase.auth.getUser();
  _cachedUserId = user?.id || null;
  return _cachedUserId;
};

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const api = {
  // Profil Verileri
  getProfile: async (): Promise<UserProfile | null> => {
    const userId = await getUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('uid', userId)
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  // Dashboard Verileri
  getDashboardStats: async (): Promise<DashboardStats> => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const agentId = userId;

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agentId);
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    const props = (properties || []) as Property[];

    // Calculate Estimated Revenue with Probability Weighting
    const estimatedRevenue = props.reduce((acc, p) => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
      const commission = (p.price * p.commission_rate) / 100;
      const probability = p.sale_probability || 0.5;
      return acc + (commission * probability);
    }, 0);

    // Calculate Discipline Score based on tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', agentId);
    
    const tks = (tasks || []) as Task[];
    const completedTasks = tks.filter(t => t.completed).length;
    const totalTasks = tks.length;
    const disciplineScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Calculate real stats from tasks
    const today = getTodayStr();
    const callsToday = tks.filter(t => t.type === 'Arama' && t.completed).length;
    const appointmentsToday = tks.filter(t => t.type === 'Randevu' && t.completed).length;

    // Generate AI Insight via Gemini
    let aiInsight = "Bugün portföy sağlığını artırmak için 3 yeni fotoğraf ekle.";
    try {
      const generateWithRetry = async (retries = 2): Promise<string> => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Sen bir emlak koçusun. Danışmanın verileri: ${props.length} portföy, ${leadsCount || 0} lead, disiplin skoru ${disciplineScore}. Bugün için tek cümlelik, çok kısa ve vurucu bir tavsiye ver.`,
          });
          return response.text || aiInsight;
        } catch (error: any) {
          if (retries > 0 && error?.status === 'UNAVAILABLE') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return generateWithRetry(retries - 1);
          }
          throw error;
        }
      };
      aiInsight = await generateWithRetry();
    } catch (e) {
      console.warn("AI Insight temporary unavailable, using fallback.");
    }

    return { 
      calls: callsToday, 
      appointments: appointmentsToday, 
      exclusive: props.filter(p => p.status === 'Yayında').length, 
      target_progress: Math.min(100, Math.round((completedTasks / (totalTasks || 1)) * 100)),
      active_properties: props.length,
      total_leads: leadsCount || 0,
      total_properties: props.length,
      estimated_revenue: estimatedRevenue,
      discipline_score: disciplineScore,
      ai_insight: aiInsight
    };
  },

  // Calculate Property Scores
  calculatePropertyScores: (property: Partial<Property>, allProperties: Property[] = []) => {
    const price = property.price || 0;
    
    // Calculate real average price from properties in the same district, or fallback to 5M
    const districtProps = allProperties.filter(p => p.address?.district === property.address?.district && p.id !== property.id);
    const avgPrice = districtProps.length > 0 
      ? districtProps.reduce((sum, p) => sum + p.price, 0) / districtProps.length 
      : 5000000; 
      
    const priceIndex = price / avgPrice;
    
    let status: 'Fırsat' | 'Normal' | 'Pahalı' = 'Normal';
    if (priceIndex < 0.9) status = 'Fırsat';
    if (priceIndex > 1.1) status = 'Pahalı';

    // Probability Logic: Price (50%) + Health (30%) + Status (20%)
    const priceScore = priceIndex < 1 ? 100 : Math.max(0, 100 - (priceIndex - 1) * 200);
    const healthScore = property.health_score || 70;
    const probability = (priceScore * 0.5 + healthScore * 0.3 + 20) / 100;

    return {
      sale_probability: Math.min(0.99, Math.max(0.1, probability)),
      market_analysis: {
        avg_price_m2: 45000,
        price_index: priceIndex,
        status
      }
    };
  },

  // Map Pins
  getMapPins: async (): Promise<MapPin[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('map_pins')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as MapPin[];
  },

  addMapPin: async (pin: Omit<MapPin, 'id' | 'agent_id' | 'created_at'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('map_pins')
      .insert({
        ...pin,
        agent_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Saha Ziyaretleri
  getFieldVisits: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('field_visits')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Building[];
  },

  getTasks: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Task[];
  },

  addTask: async (task: Omit<Task, 'id' | 'agent_id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        agent_id: userId
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  addVisit: async (visit: Omit<Building, 'id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('field_visits')
      .insert({
        ...visit,
        agent_id: userId,
        last_visit: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Lead / Aday Yönetimi
  getLeads: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Lead[];
  },

  addLead: async (lead: Omit<Lead, 'id' | 'agent_id' | 'last_contact'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        agent_id: userId,
        last_contact: new Date().toISOString(),
        behavior_metrics: {
          total_views: 0,
          avg_duration: 0,
          last_active: new Date().toISOString(),
          is_hot: false
        }
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Portföy Yönetimi
  getProperties: async (): Promise<Property[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false });
    return (data || []) as Property[];
  },

  addProperty: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'agent_id' | 'sale_probability' | 'market_analysis'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const scores = api.calculatePropertyScores(property);

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...property,
        ...scores,
        agent_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  updatePropertyStatus: async (id: string, status: Property['status']) => {
    const { error } = await supabase
      .from('properties')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },

  // AI İçerik Üretimi
  generatePropertyContent: async (property: Property) => {
    const prompt = `
      Aşağıdaki gayrimenkul özelliklerine dayanarak profesyonel bir ilan metni oluştur:
      Başlık: ${property.title}
      Tip: ${property.type}
      Kategori: ${property.category}
      Fiyat: ${property.price} TL
      Konum: ${property.address.district}, ${property.address.city}
      Metrekare: ${property.details.brut_m2} m2
      Oda Sayısı: ${property.details.rooms}
      Bina Yaşı: ${property.details.age}
      Kat: ${property.details.floor}
      
      Lütfen Sahibinden.com için detaylı ve profesyonel bir açıklama üret.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  },

  generateInstagramCaptions: async (property: Property) => {
    const prompt = `
      Aşağıdaki gayrimenkul için 3 farklı tonda Instagram paylaşım metni üret:
      Başlık: ${property.title}
      Fiyat: ${property.price} TL
      Konum: ${property.address.district}, ${property.address.city}
      Oda: ${property.details.rooms}
      M2: ${property.details.brut_m2}
      
      Varyasyonlar:
      1. Kurumsal ton (Profesyonel, güven verici)
      2. Satış odaklı ton (Fırsat vurgulu, heyecan verici)
      3. Sıcak/Samimi ton (Yaşam alanı vurgulu, duygusal)
      
      Her varyasyonda:
      - Dikkat çekici başlık
      - Kısa açıklama
      - CTA (örnek: "Detaylar için DM")
      - Uygun emoji kullanımı (abartısız)
      - 3-8 arası hashtag
      
      Yanıtı JSON formatında ver:
      {
        "corporate": "metin",
        "sales": "metin",
        "warm": "metin"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  },

  generateWhatsAppMessages: async (property: Property) => {
    const prompt = `
      Aşağıdaki gayrimenkul için 3 farklı senaryoda WhatsApp mesajı üret:
      Başlık: ${property.title}
      Fiyat: ${property.price} TL
      Konum: ${property.address.district}, ${property.address.city}
      Oda: ${property.details.rooms}
      
      Senaryolar:
      1. Tek müşteriye özel kısa mesaj
      2. WhatsApp durum/toplu paylaşım mesajı
      3. Yatırımcı müşteriye profesyonel mesaj
      
      Her mesaj:
      - Kısa ve etkili olmalı
      - CTA içermeli
      - [ilan_linki] placeholder'ını kullanmalı
      
      Yanıtı JSON formatında ver:
      {
        "single": "metin",
        "status": "metin",
        "investor": "metin"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  },

  generateMarketingModule: async (property: Property) => {
    const prompt = `
      Sen Portfy emlak asistanısın. Aşağıdaki gayrimenkul bilgilerini kullanarak profesyonel pazarlama içerikleri üret.
      
      Girdi Bilgileri:
      - İlan Başlığı: ${property.title}
      - İlan Tipi: ${property.type}
      - Oda Sayısı: ${property.details.rooms}
      - Metrekare: ${property.details.brut_m2} m2
      - Kat Bilgisi: ${property.details.floor}. Kat
      - Fiyat: ${property.price.toLocaleString()} TL
      - Konum: ${property.address.neighborhood} / ${property.address.district} / ${property.address.city}
      - Portföy Özeti: ${property.notes}
      - Hedef Müşteri Tipi: ${property.target_customer_type || 'Belirtilmemiş'}
      - Yatırım Uygunluğu: ${property.investment_suitability || 'Belirtilmemiş'}
      - Satış/Kiralama Durumu: ${property.category}
      
      Üretilecek İçerikler:
      1. Instagram post metni (3 alternatif: Kurumsal, Satış Odaklı, Samimi)
      2. WhatsApp kısa müşteri mesajı (3 alternatif)
      3. WhatsApp durum / toplu paylaşım metni (3 alternatif)
      4. Yatırımcıya özel profesyonel mesaj (3 alternatif)
      5. Kısa ilan özeti (3 alternatif)
      6. Çağrı metni (CTA) (3 alternatif)
      
      Kurallar:
      - Türkçe yaz.
      - Fazla uzun olma, vurucu ol.
      - Satış odaklı ve güven verici ol.
      - Yapay zeka gibi kokma, doğal bir emlak danışmanı dili kullan.
      - Boş övgü yapma, veriye ve özelliğe odaklan.
      - Fiyat ve temel özellikleri asla saklama.
      - Her içerikte net bir aksiyon çağrısı (CTA) olsun.
      - WhatsApp mesajlarında [ilan_linki] placeholder'ını kullan.
      
      Yanıtı tam olarak şu JSON formatında ver:
      {
        "instagram_posts": [
          { "tone": "kurumsal", "headline": "...", "caption": "...", "cta": "...", "hashtags": ["...", "..."] },
          { "tone": "satis_odakli", "headline": "...", "caption": "...", "cta": "...", "hashtags": ["...", "..."] },
          { "tone": "samimi", "headline": "...", "caption": "...", "cta": "...", "hashtags": ["...", "..."] }
        ],
        "whatsapp_messages": [
          { "type": "kisa_musteri_mesaji", "text": "...", "alternative_texts": ["...", "..."] },
          { "type": "durum_toplu_paylasim", "text": "...", "alternative_texts": ["...", "..."] },
          { "type": "yatirimciya_ozel", "text": "...", "alternative_texts": ["...", "..."] }
        ],
        "summaries": ["...", "...", "..."],
        "cta_options": ["...", "...", "..."]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  },

  // Görev Güncelleme
  updateTaskStatus: async (taskId: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed }).eq('id', taskId);
  },

  // Region Efficiency Analysis
  getRegionEfficiencyScores: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const agentId = user.id;

    const [props, leads] = await Promise.all([
      api.getProperties(),
      api.getLeads()
    ]);

    const regionStats: Record<string, { leads: number, properties: number, sales: number }> = {};

    leads.forEach(l => {
      const d = l.district || 'Bilinmiyor';
      if (!regionStats[d]) regionStats[d] = { leads: 0, properties: 0, sales: 0 };
      regionStats[d].leads++;
    });

    props.forEach(p => {
      const d = p.address.district || 'Bilinmiyor';
      if (!regionStats[d]) regionStats[d] = { leads: 0, properties: 0, sales: 0 };
      regionStats[d].properties++;
      if (p.status === 'Satıldı') regionStats[d].sales++;
    });

    return Object.entries(regionStats).map(([district, stats]) => {
      // Score calculation: Leads (10 pts) + Properties (20 pts) + Sales (50 pts)
      const score = (stats.leads * 10) + (stats.properties * 20) + (stats.sales * 50);
      return {
        district,
        score: Math.min(100, score), // Cap at 100 for display
        ...stats
      };
    }).sort((a, b) => b.score - a.score);
  },

  // Lead Analizi
  analyzeLeads: async (leads: Lead[]) => {
    const prompt = `
      Aşağıdaki gayrimenkul leadlerini analiz et ve bir emlak danışmanı için stratejik öneriler sun.
      Hangi leadler daha sıcak? Hangi leadler için ne yapılmalı?
      Kısa, öz ve aksiyon odaklı bir analiz yap.
      Leadler: ${JSON.stringify(leads)}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  },

  // Profil Güncelleme
  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('uid', uid);
    if (error) throw error;
  },

  // Notlar ve Kişisel Görevler
  getNotes: async (): Promise<UserNote[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('agent_id', user.id)
      .order('updated_at', { ascending: false });
    return (data || []) as UserNote[];
  },

  addNote: async (note: Omit<UserNote, 'id' | 'agent_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        agent_id: user.id,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  updateNote: async (id: string, data: Partial<UserNote>) => {
    const { error } = await supabase
      .from('notes')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },

  deleteNote: async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getPersonalTasks: async (): Promise<PersonalTask[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false });
    
    return (data || []).map((t: any) => ({
      ...t,
      is_completed: t.isCompleted
    })) as PersonalTask[];
  },

  addPersonalTask: async (task: Omit<PersonalTask, 'id' | 'agent_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        ...task,
        agent_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  togglePersonalTask: async (id: string, is_completed: boolean) => {
    const { error } = await supabase
      .from('personal_tasks')
      .update({ isCompleted: is_completed })
      .eq('id', id);
    if (error) throw error;
  },

  updatePersonalTask: async (id: string, data: Partial<PersonalTask>) => {
    const dbData: any = { ...data };
    if (data.is_completed !== undefined) {
      dbData.isCompleted = data.is_completed;
      delete dbData.is_completed;
    }

    const { error } = await supabase
      .from('personal_tasks')
      .update(dbData)
      .eq('id', id);
    if (error) throw error;
  },

  deletePersonalTask: async (id: string) => {
    const { error } = await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Habit Loop & Rituals
  getDailyRadar: async (): Promise<{ tasks: string[], insight: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const [tasks, leads, properties] = await Promise.all([
      api.getTasks(),
      api.getLeads(),
      api.getProperties()
    ]);

    const prompt = `
      Sen bir emlak danışmanı koçusun. Danışmanın verileri:
      - Görevler: ${JSON.stringify(tasks.filter(t => !t.completed).slice(0, 5))}
      - Sıcak Leadler: ${JSON.stringify(leads.filter(l => l.status === 'Sıcak').slice(0, 3))}
      - Portföyler: ${JSON.stringify(properties.slice(0, 3))}
      
      Bugün için en kritik 3 hamleyi seç ve kısa, vurucu birer cümle olarak yaz. 
      Ayrıca genel bir motivasyonel içgörü ver.
      Yanıtı JSON formatında ver:
      {
        "tasks": ["Hamle 1", "Hamle 2", "Hamle 3"],
        "insight": "Motivasyonel içgörü"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Daily Radar AI error", e);
      return {
        tasks: ["Dünkü görüşmeleri takip et", "Yeni portföy fotoğraflarını yükle", "Aday listeni gözden geçir"],
        insight: "Bugün harika bir gün olacak, odaklan ve başar!"
      };
    }
  },

  completeMorningRitual: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const now = new Date().toISOString();
    const today = getTodayStr();
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        last_day_started_at: now,
        last_active_date: today
      })
      .eq('uid', user.id);
    
    // If column missing, we still want to proceed
    if (error) {
      console.warn("Morning ritual profile update error:", error);
      localStorage.setItem(`day_started_${user.id}_${today}`, now);
      
      // Try updating only last_active_date if that exists
      try {
        await supabase.from('profiles').update({ last_active_date: today }).eq('uid', user.id);
      } catch (e) {
        // Ignore
      }
    }
    
    await api.earnXP(50);
  },

  completeEveningRitual: async (stats: { tasksCompleted?: number, tasks_completed?: number, revenue: number, calls: number, visits: number }) => {
    console.log("api.completeEveningRitual started with:", stats);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const today = getTodayStr();
    const tasksCompleted = stats.tasksCompleted !== undefined ? stats.tasksCompleted : (stats.tasks_completed || 0);
    
    try {
      // 1. Save daily stats (Safe Upsert)
      console.log("Step 1: Saving daily stats...");
      try {
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('id')
          .eq('agent_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (existingStats) {
          console.log("Updating existing daily stats row:", existingStats.id);
          const { error: updateError } = await supabase
            .from('user_stats')
            .update({
              tasks_completed: tasksCompleted,
              potential_revenue_handled: stats.revenue,
              calls_made: stats.calls,
              visits_made: stats.visits
            })
            .eq('id', existingStats.id);
          if (updateError) console.error("Error updating user_stats:", updateError);
        } else {
          console.log("Inserting new daily stats row");
          const { error: insertError } = await supabase
            .from('user_stats')
            .insert({
              agent_id: user.id,
              date: today,
              tasks_completed: tasksCompleted,
              potential_revenue_handled: stats.revenue,
              calls_made: stats.calls,
              visits_made: stats.visits,
              xp_earned: 100
            });
          if (insertError) console.error("Error inserting user_stats:", insertError);
        }
      } catch (statsError) {
        console.error("user_stats table might be missing columns:", statsError);
      }
      console.log("Daily stats processed.");

      // 2. Update profile streak and last ritual
      console.log("Step 2: Updating profile...");
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', user.id)
        .single();
      
      if (profileFetchError) throw profileFetchError;

      if (profile) {
        const lastActive = profile.last_active_date;
        const todayDate = new Date().toISOString().split('T')[0];
        let newStreak = profile.current_streak || 0;
        
        if (lastActive !== todayDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, profile.longest_streak || 0),
            last_active_date: todayDate,
            last_ritual_completed_at: new Date().toISOString()
          })
          .eq('uid', user.id);
        
        if (profileUpdateError) throw profileUpdateError;
        console.log("Profile updated. New streak:", newStreak);
      }

      // 3. Award XP
      console.log("Step 3: Awarding XP...");
      await api.earnXP(100);
      console.log("XP awarded.");

      return { success: true };
    } catch (error) {
      console.error("Critical error in completeEveningRitual:", error);
      throw error;
    }
  },

  earnXP: async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', user.id).single();
    if (!profile) return;

    const newXP = Number(profile.total_xp || 0) + amount;
    let newLevel = 1;
    if (newXP >= 15000) newLevel = 4;
    else if (newXP >= 5000) newLevel = 3;
    else if (newXP >= 1000) newLevel = 2;

    await supabase
      .from('profiles')
      .update({ 
        total_xp: newXP,
        broker_level: newLevel
      })
      .eq('uid', user.id);

    const today = getTodayStr();
    try {
      const { data: daily } = await supabase.from('user_stats').select('*').eq('agent_id', user.id).eq('date', today).maybeSingle();
      if (daily) {
        await supabase.from('user_stats').update({ xp_earned: (daily.xp_earned || 0) + amount }).eq('id', daily.id);
      } else {
        await supabase.from('user_stats').insert({ agent_id: user.id, date: today, xp_earned: amount });
      }
    } catch (e) {
      console.error("user_stats error in earnXP:", e);
    }
  },

  getDailyStats: async (days: number = 7): Promise<DailyStats[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    try {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .order('date', { ascending: false })
        .limit(days);
      
      return (data || []) as DailyStats[];
    } catch (e) {
      console.error("user_stats error in getDailyStats:", e);
      return [];
    }
  },

  // Mesaj Şablonları
  getMessageTemplates: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('agent_id', user.id);
    return (data || []) as MessageTemplate[];
  },

  addMessageTemplate: async (template: Omit<MessageTemplate, 'id' | 'agent_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        ...template,
        agent_id: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  deleteMessageTemplate: async (id: string) => {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // sahibinden.com Entegrasyonu
  connectSahibinden: async (apiKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agent_id = user.id;
    
    if (apiKey.length < 10) throw new Error('Geçersiz API anahtarı');

    const account: Omit<BrokerAccount, 'id'> = {
      agent_id,
      store_name: "Emlak Mağazası",
      api_key: apiKey.substring(0, 4) + "****",
      connected_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('broker_accounts')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, ...account };
  },

  getBrokerAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('agent_id', user.id)
      .maybeSingle();
    return data as BrokerAccount | null;
  },

  getExternalListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('external_listings')
      .select('*')
      .eq('agent_id', user.id);
    return (data || []) as ExternalListing[];
  },

  syncExternalListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agent_id = user.id;

    const account = await api.getBrokerAccount();
    if (!account) return [];

    // Simulate fetching from external API
    const simulatedListings: Omit<ExternalListing, 'id'>[] = [
      {
        agent_id,
        ext_id: '123456789',
        title: 'Sahibinden Satılık Lüks Daire',
        price: 4500000,
        status: 'Yayında',
        url: 'https://sahibinden.com/123456789',
        district: 'Kadıköy',
        last_sync: new Date().toISOString()
      },
      {
        agent_id,
        ext_id: '987654321',
        title: 'Kiralık Modern Ofis',
        price: 25000,
        status: 'Yayında',
        url: 'https://sahibinden.com/987654321',
        district: 'Beşiktaş',
        last_sync: new Date().toISOString()
      }
    ];

    const results: ExternalListing[] = [];
    for (const listing of simulatedListings) {
      const { data, error } = await supabase
        .from('external_listings')
        .upsert(listing, { onConflict: 'agent_id,ext_id' })
        .select()
        .single();
      if (data) results.push(data as ExternalListing);
    }

    return results;
  },

  linkPropertyToExternal: async (property_id: string, external_listing_id: string) => {
    await supabase
      .from('property_sync_links')
      .upsert({ property_id, external_listing_id }, { onConflict: 'property_id' });
  },

  getSyncLink: async (property_id: string) => {
    const { data } = await supabase
      .from('property_sync_links')
      .select('*')
      .eq('property_id', property_id)
      .maybeSingle();
    return data as PropertySyncLink | null;
  },

  importListingFromUrl: async (url: string) => {
    if (!url.includes('sahibinden.com')) throw new Error('Sadece sahibinden.com linkleri desteklenir');
    
    // Gerçek URL ayrıştırma ve veri çekme işlemi burada yapılacak
    throw new Error('Bu özellik şu anda yapım aşamasındadır.');
  },

  // Gamification MVP
  getDailyGamifiedTasks: async (force: boolean = false): Promise<GamifiedTask[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const agentId = user.id;
      
      // Ensure profile exists before inserting tasks (due to foreign key constraint)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uid')
        .eq('uid', agentId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }
      
      if (!profile) {
        console.log('Profile not found, creating one...');
        const { error: createProfileError } = await supabase.from('profiles').insert({
          uid: agentId,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || 'İsimsiz Danışman',
          role: 'agent'
        });
        if (createProfileError) {
          console.error('Error creating missing profile:', createProfileError);
          throw createProfileError;
        }
      }
      
      // Use ISO date string for "today" to ensure consistency with Postgres DATE type
      const today = getTodayStr();

      console.log('Fetching existing tasks for:', today);
      const { data: existingTasksData, error: fetchError } = await supabase
        .from('gamified_tasks')
        .select('*')
        .eq('agent_id', agentId)
        .eq('date', today);
      
      if (fetchError) {
        console.error('Error fetching existing tasks:', fetchError);
        throw fetchError;
      }
      
      let existingTasks = (existingTasksData || []).map((t: any) => ({
        ...t,
        agent_id: t.agent_id,
        is_completed: t.isCompleted || t.is_completed,
        ai_reason: t.aiReason || t.ai_reason
      })) as GamifiedTask[];
      console.log(`Found ${existingTasks.length} existing tasks for today:`, existingTasks.map(t => t.title));

      const coreTasks = [
        { title: "Peş peşe girişini sürdür", points: 10, category: 'sweet' as const },
        { title: "Bugün 100 puan kazan", points: 20, category: 'sweet' as const }
      ];

      // If tasks exist but core tasks are missing, add them
      if (existingTasks.length > 0 && !force) {
        const missingCore = coreTasks.filter(ct => !existingTasks.find(et => et.title === ct.title));
        if (missingCore.length > 0) {
          console.log('Adding missing core tasks:', missingCore.map(c => c.title));
          for (const ct of missingCore) {
            const newTask = { agent_id: agentId, ...ct, isCompleted: false, date: today };
            const { data: created, error: coreInsertError } = await supabase.from('gamified_tasks').insert(newTask).select().single();
            if (coreInsertError) console.error('Error inserting core task:', coreInsertError);
            if (created) existingTasks.push({
              ...created,
              is_completed: (created as any).isCompleted
            } as any);
          }
        }
        return existingTasks;
      }

      // If forcing, delete existing tasks for today first
      if (force && existingTasks.length > 0) {
        console.log('Forcing refresh, deleting existing tasks');
        const { error: deleteError } = await supabase
          .from('gamified_tasks')
          .delete()
          .eq('agent_id', agentId)
          .eq('date', today);
        if (deleteError) {
          console.error('Error deleting existing tasks:', deleteError);
          throw deleteError;
        }
        existingTasks = [];
      }

      console.log('Generating new tasks for today...');
      
      const sweetTemplates = [
        "Bugünkü hedefini belirle",
        "Cevapsız mesajlarını temizle",
        "1 müşteriye dönüş yap",
        "1 portföy notu güncelle",
        "Gün sonu raporunu tamamla",
        "Eski bir müşterini ara",
        "Bölge haberlerini oku"
      ];
      const mainTemplates = [
        "5 malik araması yap",
        "1 saha ziyareti kaydet",
        "1 yeni portföy ekle",
        "2 müşteri takibi yap",
        "1 randevu oluştur",
        "Bölge esnafı ziyareti",
        "İlan fiyat analizi yap"
      ];
      
      const tasks: any[] = [];
      
      // Always include these two tasks
      tasks.push({ agent_id: agentId, title: "Peş peşe girişini sürdür", points: 10, category: 'sweet', isCompleted: false, date: today });
      tasks.push({ agent_id: agentId, title: "Bugün 100 puan kazan", points: 20, category: 'sweet', isCompleted: false, date: today });

      // 3 Sweet
      const shuffledSweet = [...sweetTemplates].sort(() => 0.5 - Math.random());
      shuffledSweet.slice(0, 3).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 10, category: 'sweet', isCompleted: false, date: today }));

      // 2 Main
      const shuffledMain = [...mainTemplates].sort(() => 0.5 - Math.random());
      shuffledMain.slice(0, 2).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 50, category: 'main', isCompleted: false, date: today }));

      // 1 Smart
      console.log('Fetching leads for smart task...');
      const { data: leadsData, error: leadsError } = await supabase.from('leads').select('*').eq('agent_id', agentId);
      if (leadsError) {
        console.error('Error fetching leads for smart task:', leadsError);
      }
      const leads = (leadsData || []) as Lead[];
      console.log(`Found ${leads.length} leads`);
      
      const neglectedLeads = leads.filter(l => {
        const lastContact = new Date(l.last_contact);
        const diffDays = Math.floor((new Date().getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7 && l.status !== 'Pasif';
      });

      if (neglectedLeads.length > 0) {
        const targetLead = neglectedLeads[0];
        tasks.push({ 
          agent_id: agentId, 
          title: `"${targetLead.name}" isimli müşteriyi ara`, 
          points: 100, 
          category: 'smart', 
          isCompleted: false, 
          date: today,
          aiReason: `Bu müşteri ${targetLead.status} statüsünde ama uzun süredir temas kurulmadı.`
        });
      } else {
        tasks.push({ 
          agent_id: agentId, 
          title: "Bölgendeki yeni bir esnafla tanış", 
          points: 100, 
          category: 'smart', 
          isCompleted: false, 
          date: today,
          aiReason: "Tüm müşterilerinle güncel iletişimdesin, yeni bağlantılar kurma zamanı."
        });
      }

      const createdTasks: GamifiedTask[] = [];
      console.log(`Attempting to insert ${tasks.length} tasks`);
      
      for (const task of tasks) {
        try {
          const { data: created, error: insertError } = await supabase.from('gamified_tasks').insert(task).select().single();
          if (insertError) {
            console.error('Error inserting task:', task.title, insertError);
          }
          if (created) {
            createdTasks.push(created as any);
          }
        } catch (e) {
          console.error('Exception during task insertion:', task.title, e);
        }
      }

      if (createdTasks.length === 0 && tasks.length > 0) {
        throw new Error('Görevler oluşturuldu ancak veritabanına kaydedilemedi.');
      }

      console.log(`Successfully created ${createdTasks.length} tasks`);
      return createdTasks.map((t: any) => ({
        ...t,
        agent_id: t.agent_id,
        is_completed: t.isCompleted || t.is_completed,
        ai_reason: t.aiReason || t.ai_reason
      })) as GamifiedTask[];
    } catch (error) {
      console.error("Error in getDailyGamifiedTasks:", error);
      throw error;
    }
  },

  completeGamifiedTask: async (taskId: string, points: number) => {
    console.log("completeGamifiedTask called for:", taskId, points);
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const agentId = userId;
    
    const { error: taskError } = await supabase.from('gamified_tasks').update({ isCompleted: true }).eq('id', taskId);
    if (taskError) {
      console.error("Task update error:", taskError);
      throw taskError;
    }

    // Update user points
    const { data: profile, error: profileFetchError } = await supabase.from('profiles').select('total_xp').eq('uid', agentId).maybeSingle();
    if (profileFetchError) {
      console.error("Profile fetch error:", profileFetchError);
      throw profileFetchError;
    }
    
    if (profile) {
      const currentPoints = profile.total_xp || 0;
      const { error: profileUpdateError } = await supabase.from('profiles').update({ total_xp: currentPoints + points }).eq('uid', agentId);
      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError);
        throw profileUpdateError;
      }
      console.log("Points updated successfully. New points:", currentPoints + points);
    }
    
    return { success: true };
  },

  startDay: async () => {
    console.log("api.startDay called");
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const today = getTodayStr();

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_day_started_at: now,
          last_active_date: today
        })
        .eq('uid', userId);
      
      if (profileError) {
        console.warn("Profile update error (might be missing column):", profileError);
        // Try updating only last_active_date if that exists
        try {
          await supabase.from('profiles').update({ last_active_date: today }).eq('uid', userId);
        } catch (e) {
          // Ignore
        }
      }
      
      localStorage.setItem(`day_started_${userId}_${today}`, now);

      // Update user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (stats) {
        const { error: statsUpdateError } = await supabase
          .from('user_stats')
          .update({ day_started_at: now })
          .eq('id', stats.id);
        if (statsUpdateError) console.warn("Stats update error:", statsUpdateError);
      } else {
        const { error: statsInsertError } = await supabase
          .from('user_stats')
          .insert({
            agent_id: userId,
            date: today,
            day_started_at: now,
            tasks_completed: 0,
            potential_revenue_handled: 0,
            calls_made: 0,
            visits_made: 0,
            xp_earned: 0
          });
        if (statsInsertError) console.warn("Stats insert error:", statsInsertError);
      }
    } catch (err) {
      console.error("Critical error in startDay:", err);
      localStorage.setItem(`day_started_${userId}_${today}`, now);
    }
    
    return { success: true };
  },

  endDay: async (stats: any) => {
    console.log("api.endDay called", stats);
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const today = getTodayStr();

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          last_ritual_completed_at: now,
          last_active_date: today
        })
        .eq('uid', userId);
      
      if (profileError) {
        console.warn("Profile update error (might be missing column):", profileError);
        // Try updating only last_active_date if that exists
        try {
          await supabase.from('profiles').update({ last_active_date: today }).eq('uid', userId);
        } catch (e) {
          // Ignore
        }
      }

      localStorage.setItem(`day_ended_${userId}_${today}`, now);

      // Update user stats
      const { data: dailyStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('agent_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (dailyStats) {
        const { error: statsUpdateError } = await supabase
          .from('user_stats')
          .update({ 
            day_ended_at: now,
            tasks_completed: stats.tasks_completed,
            calls_made: stats.calls,
            visits_made: stats.visits,
            potential_revenue_handled: stats.revenue
          })
          .eq('id', dailyStats.id);
        if (statsUpdateError) console.warn("Stats update error:", statsUpdateError);
      } else {
        const { error: statsInsertError } = await supabase
          .from('user_stats')
          .insert({
            agent_id: userId,
            date: today,
            day_ended_at: now,
            tasks_completed: stats.tasks_completed,
            calls_made: stats.calls,
            visits_made: stats.visits,
            potential_revenue_handled: stats.revenue,
            xp_earned: 150
          });
        if (statsInsertError) console.warn("Stats insert error:", statsInsertError);
      }
    } catch (err) {
      console.error("Critical error in endDay:", err);
      localStorage.setItem(`day_ended_${userId}_${today}`, now);
    }
    
    return { success: true };
  },

  verifyGamifiedTask: async (task: GamifiedTask): Promise<{ verified: boolean, message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTodayStr();

    // Check if task is already completed
    if (task.is_completed) return { verified: true };

    try {
      const title = task.title.toLowerCase();

      // 1. Malik Araması (5 calls)
      if (title.includes("malik araması") || title.includes("5 malik araması")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 5) return { verified: true };
        return { verified: false, message: `Henüz ${count}/5 arama yaptın. 5 arama tamamlamalısın.` };
      }

      // 2. Saha Ziyareti
      if (title.includes("saha ziyareti")) {
        const { data: visits } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Saha').eq('completed', true).gte('created_at', today);
        if (visits && visits.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz bir saha ziyareti tamamlamadın." };
      }

      // 3. Yeni Portföy Ekle
      if (title.includes("yeni portföy ekle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('created_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz yeni bir portföy eklemedin." };
      }

      // 4. Müşteri Takibi (2 follow-ups)
      if (title.includes("müşteri takibi")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Takip').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 2) return { verified: true };
        return { verified: false, message: `Henüz ${count}/2 takip yaptın.` };
      }

      // 5. Randevu Oluştur
      if (title.includes("randevu oluştur")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Randevu').gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Henüz bir randevu oluşturmadın." };
      }

      // 6. Peş peşe girişini sürdür
      if (title.includes("peş peşe girişini sürdür")) {
        const { data: profile } = await supabase.from('profiles').select('current_streak').eq('uid', agentId).maybeSingle();
        if (profile && profile.current_streak > 0) return { verified: true };
        return { verified: false, message: "Bugün henüz giriş yapmamış görünüyorsun." };
      }

      // 7. Bugün 100 puan kazan
      if (title.includes("100 puan kazan")) {
        const { data: completedToday } = await supabase.from('gamified_tasks').select('points').eq('agent_id', agentId).eq('isCompleted', true).eq('date', today);
        const totalPointsToday = completedToday?.reduce((acc, t) => acc + t.points, 0) || 0;
        if (totalPointsToday >= 100) return { verified: true };
        return { verified: false, message: `Bugün henüz ${totalPointsToday}/100 puan topladın.` };
      }

      // 8. Bugünkü hedefini belirle
      if (title.includes("hedefini belirle")) {
        const { data: personalTasks } = await supabase.from('personal_tasks').select('id').eq('agent_id', agentId).gte('created_at', today);
        if (personalTasks && personalTasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir kişisel hedef (görev) belirlemedin." };
      }

      // 9. Portföy notu güncelle
      if (title.includes("portföy notu güncelle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('updated_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir portföy notu güncellemedin." };
      }

      // 10. Müşteriye dönüş yap
      if (title.includes("müşteriye dönüş yap")) {
        const { data: leads } = await supabase.from('leads').select('id').eq('agent_id', agentId).gte('last_contact', today);
        if (leads && leads.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir müşteriye dönüş yapmadın." };
      }

      // 11. Eski bir müşterini ara
      if (title.includes("eski bir müşterini ara")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz eski bir müşterini aramadın." };
      }

      // 12. Specific lead call (Smart Task)
      if (title.includes("isimli müşteriyi ara")) {
        const match = task.title.match(/"([^"]+)"/);
        if (match) {
          const leadName = match[1];
          const { data: lead } = await supabase.from('leads').select('id').eq('agent_id', agentId).eq('name', leadName).maybeSingle();
          if (lead) {
            const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
            if (tasks && tasks.length >= 1) return { verified: true };
          }
        }
        return { verified: false, message: "Belirtilen müşteriyi henüz aramadın." };
      }

      // 13. Gün sonu raporunu tamamla
      if (title.includes("gün sonu raporu")) {
        const { data: profile } = await supabase.from('profiles').select('last_ritual_completed_at').eq('uid', agentId).maybeSingle();
        if (profile?.last_ritual_completed_at && profile.last_ritual_completed_at.startsWith(today)) return { verified: true };
        return { verified: false, message: "Gün sonu ritüelini henüz tamamlamadın." };
      }

      // 14. Cevapsız mesajlarını temizle
      if (title.includes("cevapsız mesaj")) {
        const { data: leads } = await supabase.from('leads').select('id').eq('agent_id', agentId).gte('last_contact', today);
        if (leads && leads.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir müşteriye dönüş yapmadın." };
      }

      // 15. Bölge esnafı ziyareti / Esnafla tanış
      if (title.includes("esnafı ziyareti") || title.includes("esnafla tanış")) {
        const { data: visits } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Saha').eq('completed', true).gte('created_at', today);
        if (visits && visits.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir esnaf ziyareti kaydetmedin." };
      }

      // 16. İlan fiyat analizi yap
      if (title.includes("fiyat analizi")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('updated_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bugün henüz bir portföy analizi/güncellemesi yapmadın." };
      }

      // Default for other tasks - make it false to be stricter
      console.log("Task verification fallback for:", task.title);
      return { verified: false, message: "Bu görev henüz tamamlanmamış görünüyor." };
    } catch (error) {
      console.error("Verification error:", error);
      return { verified: false, message: "Doğrulama sırasında bir hata oluştu." };
    }
  },

  updateGamifiedTask: async (taskId: string, data: Partial<GamifiedTask>) => {
    // Map camelCase to snake_case if needed, but here we assume the DB wants camelCase
    const dbData: any = {};
    if (data.is_completed !== undefined) dbData.isCompleted = data.is_completed;
    if (data.ai_reason !== undefined) dbData.aiReason = data.ai_reason;
    if (data.title !== undefined) dbData.title = data.title;
    if (data.points !== undefined) dbData.points = data.points;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.date !== undefined) dbData.date = data.date;

    const { error } = await supabase
      .from('gamified_tasks')
      .update(dbData)
      .eq('id', taskId);
    if (error) throw error;
  },

  getGamifiedStats: async (): Promise<UserStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTodayStr();

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', agentId).maybeSingle();
    const points = profile ? (profile.total_xp || 0) : 0;

    const { data: tasksData, error: tasksError } = await supabase
      .from('gamified_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today);
    
    if (tasksError) {
      console.error('Error fetching tasks for stats:', tasksError);
    }
    
    // Map DB snake_case to interface
    const tasks = (tasksData || []).map((t: any) => ({
      ...t,
      agent_id: t.agent_id,
      is_completed: t.is_completed,
      ai_reason: t.ai_reason
    })) as GamifiedTask[];
    
    console.log(`Stats: Found ${tasks.length} tasks for ${today}`);

    const completedTasks = tasks.filter(t => t.is_completed);
    const pointsToday = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const mainTasks = tasks.filter(t => t.category === 'main');
    const completedMainTasks = mainTasks.filter(t => t.is_completed);

    // Momentum Calculation
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) : 0;
    const mainCompletionRate = mainTasks.length > 0 ? (mainTasks.filter(t => t.is_completed).length / mainTasks.length) : 0;
    
    // Streak (Calculate based on last active dates)
    let streak = profile ? (profile.current_streak || 0) : 0;
    const lastActiveDate = profile ? profile.last_active_date : null;
    
    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        await supabase.from('profiles').update({ 
          current_streak: streak + 1,
          last_active_date: today
        }).eq('uid', agentId);
        streak += 1;
      } else if (diffDays > 1) {
        await supabase.from('profiles').update({ 
          current_streak: 1,
          last_active_date: today
        }).eq('uid', agentId);
        streak = 1; // Reset to 1 for today
      }
    } else {
      // First time
      await supabase.from('profiles').update({ 
        current_streak: 1,
        last_active_date: today
      }).eq('uid', agentId);
      streak = 1;
    }
    const streakEffect = streak > 0 ? 20 : 0;

    const momentum = Math.round((completionRate * 50) + (mainCompletionRate * 30) + streakEffect);

    // Level Logic
    let level = 1;
    let level_name = "Başlangıç";
    let next_level_points = 1000;

    if (points > 15000) { level = 5; level_name = "Kapanışa Yakın"; next_level_points = 30000; }
    else if (points > 7000) { level = 4; level_name = "Saha Oyuncusu"; next_level_points = 15000; }
    else if (points > 3000) { level = 3; level_name = "Üretici"; next_level_points = 7000; }
    else if (points > 1000) { level = 2; level_name = "Aktif"; next_level_points = 3000; }

    return {
      points,
      points_today: pointsToday,
      streak,
      momentum,
      level,
      level_name,
      next_level_points,
      daily_progress: Math.round(completionRate * 100),
      tasks_completed_today: completedTasks.length,
      total_tasks_today: tasks.length
    };
  },

  getAICoachInsight: async (): Promise<string> => {
    // Simple logic for MVP
    const stats = await api.getGamifiedStats();
    if (stats.momentum < 40) return "Momentumun düştü, günü kurtarmak için 1 saha ve 1 arama görevi tamamla.";
    if (stats.tasks_completed_today === 0) return "Bugün en kritik işin 2 sıcak müşteriye dönüş yapmak.";
    if (stats.daily_progress < 100) return "Harika gidiyorsun! Günü %100 tamamlamak için sadece birkaç görevin kaldı.";
    return "Mükemmel bir gün! Tüm görevlerini tamamladın, yarın için dinlenmeyi unutma.";
  },

  // Rescue Mode (Günü Kurtar)
  getRescueSession: async (): Promise<RescueSession | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const agentId = user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('rescue_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .maybeSingle();
    
    return data as RescueSession | null;
  },

  startRescueSession: async (): Promise<RescueSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = new Date().toISOString().split('T')[0];

    // Fetch some candidates for tasks
    const leads = await api.getLeads();
    const hotLeads = leads.filter(l => l.behavior_metrics?.is_hot);
    const properties = await api.getProperties();
    const lowHealthProps = properties.filter(p => p.health_score < 80);

    const tasks: RescueTask[] = [];
    
    // 1. Call a hot lead
    if (hotLeads.length > 0) {
      tasks.push({
        id: 'r1',
        title: `${hotLeads[0].name} isimli sıcak müşteriyi ara`,
        type: 'call',
        estimated_minutes: 15,
        points: 50,
        is_completed: false,
        target_id: hotLeads[0].id
      });
    } else {
      tasks.push({
        id: 'r1',
        title: "Eski bir müşterine 'Nasılsınız?' mesajı at",
        type: 'call',
        estimated_minutes: 10,
        points: 30,
        is_completed: false
      });
    }

    // 2. Update a property
    if (lowHealthProps.length > 0) {
      tasks.push({
        id: 'r2',
        title: `"${lowHealthProps[0].title}" portföyünün notlarını güncelle`,
        type: 'update',
        estimated_minutes: 10,
        points: 40,
        is_completed: false,
        target_id: lowHealthProps[0].id
      });
    } else {
      tasks.push({
        id: 'r2',
        title: "Bir portföyüne yeni bir fotoğraf ekle",
        type: 'update',
        estimated_minutes: 15,
        points: 40,
        is_completed: false
      });
    }

    // 3. Quick CRM check
    tasks.push({
      id: 'r3',
      title: "Yarın için 1 yeni randevu planla",
      type: 'note',
      estimated_minutes: 15,
      points: 60,
      is_completed: false
    });

    const session: Omit<RescueSession, 'id'> = {
      agent_id: agentId,
      date: today,
      status: 'active',
      tasks,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour duration
    };

    const { data, error } = await supabase.from('rescue_sessions').insert(session).select().single();
    if (error) throw error;
    return data as RescueSession;
  },

  cancelRescueSession: async (sessionId: string) => {
    await supabase.from('rescue_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
  },

  completeRescueTask: async (sessionId: string, taskId: string) => {
    const { data: session } = await supabase
      .from('rescue_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session) return;
    
    const updatedTasks = (session.tasks as RescueTask[]).map(t => t.id === taskId ? { ...t, is_completed: true } : t);
    
    await supabase.from('rescue_sessions').update({ tasks: updatedTasks }).eq('id', sessionId);

    // If all completed, mark session as completed
    if (updatedTasks.every(t => t.is_completed)) {
      await supabase.from('rescue_sessions').update({ status: 'completed' }).eq('id', sessionId);
      // Award bonus points
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('uid', user.id).maybeSingle();
        if (profile) {
          const current = profile.total_xp || 0;
          await supabase.from('profiles').update({ total_xp: current + 150 }).eq('uid', user.id);
        }
      }
    }
  },

  getMissedOpportunities: async (): Promise<MissedOpportunity[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const agentId = user.id;

    const [leads, properties, visits] = await Promise.all([
      api.getLeads(),
      api.getProperties(),
      api.getFieldVisits()
    ]);

    const opportunities: MissedOpportunity[] = [];
    const now = new Date();

    // 1. Lead Follow-up (7+ days)
    leads.forEach(l => {
      const last = new Date(l.last_contact);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 7) {
        opportunities.push({
          id: `lead-${l.id}`,
          type: 'lead_followup',
          title: `${l.name} ile temas kesildi`,
          description: `${diff} gündür bu müşteriyle iletişime geçmedin. Başkasına gitmeden hemen ara!`,
          target_id: l.id,
          days_delayed: diff,
          priority: diff > 14 ? 'high' : 'medium',
          potential_value: 100
        });
      }
    });

    // 2. Stale Properties (14+ days)
    properties.forEach(p => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return;
      const last = new Date(p.updated_at);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 14) {
        opportunities.push({
          id: `prop-${p.id}`,
          type: 'property_stale',
          title: `"${p.title}" portföyü unutuldu`,
          description: `${diff} gündür bu ilanda hiçbir güncelleme yapmadın. İlanın güncelliği düşüyor.`,
          target_id: p.id,
          days_delayed: diff,
          priority: diff > 30 ? 'high' : 'medium',
          potential_value: 200
        });
      }

      // 3. Price Drop Potential
      if (p.market_analysis?.status === 'Pahalı' && p.sale_probability < 0.4) {
        opportunities.push({
          id: `price-${p.id}`,
          type: 'price_drop_potential',
          title: `Fiyat revizyonu fırsatı: ${p.title}`,
          description: "Bu mülk pazarın üzerinde kalmış görünüyor. Malikle görüşüp fiyatı %5-10 aşağı çekersen satış ihtimali %40 artar.",
          target_id: p.id,
          days_delayed: 0,
          priority: 'high',
          potential_value: 500
        });
      }
    });

    // 4. Stale Visits (30+ days)
    visits.forEach(v => {
      const last = new Date(v.last_visit);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 30) {
        opportunities.push({
          id: `visit-${v.id}`,
          type: 'visit_stale',
          title: `${v.address} ziyareti soğudu`,
          description: "Bu binayı 1 ay önce ziyaret etmiştin. Malikler taşınmış veya karar vermiş olabilir. Tekrar uğra!",
          target_id: v.id,
          days_delayed: diff,
          priority: 'medium',
          potential_value: 50
        });
      }
    });

    return opportunities.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  },

  parseVoiceCommand: async (text: string): Promise<VoiceParseResult> => {
    try {
      const prompt = `Sen bir gayrimenkul danışmanı asistanısın. Aşağıdaki sesli komut metnini analiz et ve JSON formatında yapılandırılmış veriye dönüştür.
      
      Metin: "${text}"
      
      Kurallar:
      1. Niyet (intent) şunlardan biri olmalı: 'lead' (yeni müşteri), 'task' (görev/hatırlatıcı), 'note' (saha notu) veya 'unknown'.
      2. İsim, telefon, bütçe (sayı olarak), lokasyon, tarih (ISO formatında) ve açıklama gibi verileri çıkar.
      3. Çıkaramadığın verileri boş bırak.
      
      JSON Şeması:
      {
        "intent": "lead" | "task" | "note" | "unknown",
        "confidence": 0.0 - 1.0,
        "extracted_data": {
          "name": "string",
          "phone": "string",
          "budget": number,
          "location": "string",
          "due_date": "ISO date string",
          "description": "string"
        }
      }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        original_text: text,
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        extracted_data: result.extracted_data || {}
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        original_text: text,
        intent: 'unknown',
        confidence: 0,
        extracted_data: { description: text }
      };
    }
  },

  getCoachInsights: async (): Promise<CoachInsight> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Fetch user data to analyze
    const [leads, tasks, missedOpps] = await Promise.all([
      api.getLeads(),
      api.getTasks(),
      api.getMissedOpportunities()
    ]);

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const activeLeads = leads.filter(l => l.status !== 'Pasif').length;
    const missedCount = missedOpps.length;

    const prompt = `Sen Türkiye'de çalışan bireysel gayrimenkul danışmanları için uzman bir "Davranışsal Koç" (Behavioral Coach) yapay zekasısın.
    Amacın danışmanın verilerini analiz edip ona 1 güçlü yön, 1 zayıf yön ve 1 günlük odak noktası vermek.
    Dramatik veya abartılı olma. Gerçekçi, profesyonel ve motive edici bir dil kullan.

    Danışmanın Verileri:
    - Toplam Görev: ${totalTasks} (Tamamlanan: ${completedTasks}, Oran: %${taskCompletionRate})
    - Aktif Müşteri (Lead) Sayısı: ${activeLeads}
    - Kaçırılan/Geciken Fırsat Sayısı: ${missedCount}

    Lütfen aşağıdaki JSON formatında çıktı ver:
    {
      "score": 0-100 arası genel disiplin skoru,
      "daily_tip": "Bugün odaklanması gereken tek bir net tavsiye (Maks 2 cümle)",
      "strength": {
        "title": "Güçlü yönünün kısa adı (Örn: Saha Kaplanı, Disiplinli)",
        "description": "Neden güçlü olduğu (Maks 2 cümle)"
      },
      "weakness": {
        "title": "Gelişim alanının kısa adı (Örn: Masa Başı Zayıf, Takip Eksikliği)",
        "description": "Neyi düzeltmesi gerektiği (Maks 2 cümle)"
      }
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      return JSON.parse(response.text || '{}') as CoachInsight;
    } catch (error) {
      console.error('Coach insight error:', error);
      // Fallback data
      return {
        score: 75,
        daily_tip: "Bugün en az 2 eski müşterinizi arayarak durumlarını sorun.",
        strength: {
          title: "Veri Toplayıcı",
          description: "Sisteme düzenli olarak müşteri ekliyorsunuz."
        },
        weakness: {
          title: "Takip Eksikliği",
          description: "Eklediğiniz müşterileri arama konusunda gecikmeler yaşıyorsunuz."
        }
      };
    }
  }
};
