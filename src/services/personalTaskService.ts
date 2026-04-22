import { PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { gamificationService } from './gamificationService';

export const personalTaskService = {
  getPersonalTasks: async (): Promise<PersonalTask[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return (data || []).map((t: any) => ({
      ...t,
      is_completed: t.is_completed
    })) as PersonalTask[];
  },

  addPersonalTask: async (task: Omit<PersonalTask, 'id' | 'user_id' | 'created_at'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        ...task,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  togglePersonalTask: async (id: string, is_completed: boolean) => {
    const { error } = await supabase
      .from('personal_tasks')
      .update({ is_completed })
      .eq('id', id);
    if (error) throw error;

    if (is_completed) {
      try {
        await gamificationService.earnXP('COMPLETE_BASIC_TASK', id);
      } catch (e) {
        console.warn("XP award failed for togglePersonalTask:", e);
      }
    }
  },

  updatePersonalTask: async (id: string, data: Partial<PersonalTask>) => {
    const { error } = await supabase
      .from('personal_tasks')
      .update(data)
      .eq('id', id);
    if (error) throw error;
  },

  deletePersonalTask: async (id: string) => {
    const { error } = await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
