import React from 'react';
import { AddVisitModal } from './AddVisitModal';
import { RescueModeModal } from './RescueModeModal';
import { MissedOpportunitiesModal } from './MissedOpportunitiesModal';
import { AddTaskModal } from './AddTaskModal';
// Lazy load DocumentAutomationModal
const DocumentAutomationModal = React.lazy(() => import('../../documents/DocumentAutomationModal').then(m => ({ default: m.DocumentAutomationModal })));

import { Task, Building, RescueSession, MissedOpportunity, MutationResult, Lead, Property, UserProfile, PersonalTask } from '../../../types';
import toast from 'react-hot-toast';

interface UtilityModalsProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: MutationResult<unknown, Omit<Building, "id" | "user_id">>;
  showAddTask: boolean;
  setShowAddTask: (val: boolean) => void;
  addTaskMutation: MutationResult<string, Omit<Task, 'id' | 'user_id'>>;
  addPersonalTaskMutation: MutationResult<string, Omit<PersonalTask, 'id' | 'user_id' | 'created_at'>>;
  leads: Lead[];
  properties: Property[];
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  cancelRescueMutation: MutationResult<unknown, unknown>;
  completeRescueTaskMutation: MutationResult<unknown, unknown>;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
  showDocumentAutomation: boolean;
  setShowDocumentAutomation: (val: boolean) => void;
  documentAutomationProperty: Property | null;
  documentAutomationLead: Lead | null;
  profile: UserProfile | null;
  addLeadMutation: MutationResult<unknown, unknown>;
}

export const UtilityModals: React.FC<UtilityModalsProps> = ({
  showAddVisit,
  setShowAddVisit,
  addVisitMutation,
  showAddTask,
  setShowAddTask,
  addTaskMutation,
  addPersonalTaskMutation,
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
        onSubmit={async (data) => {
          try {
            await addTaskMutation.mutateAsync(data);
            toast.success('Görev eklendi');
            setShowAddTask(false);
          } catch (error) {
            toast.error('Görev eklenirken bir hata oluştu');
            throw error;
          }
        }}
        onSubmitPersonal={async (data) => {
          try {
            await addPersonalTaskMutation.mutateAsync(data);
            toast.success("Kişisel hatırlatıcı eklendi");
            setShowAddTask(false);
          } catch (error) {
            toast.error("Kişisel hatırlatıcı eklenemedi");
            throw error;
          }
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
      <React.Suspense fallback={null}>
        {showDocumentAutomation && (
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
        )}
      </React.Suspense>
    </>
  );
};
