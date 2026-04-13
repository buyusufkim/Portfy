import React from 'react';
import { CRMModals } from '../../../pages/CRMPage';
import { VoiceQuickAddModal } from './VoiceQuickAddModal';

import { Lead, Category, MutationResult } from '../../../types';

interface LeadModalsProps {
  categories: Category[];
  addLeadMutation: MutationResult<any, any>;
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
}

export const LeadModals: React.FC<LeadModalsProps> = ({
  categories,
  addLeadMutation,
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
  addVisitMutation
}) => {
  return (
    <>
      <CRMModals 
        categories={categories}
        addLeadMutation={addLeadMutation}
        showAddLead={showAddLead}
        setShowAddLead={setShowAddLead}
        showWhatsAppImport={showWhatsAppImport}
        setShowWhatsAppImport={setShowWhatsAppImport}
        leadAnalysis={leadAnalysis}
        setLeadAnalysis={setLeadAnalysis}
        analyzeLeadsMutation={analyzeLeadsMutation}
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
