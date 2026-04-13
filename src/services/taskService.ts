import { Task, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { gamificationService } from './gamificationService';

export const taskService = {
  getTasks: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', userId);
    return (data || []) as Task[];
  },

  addTask: async (task: Omit<Task, 'id' | 'agent_id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        agent_id: userId
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  updateTaskStatus: async (taskId: string, completed: boolean) => {
    await supabase.from('tasks').update({ completed }).eq('id', taskId);
    
    if (completed) {
      try {
        await gamificationService.earnXP('COMPLETE_BASIC_TASK');
      } catch (e) {
        console.warn("XP award failed for updateTaskStatus:", e);
      }
    }
  },
};
