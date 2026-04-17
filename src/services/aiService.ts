import { supabase } from '../lib/supabase';
import { taskService } from './taskService';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { generateContent } from '../lib/aiClient';

export const aiService = {
  // YARDIMCI FONKSİYON: Limit kontrolü ve Token artırımı
  checkAndIncrementUsage: async (userId: string, tokensToAdd?: number): Promise<{ canProceed: boolean, usage?: any }> => {
    // 1. Mevcut kullanımı kontrol et
    const { data: usage } = await supabase
      .from('user_usage_limits')
      .select('current_month_usage, monthly_token_limit')
      .eq('user_id', userId)
      .single();

    // Eğer kayıt yoksa ilk defa oluşturulması için default değer varsayalım
    const currentUsage = usage?.current_month_usage || 0;
    const limit = usage?.monthly_token_limit || 500000;

    if (currentUsage >= limit) {
      return { canProceed: false };
    }

    // 2. Eğer tokensToAdd varsa (istek sonrası), veritabanına işle
    if (tokensToAdd && tokensToAdd > 0) {
      await supabase.rpc('increment_usage', {
        uid: userId,
        tokens_to_add: tokensToAdd
      });
    }

    return { canProceed: true, usage };
  },

  getDailyRadar: async (): Promise<{ tasks: string[], insight: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // MİLLİYET KONTROLÜ (ÖNCE)
    const { canProceed } = await aiService.checkAndIncrementUsage(user.id);
    if (!canProceed) {
      return {
        tasks: ["Kullanım limitiniz doldu", "Lütfen paketinizi yükseltin", "Portfy Pro'yu inceleyin"],
        insight: "Bu ayki AI kullanım limitinize ulaştınız. Yarın tekrar deneyebilir veya planınızı yükseltebilirsiniz."
      };
    }

    const [tasks, leads, properties] = await Promise.all([
      taskService.getTasks(),
      leadService.getLeads(),
      propertyService.getProperties()
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
      const response: any = await generateContent(
        "gemini-1.5-flash",
        prompt,
        { responseMimeType: "application/json" }
      );

      // KULLANIMI KAYDET (SONRA)
      const tokens = response.usageMetadata?.totalTokenCount || 500; 
      await aiService.checkAndIncrementUsage(user.id, tokens);

      return response;
    } catch (e) {
      console.error("Daily Radar AI error", e);
      
      // 🔥 YEDEK (FALLBACK) SENARYO 🔥
      // AI çökerse ekran boş kalmaz, bu gerçekçi emlak görevleri görünür
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
    const { data: { user } } = await supabase.auth.getUser();
    let aiInsight = "Bugün portföy sağlığını artırmak için 3 yeni fotoğraf ekle.";
    
    if (!user) return aiInsight;

    try {
      // MİLLİYET KONTROLÜ
      const { canProceed } = await aiService.checkAndIncrementUsage(user.id);
      if (!canProceed) return "Günlük limitinize ulaştınız. Portfy yanınızda!";

      const generateWithRetry = async (retries = 2): Promise<any> => {
        try {
          const prompt = `Sen bir emlak koçusun. Danışmanın verileri: ${propsCount} portföy, ${leadsCount} lead, disiplin skoru ${disciplineScore}. Bugün için tek cümlelik, çok kısa ve vurucu bir tavsiye ver. Yanıtı SADECE şu JSON formatında ver: {"tavsiye": "tavsiye metni"}`;
          
          const response: any = await generateContent(
            "gemini-1.5-flash",
            prompt,
            { responseMimeType: "application/json" }
          );
          
          return response;
        } catch (error: any) {
          if (retries > 0 && error?.status === 'UNAVAILABLE') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return generateWithRetry(retries - 1);
          }
          throw error;
        }
      };

      const aiResponse = await generateWithRetry();
      
      // KULLANIMI KAYDET
      const tokens = aiResponse.usageMetadata?.totalTokenCount || 300;
      await aiService.checkAndIncrementUsage(user.id, tokens);

      return aiResponse.tavsiye || aiInsight;
    } catch (e) {
      console.warn("AI Insight temporary unavailable, using fallback.");
      
      // 🔥 YEDEK (FALLBACK) SENARYO 🔥
      // AI yanıt veremezse, statik ama motive edici sözler gösterilir
      const fallbacks = [
        "Unutma: Satışı kapatan şey fiyat değil, müşteriye sunduğun güvendir.",
        "Portföy sayın ne olursa olsun, önemli olan onlara ne kadar hakim olduğundur.",
        "Bugün yeni bir aday bulmak yerine, mevcut bir adayla bağlarını güçlendir."
      ];
      // Diziden rastgele bir tavsiye seçip döndürüyoruz
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
};