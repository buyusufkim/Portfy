// src/services/aiService.ts
import { Property } from '../types';
import { supabase } from '../lib/supabase';
import { taskService } from './taskService';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { generateContent } from '../lib/aiClient';

// Scraper tipi importu (Gerçekte backendden API ile gelecek)
interface MarketComp { price: number; title: string; sqM: number; }

export const aiService = {
  checkUsage: async (userId: string): Promise<{ current: number, limit: number }> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_tokens_used, tier')
      .eq('id', userId)
      .single();

    const currentUsage = profile?.ai_tokens_used || 0;
    const limit = profile?.tier === 'pro' ? 10000 : 1000;

    return { current: currentUsage, limit };
  },
/**
   * Kartvizitten Lead Çıkarma (OCR Asistanı)
   */
  parseBusinessCard: async (base64Image: string, mimeType: string): Promise<any> => {
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
    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image.split(',')[1], mimeType: mimeType } } // Base64 başlığını temizliyoruz
        ]
      }
    ];

    try {
      // aiClient içindeki mevcut generateContent fonksiyonunu kullanıyoruz
      const response = await generateContent("gemini-2.0-flash", contents, { responseMimeType: "application/json" });
      return response;
    } catch (error) {
      console.error("Business Card OCR Error:", error);
      throw new Error("Kartvizit okunamadı. Görselin net olduğundan emin olun.");
    }
  },
  
  getDailyRadar: async (): Promise<{ tasks: string[], insight: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [tasks, leads, properties] = await Promise.all([
      taskService.getTasks(),
      leadService.getLeads(),
      propertyService.getProperties()
    ]);

    const prompt = `
      Sen bir emlak danışmanı koçusun. Danışmanın verileri:
      - Görevler: ${JSON.stringify(tasks.filter(t => !t.completed).slice(0, 5))}
      - Sıcak Leadler: ${JSON.stringify(leads.filter(l => l.status === 'Sıcak').slice(0, 3))}
      - Portföy Özeti: Toplam ${properties.length} portföyünüz var.
      
      Bugün için en kritik 3 hamleyi seç ve kısa, vurucu birer cümle olarak yaz. 
      Ayrıca genel bir motivasyonel içgörü ver.
      Yanıtı JSON formatında ver:
      {
        "tasks": ["Hamle 1", "Hamle 2", "Hamle 3"],
        "insight": "Motivasyonel içgörü"
      }
    `;

    try {
      const response: any = await generateContent(
        "gemini-2.0-flash",
        prompt,
        { responseMimeType: "application/json" }
      );

      return response;
    } catch (e) {
      console.error("Daily Radar AI error", e);
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
  generateValuationReport: async (propertyDetails: Partial<Property>, marketComps: MarketComp[]): Promise<any> => {
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
      const response = await generateContent("gemini-2.0-flash", prompt, { responseMimeType: "application/json" }) as any;
      return response;
    } catch (error) {
      console.error("Valuation AI error", error);
      throw error;
    }
  }
};