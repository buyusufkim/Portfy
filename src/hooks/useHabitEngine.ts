import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../AuthContext';
import { calculateLevel, calculateProgressToNextLevel, getLevelName } from '../lib/habitUtils';
import confetti from 'canvas-confetti';

export const useHabitEngine = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: gamifiedTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['gamifiedTasks', profile?.uid],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.uid
  });

  const { data: dailyStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['dailyStats', profile?.uid],
    queryFn: () => api.getDailyStats(7),
    enabled: !!profile?.uid
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, points }: { taskId: string, points: number }) => 
      api.completeGamifiedTask(taskId, points),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamifiedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  const startDayMutation = useMutation({
    mutationFn: api.completeMorningRitual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const endDayMutation = useMutation({
    mutationFn: (stats: { tasks_completed: number, revenue: number, calls: number, visits: number }) => 
      api.completeEveningRitual(stats),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
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
