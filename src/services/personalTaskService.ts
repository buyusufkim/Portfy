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
    
    return (data || []).map((t) => ({
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
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: updatedData, error } = await supabase
      .from('personal_tasks')
      .update({ is_completed })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();
    
    if (error) throw error;
    if (!updatedData) throw new Error('Task not found or permission denied');

    if (is_completed) {
      try {
        await gamificationService.earnXP('COMPLETE_BASIC_TASK', id);
      } catch (e) {
        console.warn("XP award failed for togglePersonalTask:", e);
      }
    }
  },

  updatePersonalTask: async (id: string, data: Partial<PersonalTask>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: updatedData, error } = await supabase
      .from('personal_tasks')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();
      
    if (error) throw error;
    if (!updatedData) throw new Error('Task not found or permission denied');
  },

  deletePersonalTask: async (id: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: deletedData, error } = await supabase
      .from('personal_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single();
      
    if (error) throw error;
    if (!deletedData) throw new Error('Task not found or permission denied');
  },
};
