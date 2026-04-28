import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { UserProfile, Lead, DailyPlan, DayClosure } from "../types";

export function useMainQueries(profileId: string | undefined, showDailyRadar: boolean) {
  const { data: leads = [] } = useQuery({
    queryKey: [QUERY_KEYS.LEADS, profileId],
    queryFn: api.getLeads,
    enabled: !!profileId,
  });
  const { data: properties = [] } = useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, profileId],
    queryFn: api.getProperties,
    enabled: !!profileId,
  });
  const { data: personalTasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_TASKS, profileId],
    queryFn: api.getPersonalTasks,
    enabled: !!profileId,
  });
  const {
    data: gamifiedTasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
  } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profileId],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profileId,
  });
  const { data: fieldVisits = [] } = useQuery({
    queryKey: [QUERY_KEYS.FIELD_VISITS, profileId],
    queryFn: api.getFieldVisits,
    enabled: !!profileId,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, profileId],
    queryFn: api.getTasks,
    enabled: !!profileId,
  });
  const { data: regionScores = [] } = useQuery({
    queryKey: [QUERY_KEYS.REGION_SCORES, profileId],
    queryFn: api.getRegionEfficiencyScores,
    enabled: !!profileId,
  });
  const { data: brokerAccount } = useQuery({
    queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profileId],
    queryFn: api.getBrokerAccount,
    enabled: !!profileId,
  });
  const { data: externalListings = [] } = useQuery({
    queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profileId],
    queryFn: api.getExternalListings,
    enabled: !!profileId,
  });
  const { data: rescueSession } = useQuery({
    queryKey: [QUERY_KEYS.RESCUE_SESSION, profileId],
    queryFn: api.getRescueSession,
    enabled: !!profileId,
  });
  const { data: missedOpportunities = [] } = useQuery({
    queryKey: [QUERY_KEYS.MISSED_OPPORTUNITIES, profileId],
    queryFn: api.getMissedOpportunities,
    enabled: !!profileId,
  });
  const { data: dailyRadarData } = useQuery({
    queryKey: [QUERY_KEYS.DAILY_RADAR, profileId],
    queryFn: () => api.getDailyRadar(),
    enabled: !!profileId && showDailyRadar,
  });

  return {
    leads,
    properties,
    personalTasks,
    gamifiedTasks,
    tasksLoading,
    tasksError,
    fieldVisits,
    tasks,
    regionScores,
    brokerAccount,
    externalListings,
    rescueSession,
    missedOpportunities,
    dailyRadarData,
  };
}
