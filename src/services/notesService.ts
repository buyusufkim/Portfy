import { UserNote } from '../types';
import { supabase } from '../lib/supabase';

export const notesService = {
  getNotes: async (): Promise<UserNote[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    return (data || []) as UserNote[];
  },

  addNote: async (note: Omit<UserNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        user_id: user.id,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  updateNote: async (id: string, data: Partial<UserNote>) => {
    const { error } = await supabase
      .from('notes')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },

  deleteNote: async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
