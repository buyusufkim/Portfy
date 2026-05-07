import React from 'react';

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start_date: string;
  metrics: Record<string, unknown>;
  generated_at: string;
}

export interface ContentCalendar {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  status: string; // 'planned' | 'completed' | 'impact_entered'
  property_id?: string;
  target_type?: 'property' | 'lead' | 'region';
  target_id?: string;
  scheduled_for: string;
  content_text: string;
  media_urls: string[];
  impact_score?: number;
}

export interface MicroGoal {
  id: string;
  user_id: string;
  title: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  deadline: string;
  status: string;
}

export interface TerritoryPlan {
  id: string;
  user_id: string;
  name: string;
  district?: string;
  priority_score?: number;
  visit_target?: number;
  week_start_date?: string;
  boundaries: Record<string, unknown>;
  strategy_notes: string;
  status: string;
}

export interface Referral {
  id: string;
  user_id: string;
  referrer_name: string;
  referred_name: string;
  referred_email?: string;
  contact_info: string;
  status: string;
  reward_status: string;
  created_at?: string;
}

export interface UserActivation {
  id: string;
  user_id: string;
  start_date: string;
  completed_steps: string[];
  is_completed: boolean;
}

export interface PortalTrafficLog {
  id: string;
  property_id: string;
  user_id: string;
  viewer_ip: string;
  viewed_at: string;
  action: string;
  property?: { title: string };
}

export interface DailyRitual {
  id: string;
  user_id: string;
  ritual_date: string;
  morning_plan_completed_at?: string;
  morning_notes?: string;
  evening_closing_completed_at?: string;
  evening_notes?: string;
}

// Bütün sayfaların (CRM, Saha, vs) beklediği tam statü listesi
export type LeadStatus = 'Aday' | 'Sıcak' | 'Yetki Alındı' | 'Pasif' | 'Soğuk' | 'Takipte' | 'Kapalı';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  avatar_url?: string;
  avatar_color?: string;
  bio?: string;
  city?: string;
  district?: string;
  subscription_type: 'none' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month';
  subscription_end_date: string | null;
  role: 'agent' | 'admin' | 'super_admin';
  notification_settings?: {
    push: boolean;
    email: boolean;
    time: string;
  };
  has_seen_onboarding?: boolean;
  has_seen_tour?: boolean;
  region?: {
    city: string;
    district: string;
    neighborhoods: string[];
  };
  active_modules?: string[];
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  broker_level: number;
  last_ritual_completed_at?: string;
  last_day_started_at?: string;
  streak_freeze_count: number;
  last_active_date?: string;
  created_at: string;
  updated_at: string;
  tier: 'free' | 'pro' | 'elite' | 'master' | 'trial';
  ai_tokens_used: number;
  ai_token_limit?: number;
  title?: string;
  company_name?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  expertise_areas?: string[];
  working_style?: string[];
  preferred_start_time?: string;
  work_start_time?: string;
  work_end_time?: string;
  ai_coach_tone?: string;
  notification_preference?: string;
}

export interface PackageRequest {
  id: string;
  user_id: string;
  requested_package: string;
  requested_duration: '1-month' | '3-month' | '6-month' | '12-month';
  amount_numeric: number;
  amount_text: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  user_note?: string;
  admin_note?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string;
    email: string;
    phone?: string;
    tier?: string;
    subscription_type?: string;
    subscription_end_date?: string;
  };
}

export interface WorkDisciplineLog {
  id: string;
  user_id: string;
  log_date: string;
  type: 'early_start' | 'early_close' | 'missed_close_penalty';
  scheduled_time?: string;
  actual_time: string;
  reason?: string;
  xp_delta?: number;
  metadata?: any;
  created_at: string;
}

export interface GlobalSettings {
  id: string;
  app_name: string;
  theme_color: string;
  maintenance_mode: boolean;
  global_modules: {
    crm: boolean;
    tasks: boolean;
    map: boolean;
    ai: boolean;
    gamification: boolean;
  };
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  price_numeric: number;
  price_text: string;
  duration_months: number;
  interval?: 'monthly' | 'yearly';
  tier?: 'free' | 'pro' | 'elite' | 'master';
  is_active: boolean;
  features: string[];
  badge?: string;
  stripe_price_id?: string;
  description?: string;
}

export interface TaskTemplate {
  id: string;
  category: 'listing' | 'sale' | 'prospecting' | 'ritual';
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  points?: number;
  auto_verify?: boolean;
  recurrence_type?: 'once' | 'daily' | 'interval' | 'weekly' | 'monthly';
  interval_days?: number | null;
  recurrence_days?: number[];
  day_of_month?: number | null;
  start_date?: string;
  end_date?: string | null;
  target_scope?: 'all' | 'free' | 'trial' | 'master';
  auto_generate?: boolean;
  is_active?: boolean;
  action_type?: string;
}

export interface SystemSettings {
  id?: number | string;
  key: string;
  value: unknown;
  description?: string;
  whatsapp_number?: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  type: string;
  status: LeadStatus;
  district: string;
  last_contact: string;
  last_contacted_at?: string;
  notes: string;
  property_id?: string;
  created_at?: string;
  relationship_level?: string;
  potential?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  region_pin_id?: string;
  next_follow_up_date?: string;
  last_contact_date?: string;
  behavior_metrics?: {
    total_views: number;
    avg_duration: number;
    last_active: string;
    is_hot: boolean;
  };
  next_followup_at?: string;
  temperature?: 'normal' | 'hot' | 'warm' | 'cold';
  silence_risk_level?: 'none' | 'low' | 'medium' | 'high';
  forget_protection_state?: 'safe' | 'at_risk' | 'stale';
  last_call_result?: string;
  last_call_result_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  property_id?: string;
  lead_id?: string;
  title: string;
  time: string;
  due_date?: string;
  notes?: string;
  type: 'Arama' | 'Randevu' | 'Saha' | 'Saha/Bölge' | 'Takip' | 'Güncelleme' | 'Sosyal Medya' | string;
  completed: boolean;
  priority?: "low" | "medium" | "high" | string;
  completed_at?: string | null;
  requires_call?: boolean;
  is_drip?: boolean;
  ai_suggestion?: string;
  drip_type?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  type: 'Daire' | 'Villa' | 'Arsa' | 'Ticari' | 'Fabrika' | 'Fabrika Arsası';
  category: 'Satılık' | 'Kiralık';
  price: number;
  commission_rate: number;
  status: 'Yeni' | 'Hazırlanıyor' | 'Yayında' | 'İlgi Var' | 'Pazarlık' | 'Satıldı' | 'Kiralandı' | 'Pasif';
  unsold_reason?: string;
  address: {
    city: string;
    district: string;
    neighborhood: string;
    lat?: number;
    lng?: number;
  };
  details: {
    brut_m2?: number;
    net_m2?: number;
    rooms: string;
    age?: number;
    floor?: number;
    totalFloors?: number;
  };
  owner: {
    name: string;
    phone: string;
    trust_score: number;
  };
  health_score: number;
  sale_probability?: number;
  market_analysis?: {
    avg_price_m2: number;
    price_index: number;
    status: 'Fırsat' | 'Normal' | 'Pahalı';
  };
  images: string[];
  notes: string;
  target_customer_type?: string;
  investment_suitability?: string;
  created_at?: string;
  updated_at?: string;
  last_status_change_at?: string;
  last_activity_at?: string;
}

export interface LeadActivityLog {
  id: string;
  user_id: string;
  lead_id: string;
  action_type: string;
  result?: string;
  note?: string;
  scheduled_followup_at?: string;
  happened_at: string;
  created_at: string;
}

export interface LeadAlert {
  id: string;
  user_id: string;
  lead_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  triggered_at: string;
  resolved_at?: string;
  last_seen_at?: string;
  lead?: Partial<Lead>;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  planned_calls: number;
  planned_followups: number;
  planned_portfolio_actions: number;
  completed_calls: number;
  completed_followups: number;
  completed_portfolio_actions: number;
  top3: string[];
  created_at: string;
  updated_at: string;
}

export interface DayClosure {
  id: string;
  user_id: string;
  closure_date: string;
  wins?: string;
  blockers?: string;
  tomorrow_top3: string[];
  stuck_lead_ids: string[];
  stuck_property_ids: string[];
  completed_calls: number;
  completed_followups: number;
  completed_portfolio_actions: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioBlocker {
  id: string;
  user_id: string;
  property_id: string;
  blocker_type: 'price' | 'presentation' | 'location' | 'demand' | 'process' | 'owner' | 'content';
  note?: string;
  impact_score: number;
  is_active: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface OwnerPortalEvent {
  id: string;
  user_id: string;
  property_id: string;
  token_id?: string;
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface MapPin {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  address: string;
  notes: string;
  created_at: string;
  kind?: RegionRecordKind;
  contact_name?: string;
  phone?: string;
  relationship_level?: 'Soğuk Temas' | 'Tanışıldı' | 'Güven Oluşuyor' | 'Aktif Referans Kaynağı' | 'VIP Network';
  last_contact_date?: string;
  next_contact_date?: string;
  followup_date?: string;
  potential?: 'Düşük' | 'Orta' | 'Yüksek' | 'Sıcak';
  add_to_crm?: boolean;
  crm_lead_id?: string;
}

export interface DashboardStats {
  calls: number;
  appointments: number;
  exclusive: number;
  target_progress: number;
  active_properties: number;
  total_leads: number;
  total_properties: number;
  estimated_revenue: number;
  discipline_score: number;
  ai_insight: string;
}

export interface Building {
  id: string;
  user_id: string;
  title: string;
  address: string;
  district?: string;
  notes?: string;
  last_visit?: string;
  status?: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_default: boolean;
}

export interface BrokerAccount {
  id: string;
  user_id: string;
  store_name: string;
  api_key: string;
  connected_at: string;
}

export interface ExternalListing {
  id: string;
  user_id: string;
  ext_id: string;
  title: string;
  price: number;
  status: 'Yayında' | 'Pasif';
  url: string;
  district: string;
  last_sync: string;
  imageUrl?: string;
}

export interface PropertySyncLink {
  property_id: string;
  external_listing_id: string;
}

export interface PriceHistory {
  id: string;
  property_id: string;
  old_price: number;
  new_price: number;
  date: string;
}

export type GamifiedTaskCategory = 'sweet' | 'main' | 'smart';

export interface GamifiedTask {
  id: string;
  user_id: string;
  title: string;
  points: number;
  category: GamifiedTaskCategory;
  is_completed: boolean;
  completed_at?: string;
  date: string;
  ai_reason?: string;
  reminder_time?: string;
  notified?: boolean;
  template_id?: string | null;
  source?: string;
  action_type?: string;
  auto_verify?: boolean;
}

export interface UserStats {
  points: number;
  points_today: number;
  streak: number;
  momentum: number;
  level: number;
  level_name: string;
  next_level_points: number;
  daily_progress: number;
  tasks_completed_today: number;
  total_tasks_today: number;
}

export interface DailyMomentum {
  date: string;
  score: number;
  tasks_completed: number;
  main_tasks_completed: number;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  tasks_completed: number;
  potential_revenue_handled: number;
  calls_made: number;
  visits_made: number;
  xp_earned: number;
  day_started_at?: string;
  day_ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RescueTask {
  id: string;
  title: string;
  type: 'call' | 'update' | 'visit' | 'note';
  estimated_minutes: number;
  points: number;
  is_completed: boolean;
  target_id?: string;
}

export interface RescueSession {
  id: string;
  user_id: string;
  date: string;
  status: 'active' | 'completed' | 'expired';
  tasks: RescueTask[];
  started_at: string;
  expires_at: string;
}

export type OpportunityType = 'lead_followup' | 'property_stale' | 'visit_stale' | 'price_drop_potential';

export interface MissedOpportunity {
  id: string;
  user_id: string;
  type: OpportunityType;
  title: string;
  description: string;
  target_id: string;
  days_delayed: number;
  priority: 'high' | 'medium' | 'low';
  potential_value?: number;
  reason?: string;
}

export interface VoiceParseAction {
  type: 'lead' | 'task' | 'note';
  payload: Record<string, unknown>;
  explanation: string;
}

export interface VoiceParseResult {
  original_text: string;
  intent: 'lead' | 'task' | 'note' | 'composite' | 'unknown';
  confidence: number;
  extracted_data: {
    name?: string;
    phone?: string;
    budget?: number;
    location?: string;
    due_date?: string;
    description?: string;
    task_type?: string;
  };
  actions?: VoiceParseAction[];
}

export interface CoachInsight {
  score: number;
  daily_tip: string;
  strength: {
    title: string;
    description: string;
  };
  weakness: {
    title: string;
    description: string;
  };
}

export interface RegionEfficiencyScore {
  district: string;
  score: number;
  leads?: number;
  properties?: number;
  sales?: number;
}

export type RegionRecordKind = 'network_contact' | 'region_point';

export interface RegionCategory {
  id: string;
  user_id?: string;
  name: string;
  label?: string; // For backward compatibility with existing Category
  kind: RegionRecordKind;
  icon: string | React.ElementType;
  color: string;
  is_default?: boolean;
  auto_add_to_crm?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

export interface WhatsAppAnalysis {
  customer_name: string;
  customer_type: string;
  interest_level: string;
  hotness_score: number;
  budget_signal: string;
  suggested_action: string;
  follow_up_date: string;
  extracted_details: string;
  confidence_score: number;
}

export interface MutationResult<TData = unknown, TVariables = void> {
  mutate: TVariables extends void ? () => void : (variables: TVariables) => void;
  mutateAsync: TVariables extends void ? () => Promise<TData> : (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isSuccess: boolean;
  error: unknown;
  variables?: TVariables;
  data?: TData;
}

export interface UserNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags?: string[];
  is_pinned?: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at?: string | null;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  due_date?: string;
  reminder_time?: string;
  notified?: boolean;
}

export interface PropertyAIContent {
  metin: string;
}

export interface InstagramMarketingContent {
  corporate: string;
  sales: string;
  warm: string;
}

export interface WhatsAppMarketingContent {
  single: string;
  status: string;
  investor: string;
}

export interface MarketingModuleContent {
  instagram_posts: {
    tone: string;
    headline: string;
    caption: string;
    cta: string;
    hashtags: string[];
  }[];
  whatsapp_messages: {
    type: string;
    text: string;
    alternative_texts: string[];
  }[];
  summaries: string[];
  cta_options: string[];
  short_description?: string;
  portal_description?: string;
}

export interface CompetitorListing {
  id: string;
  external_id: string;
  title: string;
  price: number;
  old_price?: number;
  change_type: 'new_listing' | 'price_drop' | 'sold_or_removed';
  date: string;
  location: string;
  distance: string;
  url?: string;
}

export interface MarketIntelligenceReport {
  property_id: string;
  summary: string;
  competitors: CompetitorListing[];
  market_mood: 'heating' | 'cooling' | 'stable';
  action_tip: string;
  created_at: string;
  source_type?: 'verified' | 'unavailable';
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  type: "new_lead" | "price_revision" | "ai_recommendation" | "market_report" | "system_announcement";
  in_app: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  frequency: "instant" | "daily" | "weekly" | "never";
  created_at?: string;
  updated_at?: string;
}

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignTaskStatus = 'pending' | 'completed' | 'skipped';
export type CampaignTaskType = 'prospecting' | 'crm' | 'field' | 'content' | 'learning' | 'portfolio' | 'followup' | 'review' | 'gpa';
export type GpaBucket = 'G' | 'P' | 'A';

export type AdvisorExperienceLevel = 'new' | 'experienced';
export type TaxIdentityType = 'none' | 'tc' | 'vkn';
export type WorkIntensity = 'light' | 'standard' | 'intense';

export interface AdvisorReportIdentity {
  display_name: string | null;
  professional_title: string | null;
  office_name: string | null;
  office_brand: string | null;
  myk_level: string | null;
  myk_certificate_no: string | null;
  public_phone: string | null;
  public_email: string | null;
  region: string | null;
  niche: string | null;
  tax_identity_masked: string | null;
}

export interface AdvisorProfessionalProfile {
  user_id: string;
  experience_level: AdvisorExperienceLevel;
  experience_years?: number | null;
  profession_start_date?: string | null;
  campaign_start_reason?: string | null;
  current_role?: string | null;
  has_myk: boolean;
  myk_level?: string | null;
  myk_certificate_no?: string | null;
  myk_issue_date?: string | null;
  myk_renewal_date?: string | null;
  myk_reminder_enabled: boolean;
  has_real_estate_authorization: boolean;
  authorization_no?: string | null;
  authorization_issue_date?: string | null;
  authorization_renewal_date?: string | null;
  has_office: boolean;
  office_name?: string | null;
  office_brand?: string | null;
  office_role?: string | null;
  office_phone?: string | null;
  office_address?: string | null;
  has_tax_registration: boolean;
  tax_identity_type?: TaxIdentityType | null;
  tax_identity_masked?: string | null;
  tax_identity_last4?: string | null;
  display_name?: string | null;
  professional_title?: string | null;
  report_signature_title?: string | null;
  public_phone?: string | null;
  public_email?: string | null;
  region?: string | null;
  niche?: string | null;
  daily_available_hours?: number | null;
  preferred_work_intensity?: WorkIntensity | null;
  weekly_contact_target?: number | null;
  daily_contact_target?: number | null;
  onboarding_completed: boolean;
  onboarding_completed_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdvisorCampaign {
  id: string;
  user_id: string;
  campaign_type: string;
  status: CampaignStatus;
  start_date: string;
  current_day: number;
  current_week: number;
  region?: string;
  niche?: string;
  daily_contact_target: number;
  weekly_contact_target: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CampaignTask {
  id: string;
  campaign_id: string;
  user_id: string;
  day_number: number;
  week_number: number;
  task_key: string;
  task_type: CampaignTaskType;
  title: string;
  description?: string;
  gpa_bucket?: GpaBucket;
  xp_reward: number;
  status: CampaignTaskStatus;
  due_date: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignDailyScore {
  id: string;
  campaign_id: string;
  user_id: string;
  score_date: string;
  g_score: number;
  p_score: number;
  a_score: number;
  total_score: number;
  completed_tasks: number;
  total_tasks: number;
  created_at: string;
  updated_at: string;
}

export const isAdminRole = (role?: string | null): boolean => {
  return role === 'admin' || role === 'super_admin';
};
