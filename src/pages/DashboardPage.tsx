import React, { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { DashboardView } from '../components/DashboardView';
import { useRevenueStats } from '../hooks/useRevenueStats';
import { getTodayStr } from '../services/core/utils';
import { UserProfile, Property, GamifiedTask, Task, PersonalTask, RescueSession, MissedOpportunity, MutationResult, Lead, DailyPlan } from '../types';

interface DashboardPageProps {
  profile: UserProfile | null;
  properties: Property[];
  gamifiedTasks: GamifiedTask[];
  isGamifiedTasksLoading: boolean;
  isGamifiedTasksError: boolean;
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
  completeMorningRitualMutation: MutationResult<{ success: boolean; }, Partial<DailyPlan>>;
  setSelectedLead: (val: Lead | null) => void;
  setSelectedProperty: (val: Property | null) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  properties,
  gamifiedTasks,
  isGamifiedTasksLoading,
  isGamifiedTasksError,
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
  completeMorningRitualMutation,
  setSelectedLead,
  setSelectedProperty
}) => {
  const queryClient = useQueryClient();

  // Dashboard-specific queries
  const { data: revenueStats, isLoading: revenueLoading } = useRevenueStats();

  const { data: gamifiedStats } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id],
    queryFn: () => api.getGamifiedStats(),
    enabled: !!profile?.id
  });

  const staticCoachInsight = React.useMemo(() => {
    const overdueTasks = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date());
    let tip = "Bugünün odağını tek aksiyona indir.";
    
    if (overdueTasks.length > 0) {
      tip = `Geciken ${overdueTasks.length} görevin var. Önce geciken takipleri kapat.`;
    } else if (tasks.length === 0 && personalTasks.length === 0) {
      tip = "Bugün için küçük bir hedef belirle ve güne başla.";
    } else {
      const remainingTasks = tasks.filter(t => !t.completed).length;
      if (remainingTasks > 0) {
         tip = `Bugün bekleyen ${remainingTasks} görevin var. En önemlisinden başla.`;
      }
    }

    return {
      score: 80,
      daily_tip: tip,
      strength: { title: "Düzen", description: "İyi bir ritim" },
      weakness: { title: "Odak", description: "Bir şeye odaklan" },
      recommended_tasks: [],
      market_opportunities: [],
      focus_areas: []
    };
  }, [tasks, personalTasks]);

  // Dashboard-specific mutations
  const refreshTasksMutation = useMutation({
    mutationFn: () => api.getDailyGamifiedTasks(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id] });
      setToast({ message: 'Görevler başarıyla güncellendi', type: 'success' });
    },
    onError: (error: Error) => {
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
      return api.completeGamifiedTask(task.id);
    },
    // onSuccess parametresine 'variables' ekliyoruz ki tıklanan görevin puanına ve adına ulaşabilelim
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
      
      // 🔥 İŞTE BURASI: Kendi UI kütüphanendeki bildirim sistemini XP için kullanıyoruz 🔥
      setToast({ 
        message: `Harika! "${variables.task.title}" tamamlandı. +${variables.task.points} XP kazandın!`, 
        type: 'success' 
      });
      
      // Zaten kurmuş olduğun harika konfeti efekti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f97316', '#fb923c', '#fdba74']
      });
    },
    onError: (error: Error) => {
      console.error("Görev tamamlama hatası:", error);
      setToast({ message: error.message, type: 'error' });
    }
  });

  const startDayMutation = useMutation({
    mutationFn: async (variables?: { early_start_reason?: string }) => {
      // 1. Start the day on the backend
      await api.startDay(variables);
      
      // 2. Try to refresh tasks, but don't let it block the success of starting the day
      try {
        await api.getDailyGamifiedTasks(true);
      } catch (e) {
        console.error("Failed to refresh tasks after startDay, but day is started", e);
      }
      return true;
    },
    onSuccess: () => {
      if (profile?.id) {
        const todayISO = getTodayStr();
        localStorage.setItem(`day_started_${profile.id}_${todayISO}`, new Date().toISOString());
      }
      // Invalidate all relevant queries to sync UI
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] });
      setToast({ message: "Günün başarıyla başlatıldı!", type: 'success' });
    },
    onError: (error: Error) => {
      console.error("Günü başlatma hatası:", error);
      
      // If the error indicates it was already started, we should sync local state
      if (error.message?.includes("already awarded") || error.message?.includes("already started")) {
        if (profile?.id) {
          const todayISO = getTodayStr();
          localStorage.setItem(`day_started_${profile.id}_${todayISO}`, new Date().toISOString());
        }
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.id] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] });
        setToast({ message: "Güne zaten başlamıştın, başarılar!", type: 'info' });
      } else {
        setToast({ message: "Günü başlatırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"), type: 'error' });
      }
    }
  });

  const startRescueMutation = useMutation({
    mutationFn: api.startRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.id] });
    }
  });

  // Removed: Auto-completing specific gamified tasks automatically
  const completingTasks = useRef<Set<string>>(new Set());
  useEffect(() => {
    // Intentionally left empty to prevent automatic gamification triggers on dashboard open
  }, [gamifiedTasks, profile?.id, gamifiedStats?.points_today]);

  const { data: leadAlerts = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_LEAD_ALERTS, profile?.id],
    queryFn: () => api.momentumOs.getLeadAlerts(),
    enabled: !!profile?.id
  });

  const { data: dailyPlan } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_DAILY_PLAN, profile?.id],
    queryFn: () => api.momentumOs.getDailyPlan(),
    enabled: !!profile?.id
  });

  const { data: dayClosure } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_DAY_CLOSURE, profile?.id],
    queryFn: () => api.momentumOs.getDayClosure(),
    enabled: !!profile?.id
  });

  const { data: weeklyReports = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_WEEKLY_REPORTS, profile?.id],
    queryFn: () => api.momentumOs.getWeeklyReports(),
    enabled: !!profile?.id
  });

  useEffect(() => {
    if (profile?.id) {
      // Sesi veya güne özgü heavy hesaplamaları backend'e devrettik
      api.momentumOs.runMaintenance().then(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_LEAD_ALERTS, profile.id] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_WEEKLY_REPORTS, profile.id] });
      }).catch(console.error);
    }
  }, [profile?.id, queryClient]);

  return (
    <DashboardView 
      gamifiedTasks={gamifiedTasks}
      isGamifiedTasksLoading={isGamifiedTasksLoading}
      isGamifiedTasksError={isGamifiedTasksError}
      properties={properties}
      profile={profile}
      gamifiedStats={gamifiedStats || null}
      coachInsights={staticCoachInsight}
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
      leadAlerts={leadAlerts}
      dailyPlan={dailyPlan}
      dayClosure={dayClosure}
      weeklyReports={weeklyReports}
      setSelectedLead={setSelectedLead}
      setSelectedProperty={setSelectedProperty}
    />
  );
};
