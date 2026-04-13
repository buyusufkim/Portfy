import { useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '../services/whatsappService';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useAuth } from '../AuthContext';
import { WhatsAppAnalysis } from '../types/whatsapp';
import confetti from 'canvas-confetti';

export const useWhatsAppAnalysis = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: (text: string) => whatsappService.analyzeConversation(text),
    onSuccess: () => {
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    }
  });

  const addToCRMMutation = useMutation({
    mutationFn: (analysis: WhatsAppAnalysis) => whatsappService.addToCRM(analysis),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  });

  const createFollowUpMutation = useMutation({
    mutationFn: (analysis: WhatsAppAnalysis) => whatsappService.createFollowUpTask(analysis),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.uid] });
    }
  });

  const isPremium = profile?.brokerLevel && profile.brokerLevel >= 2;

  return {
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    analysisResult: analyzeMutation.data?.analysis,
    error: analyzeMutation.error,
    reset: analyzeMutation.reset,
    addToCRM: addToCRMMutation.mutate,
    isAddingToCRM: addToCRMMutation.isPending,
    createFollowUp: createFollowUpMutation.mutate,
    isCreatingFollowUp: createFollowUpMutation.isPending,
    isPremium
  };
};
