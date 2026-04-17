import React from 'react';
import { AddVisitModal } from './AddVisitModal';
import { RescueModeModal } from './RescueModeModal';
import { MissedOpportunitiesModal } from './MissedOpportunitiesModal';

import { Task, Building, RescueSession, MissedOpportunity, MutationResult } from '../../../types';

interface UtilityModalsProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: MutationResult<any, any>;
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  cancelRescueMutation: MutationResult<any, any>;
  completeRescueTaskMutation: MutationResult<any, any>;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
}

export const UtilityModals: React.FC<UtilityModalsProps> = ({
  showAddVisit,
  setShowAddVisit,
  addVisitMutation,
  tasks,
  fieldVisits,
  rescueSession,
  cancelRescueMutation,
  completeRescueTaskMutation,
  showMissedOpportunities,
  setShowMissedOpportunities,
  missedOpportunities,
  setActiveTab
}) => {
  return (
    <>
      <AddVisitModal 
        showAddVisit={showAddVisit} 
        setShowAddVisit={setShowAddVisit} 
        addVisitMutation={addVisitMutation} 
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
    </>
  );
};
