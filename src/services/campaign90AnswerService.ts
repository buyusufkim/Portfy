import { supabase } from '../lib/supabase';

export const campaign90AnswerService = {
  async fetchMyCampaign90DayAnswers(dayNumber: number): Promise<Record<string, string> | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return null;

      const res = await fetch(`/api/campaign90/day-answers/${dayNumber}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) return null;
      const json = await res.json();
      return json.answers || null;
    } catch (e) {
      console.error("Failed to fetch day answers:", e);
      return null;
    }
  },

  async saveMyCampaign90DayAnswers(dayNumber: number, answers: Record<string, string>): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return false;

      const res = await fetch(`/api/campaign90/day-answers/${dayNumber}`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers })
      });
      
      return res.ok;
    } catch (e) {
      console.error("Failed to save day answers:", e);
      return false;
    }
  }
};
