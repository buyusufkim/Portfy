import { GoogleGenAI } from "@google/genai";
import { WhatsAppAnalysisResponse } from "../types/whatsapp";
import { WHATSAPP_ANALYSIS_SCHEMA, buildWhatsAppPrompt } from "../lib/whatsappSchema";
import { api } from "./api";
import { supabase } from "../lib/supabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const whatsappService = {
  analyzeConversation: async (text: string): Promise<WhatsAppAnalysisResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const prompt = buildWhatsAppPrompt(text);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // @ts-ignore - Gemini SDK schema type support
          responseSchema: WHATSAPP_ANALYSIS_SCHEMA
        }
      });

      const result = JSON.parse(response.text || '{}') as WhatsAppAnalysisResponse;
      result.raw_text = text;
      return result;
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
      notes: `WhatsApp Analizi: ${analysis.summary}\nBütçe: ${analysis.budget_signal}\nAciliyet: ${analysis.urgency}`
    });
  },

  createFollowUpTask: async (analysis: any) => {
    return api.addTask({
      title: `${analysis.customer_name} - Takip Araması`,
      type: 'Arama',
      time: analysis.follow_up_date,
      completed: false
    });
  }
};
