import React from 'react';
import { CRMModals } from '../../crm/CRMModals';
import { VoiceQuickAddModal } from './VoiceQuickAddModal';

import { Lead, Category, MutationResult, Property } from '../../../types';

interface LeadModalsProps {
  categories: Category[];
  addLeadMutation: MutationResult<any, any>;
  updateLeadMutation: MutationResult<any, any>;
  deleteLeadMutation: MutationResult<any, any>;
  showAddLead: boolean;
  setShowAddLead: (val: boolean) => void;
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (val: boolean) => void;
  leadAnalysis: string | null;
  setLeadAnalysis: (val: string | null) => void;
  analyzeLeadsMutation: MutationResult<string, any>;
  showVoiceQuickAdd: boolean;
  setShowVoiceQuickAdd: (val: boolean) => void;
  addTaskMutation: MutationResult<any, any>;
  addVisitMutation: MutationResult<any, any>;
  selectedLead: Lead | null;
  setSelectedLead: (val: Lead | null) => void;
  isEditingLead: boolean;
  setIsEditingLead: (val: boolean) => void;
  properties: Property[];
  setShowDocumentAutomation: (val: boolean) => void;
  setDocumentAutomationLead: (val: Lead | null) => void;
  setDocumentAutomationProperty: (val: Property | null) => void;
}

export const LeadModals: React.FC<LeadModalsProps> = ({
  categories,
  addLeadMutation,
  updateLeadMutation,
  deleteLeadMutation,
  showAddLead,
  setShowAddLead,
  showWhatsAppImport,
  setShowWhatsAppImport,
  leadAnalysis,
  setLeadAnalysis,
  analyzeLeadsMutation,
  showVoiceQuickAdd,
  setShowVoiceQuickAdd,
  addTaskMutation,
  addVisitMutation,
  selectedLead,
  setSelectedLead,
  isEditingLead,
  setIsEditingLead,
  properties,
  setShowDocumentAutomation,
  setDocumentAutomationLead,
  setDocumentAutomationProperty
}) => {
  return (
    <>
      <CRMModals 
        categories={categories}
        addLeadMutation={addLeadMutation}
        updateLeadMutation={updateLeadMutation}
        deleteLeadMutation={deleteLeadMutation}
        showAddLead={showAddLead}
        setShowAddLead={setShowAddLead}
        showWhatsAppImport={showWhatsAppImport}
        setShowWhatsAppImport={setShowWhatsAppImport}
        leadAnalysis={leadAnalysis}
        setLeadAnalysis={setLeadAnalysis}
        analyzeLeadsMutation={analyzeLeadsMutation}
        selectedLead={selectedLead}
        setSelectedLead={setSelectedLead}
        isEditing={isEditingLead}
        setIsEditing={setIsEditingLead}
        properties={properties}
        setShowDocumentAutomation={setShowDocumentAutomation}
        setDocumentAutomationLead={setDocumentAutomationLead}
        setDocumentAutomationProperty={setDocumentAutomationProperty}
      />
      <VoiceQuickAddModal 
        showVoiceQuickAdd={showVoiceQuickAdd} 
        setShowVoiceQuickAdd={setShowVoiceQuickAdd} 
        addLeadMutation={addLeadMutation} 
        addTaskMutation={addTaskMutation} 
        addVisitMutation={addVisitMutation} 
      />
    </>
  );
};
