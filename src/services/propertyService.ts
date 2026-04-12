import { Property, BrokerAccount, ExternalListing, PropertySyncLink } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { generateContent } from '../lib/aiClient';

export const propertyService = {
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
    
    const scores = propertyService.calculatePropertyScores(property);

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

    const response = await generateContent(
      "gemini-3-flash-preview",
      prompt
    );

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

    const response = await generateContent(
      "gemini-3-flash-preview",
      prompt,
      { responseMimeType: "application/json" }
    );

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

    const response = await generateContent(
      "gemini-3-flash-preview",
      prompt,
      { responseMimeType: "application/json" }
    );

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

    const response = await generateContent(
      "gemini-3-flash-preview",
      prompt,
      { responseMimeType: "application/json" }
    );

    return JSON.parse(response.text);
  },

  // sahibinden.com Entegrasyonu
  connectSahibinden: async (apiKey: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const agent_id = userId;
    
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
    const userId = await getUserId();
    if (!userId) return null;
    const { data } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('agent_id', userId)
      .maybeSingle();
    return data as BrokerAccount | null;
  },

  getExternalListings: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('external_listings')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as ExternalListing[];
  },

  syncExternalListings: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const agent_id = userId;

    const account = await propertyService.getBrokerAccount();
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
};
