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
        updateLeadMutation={leads.updateLeadMutation}
        deleteLeadMutation={leads.deleteLeadMutation}
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
        selectedLead={leads.selectedLead}
        setSelectedLead={leads.setSelectedLead}
        isEditingLead={leads.isEditingLead}
        setIsEditingLead={leads.setIsEditingLead}
        properties={portfolios.properties || []}
        setShowDocumentAutomation={leads.setShowDocumentAutomation}
        setDocumentAutomationLead={leads.setDocumentAutomationLead}
        setDocumentAutomationProperty={leads.setDocumentAutomationProperty}
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
        leads={leads.leads || []}
        regionScores={portfolios.regionScores || []}
        isEditing={portfolios.isEditing}
        setIsEditing={portfolios.setIsEditing}
        setShowAddTask={portfolios.setShowAddTask}
        tasks={portfolios.tasks || []}
        setShowDocumentAutomation={portfolios.setShowDocumentAutomation}
        setDocumentAutomationProperty={portfolios.setDocumentAutomationProperty}
        setDocumentAutomationLead={portfolios.setDocumentAutomationLead}
      />
      <UtilityModals 
        showAddVisit={utilities.showAddVisit}
        setShowAddVisit={utilities.setShowAddVisit}
        addVisitMutation={utilities.addVisitMutation}
        showAddTask={utilities.showAddTask}
        setShowAddTask={utilities.setShowAddTask}
        addTaskMutation={utilities.addTaskMutation}
        leads={utilities.leads || []}
        properties={utilities.properties || []}
        tasks={utilities.tasks || []}
        fieldVisits={utilities.fieldVisits || []}
        rescueSession={utilities.rescueSession}
        cancelRescueMutation={utilities.cancelRescueMutation}
        completeRescueTaskMutation={utilities.completeRescueTaskMutation}
        showMissedOpportunities={utilities.showMissedOpportunities}
        setShowMissedOpportunities={utilities.setShowMissedOpportunities}
        missedOpportunities={utilities.missedOpportunities || []}
        setActiveTab={utilities.setActiveTab}
        showDocumentAutomation={utilities.showDocumentAutomation}
        setShowDocumentAutomation={utilities.setShowDocumentAutomation}
        documentAutomationProperty={utilities.documentAutomationProperty}
        documentAutomationLead={utilities.documentAutomationLead}
        profile={utilities.profile}
        addLeadMutation={utilities.addLeadMutation}
      />
    </>
  );
};
