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
      .eq('user_id', userId);
    return (data || []) as Task[];
  },

  addTask: async (task: Omit<Task, 'id' | 'user_id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: userId
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  createFollowupTaskIfMissing: async (task: Omit<Task, 'id' | 'user_id'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('lead_id', task.lead_id)
      .eq('due_date', task.due_date!)
      .eq('completed', false)
      .limit(1);

    if (existingTasks && existingTasks.length > 0) {
      return null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        user_id: userId
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
