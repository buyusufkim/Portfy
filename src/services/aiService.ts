import { supabase } from '../lib/supabase';
import { taskService } from './taskService';
import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { gamificationService } from './gamificationService';
import { generateContent } from '../lib/aiClient';

export const aiService = {
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
      const response = await generateContent(
        "gemini-flash-latest",
        prompt,
        { responseMimeType: "application/json" }
      );
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Daily Radar AI error", e);
      return {
        tasks: ["Dünkü görüşmeleri takip et", "Yeni portföy fotoğraflarını yükle", "Aday listeni gözden geçir"],
        insight: "Bugün harika bir gün olacak, odaklan ve başar!"
      };
    }
  },

  getDashboardInsight: async (propsCount: number, leadsCount: number, disciplineScore: number): Promise<string> => {
    let aiInsight = "Bugün portföy sağlığını artırmak için 3 yeni fotoğraf ekle.";
    try {
      const generateWithRetry = async (retries = 2): Promise<string> => {
        try {
          const response = await generateContent(
            "gemini-flash-latest",
            `Sen bir emlak koçusun. Danışmanın verileri: ${propsCount} portföy, ${leadsCount} lead, disiplin skoru ${disciplineScore}. Bugün için tek cümlelik, çok kısa ve vurucu bir tavsiye ver.`
          );
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
    return aiInsight;
  }
};
