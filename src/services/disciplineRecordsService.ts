import { supabase } from '../lib/supabase';
import { DayClosure } from '../types';

export const disciplineRecordsService = {
  fetchMyDisciplineRecords: async (limit: number = 30): Promise<DayClosure[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('day_closure')
      .select('*')
      .eq('user_id', user.id)
      .order('closure_date', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code !== 'PGRST116') {
        throw error;
      }
      return [];
    }

    return (data as DayClosure[]) || [];
  }
};
