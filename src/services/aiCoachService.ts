import { AICoachResponse } from "../types/ai";
import { AI_COACH_SCHEMA, buildCoachPrompt } from "../lib/aiPromptBuilder";
import { api } from "./api";
import { supabase } from "../lib/supabase";
import { generateContent } from '../lib/aiClient';

export const aiCoachService = {
  getCoachInsight: async (): Promise<AICoachResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [profile, leads, properties, tasks, missedOpportunities] = await Promise.all([
      api.getProfile(),
      api.getLeads(),
      api.getProperties(),
      api.getTasks(),
      api.getMissedOpportunities()
    ]);

    const prompt = buildCoachPrompt({
      profile,
      leads,
      properties,
      tasks,
      missedOpportunities
    });

    try {
      const response = await generateContent(
        "gemini-3-flash-preview",
        prompt,
        {
          responseMimeType: "application/json",
          // @ts-ignore - Gemini SDK schema type support
          responseSchema: AI_COACH_SCHEMA
        }
      );

      const result = JSON.parse(response.text || '{}') as AICoachResponse;
      return result;
    } catch (error) {
      console.error("AI Coach Service Error:", error);
      throw new Error("AI Koç şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
    }
  },

  convertActionToTask: async (action: any) => {
    return api.addTask({
      title: action.title,
      type: action.type === 'call' ? 'Arama' : action.type === 'visit' ? 'Saha' : 'Randevu',
      time: new Date().toISOString(),
      completed: false
    });
  }
};
