import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { Lead, DailyPlan, DayClosure, UserProfile } from "../types";
import confetti from "canvas-confetti";
import { getTodayStr } from "../services/core/utils";

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
      if (data?.xp_awarded) {
         confetti();
      }
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
           const tomorrowStr = getTodayStr(tomorrow);
           await api.momentumOs.setDailyFocus(variables.tomorrow_top3[0], tomorrowStr, 'day_close_tomorrow_focus');
         } catch (e) {
           console.error("Failed to add tomorrow's MicroGoal", e);
         }
      }
      
      // Upsert to campaign90 answers if applicable
      if (variables.campaign_day) {
        try {
           const cAnswersService = await import('../services/campaign90AnswerService');
           const ansPayload: Record<string, string> = {
               source: 'day_close'
           };
           if (variables.wins) ansPayload.daily_win = variables.wins;
           if (variables.blockers) ansPayload.main_blocker = variables.blockers;
           if (variables.tomorrow_top3 && variables.tomorrow_top3[0]) ansPayload.tomorrow_focus = variables.tomorrow_top3[0];
           if (variables.campaign_focus_reflection) ansPayload.campaign_focus_reflection = variables.campaign_focus_reflection;
           if (variables.discipline_score) ansPayload.discipline_score = variables.discipline_score;
           
           await cAnswersService.campaign90AnswerService.saveMyCampaign90DayAnswers(variables.campaign_day, ansPayload);
        } catch (e) {
           console.error("Failed to save campaign day reflection on end_day", e);
        }
      }

      console.log("Saving DayClosure", variables);
      const closure = await api.momentumOs.saveDayClosure(variables);
      console.log("saveDayClosure ok");
      
      let xpResult = null;
      try {
         xpResult = await api.endDay(variables);
         console.log("endDay ok", xpResult);
      } catch (e) {
         console.error("endDay failed", e);
         throw e;
      }
      
      return { closure, xpResult };
    },
    onSuccess: (data) => {
      const nowIso = new Date().toISOString();
      queryClient.setQueryData([QUERY_KEYS.PROFILE], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          last_ritual_completed_at: nowIso,
          last_end_day_xp_at: nowIso
        };
      });
      queryClient.setQueryData([QUERY_KEYS.PROFILE, profileId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          last_ritual_completed_at: nowIso,
          last_end_day_xp_at: nowIso
        };
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS, profileId],
      });
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
      queryClient.invalidateQueries({
        queryKey: ['campaign90_active']
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign90_tasks']
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign90_progress']
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign_90_report']
      });
      if (profileId) {
        const todayStr = getTodayStr(new Date());
        localStorage.setItem(`day_ended_${profileId}_${todayStr}`, nowIso);
      }
      setShowDayCloser(false);
      
      const xpMessage = data?.xpResult?.xp_awarded ? ` +${data.xpResult.xp_awarded} XP!` : "!";
      if (data?.xpResult?.xp_awarded === 0) {
        setToast({
          message: "Bugün zaten kapatılmış.",
          type: "info",
        });
      } else {
        setToast({
          message: `Günü başarıyla kapattın. İyi dinlenmeler${xpMessage}`,
          type: "success",
        });
        confetti();
      }
    },
    onError: (e) => {
      console.error("Gün kapatılamadı:", e);
      setToast({
         message: "Gün kapatılamadı: " + (e instanceof Error ? e.message : String(e)),
         type: "error"
      });
    },
  });

  const cancelRescueMutation = useMutation({
    mutationFn: api.cancelRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.RESCUE_SESSION, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROFILE, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profileId],
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TASKS, profileId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profileId],
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
