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

    try {
      await leadService.addLead({
        name: pin.title,
        phone: '', 
        type: pin.type === 'esnaf' ? 'Esnaf' : 'Bölge Kaydı',
        status: 'Aday',
        district: '', 
        notes: `Harita üzerinden otomatik eklendi. Adres: ${pin.address}. Not: ${pin.notes}`,
        created_at: new Date().toISOString() // EKLENDİ (TS2345 FIX)
      });
    } catch (e) {
      console.warn("CRM registration failed for addMapPin:", e);
    }

    return data.id;
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
  getCompetitorPulse: marketIntelligenceService.getCompetitorPulse
};