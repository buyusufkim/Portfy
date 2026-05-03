import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { Lead, DailyPlan, DayClosure, UserProfile } from "../types";
import confetti from "canvas-confetti";

interface MainMutationsProps {
  profileId?: string;
  setToast: (toast: { message: string; type: "success" | "error" | "info" }) => void;
  setShowAddLead: (v: boolean) => void;
  setShowQuickAdd: (v: boolean) => void;
  setIsEditingLead: (v: boolean) => void;
  setSelectedLead: (v: Lead | null) => void;
  setShowAddVisit: (v: boolean) => void;
  setShowDailyRadar: (v: boolean) => void;
  setShowDayCloser: (v: boolean) => void;
  setLeadAnalysis: (v: string | null) => void;
  setIsAnalyzingLeads: (v: boolean) => void;
  setShowIntegrationModal: (v: boolean) => void;
}

export function useMainMutations({
  profileId,
  setToast,
  setShowAddLead,
  setShowQuickAdd,
  setIsEditingLead,
  setSelectedLead,
  setShowAddVisit,
  setShowDailyRadar,
  setShowDayCloser,
  setLeadAnalysis,
  setIsAnalyzingLeads,
  setShowIntegrationModal,
}: MainMutationsProps) {
  const queryClient = useQueryClient();

  const addLeadMutation = useMutation({
    mutationFn: api.addLead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEADS, profileId],
      });
      setShowAddLead(false);
      setShowQuickAdd(false);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, lead }: { id: string; lead: Partial<Lead> }) =>
      api.updateLead(id, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEADS, profileId],
      });
      setShowAddLead(false);
      setIsEditingLead(false);
      setSelectedLead(null);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: api.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.LEADS, profileId],
      });
      setSelectedLead(null);
    },
  });

  const addVisitMutation = useMutation({
    mutationFn: api.addVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FIELD_VISITS, profileId],
      });
      setShowAddVisit(false);
      setShowQuickAdd(false);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: api.addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, profileId],
      });
    },
  });

  const addPersonalTaskMutation = useMutation({
    mutationFn: api.addPersonalTask,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PERSONAL_TASKS, profileId],
      });
    },
  });

  const completeMorningRitualMutation = useMutation({
    mutationFn: async (variables: Partial<DailyPlan> & { early_start_reason?: string }) => {
      // Create a micro goal from the top3 focus, if it exists
      if (variables.top3 && variables.top3.length > 0 && variables.top3[0]?.trim()) {
         try {
           await api.momentumOs.setDailyFocus(variables.top3[0], new Date().toISOString(), 'day_start_focus');
         } catch (e) {
           console.error("Failed to add today's MicroGoal", e);
         }
      }
      await api.momentumOs.saveDailyPlan(variables);
      return api.startDay({ early_start_reason: variables.early_start_reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MOMENTUM_DAILY_PLAN],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS, profileId]
      });
      setShowDailyRadar(false);
      const xpMessage = data?.xp_awarded ? ` +${data.xp_awarded} XP!` : "!";
      setToast({
        message: `Güne harika bir başlangıç yaptın${xpMessage}`,
        type: "success",
      });
    },
    onError: () => {
      setShowDailyRadar(false);
      setToast({ message: "Güne zaten başlamıştın.", type: "info" });
    },
  });

  const completeEveningRitualMutation = useMutation({
    mutationFn: async (variables: Partial<DayClosure>) => {
      // Create tomorrow's micro goal from tomorrow_top3 focus, if it exists
      if (variables.tomorrow_top3 && variables.tomorrow_top3.length > 0 && variables.tomorrow_top3[0]?.trim()) {
         try {
           const tomorrow = new Date();
           tomorrow.setDate(tomorrow.getDate() + 1);
           await api.momentumOs.setDailyFocus(variables.tomorrow_top3[0], tomorrow.toISOString(), 'day_close_tomorrow_focus');
         } catch (e) {
           console.error("Failed to add tomorrow's MicroGoal", e);
         }
      }
      await api.momentumOs.saveDayClosure(variables);
      return api.endDay(variables);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MOMENTUM_DAY_CLOSURE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS, profileId]
      });
      if (profileId) {
        // Fallback for immediate UI update: store locally using current local date which usually overlaps enough with TR date.
        const todayStr = new Date().toISOString().split("T")[0];
        localStorage.setItem(`day_ended_${profileId}_${todayStr}`, "true");
      }
      setShowDayCloser(false);
      const xpMessage = data?.xp_awarded ? ` +${data.xp_awarded} XP!` : "!";
      setToast({
        message: `Günü başarıyla kapattın. İyi dinlenmeler${xpMessage}`,
        type: "success",
      });
      confetti();
    },
  });

  const cancelRescueMutation = useMutation({
    mutationFn: api.cancelRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESCUE_SESSION, profileId],
      });
    },
  });

  const completeRescueTaskMutation = useMutation({
    mutationFn: ({
      sessionId,
      taskId,
    }: {
      sessionId: string;
      taskId: string;
    }) => api.completeRescueTask(sessionId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESCUE_SESSION, profileId],
      });
    },
  });

  const analyzeLeadsMutation = useMutation({
    mutationFn: api.analyzeLeads,
    onSuccess: (data) => {
      setLeadAnalysis(data);
      setIsAnalyzingLeads(false);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserProfile> }) =>
      api.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE, profileId],
      });
    },
  });

  const syncListingsMutation = useMutation({
    mutationFn: api.syncExternalListings,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profileId],
      });
    },
  });

  const linkPropertyMutation = useMutation({
    mutationFn: ({
      propertyId,
      externalId,
    }: {
      propertyId: string;
      externalId: string;
    }) => api.linkPropertyToExternal(propertyId, externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTIES, profileId],
      });
    },
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: (apiKey: string) => api.connectSahibinden(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profileId],
      });
      setShowIntegrationModal(false);
    },
  });

  return {
    addLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
    addVisitMutation,
    addTaskMutation,
    addPersonalTaskMutation,
    completeMorningRitualMutation,
    completeEveningRitualMutation,
    cancelRescueMutation,
    completeRescueTaskMutation,
    analyzeLeadsMutation,
    updateProfileMutation,
    syncListingsMutation,
    linkPropertyMutation,
    connectIntegrationMutation,
  };
}
