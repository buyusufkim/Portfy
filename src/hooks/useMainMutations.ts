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
    mutationFn: async (variables: Partial<DailyPlan>) => {
      await api.momentumOs.saveDailyPlan(variables);
      return api.startDay();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MOMENTUM_DAILY_PLAN],
      });
      setShowDailyRadar(false);
      setToast({
        message: "Güne harika bir başlangıç yaptın!",
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
      await api.momentumOs.saveDayClosure(variables);
      return api.endDay(variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MOMENTUM_DAY_CLOSURE],
      });
      setShowDayCloser(false);
      setToast({
        message: "Günü başarıyla kapattın. İyi dinlenmeler!",
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
