import { WhatsAppAnalysisResponse } from "../types/whatsapp";
import { WHATSAPP_ANALYSIS_SCHEMA, buildWhatsAppPrompt } from "../lib/whatsappSchema";
import { api } from "./api";
import { supabase } from "../lib/supabase";
import { generateContent } from '../lib/aiClient';

export const whatsappService = {
  analyzeConversation: async (text: string): Promise<WhatsAppAnalysisResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const prompt = buildWhatsAppPrompt(text);

    try {
      // generateContent artık doğrudan backend'den parse edilmiş JSON objesi dönüyor!
      const response = await generateContent(
        "gemini-2.0-flash", // Backend'deki modele uyumlu
        prompt,
        {
          // @ts-ignore
          responseSchema: WHATSAPP_ANALYSIS_SCHEMA,
          responseMimeType: "application/json"
        }
      );

      // JSON.parse ÇÖPE GİTTİ! Gelen response zaten hazır obje.
      return response as WhatsAppAnalysisResponse;

    } catch (error) {
      console.error("WhatsApp Analysis Service Error:", error);
      throw new Error("WhatsApp analizi şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.");
    }
  },

  addToCRM: async (analysis: any) => {
    return api.addLead({
      name: analysis.customer_name,
      phone: "Bilinmiyor",
      type: analysis.customer_type,
      status: analysis.interest_level === 'Kritik' || analysis.interest_level === 'Yüksek' ? 'Sıcak' : 'Aday',
      district: analysis.extracted_details.location_preference || "Bilinmiyor",
      notes: `WhatsApp Analizi: ${analysis.summary}\nBütçe: ${analysis.budget_signal}\nAciliyet: ${analysis.urgency}`,
      created_at: new Date().toISOString() // EKLENDİ (TS2345 FIX)
    });
  },

  createFollowUpTask: async (analysis: any) => {
    return api.addTask({
      title: `${analysis.customer_name} - Takip Araması`,
      type: 'Arama',
      time: analysis.follow_up_date,
      completed: false
    });
  },

  importLeadFromText: async (text: string) => {
    const response = await generateContent(
      "gemini-2.0-flash", // Backend'deki modele uyumlu
      `Aşağıdaki WhatsApp mesajından emlak müşterisi bilgilerini çıkar. 
      JSON formatında şu alanları döndür: name (isim), phone (telefon), type (Alıcı/Satıcı/Kiracı/Kiralayan), status (Aday/Sıcak/Pasif), notes (notlar).
      
      Mesaj: "${text}"`,
      {
        responseMimeType: "application/json",
        // @ts-ignore
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            type: { type: "string", enum: ['Alıcı', 'Satıcı', 'Kiracı', 'Kiralayan'] },
            status: { type: "string", enum: ['Aday', 'Sıcak', 'Pasif'] },
            notes: { type: "string" }
          },
          required: ["name", "phone", "type", "status", "notes"]
        }
      }
    );
    
    // Gelen yanıta da created_at ekleyerek paslıyoruz.
    return api.addLead({
      ...response,
      created_at: new Date().toISOString()
    });
  }
};