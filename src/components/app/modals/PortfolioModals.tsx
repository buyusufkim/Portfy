import React from 'react';
import { PortfolioModals as BasePortfolioModals } from '../../../pages/PortfoliosPage';

import { Property, BrokerAccount, ExternalListing, MessageTemplate, Lead, RegionEfficiencyScore, MutationResult, Task } from '../../../types';

interface PortfolioModalsProps {
  showAddProperty: boolean;
  setShowAddProperty: (val: boolean) => void;
  showImportUrlModal: boolean;
  setShowImportUrlModal: (val: boolean) => void;
  showIntegrationModal: boolean;
  setShowIntegrationModal: (val: boolean) => void;
  showExternalListings: boolean;
  setShowExternalListings: (val: boolean) => void;
  selectedProperty: Property | null;
  setSelectedProperty: (val: Property | null) => void;
  brokerAccount: BrokerAccount | null;
  externalListings: ExternalListing[];
  syncListingsMutation: MutationResult<any, any>;
  linkPropertyMutation: MutationResult<any, any>;
  connectIntegrationMutation: MutationResult<any, any>;
  leads: Lead[];
  regionScores: RegionEfficiencyScore[];
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  setShowAddTask: (val: boolean) => void;
  tasks: Task[];
  setShowDocumentAutomation: (val: boolean) => void;
  setDocumentAutomationProperty: (val: Property | null) => void;
  setDocumentAutomationLead: (val: Lead | null) => void;
}

export const PortfolioModalsComponent: React.FC<PortfolioModalsProps> = ({
  showAddProperty,
  setShowAddProperty,
  showImportUrlModal,
  setShowImportUrlModal,
  showIntegrationModal,
  setShowIntegrationModal,
  showExternalListings,
  setShowExternalListings,
  selectedProperty,
  setSelectedProperty,
  brokerAccount,
  externalListings,
  syncListingsMutation,
  linkPropertyMutation,
  connectIntegrationMutation,
  leads,
  regionScores,
  isEditing,
  setIsEditing,
  setShowAddTask,
  tasks,
  setShowDocumentAutomation,
  setDocumentAutomationProperty,
  setDocumentAutomationLead
}) => {
  return (
    <>
      <BasePortfolioModals 
        showAddProperty={showAddProperty}
        setShowAddProperty={setShowAddProperty}
        showImportUrlModal={showImportUrlModal}
        setShowImportUrlModal={setShowImportUrlModal}
        showIntegrationModal={showIntegrationModal}
        setShowIntegrationModal={setShowIntegrationModal}
        showExternalListings={showExternalListings}
        setShowExternalListings={setShowExternalListings}
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        brokerAccount={brokerAccount}
        externalListings={externalListings}
        syncListingsMutation={syncListingsMutation}
        linkPropertyMutation={linkPropertyMutation}
        connectIntegrationMutation={connectIntegrationMutation}
        leads={leads}
        regionScores={regionScores}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        setShowAddTask={setShowAddTask}
        tasks={tasks}
        setShowDocumentAutomation={setShowDocumentAutomation}
        setDocumentAutomationProperty={setDocumentAutomationProperty}
        setDocumentAutomationLead={setDocumentAutomationLead}
      />
    </>
  );
};
export const PortfolioModals = React.memo(PortfolioModalsComponent);