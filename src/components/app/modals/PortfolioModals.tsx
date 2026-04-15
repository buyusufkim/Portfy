import React from 'react';
import { PortfolioModals as BasePortfolioModals } from '../../../pages/PortfoliosPage';
import { TemplateManagerModal } from './TemplateManagerModal';

import { Property, BrokerAccount, ExternalListing, MessageTemplate, Lead, RegionEfficiencyScore, MutationResult } from '../../../types';

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
  templates: MessageTemplate[];
  showTemplateSelector: boolean;
  setShowTemplateSelector: (val: boolean) => void;
  leads: Lead[];
  regionScores: RegionEfficiencyScore[];
  showTemplateManager: boolean;
  setShowTemplateManager: (val: boolean) => void;
  addTemplateMutation: MutationResult<any, any>;
  deleteTemplateMutation: MutationResult<any, string>;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

export const PortfolioModals: React.FC<PortfolioModalsProps> = ({
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
  templates,
  showTemplateSelector,
  setShowTemplateSelector,
  leads,
  regionScores,
  showTemplateManager,
  setShowTemplateManager,
  addTemplateMutation,
  deleteTemplateMutation,
  isEditing,
  setIsEditing
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
        templates={templates}
        showTemplateSelector={showTemplateSelector}
        setShowTemplateSelector={setShowTemplateSelector}
        leads={leads}
        regionScores={regionScores}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      <TemplateManagerModal 
        showTemplateManager={showTemplateManager} 
        setShowTemplateManager={setShowTemplateManager} 
        templates={templates} 
        addTemplateMutation={addTemplateMutation} 
        deleteTemplateMutation={deleteTemplateMutation} 
      />
    </>
  );
};
