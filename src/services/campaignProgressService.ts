import { supabase } from '../lib/supabase';
import { CampaignTask } from '../types';

export type CampaignProgressType = 
  | 'crm_new_contacts'
  | 'buyer_records'
  | 'owner_contacts'
  | 'map_pins'
  | 'field_visits'
  | 'property_candidates'
  | 'properties_created'
  | 'followup_actions'
  | 'overdue_followups'
  | 'silent_lead_reactivations'
  | 'lead_activity_logs'
  | 'drip_tasks_completed'
  | 'open_lead_alerts_reviewed'
  | 'buyer_segments_updated'
  | 'hot_leads_touched'
  | 'post_showing_followups'
  | 'missing_decision_notes'
  | 'seller_motivation_notes'
  | 'cma_analysis_done'
  | 'portfolio_updated';

export interface CampaignTaskProgress {
  type: CampaignProgressType;
  current: number;
  target: number;
  label: string;
}

/**
 * Parses task title and description to detect if it requires progress tracking.
 */
export function getTaskProgressTarget(task: CampaignTask): CampaignTaskProgress | null {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  
  // Extract the first number found in the title/description
  const match = text.match(/(\d+)/);
  if (!match) return null;
  const target = parseInt(match[1], 10);
  if (isNaN(target) || target <= 0) return null;

  if (text.includes('crm kaydı') || text.includes("crm'e ekle") || text.includes('kişi ekle')) {
    return { type: 'crm_new_contacts', current: 0, target, label: 'CRM Kaydı' };
  }
  if (text.includes('alıcı') || text.includes('kiracı') || text.includes('alıcı kartı')) {
    return { type: 'buyer_records', current: 0, target, label: 'Alıcı/Kiracı' };
  }
  if (text.includes('mülk sahibi') || text.includes('satıcı')) {
    return { type: 'owner_contacts', current: 0, target, label: 'Mülk Sahibi' };
  }
  if (text.includes('saha noktası') || text.includes('bölgem') || text.includes('network noktası')) {
    return { type: 'map_pins', current: 0, target, label: 'Saha Noktası' };
  }
  if (text.includes('saha turu') || text.includes('saha ziyareti')) {
    return { type: 'field_visits', current: 0, target, label: 'Saha Ziyareti' };
  }
  if (text.includes('portföy adayı')) {
    return { type: 'property_candidates', current: 0, target, label: 'Portföy Adayı' };
  }
  if (text.includes('portföy ekle') || text.includes('mülk ekle')) {
    return { type: 'properties_created', current: 0, target, label: 'Yeni Portföy' };
  }

  if (text.includes('takip araması') || text.includes('takip mesajı') || text.includes('takip et') || text.includes('yeniden dokun')) {
    return { type: 'followup_actions', current: 0, target, label: 'Takip / Temas' };
  }
  if (text.includes('sessiz aday') || text.includes('sessiz müşteri') || text.includes('uyandır')) {
    return { type: 'silent_lead_reactivations', current: 0, target, label: 'Uyandırılan Aday' };
  }
  if (text.includes('geciken takip') || text.includes('takip tarihi geçmiş')) {
    return { type: 'overdue_followups', current: 0, target, label: 'Geciken Takip' };
  }
  if (text.includes('lead activity') || text.includes('görüşme notu') || text.includes('aktivite log')) {
    return { type: 'lead_activity_logs', current: 0, target, label: 'Aktivite Logu' };
  }
  if (text.includes('drip') || text.includes('damla') || text.includes('otomatik takip')) {
    return { type: 'drip_tasks_completed', current: 0, target, label: 'Drip Görevi' };
  }
  if (text.includes('alarm') || text.includes('uyarı') || text.includes('lead alert')) {
    return { type: 'open_lead_alerts_reviewed', current: 0, target, label: 'İncelenen Alarm' };
  }
  if (text.includes('gösterim sonrası') || text.includes('24 saat') || text.includes('24-saat') || text.includes('gösterim takibi')) {
    return { type: 'post_showing_followups', current: 0, target, label: 'Gösterim Takibi' };
  }
  if (text.includes('karar vermek için ne eksik') || text.includes('ne eksik')) {
    return { type: 'missing_decision_notes', current: 0, target, label: 'Eksik İhtiyaç Notu' };
  }
  if (text.includes('satıcı motivasyon') || text.includes('mülk sahibi notu') || text.includes('motivasyon')) {
    return { type: 'seller_motivation_notes', current: 0, target, label: 'Satıcı Motivasyonu' };
  }
  if (text.includes('cma') || text.includes('değer analizi')) {
    return { type: 'cma_analysis_done', current: 0, target, label: 'CMA / Değer Analizi' };
  }
  if (text.includes('portföy yenileme') || text.includes('portföy güncelleme')) {
    return { type: 'portfolio_updated', current: 0, target, label: 'Portföy Güncelleme' };
  }
  if (text.includes('a/b/c') || text.includes('segment') || text.includes('sıcak/ılık/soğuk')) {
    return { type: 'buyer_segments_updated', current: 0, target, label: 'Segment Güncellemesi' };
  }
  if (text.includes('sıcak aday') || text.includes('hot lead') || text.includes('a alıcı') || text.includes('sıcak alıcı')) {
    return { type: 'hot_leads_touched', current: 0, target, label: 'Sıcak Aday Teması' };
  }

  return null;
}

export async function getCampaignTaskProgress(userId: string, tasks: CampaignTask[], date: Date): Promise<Record<string, CampaignTaskProgress>> {
  if (!tasks || tasks.length === 0) return {};

  const progressMap: Record<string, CampaignTaskProgress> = {};
  const progressTypesToFetch = new Set<CampaignProgressType>();

  tasks.forEach(task => {
    const targetInfo = getTaskProgressTarget(task);
    if (targetInfo) {
      progressMap[task.id] = targetInfo;
      progressTypesToFetch.add(targetInfo.type);
    }
  });

  if (progressTypesToFetch.size === 0) {
    return progressMap;
  }

  // Determine today start and end in UTC for queries
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  // Prepare counts
  const counts: Partial<Record<CampaignProgressType, number>> = {};

  const promises: Promise<void>[] = [];

  // CRM New Contacts
  if (progressTypesToFetch.has('crm_new_contacts') || progressTypesToFetch.has('buyer_records') || progressTypesToFetch.has('owner_contacts')) {
    promises.push((async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, type, status, name, notes')
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso);
          
        if (!error && data) {
          if (progressTypesToFetch.has('crm_new_contacts')) {
            counts['crm_new_contacts'] = data.length;
          }
          if (progressTypesToFetch.has('buyer_records')) {
            counts['buyer_records'] = data.filter(d => {
              const text = `${d.type || ''} ${d.status || ''} ${d.name || ''} ${d.notes || ''}`.toLowerCase();
              return text.includes('alıcı') || text.includes('kiracı');
            }).length;
          }
          if (progressTypesToFetch.has('owner_contacts')) {
            counts['owner_contacts'] = data.filter(d => {
              const text = `${d.type || ''} ${d.status || ''} ${d.name || ''} ${d.notes || ''}`.toLowerCase();
              return text.includes('satıcı') || text.includes('mülk sahibi') || text.includes('owner');
            }).length;
          }
        }
      } catch (e) {
        console.error('Error fetching leads progress:', e);
      }
    })());
  }

  if (progressTypesToFetch.has('map_pins')) {
     promises.push((async () => {
      try {
        const { count, error } = await supabase
          .from('map_pins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso);
        if (!error) counts['map_pins'] = count || 0;
      } catch (e) {
        console.error('Error fetching map_pins progress:', e);
      }
     })());
  }

  if (progressTypesToFetch.has('field_visits')) {
    promises.push((async () => {
     try {
       const { count, error } = await supabase
         .from('field_visits')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', userId)
         .gte('created_at', startIso)
         .lte('created_at', endIso);
       if (!error) counts['field_visits'] = count || 0;
     } catch (e) {
       console.error('Error fetching field_visits progress:', e);
     }
    })());
 }

 if (progressTypesToFetch.has('properties_created') || progressTypesToFetch.has('property_candidates') || progressTypesToFetch.has('cma_analysis_done') || progressTypesToFetch.has('portfolio_updated')) {
    promises.push((async () => {
     try {
       const { data, error } = await supabase
         .from('properties')
         .select('id, created_at, updated_at, market_analysis')
         .eq('user_id', userId)
         .or(`created_at.gte.${startIso},updated_at.gte.${startIso}`);
         
       if (!error && data) {
         if (progressTypesToFetch.has('properties_created')) {
           counts['properties_created'] = data.filter(d => d.created_at && new Date(d.created_at) >= startOfDay).length;
         }
         if (progressTypesToFetch.has('property_candidates')) {
           counts['property_candidates'] = data.filter(d => d.created_at && new Date(d.created_at) >= startOfDay).length;
         }
         if (progressTypesToFetch.has('portfolio_updated')) {
           counts['portfolio_updated'] = data.filter(d => d.updated_at && new Date(d.updated_at) >= startOfDay).length;
         }
         if (progressTypesToFetch.has('cma_analysis_done')) {
           counts['cma_analysis_done'] = data.filter(d => {
             const isUpdatedToday = d.updated_at && new Date(d.updated_at) >= startOfDay;
             if (!isUpdatedToday || !d.market_analysis) return false;
             if (typeof d.market_analysis === 'string') return d.market_analysis.trim().length > 0;
             if (typeof d.market_analysis === 'object') return Object.keys(d.market_analysis).length > 0;
             return false;
           }).length;
         }
       }
     } catch (e) {
       console.error('Error fetching properties progress:', e);
     }
    })());
 }

  if (progressTypesToFetch.has('lead_activity_logs') || progressTypesToFetch.has('followup_actions')) {
    promises.push((async () => {
      try {
        const { data, error } = await supabase
          .from('lead_activity_log')
          .select('id, action_type')
          .eq('user_id', userId)
          .gte('happened_at', startIso)
          .lte('happened_at', endIso);
        if (!error && data) {
          if (progressTypesToFetch.has('lead_activity_logs')) counts['lead_activity_logs'] = data.length;
          if (progressTypesToFetch.has('followup_actions')) {
            counts['followup_actions'] = data.filter(d => 
              d.action_type === 'call' || d.action_type === 'message' || d.action_type === 'contact' || d.action_type === 'followup' || d.action_type === 'email' || d.action_type === 'whatsapp'
            ).length;
          }
        }
      } catch (e) {
        console.error('Error fetching lead_activity_log progress:', e);
      }
    })());
 }

 if (progressTypesToFetch.has('drip_tasks_completed') || progressTypesToFetch.has('followup_actions') || progressTypesToFetch.has('post_showing_followups')) {
    promises.push((async () => {
      try {
        let { data, error }: { data: any, error: any } = await supabase
          .from('tasks')
          .select('id, lead_id, is_drip, drip_type, title, notes, completed_at, updated_at')
          .eq('user_id', userId)
          .eq('completed', true)
          .gte('completed_at', startIso)
          .lte('completed_at', endIso);

        // Fallback for missing completed_at column error
        if (error && (error.code === 'PGRST204' || error.message?.includes('completed_at'))) {
           const fallbackCall = await supabase
              .from('tasks')
              .select('id, lead_id, is_drip, drip_type, title, notes, updated_at')
              .eq('user_id', userId)
              .eq('completed', true)
              .gte('updated_at', startIso)
              .lte('updated_at', endIso);
           data = fallbackCall.data;
           error = fallbackCall.error;
        }

        if (error) {
            console.error('Error fetching tasks progress fallback:', error.message);
        } else if (data) {
          if (progressTypesToFetch.has('drip_tasks_completed')) {
            counts['drip_tasks_completed'] = data.filter(d => d.is_drip || d.drip_type).length;
          }
          if (progressTypesToFetch.has('post_showing_followups')) {
            counts['post_showing_followups'] = data.filter(d => 
              d.lead_id && (d.title?.toLowerCase().includes('gösterim') || d.notes?.toLowerCase().includes('gösterim'))
            ).length;
          }
          if (progressTypesToFetch.has('followup_actions') && !counts['followup_actions']) {
            counts['followup_actions'] = data.filter(d => 
              d.lead_id && (d.is_drip || d.drip_type || (d.title && d.title.toLowerCase().includes('takip')) || (d.notes && d.notes.toLowerCase().includes('takip')))
            ).length;
          }
        }
      } catch(e) {
        console.error('Error fetching tasks progress:', e);
      }
    })());
 }

 if (progressTypesToFetch.has('buyer_segments_updated') || progressTypesToFetch.has('hot_leads_touched') || progressTypesToFetch.has('silent_lead_reactivations') || progressTypesToFetch.has('overdue_followups') || progressTypesToFetch.has('missing_decision_notes') || progressTypesToFetch.has('seller_motivation_notes')) {
    promises.push((async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', userId)
          .or(`last_contacted_at.gte.${startIso},updated_at.gte.${startIso},created_at.gte.${startIso}`);
          
        if (!error && data) {
          if (progressTypesToFetch.has('buyer_segments_updated')) {
             counts['buyer_segments_updated'] = data.filter(d => 
               d.updated_at && new Date(d.updated_at) >= startOfDay && (d.type || d.status || d.temperature)
             ).length;
          }
          if (progressTypesToFetch.has('hot_leads_touched')) {
             counts['hot_leads_touched'] = data.filter(d => {
               const isTouchedToday = d.last_contacted_at && new Date(d.last_contacted_at) >= startOfDay;
               const tempStr = `${d.temperature || ''} ${d.status || ''} ${d.type || ''}`.toLowerCase();
               const isHot = tempStr.includes('hot') || tempStr.includes('sıcak') || tempStr.includes('sicak');
               return isTouchedToday && isHot;
             }).length;
          }
          if (progressTypesToFetch.has('missing_decision_notes')) {
            counts['missing_decision_notes'] = data.filter(d => {
              const isUpdatedToday = d.updated_at && new Date(d.updated_at) >= startOfDay;
              return isUpdatedToday && (d.notes && (d.notes.toLowerCase().includes('eksik') || d.notes.toLowerCase().includes('karar') || d.notes.toLowerCase().includes('neden')));
            }).length;
          }
          if (progressTypesToFetch.has('seller_motivation_notes')) {
            counts['seller_motivation_notes'] = data.filter(d => {
              const isUpdatedToday = d.updated_at && new Date(d.updated_at) >= startOfDay;
              return isUpdatedToday && d.type === 'seller' && d.notes && d.notes.length > 10;
            }).length;
          }
          if (progressTypesToFetch.has('silent_lead_reactivations')) {
             counts['silent_lead_reactivations'] = data.filter(d => {
               const isTouchedToday = d.last_contacted_at && new Date(d.last_contacted_at) >= startOfDay;
               const isAtRisk = (d.silence_risk_level && d.silence_risk_level !== 'none') || (d.forget_protection_state && d.forget_protection_state !== 'safe');
               return isTouchedToday && isAtRisk;
             }).length;
          }
          if (progressTypesToFetch.has('overdue_followups')) {
             counts['overdue_followups'] = data.filter(d => {
               return d.last_contacted_at && new Date(d.last_contacted_at) >= startOfDay;
             }).length;
          }
        }
      } catch (e) {
        console.error('Error fetching leads updates progress:', e);
      }
    })());
 }

 if (progressTypesToFetch.has('open_lead_alerts_reviewed')) {
    promises.push((async () => {
      try {
        const { data, error } = await supabase
          .from('lead_alerts')
          .select('*')
          .eq('user_id', userId)
          .or(`resolved_at.gte.${startIso},last_seen_at.gte.${startIso}`);
        if (!error && data) {
           counts['open_lead_alerts_reviewed'] = data.length;
        }
      } catch(e) {
        console.error('Error fetching lead_alerts progress:', e);
      }
    })());
 }

 await Promise.all(promises);

  // Apply counts to progressMap
  Object.keys(progressMap).forEach(taskId => {
    const prog = progressMap[taskId];
    prog.current = counts[prog.type] || 0;
  });

  return progressMap;
}
