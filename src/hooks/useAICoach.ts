import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { coachService } from "../services/coachService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { useAuth } from "../AuthContext";
import { taskService } from "../services/taskService";
import { leadService } from "../services/leadService";
import { propertyService } from "../services/propertyService";

export const useAICoach = () => {
  const { profile } = useAuth();

  const {
    data: insight,
    isPending,
    error,
    mutate: fetchInsight,
    mutateAsync: fetchInsightAsync,
  } = useMutation({
    mutationFn: (params: { requestType?: string; customMessage?: string }) => 
      coachService.getDetailedInsight(params),
  });

  const { data: stats } = useQuery({
    queryKey: ['coach_operations_summary', profile?.id],
    queryFn: async () => {
      const [tasks, leads, properties] = await Promise.all([
        taskService.getTasks(),
        leadService.getLeads(),
        propertyService.getProperties()
      ]);
      const openTasks = tasks.filter(t => !t.completed).length;
      const todayTasks = tasks.filter(t => !t.completed && new Date(t.due_date).toDateString() === new Date().toDateString()).length;
      const overdueTasks = tasks.filter(t => !t.completed && new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0))).length;
      const hotLeads = leads.filter(l => l.status === 'Sıcak').length;
      const activeProperties = properties.filter(p => ['Yayında', 'İlgi Var', 'Pazarlık', 'Yeni'].includes(p.status)).length;
      return { openTasks, todayTasks, overdueTasks, hotLeads, activeProperties };
    },
    enabled: !!profile?.id
  });

  const isPremium = profile?.broker_level && profile.broker_level >= 2;

  return {
    insight: insight?.insight,
    generated_at: insight?.generated_at,
    isLoading: isPending,
    error,
    fetchInsight,
    fetchInsightAsync,
    stats,
    isPremium,
    profile
  };
};
