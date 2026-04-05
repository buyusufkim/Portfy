export type LeadStatus = 'Aday' | 'Sıcak' | 'Yetki Alındı' | 'Pasif';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  subscriptionType: 'none' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month';
  subscriptionEndDate: string | null;
  role: 'agent' | 'admin';
  notificationTime?: string; // e.g., "09:00"
  hasSeenOnboarding?: boolean;
  hasSeenTour?: boolean;
  region?: {
    city: string;
    district: string;
    neighborhoods: string[]; // max 3
  };
  activeModules?: string[]; // Custom modules enabled for this user
}

export interface GlobalSettings {
  id: string;
  appName: string;
  themeColor: string;
  maintenanceMode: boolean;
  globalModules: {
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
  price: number;
  durationMonths: number;
  isActive: boolean;
  features: string[];
}

export interface Lead {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  type: string;
  status: LeadStatus;
  district: string;
  lastContact: string;
  notes: string;
  behaviorMetrics?: {
    totalViews: number;
    avgDuration: number;
    lastActive: string;
    isHot: boolean;
  };
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  time: string;
  type: 'Arama' | 'Randevu' | 'Saha';
  completed: boolean;
}

export interface Property {
  id: string;
  agentId: string;
  title: string;
  type: 'Daire' | 'Villa' | 'Arsa' | 'Ticari' | 'Fabrika' | 'Fabrika Arsası';
  category: 'Satılık' | 'Kiralık';
  price: number;
  commissionRate: number;
  status: 'Yeni' | 'Hazırlanıyor' | 'Yayında' | 'İlgi Var' | 'Pazarlık' | 'Satıldı' | 'Pasif';
  address: {
    city: string;
    district: string;
    neighborhood: string;
    lat?: number;
    lng?: number;
  };
  details: {
    brutM2: number;
    netM2: number;
    rooms: string;
    age: number;
    floor: number;
  };
  owner: {
    name: string;
    phone: string;
    trustScore: number;
  };
  healthScore: number;
  saleProbability: number;
  marketAnalysis?: {
    avgPriceM2: number;
    priceIndex: number; // 1.0 is market average
    status: 'Fırsat' | 'Normal' | 'Pahalı';
  };
  images: string[];
  notes: string;
  targetCustomerType?: string;
  investmentSuitability?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapPin {
  id: string;
  agentId: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  calls: number;
  appointments: number;
  exclusive: number;
  targetProgress: number;
  activeProperties: number;
  totalLeads: number;
  totalProperties: number;
  estimatedRevenue: number;
  disciplineScore: number;
  aiInsight: string;
}

export interface Building {
  id: string;
  address: string;
  district: string;
  status: 'Görüşüldü' | 'Potansiyel' | 'Ret' | 'Boş';
  lastVisit: string;
  notes: string;
}

export interface MessageTemplate {
  id: string;
  agentId: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface BrokerAccount {
  id: string;
  agentId: string;
  storeName: string;
  apiKey: string;
  connectedAt: string;
}

export interface ExternalListing {
  id: string;
  extId: string;
  title: string;
  price: number;
  status: 'Yayında' | 'Pasif';
  url: string;
  district: string;
  lastSync: string;
}

export interface PropertySyncLink {
  propertyId: string;
  externalListingId: string;
}

export interface PriceHistory {
  id: string;
  propertyId: string;
  oldPrice: number;
  newPrice: number;
  date: string;
}

export type GamifiedTaskCategory = 'sweet' | 'main' | 'smart';

export interface GamifiedTask {
  id: string;
  agentId: string;
  title: string;
  points: number;
  category: GamifiedTaskCategory;
  isCompleted: boolean;
  date: string;
  aiReason?: string;
}

export interface UserStats {
  points: number;
  pointsToday: number;
  streak: number;
  momentum: number;
  level: number;
  levelName: string;
  nextLevelPoints: number;
  dailyProgress: number; // 0-100
  tasksCompletedToday: number;
  totalTasksToday: number;
}

export interface DailyMomentum {
  date: string;
  score: number;
  tasksCompleted: number;
  mainTasksCompleted: number;
}

export interface RescueTask {
  id: string;
  title: string;
  type: 'call' | 'update' | 'visit' | 'note';
  estimatedMinutes: number;
  points: number;
  isCompleted: boolean;
  targetId?: string; // Lead or Property ID
}

export interface RescueSession {
  id: string;
  agentId: string;
  date: string;
  status: 'active' | 'completed' | 'expired';
  tasks: RescueTask[];
  startedAt: string;
  expiresAt: string;
}

export type OpportunityType = 'lead_followup' | 'property_stale' | 'visit_stale' | 'price_drop_potential';

export interface MissedOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  targetId: string;
  daysDelayed: number;
  priority: 'high' | 'medium' | 'low';
  potentialValue?: number; // Estimated commission or points
}

export interface VoiceParseResult {
  originalText: string;
  intent: 'lead' | 'task' | 'note' | 'unknown';
  confidence: number;
  extractedData: {
    name?: string;
    phone?: string;
    budget?: number;
    location?: string;
    dueDate?: string;
    description?: string;
  };
}

export interface CoachInsight {
  score: number;
  dailyTip: string;
  strength: {
    title: string;
    description: string;
  };
  weakness: {
    title: string;
    description: string;
  };
}

export interface UserNote {
  id: string;
  agentId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface PersonalTask {
  id: string;
  agentId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}
