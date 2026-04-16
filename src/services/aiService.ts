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
      const response: any = await generateContent(
        "gemini-2.5-flash", // Modele dikkat
        prompt,
        { responseMimeType: "application/json" }
      );
      // JSON.parse(response.text) çöpe gitti!
      return response;
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
          // BACKEND ÇÖKMESİN DİYE ZORLA JSON İSTİYORUZ
          const prompt = `Sen bir emlak koçusun. Danışmanın verileri: ${propsCount} portföy, ${leadsCount} lead, disiplin skoru ${disciplineScore}. Bugün için tek cümlelik, çok kısa ve vurucu bir tavsiye ver. Yanıtı SADECE şu JSON formatında ver: {"tavsiye": "tavsiye metni"}`;
          
          const response: any = await generateContent(
            "gemini-2.5-flash",
            prompt,
            { responseMimeType: "application/json" }
          );
          // Backend'den gelen objenin içindeki tavsiyeyi okuyoruz
          return response.tavsiye || aiInsight;
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