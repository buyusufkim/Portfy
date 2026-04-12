import { Building } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';

export const fieldVisitService = {
  getFieldVisits: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('field_visits')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Building[];
  },

  addVisit: async (visit: Omit<Building, 'id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('field_visits')
      .insert({
        ...visit,
        agent_id: userId,
        last_visit: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }
};
