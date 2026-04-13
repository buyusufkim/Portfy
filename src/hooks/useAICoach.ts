import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { coachService } from '../services/coachService';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useAuth } from '../AuthContext';
import { AICoachAction } from '../types/ai';
import confetti from 'canvas-confetti';

export const useAICoach = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: insight, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.AI_COACH_INSIGHT, profile?.uid],
    queryFn: api.getDetailedCoachInsight,
    enabled: !!profile?.uid,
    staleTime: 1000 * 60 * 15, // 15 dakika cache
  });

  const convertToTaskMutation = useMutation({
    mutationFn: (action: AICoachAction) => coachService.convertActionToTask(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.uid] });
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    }
  });

  const isPremium = profile?.broker_level && profile.broker_level >= 2;

  return {
    insight: insight?.insight,
    generated_at: insight?.generated_at,
    isLoading,
    error,
    refetch,
    convertToTask: convertToTaskMutation.mutate,
    isConverting: convertToTaskMutation.isPending,
    isPremium
  };
};
