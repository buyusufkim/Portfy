import React from 'react';
import { CRMModals } from '../../../pages/CRMPage';
import { VoiceQuickAddModal } from './VoiceQuickAddModal';

import { Lead } from '../../../types';

interface LeadModalsProps {
  categories: string[];
  addLeadMutation: any;
  showAddLead: boolean;
  setShowAddLead: (val: boolean) => void;
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (val: boolean) => void;
  leadAnalysis: string | null;
  setLeadAnalysis: (val: string | null) => void;
  analyzeLeadsMutation: any;
  showVoiceQuickAdd: boolean;
  setShowVoiceQuickAdd: (val: boolean) => void;
  addTaskMutation: any;
  addVisitMutation: any;
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
