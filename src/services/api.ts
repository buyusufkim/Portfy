import { Lead, Task, Building, Property, DashboardStats, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, PropertySyncLink, PriceHistory, GamifiedTask, UserStats, DailyMomentum, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, CoachInsight, MapPin, UserNote, PersonalTask, DailyStats } from '../types';
import { supabase } from '../lib/supabase';

import { getUserId, getTodayStr } from './core/utils';

import { leadService } from './leadService';
import { propertyService } from './propertyService';
import { taskService } from './taskService';
import { profileService } from './profileService';
import { gamificationService } from './gamificationService';
import { aiService } from './aiService';
import { notesService } from './notesService';
import { personalTaskService } from './personalTaskService';
import { rescueService } from './rescueService';
import { missedOpportunityService } from './missedOpportunityService';
import { voiceService } from './voiceService';
import { coachService } from './coachService';
import { fieldVisitService } from './fieldVisitService';
import { whatsappService } from './whatsappService';
import { marketIntelligenceService } from './marketIntelligenceService';
import { momentumOsService } from './momentumOsService';

// VITE ENV üzerinden API URL alınıyor, yoksa fallback olarak boş string bırakılıyor.
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  // Momentum OS
  momentumOs: momentumOsService,

  getLiveMarketAnalysis: async (property: Partial<Property>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/api/market/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          city: property.address?.city || 'Kayseri',
          district: property.address?.district || 'Talas',
          neighborhood: property.address?.neighborhood || '',
          propertyType: property.type || 'Konut',
          m2: property.details?.brut_m2 || 100
        }),
      });

      if (!response.ok) throw new Error('Piyasa verisi çekilemedi');
      return await response.json();
    } catch (error) {
      console.error('Live Market Fetch Error:', error);
      throw error;
    }
  },

  // Lead / Aday Yönetimi
  getLeads: leadService.getLeads,
  addLead: leadService.addLead,
  updateLead: leadService.updateLead,
  deleteLead: leadService.deleteLead,
  analyzeLeads: leadService.analyzeLeads,
  importLeadFromText: whatsappService.importLeadFromText,

  // Portföy Yönetimi
  getProperties: propertyService.getProperties,
  addProperty: propertyService.addProperty,
  updatePropertyStatus: propertyService.updatePropertyStatus,
  updateProperty: propertyService.updateProperty,
  deleteProperty: propertyService.deleteProperty,
  uploadPropertyImage: propertyService.uploadPropertyImage,
  calculatePropertyScores: propertyService.calculatePropertyScores,

  // AI İçerik Üretimi
  generatePropertyContent: propertyService.generatePropertyContent,
  generateInstagramCaptions: propertyService.generateInstagramCaptions,
  generateWhatsAppMessages: propertyService.generateWhatsAppMessages,
  generateMarketingModule: propertyService.generateMarketingModule,
  getMarketingOutput: propertyService.getMarketingOutput,
  saveMarketingOutput: propertyService.saveMarketingOutput,

  // sahibinden.com Entegrasyonu
  connectSahibinden: propertyService.connectSahibinden,
  getBrokerAccount: propertyService.getBrokerAccount,
  getExternalListings: propertyService.getExternalListings,
  syncExternalListings: propertyService.syncExternalListings,
  linkPropertyToExternal: propertyService.linkPropertyToExternal,
  getSyncLink: propertyService.getSyncLink,
  importListingFromUrl: propertyService.importListingFromUrl,

  // Görev Yönetimi
  getTasks: taskService.getTasks,
  addTask: taskService.addTask,
  createFollowupTaskIfMissing: taskService.createFollowupTaskIfMissing,
  updateTaskStatus: taskService.updateTaskStatus,

  // Gamification
  getDailyGamifiedTasks: gamificationService.getDailyGamifiedTasks,
  completeGamifiedTask: gamificationService.completeGamifiedTask,
  verifyGamifiedTask: gamificationService.verifyGamifiedTask,
  updateGamifiedTask: gamificationService.updateGamifiedTask,

  // Kişisel Görevler
  getPersonalTasks: personalTaskService.getPersonalTasks,
  addPersonalTask: personalTaskService.addPersonalTask,
  togglePersonalTask: personalTaskService.togglePersonalTask,
  updatePersonalTask: personalTaskService.updatePersonalTask,
  deletePersonalTask: personalTaskService.deletePersonalTask,

  // Profil Verileri
  getProfile: profileService.getProfile,
  updateProfile: profileService.updateProfile,
  earnXP: gamificationService.earnXP,
  getDailyStats: profileService.getDailyStats,
  startDay: profileService.startDay,
  endDay: profileService.endDay,
  getDailyRadar: aiService.getDailyRadar,
  getGamifiedStats: gamificationService.getGamifiedStats,
  getAICoachInsight: coachService.getQuickTip,

  // Dashboard Verileri
  getDashboardStats: async (): Promise<DashboardStats> => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const agentId = userId;

    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId);
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const props = (properties || []) as Property[];

    const estimatedRevenue = props.reduce((acc, p) => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
      const commission = (p.price * p.commission_rate) / 100;
      const probability = p.sale_probability || 0.5;
      return acc + (commission * probability);
    }, 0);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    const tks = (tasks || []) as Task[];
    const completedTasks = tks.filter(t => t.completed).length;
    const totalTasks = tks.length;
    const disciplineScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const today = getTodayStr();
    const callsToday = tks.filter(t => t.type === 'Arama' && t.completed).length;
    const appointmentsToday = tks.filter(t => t.type === 'Randevu' && t.completed).length;

    const aiInsight = await aiService.getDashboardInsight(props.length, leadsCount || 0, disciplineScore);

    return { 
      calls: callsToday, 
      appointments: appointmentsToday, 
      exclusive: props.filter(p => p.status === 'Yayında').length, 
      target_progress: Math.min(100, Math.round((completedTasks / (totalTasks || 1)) * 100)),
      active_properties: props.length,
      total_leads: leadsCount || 0,
      total_properties: props.length,
      estimated_revenue: estimatedRevenue,
      discipline_score: disciplineScore,
      ai_insight: aiInsight
    };
  },

  // Map Pins
  getMapPins: async (): Promise<MapPin[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('map_pins')
      .select('*')
      .eq('user_id', userId);
    return (data || []) as MapPin[];
  },

  addMapPin: async (pin: Omit<MapPin, 'id' | 'user_id' | 'created_at'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('map_pins')
      .insert({
        ...pin,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;

    let crmSuccess = false;
    let crmError: string | undefined = undefined;

    if (pin.add_to_crm) {
      try {
        let status: 'Aday' | 'Sıcak' | 'Yetki Alındı' | 'Pasif' | 'Soğuk' | 'Takipte' | 'Kapalı' = 'Takipte';
        if (pin.potential === 'Sıcak' || pin.potential === 'Yüksek') status = 'Sıcak';
        else if (pin.potential === 'Düşük') status = 'Soğuk';
        
        const newLead = await leadService.addLead({
          name: pin.contact_name || pin.title,
          phone: pin.phone || '', 
          type: 'Bölge Network',
          status,
          district: '', 
          notes: `[Sistem: Bölgem Radar üzerinden eklendi]\nBağlantı ID: ${data.id}\nPotansiyel: ${pin.potential || 'Belirtilmedi'}\nİlişki: ${pin.relationship_level || 'Atanmadı'}\nAdres: ${pin.address || ''}\n\n${pin.notes || ''}`,
          next_followup_at: pin.next_contact_date || pin.followup_date || undefined
        });
        await api.updateMapPin(data.id, { crm_lead_id: newLead.id });
        crmSuccess = true;
      } catch (e) {
        console.warn("CRM registration failed for addMapPin:", e);
        crmError = e instanceof Error ? e.message : 'Bilinmeyen hata';
      }
    }

    return { id: data.id, crmSuccess, crmError };
  },

  convertPinToLead: async (pin: MapPin) => {
    let status: 'Aday' | 'Sıcak' | 'Yetki Alındı' | 'Pasif' | 'Soğuk' | 'Takipte' | 'Kapalı' = 'Takipte';
    if (pin.potential === 'Sıcak' || pin.potential === 'Yüksek') status = 'Sıcak';
    else if (pin.potential === 'Düşük') status = 'Soğuk';
    
    const newLead = await leadService.addLead({
      name: pin.contact_name || pin.title,
      phone: pin.phone || '', 
      type: 'Bölge Network',
      status,
      district: '', 
      notes: `[Sistem: Bölgem Radar üzerinden dönüştürüldü]\nBağlantı ID: ${pin.id}\nPotansiyel: ${pin.potential || 'Belirtilmedi'}\nİlişki: ${pin.relationship_level || 'Atanmadı'}\nAdres: ${pin.address || ''}\n\n${pin.notes || ''}`,
      next_followup_at: pin.next_contact_date || pin.followup_date || undefined
    });
    await api.updateMapPin(pin.id, { crm_lead_id: newLead.id });
  },

  updateMapPin: async (pinId: string, updates: Partial<Omit<MapPin, 'id' | 'user_id' | 'created_at'>>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('map_pins')
      .update(updates)
      .eq('id', pinId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  addRegionTask: async (pin: MapPin, title: string, dueDate: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: title,
        type: 'Saha/Bölge',
        priority: pin.potential === 'Sıcak' || pin.potential === 'Yüksek' ? 'high' : 'medium',
        due_date: dueDate,
        notes: `Bağlantı: ${pin.title}\nAdres: ${pin.address}\nNot: ${pin.notes || ''}`,
        source: 'bolgem',
        metadata: { 
          region_pin_id: pin.id,
          contact_name: pin.contact_name || pin.title,
          category: pin.type,
          potential: pin.potential,
          relationship_level: pin.relationship_level
        }
      })
      .select()
      .single();
    
    if (error) throw error;

    if (pin.kind === 'network_contact') {
      await api.updateMapPin(pin.id, { next_contact_date: dueDate });
    } else {
      await api.updateMapPin(pin.id, { followup_date: dueDate });
    }

    return data;
  },

  // Saha Ziyaretleri
  getFieldVisits: fieldVisitService.getFieldVisits,
  addVisit: fieldVisitService.addVisit,

  // Region Efficiency Analysis
  getRegionEfficiencyScores: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const agentId = user.id;

    const [props, leads] = await Promise.all([
      api.getProperties(),
      api.getLeads()
    ]);

    const regionStats: Record<string, { leads: number, properties: number, sales: number }> = {};

    leads.forEach(l => {
      const d = l.district || 'Bilinmiyor';
      if (!regionStats[d]) regionStats[d] = { leads: 0, properties: 0, sales: 0 };
      regionStats[d].leads++;
    });

    props.forEach(p => {
      const d = p.address.district || 'Bilinmiyor';
      if (!regionStats[d]) regionStats[d] = { leads: 0, properties: 0, sales: 0 };
      regionStats[d].properties++;
      if (p.status === 'Satıldı') regionStats[d].sales++;
    });

    return Object.entries(regionStats).map(([district, stats]) => {
      const score = (stats.leads * 10) + (stats.properties * 20) + (stats.sales * 50);
      return {
        district,
        score: Math.min(100, score),
        ...stats
      };
    }).sort((a, b) => b.score - a.score);
  },

  // Notlar ve Kişisel Görevler
  getNotes: notesService.getNotes,
  addNote: notesService.addNote,
  updateNote: notesService.updateNote,
  deleteNote: notesService.deleteNote,

  // Mesaj Şablonları
  getMessageTemplates: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id);
    return (data || []) as MessageTemplate[];
  },

  addMessageTemplate: async (template: Omit<MessageTemplate, 'id' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        ...template,
        user_id: user.id
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },

  deleteMessageTemplate: async (id: string) => {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Rescue Mode (Günü Kurtar)
  getRescueSession: rescueService.getRescueSession,
  startRescueSession: rescueService.startRescueSession,
  cancelRescueSession: rescueService.cancelRescueSession,
  completeRescueTask: rescueService.completeRescueTask,

  getMissedOpportunities: missedOpportunityService.getMissedOpportunities,

  parseVoiceCommand: voiceService.parseVoiceCommand,

  getCoachInsights: coachService.getSimpleInsight,
  getDetailedCoachInsight: coachService.getDetailedInsight,
  getCompetitorPulse: marketIntelligenceService.getCompetitorPulse,

  // Admin V3 Features
  getAdminUserNotes: async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/user-notes/${userId}`, {
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Notlar çekilemedi');
    return await response.json();
  },
  createAdminUserNote: async (userId: string, note: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/user-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ userId, note })
    });
    if (!response.ok) throw new Error('Not eklenemedi');
    return await response.json();
  },
  deleteAdminUserNote: async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/user-notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Not silinemedi');
    return await response.json();
  },
  getAdminAnnouncements: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/announcements`, {
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Duyurular çekilemedi');
    return await response.json();
  },
  createAdminAnnouncement: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Duyuru oluşturulamadı');
    return await response.json();
  },
  updateAdminAnnouncement: async (id: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Duyuru güncellenemedi');
    return await response.json();
  },
  deleteAdminAnnouncement: async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Duyuru silinemedi');
    return await response.json();
  },
  getAdminSupportTickets: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/support-tickets`, {
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Talepler çekilemedi');
    return await response.json();
  },
  updateAdminSupportTicket: async (id: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/support-tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Talep güncellenemedi');
    return await response.json();
  },
  getAdminAuditLogs: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Loglar çekilemedi');
    return await response.json();
  },
  getAdminSettings: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/settings`, {
      headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
    });
    if (!response.ok) throw new Error('Ayarlar çekilemedi');
    return await response.json();
  },
  updateAdminSettings: async (settings: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/update-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ settings })
    });
    if (!response.ok) throw new Error('Ayarlar güncellenemedi');
    return await response.json();
  },
  adminCreateTaskTemplate: async (data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/task-templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  adminUpdateTaskTemplate: async (id: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/task-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  adminDeleteTaskTemplate: async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/task-templates/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.access_token || ''}` },
    });
    if (!response.ok) throw new Error(await response.text());
  },
  adminResetToday: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${API_URL}/api/ai/admin/reset-today`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
       const err = await response.json().catch(() => ({error: "Sıfırlama işlemi başarısız"}));
       throw new Error(err.error || err.message || "Sıfırlama işlemi başarısız");
    }
    return response.json();
  }
};