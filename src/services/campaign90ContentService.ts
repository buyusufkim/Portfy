import { supabase } from '../lib/supabase';
import { AdminCampaignDayContent } from './adminCampaign90Service';

export const campaign90ContentService = {
  async getPublishedDayContent(dayNumber: number): Promise<AdminCampaignDayContent | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return null;

      const res = await fetch(`/api/campaign90/day-content/${dayNumber}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      
      if (!res.ok) {
          return null; // Silent fallback
      }
      const json = await res.json();
      return json.content || null;
    } catch (e) {
      console.error("Failed to fetch published day content:", e);
      return null;
    }
  }
};
