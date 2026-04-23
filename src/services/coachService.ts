import { CoachInsight, PersonalTask, GamifiedTask, Task } from '../types';
import { AICoachResponse, AICoachAction } from "../types/ai";
import { AI_COACH_SCHEMA, buildCoachPrompt } from "../lib/aiPromptBuilder";
import { supabase } from '../lib/supabase';
import { leadService } from './leadService';
import { taskService } from './taskService';
import { missedOpportunityService } from './missedOpportunityService';
import { propertyService } from './propertyService';
import { profileService } from './profileService';
import { gamificationService } from './gamificationService';
import { generateContent } from '../lib/aiClient';

export const coachService = {
  /**
   * Returns a detailed AI-generated coaching response with strategic actions.
   * Used in the dedicated AI Coach Panel (Premium feature).
   */
  getDetailedInsight: async (): Promise<AICoachResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [profile, leads, properties, tasks, missedOpportunities] = await Promise.all([
      profileService.getProfile(),
      leadService.getLeads(),
      propertyService.getProperties(),
      taskService.getTasks(),
      missedOpportunityService.getMissedOpportunities()
    ]);

    const prompt = buildCoachPrompt({
      profile,
      leads,
      properties,
      tasks,
      missedOpportunities
    });

    try {
      const response: any = await generateContent(
        "gemini-2.0-flash",
        prompt,
        {
          // @ts-ignore
          responseSchema: AI_COACH_SCHEMA,
          responseMimeType: "application/json"
        }
      );

      return response as AICoachResponse;
    } catch (error) {
      console.error("AI Coach Service Error:", error);
      throw new Error("AI Koç şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
    }
  },

  /**
   * Returns a simpler AI-generated coaching summary.
   * Used in the main Dashboard view.
   */
  getSimpleInsight: async (): Promise<CoachInsight> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
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
    Özellikle sosyal medya kullanımı (Reels, Story, LinkedIn) ve dijital görünürlük konularında da tavsiyeler ekle.
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
      const response: any = await generateContent(
        'gemini-2.0-flash',
        prompt,
        {
          responseMimeType: 'application/json',
        }
      );

      return response as CoachInsight;
    } catch (error) {
      console.error('Coach insight error:', error);
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
  },

  /**
   * Returns a quick, logic-based tip based on current gamification stats.
   * Does not require an AI call.
   */
  getQuickTip: async (): Promise<string> => {
    const stats = await gamificationService.getGamifiedStats();
    if (stats.momentum < 40) return "Momentumun düştü, günü kurtarmak için 1 saha ve 1 arama görevi tamamla.";
    if (stats.tasks_completed_today === 0) return "Bugün en kritik işin 2 sıcak müşteriye dönüş yapmak.";
    if (stats.daily_progress < 100) return "Harika gidiyorsun! Günü %100 tamamlamak için sadece birkaç görevin kaldı.";
    return "Mükemmel bir gün! Tüm görevlerini tamamladın, yarın için dinlenmeyi unutma.";
  },

  /**
   * Converts a recommended AI action into a real task in the system.
   */
  convertActionToTask: async (action: AICoachAction) => {
    const typeMap: Record<string, Task['type']> = {
      'call': 'Arama',
      'visit': 'Saha',
      'followup': 'Takip',
      'update': 'Güncelleme',
      'social': 'Sosyal Medya'
    };

    return taskService.addTask({
      title: action.title,
      type: typeMap[action.type] || 'Randevu',
      time: new Date().toISOString(),
      completed: false
    });
  }
};