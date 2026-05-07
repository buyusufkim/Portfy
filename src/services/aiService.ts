// src/services/aiService.ts
import { Property } from '../types';
import { supabase } from '../lib/supabase';
import { taskService } from './taskService';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { profileService } from './profileService';
import { normalizeAiCoachTone, getAiCoachToneInstruction } from '../lib/aiPromptBuilder';
import { generateContent } from '../lib/aiClient';

import { getEffectiveAiTokenLimit } from '../config/subscriptionLimits';

// Scraper tipi importu (Gerçekte backendden API ile gelecek)
interface MarketComp { price: number; title: string; sqM: number; }

export interface ParsedBusinessCard {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface ValuationReport {
  estimatedValueRange: { min: number; max: number };
  recommendedListingPrice: number;
  marketInsight: string;
  persuasionScript: string;
  competitorSummary: string;
}

export const aiService = {
  getAiRequestLogs: async (limit: number = 20, offset: number = 0, featureFilter?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('ai_request_logs')
      .select('id, feature_key, model_name, prompt_tokens, completion_tokens, total_tokens, status_code, request_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (featureFilter && featureFilter !== 'all') {
      if (featureFilter === 'other') {
        query = query.not('feature_key', 'in', '("ai_coach", "dashboard_coach", "property_marketing_content", "whatsapp_analysis", "whatsapp_lead_extract", "business_card_parse", "generic_safe_json")');
      } else {
        query = query.eq('feature_key', featureFilter);
      }
    }

    const { data, error } = await query;
    if (error) {
       console.error("Error fetching AI logs:", error);
       return [];
    }
    return data || [];
  },

  checkUsage: async (userId: string): Promise<{ current: number, limit: number }> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const currentUsage = profile?.ai_tokens_used || 0;
    const limit = getEffectiveAiTokenLimit(profile);

    return { current: currentUsage, limit };
  },
/**
   * Kartvizitten Lead Çıkarma (OCR Asistanı)
   */
  parseBusinessCard: async (base64Image: string, mimeType: string): Promise<ParsedBusinessCard> => {
    const prompt = `
      Sen yetenekli bir OCR ve veri çıkarma asistanısın. 
      Bu kartvizit görselini analiz et ve bir emlak müşterisi (Lead) kaydı oluşturmak için şu bilgileri çıkar:
      İsim (name), Telefon (phone), E-posta (email), ve eğer varsa Şirket/Unvan/Adres bilgisini notlar (notes) kısmına yaz.
      Telefon numarasını başında 0 olacak şekilde (örn: 05551234567) ve boşluksuz formatla.
      Bulamadığın alanları boş string ("") olarak bırak.
      
      Yanıtı sadece JSON formatında ver:
      {
        "name": "İsim Soyisim",
        "phone": "Telefon numarası",
        "email": "E-posta",
        "notes": "Unvan / Şirket / Ek bilgiler"
      }
    `;

    // Gemini API'sine gönderilecek format
    const contents: import('../lib/aiClient').GenerateContentInput = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image.split(',')[1], mimeType: mimeType } } // Base64 başlığını temizliyoruz
        ]
      }
    ];

    try {
      const response = await generateContent<ParsedBusinessCard>("gemini-2.5-flash", contents, { 
        featureKey: "business_card_parse",
        responseMimeType: "application/json" 
      });
      return response;
    } catch (error) {
      console.error("Business Card OCR Error:", error);
      throw new Error("Kartvizit okunamadı. Görselin net olduğundan emin olun.");
    }
  },
  
  getDailyRadar: async (): Promise<{ tasks: string[], insight: string, isCampaignUser?: boolean }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [profile, tasks, leads, properties, { data: advProfile }, { data: activeCampaign }] = await Promise.all([
      profileService.getProfile(),
      taskService.getTasks(),
      leadService.getLeads(),
      propertyService.getProperties(),
      supabase.from('advisor_professional_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('campaign_90_status').select('*').eq('user_id', user.id).eq('status', 'active').single()
    ]);
    
    const isNewBeginnerCampaign = advProfile?.experience_level === 'new' && activeCampaign;
    const campaignDay = activeCampaign?.current_day || 1;

    const tone = normalizeAiCoachTone(profile?.ai_coach_tone);
    const toneInstruction = getAiCoachToneInstruction(tone);

    if (isNewBeginnerCampaign) {
        if (campaignDay <= 3) {
            return {
                tasks: [
                    "Bugünün eğitimini dikkatle oku.",
                    "Mesleki evrak / ofis / yetki hazırlığını kontrol et.",
                    "Bugünkü kamp görevlerini sırayla tamamla."
                ],
                insight: "Bugün satış baskısı yok. Önce güvenli çalışma zeminini ve ofis hazırlığını kuruyoruz.",
                isCampaignUser: true
            };
        } else {
            return {
                tasks: [
                    "Bugünün eğitimini dikkatle oku.",
                    "Bugünkü kamp görevlerinden ilk 3 görevi tamamla.",
                    "Gün sonunda kamp ilerlemeni mutlaka kontrol et."
                ],
                insight: "Bugün kamp akışına odaklan. Eğitimlerini al, görevlerini yap ve momentumu koru!",
                isCampaignUser: true
            };
        }
    }

    const prompt = `
      Sen bir emlak danışmanı koçusun. Danışmanın verileri:
      - Görevler: ${JSON.stringify(tasks.filter(t => !t.completed).slice(0, 5))}
      - Sıcak Leadler: ${JSON.stringify(leads.filter(l => l.status === 'Sıcak').slice(0, 3))}
      - Portföy Özeti: Toplam ${properties.length} portföyünüz var.
      
      Bugün için en kritik 3 hamleyi seç ve kısa, vurucu birer cümle olarak yaz. 
      Ayrıca genel bir içgörü ver.
      
      ${toneInstruction}
      
      Yanıtı JSON formatında ver:
      {
        "tasks": ["Hamle 1", "Hamle 2", "Hamle 3"],
        "insight": "Motivasyonel/Direkt içgörü"
      }
    `;

    try {
      const response = await generateContent<{ tasks: string[], insight: string }>(
        "gemini-2.5-flash",
        prompt,
        { 
          featureKey: "dashboard_coach",
          responseMimeType: "application/json" 
        }
      );

      return response;
    } catch (error) {
      console.error("Daily Radar AI error", error);
      return {
        tasks: [
          "Dünkü en sıcak 3 müşterini ara ve durum güncellemesi yap.",
          "Portföyündeki en eski ilanın fotoğraflarını ve fiyatını gözden geçir.",
          "Bölgendeki yeni fiyat hareketlerini analiz etmek için 15 dakika ayır."
        ],
        insight: "Yapay zeka koçun şu an arka planda veri güncelliyor ama sen hedeflerini çok iyi biliyorsun. Sahaya dön ve fark yarat!"
      };
    }
  },

  getDashboardInsight: async (propsCount: number, leadsCount: number, disciplineScore: number): Promise<string> => {
    // Mevcut kodlar...
    return "Bugün portföy sağlığını artırmak için 3 yeni fotoğraf ekle.";
  },

  /**
   * YENİ ÖZELLİK: Portföy Değerleme & Satıcı İkna Raporu (CMA Motoru)
   */
  generateValuationReport: async (propertyDetails: Partial<Property>, marketComps: MarketComp[]): Promise<ValuationReport> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ortalama piyasa hesaplamaları
    const avgPrice = marketComps.reduce((acc, curr) => acc + curr.price, 0) / (marketComps.length || 1);

    const prompt = `
      Sen üst düzey, otoriter ve premium bir gayrimenkul danışmanısın. 
      Elimizde ${propertyDetails.address?.city} ${propertyDetails.address?.district} bölgesinde bir satılık portföy adayı var. 
      Özellikleri: ${JSON.stringify(propertyDetails)}
      
      Sahibinden ve diğer portallardan çektiğimiz bölgedeki ${marketComps.length} adet rakip ilanın ortalama fiyatı: ${avgPrice} TL.
      
      Satıcıyı (mal sahibini) masada ikna etmek için, piyasa gerçeklerine dayanan, profesyonel bir "Değerleme ve Strateji Raporu" oluştur. Rapor sıradan olmamalı; veriyi kullanarak satıcının gerçek dışı fiyat beklentisini profesyonelce kırmalı.
      
      Yanıtı şu JSON formatında ver:
      {
        "estimatedValueRange": { "min": number, "max": number },
        "recommendedListingPrice": number,
        "marketInsight": "Piyasa durumunun 2 cümlelik sert ve net analizi",
        "persuasionScript": "Müşteriye yüz yüze sunumda söylenecek, veriye dayalı 3-4 cümlelik ikna metni",
        "competitorSummary": "Bölgedeki X satılık daire sizin rakibiniz. Onlardan sıyrılmak için..."
      }
    `;

    try {
      const response = await generateContent<ValuationReport>("gemini-2.5-flash", prompt, { 
        featureKey: "property_valuation",
        responseMimeType: "application/json" 
      });
      return response;
    } catch (error) {
      console.error("Valuation AI error", error);
      throw error;
    }
  }
};