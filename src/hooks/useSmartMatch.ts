import { useMutation, useQueryClient } from '@tanstack/react-query';
import { smartMatchService } from '../services/smartMatchService';
import { useAuth } from '../AuthContext';

export const useSmartMatch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const runMatchMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('User not found');
      return await smartMatchService.runSmartMatchForNewProperty(propertyId, user.id);
    },
    onSuccess: () => {
      // Eşleşme yakalanırsa, AI Koç (Insights) panelini anında yenile
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    }
  });

  return {
    runSmartMatch: runMatchMutation.mutate,
    runSmartMatchAsync: runMatchMutation.mutateAsync,
    isMatching: runMatchMutation.isPending,
  };
};