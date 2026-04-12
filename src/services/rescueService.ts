import { RescueSession, RescueTask } from '../types';
import { supabase } from '../lib/supabase';
import { leadService } from './leadService';
import { propertyService } from './propertyService';

export const rescueService = {
  getRescueSession: async (): Promise<RescueSession | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const agentId = user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('rescue_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .maybeSingle();
    
    return data as RescueSession | null;
  },

  startRescueSession: async (): Promise<RescueSession> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = new Date().toISOString().split('T')[0];

    // Fetch some candidates for tasks
    const leads = await leadService.getLeads();
    const hotLeads = leads.filter(l => l.behavior_metrics?.is_hot);
    const properties = await propertyService.getProperties();
    const lowHealthProps = properties.filter(p => p.health_score < 80);

    const tasks: RescueTask[] = [];
    
    // 1. Call a hot lead
    if (hotLeads.length > 0) {
      tasks.push({
        id: 'r1',
        title: `${hotLeads[0].name} isimli sıcak müşteriyi ara`,
        type: 'call',
        estimated_minutes: 15,
        points: 50,
        is_completed: false,
        target_id: hotLeads[0].id
      });
    } else {
      tasks.push({
        id: 'r1',
        title: "Eski bir müşterine 'Nasılsınız?' mesajı at",
        type: 'call',
        estimated_minutes: 10,
        points: 30,
        is_completed: false
      });
    }

    // 2. Update a property
    if (lowHealthProps.length > 0) {
      tasks.push({
        id: 'r2',
        title: `"${lowHealthProps[0].title}" portföyünün notlarını güncelle`,
        type: 'update',
        estimated_minutes: 10,
        points: 40,
        is_completed: false,
        target_id: lowHealthProps[0].id
      });
    } else {
      tasks.push({
        id: 'r2',
        title: "Bir portföyüne yeni bir fotoğraf ekle",
        type: 'update',
        estimated_minutes: 15,
        points: 40,
        is_completed: false
      });
    }

    // 3. Quick CRM check
    tasks.push({
      id: 'r3',
      title: "Yarın için 1 yeni randevu planla",
      type: 'note',
      estimated_minutes: 15,
      points: 60,
      is_completed: false
    });

    const session: Omit<RescueSession, 'id'> = {
      agent_id: agentId,
      date: today,
      status: 'active',
      tasks,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour duration
    };

    const { data, error } = await supabase.from('rescue_sessions').insert(session).select().single();
    if (error) throw error;
    return data as RescueSession;
  },

  cancelRescueSession: async (sessionId: string) => {
    await supabase.from('rescue_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
  },

  completeRescueTask: async (sessionId: string, taskId: string) => {
    const { data: session } = await supabase
      .from('rescue_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (!session) return;
    
    const updatedTasks = (session.tasks as RescueTask[]).map(t => t.id === taskId ? { ...t, is_completed: true } : t);
    
    await supabase.from('rescue_sessions').update({ tasks: updatedTasks }).eq('id', sessionId);

    // If all completed, mark session as completed
    if (updatedTasks.every(t => t.is_completed)) {
      await supabase.from('rescue_sessions').update({ status: 'completed' }).eq('id', sessionId);
      // Award bonus points
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('uid', user.id).maybeSingle();
        if (profile) {
          const current = profile.total_xp || 0;
          await supabase.from('profiles').update({ total_xp: current + 150 }).eq('uid', user.id);
        }
      }
    }
  }
};
