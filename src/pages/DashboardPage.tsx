import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { DashboardView } from '../components/DashboardView';
import { useRevenueStats } from '../hooks/useRevenueStats';
import { UserProfile, Property, GamifiedTask, Task, PersonalTask, RescueSession, MissedOpportunity } from '../types';

interface DashboardPageProps {
  profile: UserProfile | null;
  properties: Property[];
  gamifiedTasks: GamifiedTask[];
  personalTasks: PersonalTask[];
  tasks: Task[];
  rescueSession: RescueSession | null;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowDailyRadar: (show: boolean) => void;
  setShowDayCloser: (show: boolean) => void;
  setShowMissedOpportunities: (show: boolean) => void;
  setToast: (toast: { message: string, type: 'success' | 'error' | 'info' } | null) => void;
  completeMorningRitualMutation: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  properties,
  gamifiedTasks,
  personalTasks,
  tasks,
  rescueSession,
  missedOpportunities,
  setActiveTab,
  setShowAdminPanel,
  setShowDailyRadar,
  setShowDayCloser,
  setShowMissedOpportunities,
  setToast,
  completeMorningRitualMutation
}) => {
  const queryClient = useQueryClient();

  // Dashboard-specific queries
  const { data: revenueStats, isLoading: revenueLoading } = useRevenueStats();

  const { data: gamifiedStats } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid],
    queryFn: api.getGamifiedStats,
    enabled: !!profile?.uid
  });

  const { data: coachInsights } = useQuery({
    queryKey: [QUERY_KEYS.COACH_INSIGHTS, profile?.uid],
    queryFn: api.getCoachInsights,
    enabled: !!profile?.uid
  });

  // Dashboard-specific mutations
  const refreshTasksMutation = useMutation({
    mutationFn: () => api.getDailyGamifiedTasks(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid] });
      setToast({ message: 'Görevler başarıyla güncellendi', type: 'success' });
    },
    onError: (error: any) => {
      console.error('Task refresh error:', error);
      setToast({ message: 'Görevler oluşturulurken bir hata oluştu', type: 'error' });
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ task }: { task: GamifiedTask }) => {
      console.log("Görev tamamlama başlatıldı:", task.title);
      const { verified, message } = await api.verifyGamifiedTask(task);
      console.log("Doğrulama sonucu:", verified, message);
      if (!verified) throw new Error(message || "Görev doğrulanamadı.");
      return api.completeGamifiedTask(task.id, task.points);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COACH_INSIGHTS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
      setToast({ message: "Görev başarıyla tamamlandı!", type: 'success' });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f97316', '#fb923c', '#fdba74']
      });
    },
    onError: (error: any) => {
      console.error("Görev tamamlama hatası:", error);
      setToast({ message: error.message, type: 'error' });
    }
  });

  const startDayMutation = useMutation({
    mutationFn: api.startDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS] });
      setToast({ message: "Günün başarıyla başlatıldı!", type: 'success' });
    },
    onError: (error: any) => {
      console.error("Günü başlatma hatası:", error);
      setToast({ message: "Günü başlatırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"), type: 'error' });
    }
  });

  const startRescueMutation = useMutation({
    mutationFn: api.startRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION] });
    }
  });

  // Auto-complete specific gamified tasks
  const completingTasks = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (gamifiedTasks && gamifiedTasks.length > 0 && profile?.uid) {
      // 1. Peş peşe girişini sürdür
      const loginTask = gamifiedTasks.find(t => t.title === "Peş peşe girişini sürdür" && !t.is_completed);
      if (loginTask && !completingTasks.current.has(loginTask.id)) {
        completingTasks.current.add(loginTask.id);
        completeTaskMutation.mutate({ task: loginTask });
      }

      // 2. Bugün 100 puan kazan
      const pointsTask = gamifiedTasks.find(t => t.title === "Bugün 100 puan kazan" && !t.is_completed);
      if (pointsTask && (gamifiedStats?.points_today || 0) >= 100 && !completingTasks.current.has(pointsTask.id)) {
        completingTasks.current.add(pointsTask.id);
        completeTaskMutation.mutate({ task: pointsTask });
      }
    }
  }, [gamifiedTasks, profile?.uid, gamifiedStats?.points_today]);

  return (
    <DashboardView 
      gamifiedTasks={gamifiedTasks}
      properties={properties}
      profile={profile}
      gamifiedStats={gamifiedStats}
      coachInsights={coachInsights}
      tasks={tasks}
      personalTasks={personalTasks}
      startRescueMutation={startRescueMutation}
      rescueSession={rescueSession}
      completeMorningRitualMutation={completeMorningRitualMutation}
      setActiveTab={setActiveTab}
      setShowAdminPanel={setShowAdminPanel}
      refreshTasksMutation={refreshTasksMutation}
      completeTaskMutation={completeTaskMutation}
      setShowDailyRadar={setShowDailyRadar}
      setShowDayCloser={setShowDayCloser}
      setShowMissedOpportunities={setShowMissedOpportunities}
      missedOpportunities={missedOpportunities}
      startDayMutation={startDayMutation}
      revenueStats={revenueStats}
      revenueLoading={revenueLoading}
      queryClient={queryClient}
    />
  );
};
