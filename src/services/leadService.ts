import { Lead } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { gamificationService } from './gamificationService';
import { generateContent } from '../lib/aiClient';

export const leadService = {
  getLeads: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);
    return (data || []) as Lead[];
  },

  addLead: async (lead: Omit<Lead, 'id' | 'user_id' | 'last_contact'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        user_id: userId,
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
    
    // Award XP for adding a lead
    try {
      await gamificationService.earnXP('ADD_LEAD', { leadId: data.id });
    } catch (e) {
      console.warn("XP award failed for addLead:", e);
    }

    return data.id;
  },

  updateLead: async (id: string, lead: Partial<Lead>) => {
    const { error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id);
    if (error) throw error;
  },

  deleteLead: async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  analyzeLeads: async (leads: Lead[]) => {
    // 1. ÇÖP VERİYİ TEMİZLE (Token tasarrufu)
    const strippedLeads = leads.map(l => ({ 
      isim: l.name, 
      tip: l.type, 
      durum: l.status, 
      not: l.notes 
    }));

    // 2. AI'A KESİN JSON EMRİ VER
    const prompt = `
      Aşağıdaki gayrimenkul leadlerini (müşterileri) analiz et.
      Yanıtını SADECE aşağıdaki JSON formatında ver, dışına çıkma:
      {
        "ozet": "Genel durumun 2 cümlelik özeti",
        "sicak_musteriler": ["Ahmet Bey (Alıcı)", "Ayşe Hanım (Satıcı)"],
        "aksiyon_plani": ["Ahmet Bey'i bugün ara", "Ayşe Hanım'a rapor gönder"]
      }
      
      Müşteriler: ${JSON.stringify(strippedLeads)}
    `;

    try {
      // 3. AI ÇAĞRISI (Backend'deki model adıyla uyumlu olmalı)
      const response: any = await generateContent(
        "gemini-2.5-flash", 
        prompt
      );

      // 4. JSON OBJESİNİ EKRANDA GÖSTERİLECEK METNE ÇEVİR
      // (response.text kullanmıyoruz çünkü artık direkt obje geliyor)
      if (!response || Object.keys(response).length === 0) return "Analiz yapılamadı.";

      let formattedAnalysis = `${response.ozet || ''}\n\n`;
      
      if (response.sicak_musteriler && response.sicak_musteriler.length > 0) {
        formattedAnalysis += `🔥 Öncelikli Müşteriler:\n- ${response.sicak_musteriler.join('\n- ')}\n\n`;
      }
      
      if (response.aksiyon_plani && response.aksiyon_plani.length > 0) {
        formattedAnalysis += `📋 Aksiyon Planı:\n- ${response.aksiyon_plani.join('\n- ')}`;
      }

      return formattedAnalysis.trim();

    } catch (error) {
      console.error("Lead analiz hatası:", error);
      return "Müşteri analizi şu an yapılamıyor.";
    }
  },
};
