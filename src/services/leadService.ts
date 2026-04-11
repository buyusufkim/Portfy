import { Lead } from '../types';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";
import { getUserId } from './core/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const leadService = {
  getLeads: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Lead[];
  },

  addLead: async (lead: Omit<Lead, 'id' | 'agent_id' | 'last_contact'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...lead,
        agent_id: userId,
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
    return data.id;
  },

  analyzeLeads: async (leads: Lead[]) => {
    const prompt = `
      Aşağıdaki gayrimenkul leadlerini analiz et ve bir emlak danışmanı için stratejik öneriler sun.
      Hangi leadler daha sıcak? Hangi leadler için ne yapılmalı?
      Kısa, öz ve aksiyon odaklı bir analiz yap.
      Leadler: ${JSON.stringify(leads)}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  },
};
