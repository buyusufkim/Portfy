import React from 'react';
import { AnimatePresence } from 'motion/react';
import { DashboardPage } from '../../pages/DashboardPage';
import { BolgemView } from '../BolgemView';
import { PortfoliosPage } from '../../pages/PortfoliosPage';
import { CRMPage } from '../../pages/CRMPage';
import { NotesView } from '../NotesView';
import { ProfilView } from '../ProfilView';
import { CoachView } from './CoachView'; // Wait, CoachView is in App.tsx too?
import { LoadingFallback } from './LoadingFallback'; // I should probably move these too or export them
import { AdminPanel } from '../AdminPanel';

// I'll need to check where CoachView and LoadingFallback are.
// In App.tsx they are defined as local components.
// I'll move them to separate files or include them in MainContentRouter if they are small.
// Actually, I'll move them to src/components/app/ as well.

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
  Building
} from '../../types';

export interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  logout: () => void;
  profile: UserProfile | null;
}

export interface LeadProps {
  leads: Lead[];
  leadsLoading: boolean;
  categories: string[];
  showAddLead: boolean;
  setShowAddLead: (val: boolean) => void;
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (val: boolean) => void;
  leadAnalysis: string | null;
  setLeadAnalysis: (val: string | null) => void;
  analyzeLeadsMutation: any;
  isAnalyzingLeads: boolean;
  setIsAnalyzingLeads: (val: boolean) => void;
  addLeadMutation: any;
}

export interface PortfolioProps {
  properties: Property[];
  propertiesLoading: boolean;
  selectedDistrict: string | 'all';
  setSelectedDistrict: (val: string | 'all') => void;
  viewMode: 'list' | 'pipeline';
  setViewMode: (val: 'list' | 'pipeline') => void;
  setShowImportUrlModal: (val: boolean) => void;
  regionScores: any[];
  setShowExternalListings: (val: boolean) => void;
  setShowIntegrationModal: (val: boolean) => void;
  setSelectedProperty: (val: Property | null) => void;
  selectedProperty: Property | null;
  brokerAccount: BrokerAccount | null;
  externalListings: ExternalListing[];
  syncListingsMutation: any;
  linkPropertyMutation: any;
  connectIntegrationMutation: any;
  templates: MessageTemplate[];
  showTemplateSelector: boolean;
  setShowTemplateSelector: (val: boolean) => void;
  showTemplateManager: boolean;
  setShowTemplateManager: (val: boolean) => void;
  addTemplateMutation: any;
  deleteTemplateMutation: any;
  showAddProperty: boolean;
  setShowAddProperty: (val: boolean) => void;
  showImportUrlModal: boolean;
  showIntegrationModal: boolean;
  showExternalListings: boolean;
}

export interface UtilityProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: any;
  showDailyBriefing: boolean;
  setShowDailyBriefing: (val: boolean) => void;
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  cancelRescueMutation: any;
  completeRescueTaskMutation: any;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  gamifiedTasks: GamifiedTask[];
  personalTasks: PersonalTask[];
  setShowDailyRadar: (val: boolean) => void;
  setShowDayCloser: (val: boolean) => void;
  setToast: (toast: any) => void;
  completeMorningRitualMutation: any;
  showVoiceQuickAdd: boolean;
  setShowVoiceQuickAdd: (val: boolean) => void;
  addTaskMutation: any;
  setActiveTab: (tab: string) => void;
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
    return <AdminPanel onClose={() => navigation.setShowAdminPanel(false)} />;
  }

  return (
    <AnimatePresence mode="wait">
      {navigation.activeTab === 'dashboard' && (
        <DashboardPage 
          profile={navigation.profile}
          properties={portfolios.properties}
          gamifiedTasks={utilities.gamifiedTasks}
          personalTasks={utilities.personalTasks}
          tasks={utilities.tasks}
          rescueSession={utilities.rescueSession}
          missedOpportunities={utilities.missedOpportunities}
          setActiveTab={navigation.setActiveTab}
          setShowAdminPanel={navigation.setShowAdminPanel}
          setShowDailyRadar={utilities.setShowDailyRadar}
          setShowDayCloser={utilities.setShowDayCloser}
          setShowMissedOpportunities={utilities.setShowMissedOpportunities}
          setToast={utilities.setToast}
          completeMorningRitualMutation={utilities.completeMorningRitualMutation}
        />
      )}
      {navigation.activeTab === 'bolgem' && (
        <React.Suspense fallback={<LoadingFallback />}>
          <BolgemView profile={navigation.profile} />
        </React.Suspense>
      )}
      {navigation.activeTab === 'portfoyler' && (
        <PortfoliosPage 
          properties={portfolios.properties}
          selectedDistrict={portfolios.selectedDistrict}
          setSelectedDistrict={portfolios.setSelectedDistrict}
          viewMode={portfolios.viewMode}
          setViewMode={portfolios.setViewMode}
          setShowImportUrlModal={portfolios.setShowImportUrlModal}
          regionScores={portfolios.regionScores}
          propertiesLoading={portfolios.propertiesLoading}
          setSelectedProperty={portfolios.setSelectedProperty}
        />
      )}
      {navigation.activeTab === 'crm' && (
        <CRMPage 
          profile={navigation.profile}
          leads={leads.leads}
          leadsLoading={leads.leadsLoading}
          categories={leads.categories}
          setShowWhatsAppImport={leads.setShowWhatsAppImport}
          setShowAddLead={leads.setShowAddLead}
          setIsAnalyzingLeads={leads.setIsAnalyzingLeads}
          analyzeLeadsMutation={leads.analyzeLeadsMutation}
          isAnalyzingLeads={leads.isAnalyzingLeads}
        />
      )}
      {navigation.activeTab === 'notes' && <NotesView />}
      {navigation.activeTab === 'profil' && (
        <ProfilView 
          profile={navigation.profile}
          setShowAdminPanel={navigation.setShowAdminPanel}
          brokerAccount={portfolios.brokerAccount}
          setShowExternalListings={portfolios.setShowExternalListings}
          setShowIntegrationModal={portfolios.setShowIntegrationModal}
          logout={navigation.logout}
        />
      )}
      {navigation.activeTab === 'koc' && <CoachView />}
    </AnimatePresence>
  );
};
