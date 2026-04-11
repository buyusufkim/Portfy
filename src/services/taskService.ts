import { Task, PersonalTask } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';

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
  },

  getPersonalTasks: async (): Promise<PersonalTask[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false });
    
    return (data || []).map((t: any) => ({
      ...t,
      is_completed: t.is_completed
    })) as PersonalTask[];
  },

  addPersonalTask: async (task: Omit<PersonalTask, 'id' | 'agent_id' | 'created_at'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        ...task,
        agent_id: userId,
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
