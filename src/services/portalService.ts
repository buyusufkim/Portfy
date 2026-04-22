import { supabase } from '../lib/supabase';
import { Property, Task } from '../types';

export const portalService = {
  getPropertyData: async (propertyId: string) => {
    // 1. Mülk bilgilerini çek (RLS izin vermeli, genel select açık olmalı veya auth'suz erişim denenebilir)
    // Not: Normalde RLS mülk sahibine veya agent'a kısıtlıdır. 
    // Bu senaryoda public bir portal isteniyor, bu yüzden mülk id'sini bilmek yeterli sayılıyor (Shadow ID mantığı).
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*, profiles(display_name, email, phone)')
      .eq('id', propertyId)
      .single();

    if (propError) throw propError;

    // 2. İlgili görevleri (Arama, Randevu vb.) çek
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('property_id', propertyId)
      .eq('completed', true);

    if (taskError) throw taskError;

    const tks = (tasks || []) as Task[];
    
    return {
      property: property as Property & { profiles: any },
      stats: {
        calls: tks.filter(t => t.type === 'Arama').length,
        visits: tks.filter(t => t.type === 'Randevu' || t.type === 'Saha').length,
        daysOnMarket: Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24))
      },
      recentActivities: tks.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
    };
  }
};
