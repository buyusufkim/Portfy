import React from 'react';
import { AddVisitModal } from './AddVisitModal';
import { RescueModeModal } from './RescueModeModal';
import { MissedOpportunitiesModal } from './MissedOpportunitiesModal';
import { AddTaskModal } from './AddTaskModal';
import { DocumentAutomationModal } from '../../documents/DocumentAutomationModal';

import { Task, Building, RescueSession, MissedOpportunity, MutationResult, Lead, Property, UserProfile } from '../../../types';

interface UtilityModalsProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: MutationResult<any, any>;
  showAddTask: boolean;
  setShowAddTask: (val: boolean) => void;
  addTaskMutation: MutationResult<any, any>;
  leads: Lead[];
  properties: Property[];
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  cancelRescueMutation: MutationResult<any, any>;
  completeRescueTaskMutation: MutationResult<any, any>;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
  showDocumentAutomation: boolean;
  setShowDocumentAutomation: (val: boolean) => void;
  documentAutomationProperty: Property | null;
  documentAutomationLead: Lead | null;
  profile: UserProfile | null;
  addLeadMutation: MutationResult<any, any>;
}

export const UtilityModals: React.FC<UtilityModalsProps> = ({
  showAddVisit,
  setShowAddVisit,
  addVisitMutation,
  showAddTask,
  setShowAddTask,
  addTaskMutation,
  leads,
  properties,
  tasks,
  fieldVisits,
  rescueSession,
  cancelRescueMutation,
  completeRescueTaskMutation,
  showMissedOpportunities,
  setShowMissedOpportunities,
  missedOpportunities,
  setActiveTab,
  showDocumentAutomation,
  setShowDocumentAutomation,
  documentAutomationProperty,
  documentAutomationLead,
  profile,
  addLeadMutation
}) => {
  return (
    <>
      <AddVisitModal 
        showAddVisit={showAddVisit} 
        setShowAddVisit={setShowAddVisit} 
        addVisitMutation={addVisitMutation} 
      />
      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={(data) => {
          addTaskMutation.mutate(data);
          setShowAddTask(false);
        }}
        leads={leads}
        properties={properties}
      />
      <RescueModeModal 
        rescueSession={rescueSession} 
        cancelRescueMutation={cancelRescueMutation} 
        completeRescueTaskMutation={completeRescueTaskMutation} 
      />
      <MissedOpportunitiesModal 
        showMissedOpportunities={showMissedOpportunities} 
        setShowMissedOpportunities={setShowMissedOpportunities} 
        missedOpportunities={missedOpportunities} 
        setActiveTab={setActiveTab} 
      />
      <DocumentAutomationModal 
        isOpen={showDocumentAutomation}
        onClose={() => setShowDocumentAutomation(false)}
        property={documentAutomationProperty}
        lead={documentAutomationLead}
        agentProfile={profile}
        allLeads={leads}
        allProperties={properties}
        addLeadMutation={addLeadMutation}
      />
    </>
  );
};
