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

export const api = {
  // Lead / Aday Yönetimi
  getLeads: leadService.getLeads,
  addLead: leadService.addLead,
  analyzeLeads: leadService.analyzeLeads,
  importLeadFromText: whatsappService.importLeadFromText,

  // Portföy Yönetimi
  getProperties: propertyService.getProperties,
  addProperty: propertyService.addProperty,
  updatePropertyStatus: propertyService.updatePropertyStatus,
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
  completeMorningRitual: profileService.completeMorningRitual,
  completeEveningRitual: profileService.completeEveningRitual,
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
      .eq('agent_id', agentId);
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    const props = (properties || []) as Property[];

    // Calculate Estimated Revenue with Probability Weighting
    const estimatedRevenue = props.reduce((acc, p) => {
      if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
      const commission = (p.price * p.commission_rate) / 100;
      const probability = p.sale_probability || 0.5;
      return acc + (commission * probability);
    }, 0);

    // Calculate Discipline Score based on tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('agent_id', agentId);
    
    const tks = (tasks || []) as Task[];
    const completedTasks = tks.filter(t => t.completed).length;
    const totalTasks = tks.length;
    const disciplineScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Calculate real stats from tasks
    const today = getTodayStr();
    const callsToday = tks.filter(t => t.type === 'Arama' && t.completed).length;
    const appointmentsToday = tks.filter(t => t.type === 'Randevu' && t.completed).length;

    // Generate AI Insight via Gemini
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
      .eq('agent_id', userId);
    return (data || []) as MapPin[];
  },

  addMapPin: async (pin: Omit<MapPin, 'id' | 'agent_id' | 'created_at'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('map_pins')
      .insert({
        ...pin,
        agent_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
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
      // Score calculation: Leads (10 pts) + Properties (20 pts) + Sales (50 pts)
      const score = (stats.leads * 10) + (stats.properties * 20) + (stats.sales * 50);
      return {
        district,
        score: Math.min(100, score), // Cap at 100 for display
        ...stats
      };
    }).sort((a, b) => b.score - a.score);
  },

  // Profil Güncelleme
  // (Moved to profileService)

  // Notlar ve Kişisel Görevler
  getNotes: notesService.getNotes,
  addNote: notesService.addNote,
  updateNote: notesService.updateNote,
  deleteNote: notesService.deleteNote,

  // Habit Loop & Rituals
  // (Moved to profileService)

  // Mesaj Şablonları
  getMessageTemplates: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('agent_id', user.id);
    return (data || []) as MessageTemplate[];
  },

  addMessageTemplate: async (template: Omit<MessageTemplate, 'id' | 'agent_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        ...template,
        agent_id: user.id
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

  // Gamification MVP
  // (Moved to profileService)

  // Rescue Mode (Günü Kurtar)
  getRescueSession: rescueService.getRescueSession,
  startRescueSession: rescueService.startRescueSession,
  cancelRescueSession: rescueService.cancelRescueSession,
  completeRescueTask: rescueService.completeRescueTask,

  getMissedOpportunities: missedOpportunityService.getMissedOpportunities,

  parseVoiceCommand: voiceService.parseVoiceCommand,

  getCoachInsights: coachService.getSimpleInsight,
  getDetailedCoachInsight: coachService.getDetailedInsight
};
