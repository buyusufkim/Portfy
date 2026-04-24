import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useAuth } from '../AuthContext';
import { calculateLevel, calculateProgressToNextLevel, getLevelName } from '../lib/habitUtils';
import confetti from 'canvas-confetti';
import { DayClosure } from '../types';

export const useHabitEngine = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: gamifiedTasks = [], isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.id
  });

  const { data: dailyStats = [], isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.DAILY_STATS, profile?.id],
    queryFn: () => api.getDailyStats(7),
    enabled: !!profile?.id
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => 
      api.completeGamifiedTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DAILY_STATS, profile?.id] });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  const startDayMutation = useMutation({
    mutationFn: api.startDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
    }
  });

  const endDayMutation = useMutation({
    mutationFn: (stats: Partial<DayClosure>) => 
      api.endDay(stats),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DAILY_STATS, profile?.id] });
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.5 }
      });
    }
  });

  const level = profile ? calculateLevel(profile.total_xp) : 1;
  const levelProgress = profile ? calculateProgressToNextLevel(profile.total_xp) : 0;
  const levelName = getLevelName(level);

  return {
    profile,
    gamifiedTasks,
    dailyStats,
    tasksLoading,
    tasksError,
    isLoading: tasksLoading || statsLoading,
    completeTask: completeTaskMutation.mutate,
    isCompletingTask: completeTaskMutation.isPending,
    startDay: startDayMutation.mutate,
    isStartingDay: startDayMutation.isPending,
    endDay: endDayMutation.mutate,
    isEndingDay: endDayMutation.isPending,
    level,
    levelProgress,
    levelName
  };
};
