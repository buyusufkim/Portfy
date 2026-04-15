import { Building } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { leadService } from './leadService';

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

    // Automatically register in CRM
    try {
      await leadService.addLead({
        name: visit.address.split(',')[0], // Use first part of address as name
        phone: '',
        type: 'Saha Ziyareti',
        status: 'Aday',
        district: visit.district,
        notes: `Saha ziyareti üzerinden otomatik eklendi. Durum: ${visit.status}. Not: ${visit.notes}`
      });
    } catch (e) {
      console.warn("CRM registration failed for addVisit:", e);
    }

    return data.id;
  }
};
