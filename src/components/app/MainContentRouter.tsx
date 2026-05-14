import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoadingFallback } from './LoadingFallback';
import { PremiumGate } from '../premium/PremiumGate'; // KİLİT SİSTEMİ EKLENDİ

const AdminPanel = React.lazy(() => import('../AdminPanel'));
const BolgemView = React.lazy(() => import('../BolgemView'));
const DashboardPage = React.lazy(() => import('../../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TasksPage = React.lazy(() => import('../../pages/TasksPage').then(m => ({ default: m.TasksPage })));
const Campaign90Page = React.lazy(() => import('../../pages/Campaign90Page').then(m => ({ default: m.Campaign90Page })));
const PortfoliosPage = React.lazy(() => import('../../pages/PortfoliosPage').then(m => ({ default: m.PortfoliosPage })));
const CRMPage = React.lazy(() => import('../../pages/CRMPage').then(m => ({ default: m.CRMPage })));
const ProfilView = React.lazy(() => import('../ProfilView').then(m => ({ default: m.ProfilView })));
const CoachView = React.lazy(() => import('./CoachView').then(m => ({ default: m.CoachView })));

import { 
  UserProfile, 
  Lead, 
  Property, 
  BrokerAccount, 
  ExternalListing, 
  MessageTemplate, 
  GamifiedTask, 
  PersonalTask, 
  RescueSession, 
  MissedOpportunity,
  Task,
  Building,
  MutationResult,
  RegionEfficiencyScore,
  Category,
  DailyPlan
} from '../../types';

export interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  logout: () => void;
  profile: UserProfile | null;
  updateProfileMutation: MutationResult<void, { id: string, data: Partial<UserProfile> }>;
}

export interface LeadProps {
  leads: Lead[];
  leadsLoading: boolean;
  categories: Category[];
  showAddLead: boolean;
  setShowAddLead: (val: boolean) => void;
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (val: boolean) => void;
  leadAnalysis: string | null;
  setLeadAnalysis: (val: string | null) => void;
  analyzeLeadsMutation: MutationResult<string, Lead[]>;
  isAnalyzingLeads: boolean;
  setIsAnalyzingLeads: (val: boolean) => void;
  addLeadMutation: MutationResult<Lead, Omit<Lead, 'id' | 'user_id' | 'last_contact'>>;
  updateLeadMutation: MutationResult<void, { id: string, lead: Partial<Lead> }>;
  deleteLeadMutation: MutationResult<void, string>;
  selectedLead: Lead | null;
  setSelectedLead: (val: Lead | null) => void;
  isEditingLead: boolean;
  setIsEditingLead: (val: boolean) => void;
  setShowDocumentAutomation: (val: boolean) => void;
  setDocumentAutomationLead: (val: Lead | null) => void;
  setDocumentAutomationProperty: (val: Property | null) => void;
}

export interface PortfolioProps {
  properties: Property[];
  propertiesLoading: boolean;
  selectedDistrict: string | 'all';
  setSelectedDistrict: (val: string | 'all') => void;
  viewMode: 'list' | 'grid' | 'pipeline';
  setViewMode: (val: 'list' | 'grid' | 'pipeline') => void;
  setShowImportUrlModal: (val: boolean) => void;
  regionScores: RegionEfficiencyScore[];
  setShowExternalListings: (val: boolean) => void;
  setShowIntegrationModal: (val: boolean) => void;
  setSelectedProperty: (val: Property | null) => void;
  selectedProperty: Property | null;
  brokerAccount: BrokerAccount | null;
  externalListings: ExternalListing[];
  syncListingsMutation: MutationResult<ExternalListing[], void>;
  linkPropertyMutation: MutationResult<unknown, unknown>;
  connectIntegrationMutation: MutationResult<unknown, unknown>;
  showAddProperty: boolean;
  setShowAddProperty: (val: boolean) => void;
  showImportUrlModal: boolean;
  showIntegrationModal: boolean;
  showExternalListings: boolean;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  setShowRegionSetup: (val: boolean) => void;
  setShowAddTask: (val: boolean) => void;
  tasks: Task[];
  setShowDocumentAutomation: (val: boolean) => void;
  setDocumentAutomationProperty: (val: Property | null) => void;
  setDocumentAutomationLead: (val: Lead | null) => void;
}

export interface UtilityProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: MutationResult<unknown, Omit<Building, "id" | "user_id">>;
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  showRescueModal: boolean;
  setShowRescueModal: (val: boolean) => void;
  cancelRescueMutation: MutationResult<unknown, unknown>;
  completeRescueTaskMutation: MutationResult<unknown, unknown>;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  gamifiedTasks: GamifiedTask[];
  personalTasks: PersonalTask[];
  setShowDailyRadar: (val: boolean) => void;
  setPendingEarlyStartReason?: (val: string) => void;
  setShowDayCloser: (val: boolean) => void;
  setToast: (toast: { message: string, type: 'success' | 'error' | 'info' } | null) => void;
  completeMorningRitualMutation: MutationResult<{ success: boolean; }, Partial<DailyPlan> & { early_start_reason?: string }>;
  tasksLoading: boolean;
  tasksError: boolean;
  showVoiceQuickAdd: boolean;
  setShowVoiceQuickAdd: (val: boolean) => void;
  showAddTask: boolean;
  setShowAddTask: (val: boolean) => void;
  addTaskMutation: MutationResult<string, Omit<Task, 'id' | 'user_id'>>;
  addPersonalTaskMutation: MutationResult<string, Omit<PersonalTask, 'id' | 'user_id' | 'created_at'>>;
  setActiveTab: (tab: string) => void;
  leads: Lead[];
  properties: Property[];
  showDocumentAutomation: boolean;
  setShowDocumentAutomation: (val: boolean) => void;
  documentAutomationProperty: Property | null;
  documentAutomationLead: Lead | null;
  profile: UserProfile | null;
  addLeadMutation: MutationResult<Lead, Omit<Lead, 'id' | 'user_id' | 'last_contact'>>;
}

export interface MainContentRouterProps {
  navigation: NavigationProps;
  leads: LeadProps;
  portfolios: PortfolioProps;
  utilities: UtilityProps;
}

export const MainContentRouter: React.FC<MainContentRouterProps> = ({
  navigation,
  leads,
  portfolios,
  utilities
}) => {
  if (navigation.showAdminPanel) {
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <AdminPanel onClose={() => navigation.setShowAdminPanel(false)} />
      </React.Suspense>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={navigation.activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <React.Suspense fallback={<LoadingFallback />}>
          {navigation.activeTab === 'dashboard' && (
            <DashboardPage 
              profile={navigation.profile}
            properties={portfolios.properties || []}
            gamifiedTasks={utilities.gamifiedTasks || []}
            isGamifiedTasksLoading={utilities.tasksLoading}
            isGamifiedTasksError={utilities.tasksError}
            personalTasks={utilities.personalTasks || []}
            tasks={utilities.tasks || []}
            rescueSession={utilities.rescueSession}
            setShowRescueModal={utilities.setShowRescueModal}
            missedOpportunities={utilities.missedOpportunities || []}
            setActiveTab={navigation.setActiveTab}
            setShowAdminPanel={navigation.setShowAdminPanel}
            setShowDailyRadar={utilities.setShowDailyRadar}
            setShowDayCloser={utilities.setShowDayCloser}
            setShowMissedOpportunities={utilities.setShowMissedOpportunities}
            setToast={utilities.setToast}
            completeMorningRitualMutation={utilities.completeMorningRitualMutation}
            setSelectedLead={leads.setSelectedLead}
            setSelectedProperty={portfolios.setSelectedProperty}
          />
        )}
        {navigation.activeTab === 'tasks' && (
          <TasksPage 
            profile={navigation.profile}
            tasks={utilities.tasks || []}
            personalTasks={utilities.personalTasks || []}
            setActiveTab={navigation.setActiveTab}
          />
        )}
        {navigation.activeTab === 'bolgem' && (
            <BolgemView 
              profile={navigation.profile} 
              setToast={utilities.setToast}
            />
        )}
        {navigation.activeTab === 'campaign-90' && (
          <Campaign90Page />
        )}
        {navigation.activeTab === 'portfoyler' && (
          <PortfoliosPage 
            properties={portfolios.properties || []}
            selectedDistrict={portfolios.selectedDistrict}
            setSelectedDistrict={portfolios.setSelectedDistrict}
            viewMode={portfolios.viewMode}
            setViewMode={portfolios.setViewMode}
            setShowImportUrlModal={portfolios.setShowImportUrlModal}
            regionScores={portfolios.regionScores || []}
            propertiesLoading={portfolios.propertiesLoading}
            setSelectedProperty={portfolios.setSelectedProperty}
          />
        )}
        {navigation.activeTab === 'crm' && (
          <CRMPage 
            profile={navigation.profile}
            leads={leads.leads || []}
            leadsLoading={leads.leadsLoading}
            categories={leads.categories || []}
            setShowWhatsAppImport={leads.setShowWhatsAppImport}
            setShowAddLead={leads.setShowAddLead}
            setIsAnalyzingLeads={leads.setIsAnalyzingLeads}
            analyzeLeadsMutation={leads.analyzeLeadsMutation}
            leadAnalysis={leads.leadAnalysis}
            isAnalyzingLeads={leads.isAnalyzingLeads}
            properties={portfolios.properties || []}
            selectedLead={leads.selectedLead}
            setSelectedLead={leads.setSelectedLead}
          />
        )}
        {navigation.activeTab === 'profil' && (
          <ProfilView 
            profile={navigation.profile}
            setShowAdminPanel={navigation.setShowAdminPanel}
            brokerAccount={portfolios.brokerAccount}
            setShowExternalListings={portfolios.setShowExternalListings}
            setShowIntegrationModal={portfolios.setShowIntegrationModal}
            syncListingsMutation={portfolios.syncListingsMutation}
            updateProfileMutation={navigation.updateProfileMutation}
            setShowRegionSetup={portfolios.setShowRegionSetup}
            logout={navigation.logout}
          />
        )}
        
        {/* 🔥 AI KOÇ SAYFASI KİLİTLENDİ 🔥 */}
        {navigation.activeTab === 'koc' && (
          <PremiumGate featureKey="ai_coach">
            <CoachView setActiveTab={navigation.setActiveTab} />
          </PremiumGate>
        )}
        </React.Suspense>
      </motion.div>
    </AnimatePresence>
  );
};