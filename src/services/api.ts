import { Lead, Task, Building, Property, DashboardStats, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, PropertySyncLink, PriceHistory, GamifiedTask, UserStats, DailyMomentum, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const api = {
  // Dashboard Verileri
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('agentId', agentId);
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('agentId', agentId);

    const props = (properties || []) as Property[];

    // Calculate Estimated Revenue with Probability Weighting
    const estimatedRevenue = props.reduce((acc, p) => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
      const commission = (p.price * p.commissionRate) / 100;
      const probability = p.saleProbability || 0.5;
      return acc + (commission * probability);
    }, 0);

    // Calculate Discipline Score based on tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('agentId', agentId);
    
    const tks = (tasks || []) as Task[];
    const completedTasks = tks.filter(t => t.completed).length;
    const totalTasks = tks.length;
    const disciplineScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Generate AI Insight via Gemini
    let aiInsight = "Bugün portföy sağlığını artırmak için 3 yeni fotoğraf ekle.";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sen bir emlak koçusun. Danışmanın verileri: ${props.length} portföy, ${leadsCount || 0} lead, disiplin skoru ${disciplineScore}. Bugün için tek cümlelik, çok kısa ve vurucu bir tavsiye ver.`,
      });
      aiInsight = response.text || aiInsight;
    } catch (e) {
      console.error("AI Insight error", e);
    }

    return { 
      calls: 12, 
      appointments: 4, 
      exclusive: props.filter(p => p.status === 'Yayında').length, 
      targetProgress: 65,
      activeProperties: props.length,
      totalLeads: leadsCount || 0,
      totalProperties: props.length,
      estimatedRevenue,
      disciplineScore,
      aiInsight
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
    const healthScore = property.healthScore || 70;
    const probability = (priceScore * 0.5 + healthScore * 0.3 + 20) / 100;

    return {
      saleProbability: Math.min(0.99, Math.max(0.1, probability)),
      marketAnalysis: {
        avgPriceM2: 45000,
        priceIndex,
        status
      }
    };
  },

  // Map Pins
  getMapPins: async (): Promise<MapPin[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('map_pins')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as MapPin[];
  },

  addMapPin: async (pin: Omit<MapPin, 'id' | 'agentId' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('map_pins')
      .insert({
        ...pin,
        agentId: user.id,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Saha Ziyaretleri
  getFieldVisits: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('field_visits')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as Building[];
  },

  getTasks: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as Task[];
  },

  addTask: async (task: Omit<Task, 'id' | 'agentId'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        agentId: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  addVisit: async (visit: Omit<Building, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('field_visits')
      .insert({
        ...visit,
        agentId: user.id,
        lastVisit: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Lead / Aday Yönetimi
  getLeads: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as Lead[];
  },

  addLead: async (lead: Omit<Lead, 'id' | 'agentId' | 'lastContact'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        agentId: user.id,
        lastContact: new Date().toISOString(),
        behaviorMetrics: {
          totalViews: 0,
          avgDuration: 0,
          lastActive: new Date().toISOString(),
          isHot: false
        }
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  // Portföy Yönetimi
  getProperties: async (): Promise<Property[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('agentId', user.id)
      .order('createdAt', { ascending: false });
    return (data || []) as Property[];
  },

  addProperty: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'agentId' | 'saleProbability' | 'marketAnalysis'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const scores = api.calculatePropertyScores(property);

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...property,
        ...scores,
        agentId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        updatedAt: new Date().toISOString()
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
      Metrekare: ${property.details.brutM2} m2
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
      M2: ${property.details.brutM2}
      
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
      - Metrekare: ${property.details.brutM2} m2
      - Kat Bilgisi: ${property.details.floor}. Kat
      - Fiyat: ${property.price.toLocaleString()} TL
      - Konum: ${property.address.neighborhood} / ${property.address.district} / ${property.address.city}
      - Portföy Özeti: ${property.notes}
      - Hedef Müşteri Tipi: ${property.targetCustomerType || 'Belirtilmemiş'}
      - Yatırım Uygunluğu: ${property.investmentSuitability || 'Belirtilmemiş'}
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
      .eq('agentId', user.id)
      .order('updatedAt', { ascending: false });
    return (data || []) as UserNote[];
  },

  addNote: async (note: Omit<UserNote, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        agentId: user.id,
        createdAt: now,
        updatedAt: now
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
        updatedAt: new Date().toISOString()
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
      .eq('agentId', user.id)
      .order('createdAt', { ascending: false });
    return (data || []) as PersonalTask[];
  },

  addPersonalTask: async (task: Omit<PersonalTask, 'id' | 'agentId' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        ...task,
        agentId: user.id,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  togglePersonalTask: async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('personal_tasks')
      .update({ isCompleted })
      .eq('id', id);
    if (error) throw error;
  },

  updatePersonalTask: async (id: string, data: Partial<PersonalTask>) => {
    const { error } = await supabase
      .from('personal_tasks')
      .update(data)
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

  // Mesaj Şablonları
  getMessageTemplates: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as MessageTemplate[];
  },

  addMessageTemplate: async (template: Omit<MessageTemplate, 'id' | 'agentId'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        ...template,
        agentId: user.id
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
    const agentId = user.id;
    
    if (apiKey.length < 10) throw new Error('Geçersiz API anahtarı');

    const account: Omit<BrokerAccount, 'id'> = {
      agentId,
      storeName: "Emlak Mağazası",
      apiKey: apiKey.substring(0, 4) + "****",
      connectedAt: new Date().toISOString()
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
      .eq('agentId', user.id)
      .maybeSingle();
    return data as BrokerAccount | null;
  },

  getExternalListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('external_listings')
      .select('*')
      .eq('agentId', user.id);
    return (data || []) as ExternalListing[];
  },

  syncExternalListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Gerçek API entegrasyonu burada yapılacak
    // Şimdilik boş bırakıyoruz
    return [];
  },

  linkPropertyToExternal: async (propertyId: string, externalListingId: string) => {
    await supabase
      .from('property_sync_links')
      .upsert({ propertyId, externalListingId }, { onConflict: 'propertyId' });
  },

  getSyncLink: async (propertyId: string) => {
    const { data } = await supabase
      .from('property_sync_links')
      .select('*')
      .eq('propertyId', propertyId)
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
      
      // Use local date for "today" to avoid timezone issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      console.log('Fetching tasks for:', today, 'agent:', agentId);

      const { data: existingTasksData } = await supabase
        .from('gamified_tasks')
        .select('*')
        .eq('agentId', agentId)
        .eq('date', today);
      
      let existingTasks = (existingTasksData || []) as GamifiedTask[];

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
            const newTask = { agentId, ...ct, isCompleted: false, date: today };
            const { data: created } = await supabase.from('gamified_tasks').insert(newTask).select().single();
            if (created) existingTasks.push(created as GamifiedTask);
          }
        }
        return existingTasks;
      }

      // If forcing, delete existing tasks for today first (optional, but cleaner)
      if (force && existingTasks.length > 0) {
        console.log('Forcing refresh, deleting existing tasks');
        await supabase.from('gamified_tasks').delete().eq('agentId', agentId).eq('date', today);
        existingTasks = [];
      }

      console.log('Generating new tasks for today');

      // Generate tasks for today
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

      const tasks: Omit<GamifiedTask, 'id'>[] = [];
      
      // Always include these two tasks
      tasks.push({ agentId, title: "Peş peşe girişini sürdür", points: 10, category: 'sweet', isCompleted: false, date: today });
      tasks.push({ agentId, title: "Bugün 100 puan kazan", points: 20, category: 'sweet', isCompleted: false, date: today });

      // 3 Sweet
      const shuffledSweet = [...sweetTemplates].sort(() => 0.5 - Math.random());
      shuffledSweet.slice(0, 3).forEach(t => tasks.push({ agentId, title: t, points: 10, category: 'sweet', isCompleted: false, date: today }));

      // 2 Main
      const shuffledMain = [...mainTemplates].sort(() => 0.5 - Math.random());
      shuffledMain.slice(0, 2).forEach(t => tasks.push({ agentId, title: t, points: 50, category: 'main', isCompleted: false, date: today }));

      // 1 Smart (Real logic based on existing data)
      const { data: leadsData } = await supabase.from('leads').select('*').eq('agentId', agentId);
      const leads = (leadsData || []) as Lead[];
      
      const neglectedLeads = leads.filter(l => {
        const lastContact = new Date(l.lastContact);
        const diffDays = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7 && l.status !== 'Pasif';
      });

      if (neglectedLeads.length > 0) {
        const targetLead = neglectedLeads[0];
        tasks.push({ 
          agentId, 
          title: `"${targetLead.name}" isimli müşteriyi ara`, 
          points: 100, 
          category: 'smart', 
          isCompleted: false, 
          date: today,
          aiReason: `Bu müşteri ${targetLead.status} statüsünde ama uzun süredir temas kurulmadı.`
        });
      } else {
        tasks.push({ 
          agentId, 
          title: "Bölgendeki yeni bir esnafla tanış", 
          points: 100, 
          category: 'smart', 
          isCompleted: false, 
          date: today,
          aiReason: "Tüm müşterilerinle güncel iletişimdesin, yeni bağlantılar kurma zamanı."
        });
      }

      const createdTasks: GamifiedTask[] = [];
      for (const task of tasks) {
        const { data: created } = await supabase.from('gamified_tasks').insert(task).select().single();
        if (created) createdTasks.push(created as GamifiedTask);
      }

      return createdTasks;
    } catch (error) {
      console.error("Error in getDailyGamifiedTasks:", error);
      return [];
    }
  },

  completeGamifiedTask: async (taskId: string, points: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    
    await supabase.from('gamified_tasks').update({ isCompleted: true }).eq('id', taskId);

    // Update user points and XP
    const { data: profile } = await supabase.from('profiles').select('gamifiedPoints, xp, level').eq('uid', agentId).maybeSingle();
    if (profile) {
      const currentPoints = profile.gamifiedPoints || 0;
      const currentXP = profile.xp || 0;
      const currentLevel = profile.level || 1;
      
      const newXP = currentXP + points;
      // Simple level up logic: level = floor(sqrt(xp / 100)) + 1
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

      await supabase.from('profiles').update({ 
        gamifiedPoints: currentPoints + points,
        xp: newXP,
        level: newLevel
      }).eq('uid', agentId);
    }
  },

  updateGamifiedTask: async (taskId: string, data: Partial<GamifiedTask>) => {
    const { error } = await supabase
      .from('gamified_tasks')
      .update(data)
      .eq('id', taskId);
    if (error) throw error;
  },

  getGamifiedStats: async (): Promise<UserStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', agentId).maybeSingle();
    const points = profile ? (profile.gamifiedPoints || 0) : 0;

    const { data: tasksData } = await supabase
      .from('gamified_tasks')
      .select('*')
      .eq('agentId', agentId)
      .eq('date', today);
    
    const tasks = (tasksData || []) as GamifiedTask[];

    const completedTasks = tasks.filter(t => t.isCompleted);
    const pointsToday = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const mainTasks = tasks.filter(t => t.category === 'main');
    const completedMainTasks = mainTasks.filter(t => t.isCompleted);

    // Momentum Calculation
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) : 0;
    const mainCompletionRate = mainTasks.length > 0 ? (completedMainTasks.length / mainTasks.length) : 0;
    
    // Streak (Calculate based on last active dates)
    let streak = profile ? (profile.currentStreak || 0) : 0;
    const lastActiveDate = profile ? profile.lastActiveDate : null;
    
    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        await supabase.from('profiles').update({ 
          currentStreak: streak + 1,
          lastActiveDate: today
        }).eq('uid', agentId);
        streak += 1;
      } else if (diffDays > 1) {
        await supabase.from('profiles').update({ 
          currentStreak: 1,
          lastActiveDate: today
        }).eq('uid', agentId);
        streak = 1; // Reset to 1 for today
      }
    } else {
      // First time
      await supabase.from('profiles').update({ 
        currentStreak: 1,
        lastActiveDate: today
      }).eq('uid', agentId);
      streak = 1;
    }
    const streakEffect = streak > 0 ? 20 : 0;

    const momentum = Math.round((completionRate * 50) + (mainCompletionRate * 30) + streakEffect);

    // Level Logic
    let level = profile?.level || 1;
    let levelName = "Başlangıç";
    let nextLevelPoints = Math.pow(level, 2) * 100;

    if (level >= 50) levelName = "Efsane";
    else if (level >= 30) levelName = "Master";
    else if (level >= 15) levelName = "Top Producer";
    else if (level >= 5) levelName = "Profesyonel";
    else levelName = "Çaylak";

    return {
      points,
      pointsToday,
      streak,
      momentum,
      level,
      levelName,
      nextLevelPoints,
      dailyProgress: Math.round(completionRate * 100),
      tasksCompletedToday: completedTasks.length,
      totalTasksToday: tasks.length
    };
  },

  completeMorningRitual: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ lastMorningRitualAt: now }).eq('uid', user.id);
    // Award XP for starting the day
    const { data: profile } = await supabase.from('profiles').select('xp').eq('uid', user.id).maybeSingle();
    if (profile) {
      const newXP = (profile.xp || 0) + 50;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('uid', user.id);
    }
  },

  completeEveningRitual: async (stats: { tasksCompleted: number, revenue: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    
    await supabase.from('profiles').update({ lastEveningRitualAt: now }).eq('uid', user.id);
    
    // Save daily stats
    await supabase.from('daily_stats').upsert({
      agentId: user.id,
      date: today,
      tasksCompleted: stats.tasksCompleted,
      potentialRevenueHandled: stats.revenue,
      xpEarned: 100 // Fixed XP for ritual
    });

    // Award XP
    const { data: profile } = await supabase.from('profiles').select('xp').eq('uid', user.id).maybeSingle();
    if (profile) {
      const newXP = (profile.xp || 0) + 100;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('uid', user.id);
    }
  },

  getWeeklyRecap: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: stats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('agentId', user.id)
      .gte('date', dateStr);

    const s = (stats || []) as any[];
    const totalTasks = s.reduce((acc, curr) => acc + (curr.tasksCompleted || 0), 0);
    const totalRevenue = s.reduce((acc, curr) => acc + (curr.potentialRevenueHandled || 0), 0);
    
    const prompt = `Aşağıdaki haftalık performans verilerini analiz et ve danışmana 3 maddelik, motive edici bir haftalık özet çıkar.
    Veriler: ${totalTasks} görev tamamlandı, ${totalRevenue.toLocaleString()} TL değerinde fırsat yönetildi.
    Yanıtı JSON formatında ver: { "summary": ["madde 1", "madde 2", "madde 3"], "score": 0-100 }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text);
    } catch (e) {
      return { summary: ["Harika bir haftaydı!", "Görevlerini aksatmadın.", "Gelecek hafta daha iyisini yapabilirsin."], score: 80 };
    }
  },

  getAICoachInsight: async (): Promise<string> => {
    // Simple logic for MVP
    const stats = await api.getGamifiedStats();
    if (stats.momentum < 40) return "Momentumun düştü, günü kurtarmak için 1 saha ve 1 arama görevi tamamla.";
    if (stats.tasksCompletedToday === 0) return "Bugün en kritik işin 2 sıcak müşteriye dönüş yapmak.";
    if (stats.dailyProgress < 100) return "Harika gidiyorsun! Günü %100 tamamlamak için sadece birkaç görevin kaldı.";
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
      .eq('agentId', agentId)
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
    const hotLeads = leads.filter(l => l.behaviorMetrics?.isHot);
    const properties = await api.getProperties();
    const lowHealthProps = properties.filter(p => p.healthScore < 80);

    const tasks: RescueTask[] = [];
    
    // 1. Call a hot lead
    if (hotLeads.length > 0) {
      tasks.push({
        id: 'r1',
        title: `${hotLeads[0].name} isimli sıcak müşteriyi ara`,
        type: 'call',
        estimatedMinutes: 15,
        points: 50,
        isCompleted: false,
        targetId: hotLeads[0].id
      });
    } else {
      tasks.push({
        id: 'r1',
        title: "Eski bir müşterine 'Nasılsınız?' mesajı at",
        type: 'call',
        estimatedMinutes: 10,
        points: 30,
        isCompleted: false
      });
    }

    // 2. Update a property
    if (lowHealthProps.length > 0) {
      tasks.push({
        id: 'r2',
        title: `"${lowHealthProps[0].title}" portföyünün notlarını güncelle`,
        type: 'update',
        estimatedMinutes: 10,
        points: 40,
        isCompleted: false,
        targetId: lowHealthProps[0].id
      });
    } else {
      tasks.push({
        id: 'r2',
        title: "Bir portföyüne yeni bir fotoğraf ekle",
        type: 'update',
        estimatedMinutes: 15,
        points: 40,
        isCompleted: false
      });
    }

    // 3. Quick CRM check
    tasks.push({
      id: 'r3',
      title: "Yarın için 1 yeni randevu planla",
      type: 'note',
      estimatedMinutes: 15,
      points: 60,
      isCompleted: false
    });

    const session: Omit<RescueSession, 'id'> = {
      agentId,
      date: today,
      status: 'active',
      tasks,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour duration
    };

    const { data, error } = await supabase.from('rescue_sessions').insert(session).select().single();
    if (error) throw error;
    return data as RescueSession;
  },

  completeRescueTask: async (sessionId: string, taskId: string) => {
    const { data: session } = await supabase
      .from('rescue_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session) return;
    
    const updatedTasks = (session.tasks as RescueTask[]).map(t => t.id === taskId ? { ...t, isCompleted: true } : t);
    
    await supabase.from('rescue_sessions').update({ tasks: updatedTasks }).eq('id', sessionId);

    // If all completed, mark session as completed
    if (updatedTasks.every(t => t.isCompleted)) {
      await supabase.from('rescue_sessions').update({ status: 'completed' }).eq('id', sessionId);
      // Award bonus points
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('gamifiedPoints').eq('uid', user.id).maybeSingle();
        if (profile) {
          const current = profile.gamifiedPoints || 0;
          await supabase.from('profiles').update({ gamifiedPoints: current + 150 }).eq('uid', user.id);
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
      const last = new Date(l.lastContact);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 7) {
        opportunities.push({
          id: `lead-${l.id}`,
          type: 'lead_followup',
          title: `${l.name} ile temas kesildi`,
          description: `${diff} gündür bu müşteriyle iletişime geçmedin. Başkasına gitmeden hemen ara!`,
          targetId: l.id,
          daysDelayed: diff,
          priority: diff > 14 ? 'high' : 'medium',
          potentialValue: 100
        });
      }
    });

    // 2. Stale Properties (14+ days)
    properties.forEach(p => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return;
      const last = new Date(p.updatedAt);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 14) {
        opportunities.push({
          id: `prop-${p.id}`,
          type: 'property_stale',
          title: `"${p.title}" portföyü unutuldu`,
          description: `${diff} gündür bu ilanda hiçbir güncelleme yapmadın. İlanın güncelliği düşüyor.`,
          targetId: p.id,
          daysDelayed: diff,
          priority: diff > 30 ? 'high' : 'medium',
          potentialValue: 200
        });
      }

      // 3. Price Drop Potential
      if (p.marketAnalysis?.status === 'Pahalı' && p.saleProbability < 0.4) {
        opportunities.push({
          id: `price-${p.id}`,
          type: 'price_drop_potential',
          title: `Fiyat revizyonu fırsatı: ${p.title}`,
          description: "Bu mülk pazarın üzerinde kalmış görünüyor. Malikle görüşüp fiyatı %5-10 aşağı çekersen satış ihtimali %40 artar.",
          targetId: p.id,
          daysDelayed: 0,
          priority: 'high',
          potentialValue: 500
        });
      }
    });

    // 4. Stale Visits (30+ days)
    visits.forEach(v => {
      const last = new Date(v.lastVisit);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 30) {
        opportunities.push({
          id: `visit-${v.id}`,
          type: 'visit_stale',
          title: `${v.address} ziyareti soğudu`,
          description: "Bu binayı 1 ay önce ziyaret etmiştin. Malikler taşınmış veya karar vermiş olabilir. Tekrar uğra!",
          targetId: v.id,
          daysDelayed: diff,
          priority: 'medium',
          potentialValue: 50
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
        "extractedData": {
          "name": "string",
          "phone": "string",
          "budget": number,
          "location": "string",
          "dueDate": "ISO date string",
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
        originalText: text,
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        extractedData: result.extractedData || {}
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        originalText: text,
        intent: 'unknown',
        confidence: 0,
        extractedData: { description: text }
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
      "dailyTip": "Bugün odaklanması gereken tek bir net tavsiye (Maks 2 cümle)",
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
        dailyTip: "Bugün en az 2 eski müşterinizi arayarak durumlarını sorun.",
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
