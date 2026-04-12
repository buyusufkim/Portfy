import React from 'react';
import { AddVisitModal } from './AddVisitModal';
import { DailyBriefingModal } from './DailyBriefingModal';
import { RescueModeModal } from './RescueModeModal';
import { MissedOpportunitiesModal } from './MissedOpportunitiesModal';

import { Task, Building, RescueSession, MissedOpportunity } from '../../../types';

interface UtilityModalsProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: any;
  showDailyBriefing: boolean;
  setShowDailyBriefing: (val: boolean) => void;
  tasks: Task[];
  fieldVisits: Building[];
  rescueSession: RescueSession | null;
  cancelRescueMutation: any;
  completeRescueTaskMutation: any;
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
}

export const UtilityModals: React.FC<UtilityModalsProps> = ({
  showAddVisit,
  setShowAddVisit,
  addVisitMutation,
  showDailyBriefing,
  setShowDailyBriefing,
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
      <DailyBriefingModal 
        showDailyBriefing={showDailyBriefing} 
        setShowDailyBriefing={setShowDailyBriefing} 
        tasks={tasks} 
        fieldVisits={fieldVisits} 
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
