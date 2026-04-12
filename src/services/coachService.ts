import { CoachInsight } from '../types';
import { supabase } from '../lib/supabase';
import { leadService } from './leadService';
import { taskService } from './taskService';
import { missedOpportunityService } from './missedOpportunityService';
import { generateContent } from '../lib/aiClient';

export const coachService = {
  getCoachInsights: async (): Promise<CoachInsight> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Fetch user data to analyze
    const [leads, tasks, missedOpps] = await Promise.all([
      leadService.getLeads(),
      taskService.getTasks(),
      missedOpportunityService.getMissedOpportunities()
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
      const response = await generateContent(
        'gemini-3-flash-preview',
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

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
