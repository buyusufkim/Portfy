import React from 'react';
import { LeadModals } from './modals/LeadModals';
import { PortfolioModals } from './modals/PortfolioModals';
import { UtilityModals } from './modals/UtilityModals';
import { LeadProps, PortfolioProps, UtilityProps, NavigationProps } from './MainContentRouter';

export interface AppModalsProps {
  leads: LeadProps;
  portfolios: PortfolioProps;
  utilities: UtilityProps;
  navigation: NavigationProps;
}

export const AppModals: React.FC<AppModalsProps> = ({
  leads,
  portfolios,
  utilities
}) => {
  return (
    <>
      <LeadModals 
        categories={leads.categories || []}
        addLeadMutation={leads.addLeadMutation}
        showAddLead={leads.showAddLead}
        setShowAddLead={leads.setShowAddLead}
        showWhatsAppImport={leads.showWhatsAppImport}
        setShowWhatsAppImport={leads.setShowWhatsAppImport}
        leadAnalysis={leads.leadAnalysis}
        setLeadAnalysis={leads.setLeadAnalysis}
        analyzeLeadsMutation={leads.analyzeLeadsMutation}
        showVoiceQuickAdd={utilities.showVoiceQuickAdd}
        setShowVoiceQuickAdd={utilities.setShowVoiceQuickAdd}
        addTaskMutation={utilities.addTaskMutation}
        addVisitMutation={utilities.addVisitMutation}
      />
      <PortfolioModals 
        showAddProperty={portfolios.showAddProperty}
        setShowAddProperty={portfolios.setShowAddProperty}
        showImportUrlModal={portfolios.showImportUrlModal}
        setShowImportUrlModal={portfolios.setShowImportUrlModal}
        showIntegrationModal={portfolios.showIntegrationModal}
        setShowIntegrationModal={portfolios.setShowIntegrationModal}
        showExternalListings={portfolios.showExternalListings}
        setShowExternalListings={portfolios.setShowExternalListings}
        selectedProperty={portfolios.selectedProperty}
        setSelectedProperty={portfolios.setSelectedProperty}
        brokerAccount={portfolios.brokerAccount}
        externalListings={portfolios.externalListings || []}
        syncListingsMutation={portfolios.syncListingsMutation}
        linkPropertyMutation={portfolios.linkPropertyMutation}
        connectIntegrationMutation={portfolios.connectIntegrationMutation}
        templates={portfolios.templates || []}
        showTemplateSelector={portfolios.showTemplateSelector}
        setShowTemplateSelector={portfolios.setShowTemplateSelector}
        leads={leads.leads || []}
        regionScores={portfolios.regionScores || []}
        showTemplateManager={portfolios.showTemplateManager}
        setShowTemplateManager={portfolios.setShowTemplateManager}
        addTemplateMutation={portfolios.addTemplateMutation}
        deleteTemplateMutation={portfolios.deleteTemplateMutation}
      />
      <UtilityModals 
        showAddVisit={utilities.showAddVisit}
        setShowAddVisit={utilities.setShowAddVisit}
        addVisitMutation={utilities.addVisitMutation}
        showDailyBriefing={utilities.showDailyBriefing}
        setShowDailyBriefing={utilities.setShowDailyBriefing}
        tasks={utilities.tasks || []}
        fieldVisits={utilities.fieldVisits || []}
        rescueSession={utilities.rescueSession}
        cancelRescueMutation={utilities.cancelRescueMutation}
        completeRescueTaskMutation={utilities.completeRescueTaskMutation}
        showMissedOpportunities={utilities.showMissedOpportunities}
        setShowMissedOpportunities={utilities.setShowMissedOpportunities}
        missedOpportunities={utilities.missedOpportunities || []}
        setActiveTab={utilities.setActiveTab}
      />
    </>
  );
};
