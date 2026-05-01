import React, { useState } from "react";
import { TokenUsageAlert } from "./TokenUsageAlert";
import { motion } from "motion/react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Moon,
  ArrowRight,
  AlertCircle,
  ClipboardList,
  Ghost,
  Target,
  Plus,
  MapPin,
  StickyNote,
  Brain,
  Calendar,
  Play,
  Star,
  Edit3,
  Clock,
  Phone,
  UserCheck,
  CheckSquare,
  LifeBuoy,
  ChevronRight,
  Mail,
  Home,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { Card } from "./UI";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import {
  UserProfile,
  GamifiedTask,
  Property,
  Task,
  PersonalTask,
  RescueSession,
  UserStats,
  CoachInsight,
  MutationResult,
  MissedOpportunity,
  DailyPlan,
  DayClosure,
  WeeklyReport,
  LeadAlert,
  Lead,
} from "../types";
import { RevenueStats } from "../types/revenue";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { LucideIcon } from "lucide-react";

type BaseActionItem = {
  id: string;
  title: string;
  subtitle: string;
  desc?: string;
  icon: LucideIcon;
  colorClass: string;
  ringClass: string;
};

type TopActionItem = BaseActionItem &
  (
    | { type: "alert"; originalItem: LeadAlert }
    | { type: "bolgem_followup"; originalItem: Task }
    | { type: "smart_rec"; originalItem: Property }
    | { type: "drip"; originalItem: Task }
    | { type: "gamified"; originalItem: GamifiedTask }
    | { type: "daily"; originalItem: Task }
    | { type: "personal"; originalItem: PersonalTask }
  );

import { useFeatureAccess } from "../hooks/useFeatureAccess";
import { UpgradeModal } from "./premium/UpgradeModal";
import { toast } from "react-hot-toast";
import { useTurkeyClock } from "../hooks/useTurkeyClock";

const formatTime = (dateStr?: string) => {
  if (!dateStr) return "Bugün";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Bugün";
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "Bugün";
  }
};

interface DashboardViewProps {
  profile: UserProfile | null;
  gamifiedStats: UserStats | null;
  properties: Property[];
  coachInsights: CoachInsight | null;
  gamifiedTasks: GamifiedTask[];
  rescueSession: RescueSession | null;
  isGamifiedTasksLoading: boolean;
  isGamifiedTasksError: boolean;
  refreshTasksMutation: MutationResult<GamifiedTask[], void>;
  completeTaskMutation: MutationResult<void, { task: GamifiedTask }>;
  startRescueMutation: MutationResult<RescueSession, void>;
  revenueStats: RevenueStats | null;
  revenueLoading: boolean;
  setActiveTab: (tab: string) => void;
  setShowDayCloser: (show: boolean) => void;
  queryClient: QueryClient;
  startDayMutation: MutationResult<boolean, void>;
  completeMorningRitualMutation: MutationResult<
    { success: boolean },
    Partial<DailyPlan>
  >;
  tasks?: Task[];
  personalTasks?: PersonalTask[];
  setShowAdminPanel?: (show: boolean) => void;
  setShowDailyRadar?: (show: boolean) => void;
  setShowMissedOpportunities?: (show: boolean) => void;
  missedOpportunities?: MissedOpportunity[];
  leadAlerts?: LeadAlert[];
  dailyPlan?: DailyPlan | null;
  dayClosure?: DayClosure | null;
  weeklyReports?: WeeklyReport[];
  setSelectedLead?: (lead: Lead | null) => void;
  setSelectedProperty?: (prop: Property | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  gamifiedStats,
  properties,
  coachInsights,
  gamifiedTasks,
  isGamifiedTasksLoading,
  completeTaskMutation,
  startRescueMutation,
  revenueStats,
  setActiveTab,
  setShowDayCloser,
  queryClient,
  startDayMutation,
  completeMorningRitualMutation,
  tasks = [],
  personalTasks = [],
  setShowDailyRadar,
  leadAlerts = [],
  dailyPlan,
  weeklyReports = [],
}) => {
  const [microGoalInput, setMicroGoalInput] = useState("");
  const [showMicroGoalForm, setShowMicroGoalForm] = useState(false);
  const [visiblePriorityCount, setVisiblePriorityCount] = useState(5);

  // --- Bugünün Öncelikleri Logic ---
  const { todayISO } = useTurkeyClock();

  const isTodayOrOverdue = (taskDate?: string) => {
    if (!taskDate) return true; // Without date falls to today
    return taskDate.split("T")[0] <= todayISO;
  };

  const alertItems: TopActionItem[] = leadAlerts
    .map((alert) => ({
      type: "alert" as const,
      originalItem: alert,
      id: `alert-${alert.id}`,
      title: alert.lead?.name || "İsimsiz Lead",
      subtitle: "Acil Alarm",
      desc: alert.alert_type,
      icon: AlertCircle,
      colorClass: "text-red-600 bg-red-100",
      ringClass: "hover:ring-red-200",
    }))
    .slice(0, 4);

  const dripItems: TopActionItem[] = (tasks || [])
    .filter(
      (t) =>
        t.is_drip && !t.completed && isTodayOrOverdue(t.due_date || t.time),
    )
    .map((task) => ({
      type: "drip" as const,
      originalItem: task,
      id: `drip-${task.id}`,
      title: task.title,
      subtitle: "Akıllı Takip",
      desc:
        task.ai_suggestion ||
        "Müşteri ile tekrar iletişime geçme zamanı geldi.",
      icon: Ghost,
      colorClass: "text-orange-600 bg-orange-100",
      ringClass: "hover:ring-orange-200",
    }))
    .slice(0, 3);

  const smartRecItems: TopActionItem[] = (properties || [])
    .filter(
      (p) => p.market_analysis?.status === "Pahalı" && p.status === "Yayında",
    )
    .map((p) => ({
      type: "smart_rec" as const,
      originalItem: p,
      id: `prop-${p.id}`,
      title: "Fiyat Revizesi Önerisi",
      subtitle: p.title,
      desc: "Piyasa ortalamasının üzerinde. Fiyat aksiyonu almalısın.",
      icon: Sparkles,
      colorClass: "text-amber-600 bg-amber-100",
      ringClass: "hover:ring-amber-200",
    }))
    .slice(0, 3);

  const dailyItems: TopActionItem[] = (tasks || [])
    .filter(
      (t) =>
        !t.is_drip && !t.completed && isTodayOrOverdue(t.due_date || t.time),
    )
    .map((task) => ({
      type: "daily" as const,
      originalItem: task,
      id: `daily-${task.id}`,
      title: task.title,
      subtitle: "Günlük Görev",
      desc: "Bugün yapman gereken standart bir görev.",
      icon: ClipboardList,
      colorClass: "text-blue-600 bg-blue-100",
      ringClass: "hover:ring-blue-200",
    }));

  const gamifiedItems: TopActionItem[] = (gamifiedTasks || [])
    .filter((gt) => !gt.is_completed)
    .map((gt) => ({
      type: "gamified" as const,
      originalItem: gt,
      id: `gamified-${gt.id}`,
      title: gt.title,
      subtitle: "Gelişim",
      desc: `${gt.points} XP Kazandırır`,
      icon: Star,
      colorClass: "text-indigo-600 bg-indigo-100",
      ringClass: "hover:ring-indigo-200",
    }));

  const personalItems: TopActionItem[] = (personalTasks || [])
    .filter((pt) => !pt.is_completed && isTodayOrOverdue(pt.due_date || pt.reminder_time))
    .map((pt) => {
      const isOverdue = pt.due_date && pt.due_date.split("T")[0] < todayISO;
      return {
        type: "personal" as const,
        originalItem: pt,
        id: `personal-${pt.id}`,
        title: pt.title,
        subtitle: isOverdue ? "Gecikti" : "Kişisel",
        desc: formatTime(pt.due_date || pt.reminder_time),
        icon: UserCheck,
        colorClass: "text-rose-600 bg-rose-100",
        ringClass: "hover:ring-rose-200",
      };
    });

  const remainingItems = [
    ...dailyItems,
    ...gamifiedItems,
    ...personalItems,
  ];

  const todaysPriorities: TopActionItem[] = [
    ...alertItems,
    ...dripItems,
    ...smartRecItems,
    ...remainingItems,
  ].slice(0, 15);

  const visiblePriorities = todaysPriorities.slice(0, visiblePriorityCount);

  const { data: microGoals } = useQuery({
    queryKey: [QUERY_KEYS.MICRO_GOALS, profile?.id],
    queryFn: api.momentumOs.getMicroGoals,
    enabled: !!profile?.id,
  });

  const activeMicroGoal = microGoals?.find((m) => m.status === "pending");

  const addMicroGoalMutation = useMutation({
    mutationFn: (title: string) =>
      api.momentumOs.addMicroGoal({
        title,
        status: "pending",
        deadline: new Date().toISOString(),
        target_metric: "daily_focus",
        target_value: 1,
        current_value: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS, profile?.id],
      });
      setMicroGoalInput("");
      setShowMicroGoalForm(false);
      toast.success("Mikro hedef başarıyla belirlendi!");
    },
  });

  // Premium Erişim Kontrolleri
  const { hasAccess, subscribe } = useFeatureAccess();
  const canUseAiCoach = hasAccess("ai_coach");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const localStarted = profile?.id
    ? localStorage.getItem(`day_started_${profile.id}_${todayISO}`)
    : null;
  const localEnded = profile?.id
    ? localStorage.getItem(`day_ended_${profile.id}_${todayISO}`)
    : null;

  const isDayStarted = !!(
    (profile?.last_day_started_at &&
      profile.last_day_started_at.startsWith(todayISO)) ||
    profile?.last_active_date === todayISO ||
    localStarted ||
    startDayMutation.isSuccess ||
    completeMorningRitualMutation.isSuccess
  );

  const dayStartTimestamp = profile?.last_day_started_at || localStarted || "";
  const isDayEnded = !!(
    localEnded ||
    (profile?.last_ritual_completed_at &&
      profile.last_ritual_completed_at.startsWith(todayISO) &&
      (!dayStartTimestamp ||
        profile.last_ritual_completed_at > dayStartTimestamp))
  );

  React.useEffect(() => {
    if (profile?.id && !localStarted) {
      const dbStartedToday =
        profile.last_day_started_at?.startsWith(todayISO) ||
        profile.last_active_date === todayISO;
      if (dbStartedToday) {
        localStorage.setItem(
          `day_started_${profile.id}_${todayISO}`,
          profile.last_day_started_at || new Date().toISOString(),
        );
      }
    }
  }, [profile, localStarted, todayISO]);

  const flowNotesTasks = (tasks || [])
    .filter((t) => {
      if (t.completed || !t.notes || t.notes.trim() === "") return false;
      const taskDay = t.due_date
        ? t.due_date.split("T")[0]
        : t.time
          ? t.time.split("T")[0]
          : null;
      return taskDay === todayISO;
    })
    .map((task) => {
      let sourceLabel = "İş";
      if (task.source === "bolgem") sourceLabel = "Bölgem";
      else if (task.source === "content" || task.type === "İçerik")
        sourceLabel = "İçerik";
      else if (task.source === "crm" || task.lead_id) sourceLabel = "CRM";
      else if (task.property_id) sourceLabel = "Portföy";

      return {
        id: `task-${task.id}`,
        title: task.title,
        notes: task.notes!,
        sourceLabel,
        noteTime: formatTime(task.due_date || task.time)
      };
    });

  const flowNotesPersonal = (personalTasks || [])
    .filter((pt) => {
      if (pt.is_completed || !pt.notes || pt.notes.trim() === "") return false;
      const taskDay = pt.due_date
        ? pt.due_date.split("T")[0]
        : pt.reminder_time
          ? pt.reminder_time.split("T")[0]
          : null;
      return taskDay === todayISO;
    })
    .map((pt) => ({
      id: `pt-${pt.id}`,
      title: pt.title,
      notes: pt.notes!,
      sourceLabel: "Kişisel",
      noteTime: formatTime(pt.due_date || pt.reminder_time)
    }));

  const flowNotes = [...flowNotesTasks, ...flowNotesPersonal].slice(0, 3);

  // Daily Plan Indicators
  const safePercent = (done: number, target: number) => target <= 0 ? 0 : Math.min(100, Math.round((done / target) * 100));

  const calcCallsTarget = dailyPlan?.planned_calls ?? 0;
  const calcCallsDone = dailyPlan?.completed_calls ?? 0;
  const calcCallsPercent = safePercent(calcCallsDone, calcCallsTarget);

  const calcFollowupsTarget = dailyPlan?.planned_followups ?? 0;
  const calcFollowupsDone = dailyPlan?.completed_followups ?? 0;
  const calcFollowupsPercent = safePercent(calcFollowupsDone, calcFollowupsTarget);

  const calcVisitsTarget = dailyPlan?.planned_portfolio_actions ?? 0;
  const calcVisitsDone = dailyPlan?.completed_portfolio_actions ?? 0;
  const calcVisitsPercent = safePercent(calcVisitsDone, calcVisitsTarget);

  const offerTasks = tasks.filter(t => 
    t.title.toLowerCase().includes('teklif') || 
    t.title.toLowerCase().includes('offer') ||
    (t.type && t.type.toLowerCase().includes('teklif')) ||
    (t.notes && t.notes.toLowerCase().includes('teklif'))
  );
  
  const calcOffersTarget = offerTasks.length;
  const calcOffersDone = offerTasks.filter(t => t.completed).length;
  const calcOffersPercent = safePercent(calcOffersDone, calcOffersTarget);

  // Action Center
  const countBolgemAlerts = (tasks || [])
    .filter(
      (t) =>
        t.source === "bolgem" &&
        !t.completed &&
        isTodayOrOverdue(t.due_date || t.time),
    ).length;

  const countMissedFollowups = leadAlerts.filter(a => a.alert_type === "long_time_no_contact" || a.alert_type === "needs_follow_up").length + 
    tasks.filter(t => !t.completed && (t.source === "crm" || t.lead_id) && t.title.toLowerCase().includes('takip') && isTodayOrOverdue(t.due_date || t.time)).length;
  const countNewLeads = leadAlerts.filter(a => a.alert_type === "new_lead").length;
  const countPriceRevisions = smartRecItems.length;
  const totalBadges = countMissedFollowups + countNewLeads + countPriceRevisions + countBolgemAlerts;

  const countOverdueTasks = (tasks || []).filter(t => !t.completed && t.due_date && t.due_date.split("T")[0] < todayISO).length + 
                            (personalTasks || []).filter(t => !t.is_completed && t.due_date && t.due_date.split("T")[0] < todayISO).length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const isEst = !(revenueStats && (revenueStats.total_pipeline_value !== undefined || revenueStats.weighted_revenue !== undefined));
  const rvPotential = revenueStats?.total_pipeline_value ?? properties.filter(p => p.status === 'Yayında').reduce((acc, p) => acc + ((p.price || 0) * 0.02), 0);
  const rvExpected = revenueStats?.weighted_revenue ?? Math.round(rvPotential * 0.6);
  const rvOffer = Math.round(rvPotential * 0.3);
  const rvClosed = Math.round(rvPotential * 0.4);
  const rvMax = Math.max(1, rvPotential, rvExpected, rvOffer, rvClosed);

  const hasMomentumData = weeklyReports?.[0]?.metrics?.performance_score !== undefined || gamifiedStats?.streak;
  const momentumScore = (weeklyReports?.[0]?.metrics?.performance_score as number) ?? (gamifiedStats?.streak ? Math.min(100, Math.round((gamifiedStats.streak / 7) * 100)) : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-36 lg:pb-8"
    >
      <div className="lg:hidden px-2 mb-4">
        <h1 className="text-xl font-bold text-[#061A32]">
          Günaydın {profile?.display_name?.split(' ')[0] || 'Danışman'} 👋
        </h1>
      </div>

      <TokenUsageAlert />

      {isDayStarted && isDayEnded && (
        <Card className="p-5 md:p-6 bg-slate-50 border-slate-200 border-dashed mb-6 rounded-[24px]">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bugün Başarıyla Tamamlandı</h3>
              <p className="text-[10px] font-medium uppercase tracking-wider">
                İyi dinlenmeler şampiyon!
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* SOL KOLON (MAIN) */}
        <div className="contents lg:flex lg:flex-col lg:col-span-2 lg:gap-6">
        
          {/* HERO CARD: Bugünü Netleştir */}
          <section className="order-1">
            <Card className="p-5 bg-gradient-to-br from-[#061A32] via-[#082B55] to-[#061A32] text-white border-none shadow-xl relative overflow-hidden rounded-[28px] flex flex-col md:flex-row justify-between gap-4 md:items-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2B4]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 flex-1">
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2 mb-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Bugünü Netleştir
                  </h2>
                </div>
                <p className="text-sm text-white/75 font-medium max-w-sm mb-4">
                  Planla, önceliklendir, ilerle ve günü güçlü kapat.
                </p>

                {!isDayStarted && !isDayEnded && (
                  <button
                    onClick={() => {
                      startDayMutation.mutate();
                      if (setShowDailyRadar) setShowDailyRadar(true);
                    }}
                    disabled={startDayMutation.isPending}
                    className="bg-white hover:bg-slate-50 text-[#FF6B1A] px-8 h-12 rounded-xl text-sm font-bold active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                    {startDayMutation.isPending ? "Başlatılıyor..." : "Günü Başlat"}
                  </button>
                )}
              </div>

              {/* Sağ Taraf - Stats */}
              <div className="relative z-10 grid grid-cols-2 gap-0 bg-[#041A33]/70 rounded-2xl w-full md:w-auto overflow-hidden">
                <div className="p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-1 text-[#FF6B1A]">
                    <Zap size={14} className="fill-current shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/90 truncate">Günlük Streak</span>
                  </div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-2xl md:text-3xl font-black text-white leading-none">{gamifiedStats ? gamifiedStats.streak ?? 0 : 0}</span>
                    <span className="text-xs md:text-sm font-bold ml-1 text-white/80">gün</span>
                  </div>
                  <div className="text-[9px] text-[#00D2B4] font-bold truncate mt-auto">Harika gidiyorsun!</div>
                </div>
                
                <div className="p-4 border-l border-white/10 flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-1 text-amber-400">
                    <Star size={14} className="stroke-[2.5] shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/90 truncate">XP Puanı</span>
                  </div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-2xl md:text-3xl font-black text-white leading-none">{gamifiedStats ? (gamifiedStats.points ?? 0).toLocaleString() : 0}</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-auto overflow-hidden shrink-0">
                     <div className="h-full bg-[#00D2B4] rounded-full" style={{ width: `${Math.min(100, ((gamifiedStats?.points ?? 0) / 2000) * 100)}%` }} />
                  </div>
                  <div className="text-[8px] text-white/50 mt-1 truncate">Ödüle {Math.max(0, 2000 - (gamifiedStats?.points ?? 0))} XP</div>
                </div>
              </div>
            </Card>
          </section>

          {/* 1. BUGÜNÜN ÖNCELİKLERİ */}
          <section className="order-2">
            <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">1</div>
                  <h3 className="text-base font-bold text-slate-900">Bugünün Öncelikleri</h3>
                </div>
                {setActiveTab && (
                  <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center shrink-0">
                    Tümünü gör <ArrowRight size={14} className="ml-1" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {visiblePriorities.length > 0 ? (
                  <>
                    {visiblePriorities.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          if (item.type === "gamified" && completeTaskMutation) {
                            completeTaskMutation.mutate({ task: item.originalItem });
                          }
                        }}
                        className={`flex items-center justify-between p-2 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100 group min-h-[64px] ${item.type === "gamified" ? "cursor-pointer" : ""}`}
                      >
                        <div className="flex items-center gap-4 min-w-0 pr-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.colorClass}`}>
                            <item.icon size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {item.desc || item.subtitle}
                            </p>
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center ml-2">
                            <div className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                              item.type === "alert" ? "bg-red-100 text-red-700" :
                              item.type === "drip" ? "bg-orange-100 text-orange-700" :
                              item.type === "smart_rec" ? "bg-amber-100 text-amber-700" :
                              item.type === "daily" ? "bg-blue-100 text-blue-700" :
                              item.type === "personal" ? "bg-rose-100 text-rose-700" :
                              item.type === "gamified" ? "bg-indigo-100 text-indigo-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                            {item.type === "alert" ? "Kritik" :
                             item.type === "drip" ? "Takip" :
                             item.type === "smart_rec" ? "Öneri" :
                             item.type === "daily" ? "Planlandı" :
                             item.type === "personal" ? "Kişisel" :
                             item.type === "gamified" ? "Gelişim" :
                             "Planlandı"}
                            </div>
                        </div>
                      </div>
                    ))}
                    {todaysPriorities.length > 5 && (
                      <button 
                        onClick={() => {
                          if (visiblePriorityCount < Math.min(15, todaysPriorities.length)) {
                            setVisiblePriorityCount(prev => Math.min(prev + 5, 15, todaysPriorities.length));
                          } else {
                            setVisiblePriorityCount(5);
                          }
                        }}
                        className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-700 py-2 mt-2 transition-colors border border-slate-100 rounded-lg hover:bg-slate-50"
                      >
                        {visiblePriorityCount < Math.min(15, todaysPriorities.length) ? "5 öncelik daha göster" : "Daha az göster"}
                      </button>
                    )}
                    {isGamifiedTasksLoading && (
                      <div className="text-center text-[10px] font-medium text-slate-400 mt-2">
                        Gelişim görevleri yükleniyor...
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Target size={24} className="text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Bugün için öncelik yok</h4>
                    <p className="text-xs text-slate-500 mb-4 max-w-[200px]">Yeni görev, lead takibi veya portföy aksiyonu eklendiğinde burada görünür.</p>
                    <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                      Günlük Akış'a git
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* 2. MİKRO HEDEF */}
          <section className="order-3">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">2</div>
                    <h3 className="text-base font-bold text-slate-900">Mikro Hedef</h3>
                  </div>
                  {!showMicroGoalForm && (
                      <button onClick={() => setShowMicroGoalForm(true)} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                        <Edit3 size={12} /> {activeMicroGoal ? "Yeni Hedef" : "Mikro Hedef Ekle"}
                      </button>
                  )}
                </div>

                {showMicroGoalForm ? (
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <input
                            type="text"
                            placeholder="Bugünkü mikro hedefini yaz..."
                            value={microGoalInput}
                            onChange={(e) => setMicroGoalInput(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowMicroGoalForm(false);
                                    setMicroGoalInput("");
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => addMicroGoalMutation.mutate(microGoalInput.trim())}
                                disabled={!microGoalInput.trim() || addMicroGoalMutation.isPending}
                                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                {addMicroGoalMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0 self-start md:self-auto">
                        <Target size={24} className="text-[#00D2B4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{activeMicroGoal?.title || "Mikro hedef belirlenmedi"}</h4>
                            <p className="text-xs text-slate-500 truncate">{activeMicroGoal ? 'Hedef' : 'Bugün odaklanacağın küçük hedefi belirle.'}</p>
                          </div>
                          {activeMicroGoal && (
                            <span className="text-xs font-bold text-slate-600 shrink-0 self-start md:self-auto">
                              {`${activeMicroGoal.current_value ?? 0} / ${activeMicroGoal.target_value ?? 1}`}
                            </span>
                          )}
                        </div>
                        
                        {activeMicroGoal ? (
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden w-full">
                              <div className="h-full bg-[#00D2B4]" style={{ width: `${Math.min(100, ((activeMicroGoal.current_value ?? 0) / Math.max(1, activeMicroGoal.target_value ?? 1)) * 100)}%` }} />
                          </div>
                        ) : (
                          <button onClick={() => setShowMicroGoalForm(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-2 flex items-center">
                            Mikro hedef ekle <Plus size={14} className="ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                )}
                
                <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-medium">Günün bitmesine <strong className="font-bold">6sa 48dk</strong> kaldı</span>
                </div>
              </Card>
          </section>

          {/* 3. GÜNÜN NOTLARI / AKIŞ NOTLARI */}
          <section className="order-4">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">3</div>
                    <h3 className="text-base font-bold text-slate-900">Günün Notları / Akış Notları</h3>
                  </div>
                  {setActiveTab && (
                      <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center shrink-0">
                        Tümünü gör <ArrowRight size={14} className="ml-1" />
                      </button>
                  )}
                </div>

                <div className="space-y-3">
                    {flowNotes.length > 0 ? flowNotes.slice(0,3).map(note => (
                      <div key={note.id} className="flex gap-4 items-center justify-between border-b border-slate-50 pb-3 last:pb-0 last:border-0">
                        <div className="flex flex-1 items-start gap-3 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                          {note.sourceLabel}
                          </span>
                          <div className="text-sm font-medium text-slate-700 leading-snug line-clamp-2">
                          {note.notes}
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0 mt-0.5">{note.noteTime}</span>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <StickyNote size={20} className="text-slate-400" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Bugün için akış notu yok</h4>
                        <p className="text-xs text-slate-500 mb-3 max-w-[200px]">Görev veya kişisel hatırlatıcılara not eklendiğinde burada görünür.</p>
                        <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                          Günlük Akış'a git
                        </button>
                      </div>
                    )}
                </div>
              </Card>
          </section>

          {/* 4. GÜNLÜK PLAN GÖSTERGELERİ */}
          <section className="order-6">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">4</div>
                  <h3 className="text-base font-bold text-slate-900">Günlük Plan Göstergeleri</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="md:border-r border-slate-100 md:pr-4">
                      <div className="flex items-center gap-1.5 text-emerald-500 mb-2">
                        <Phone size={16} />
                        <span className="text-xs font-bold text-slate-600">Arama</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-black text-slate-900 leading-none">{calcCallsDone}<span className="text-sm text-slate-400 font-medium ml-1">/ {calcCallsTarget}</span></div>
                        <span className="text-[10px] font-bold text-slate-400">%{calcCallsPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{width: `${calcCallsPercent}%`}} />
                      </div>
                  </div>
                  
                  <div className="md:border-r border-slate-100 md:pr-4">
                      <div className="flex items-center gap-1.5 text-orange-500 mb-2">
                        <UserCheck size={16} />
                        <span className="text-xs font-bold text-slate-600">Takip</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-black text-slate-900 leading-none">{calcFollowupsDone}<span className="text-sm text-slate-400 font-medium ml-1">/ {calcFollowupsTarget}</span></div>
                        <span className="text-[10px] font-bold text-slate-400">%{calcFollowupsPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{width: `${calcFollowupsPercent}%`}} />
                      </div>
                  </div>

                  <div className="md:border-r border-slate-100 md:pr-4">
                      <div className="flex items-center gap-1.5 text-blue-500 mb-2">
                        <Calendar size={16} />
                        <span className="text-xs font-bold text-slate-600">Ziyaret</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-black text-slate-900 leading-none">{calcVisitsDone}<span className="text-sm text-slate-400 font-medium ml-1">/ {calcVisitsTarget}</span></div>
                        <span className="text-[10px] font-bold text-slate-400">%{calcVisitsPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{width: `${calcVisitsPercent}%`}} />
                      </div>
                  </div>

                  <div>
                      <div className="flex items-center gap-1.5 text-indigo-500 mb-2">
                        <CheckSquare size={16} />
                        <span className="text-xs font-bold text-slate-600">Teklif</span>
                      </div>
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-2xl font-black text-slate-900 leading-none">{calcOffersDone}<span className="text-sm text-slate-400 font-medium ml-1">/ {calcOffersTarget}</span></div>
                        <span className="text-[10px] font-bold text-slate-400">%{calcOffersPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{width: `${calcOffersPercent}%`}} />
                      </div>
                  </div>
                </div>
              </Card>
          </section>

          {/* 5. RESCUE */}
          <section className="order-8">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">5</div>
                  <h3 className="text-base font-bold text-slate-900">Rescue / Günün Özeti</h3>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${countOverdueTasks > 0 ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-500"}`}>
                        <LifeBuoy size={24} />
                      </div>
                      <div>
                        {countOverdueTasks > 0 ? (
                          <>
                            <p className="text-sm font-bold text-slate-900">Planın gerisindesin. <span className="text-orange-600">{countOverdueTasks} aksiyonda gecikme var.</span></p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Önceliklerini sadeleştir, en yüksek etkili 1 aksiyona odaklan.</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-slate-900">Planın yolunda. <span className="text-emerald-600">Geciken aksiyon yok.</span></p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Mevcut odağını koruyarak ilerlemeye devam et.</p>
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => startRescueMutation.mutate()} className={`text-[11px] font-bold bg-white border px-4 h-10 rounded-xl transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto shadow-sm whitespace-nowrap shrink-0 ${countOverdueTasks > 0 ? "text-orange-500 border-orange-200 hover:bg-orange-50" : "text-emerald-500 border-emerald-200 hover:bg-emerald-50"}`}>
                      <Zap size={14} className="fill-current" /> Odaklanma Modu
                    </button>
                </div>
              </Card>
          </section>

          {/* GÜNÜ KAPAT */}
          <section className="order-9">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
                  <div className="flex items-center gap-4 text-center md:text-left w-full">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                      <Moon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-slate-900">Günü Kapat</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 pr-2">Bugünkü ilerlemeni kaydet, kazanımlarını not al ve yarına hazır ol.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                      <button onClick={() => setShowDayCloser(true)} className="h-10 px-6 rounded-xl bg-[#061A32] text-white font-bold text-[11px] flex items-center gap-1.5 hover:bg-[#082B55] transition-colors w-full md:w-auto justify-center shadow-md">
                        <CheckCircle2 size={16} /> Günü Kapat
                      </button>
                  </div>
                </div>
              </Card>
          </section>
        </div>

        {/* SAĞ KOLON (WIDGETS: AI İçgörü, Gelir Özeti vs.) */}
        <div className="contents lg:flex lg:flex-col lg:col-span-1 lg:gap-6 mt-4 lg:mt-0">
          
          {/* Aksiyon Merkezi */}
          <section className="order-7">
            <Card className="p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Target size={18} className="text-slate-700" />
                 <h3 className="text-sm font-bold text-slate-900">Aksiyon Merkezi</h3>
               </div>
               {totalBadges > 0 && (
                 <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{totalBadges}</div>
               )}
             </div>
             
             <div className="space-y-1">
               <div className="flex items-center justify-between text-xs py-2">
                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                     <Phone size={16} className="text-emerald-500" /> Cevapsız / Geri Dönüş Bekleyen
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countMissedFollowups > 0 ? "text-red-500 bg-red-50" : "text-slate-500 bg-slate-50"}`}>{countMissedFollowups}</span>
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />

               <div className="flex items-center justify-between text-xs py-2">
                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                     <Mail size={16} className="text-blue-500" /> Yeni Lead'ler
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countNewLeads > 0 ? "text-orange-500 bg-orange-50" : "text-slate-500 bg-slate-50"}`}>{countNewLeads}</span>
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />

               <div className="flex items-center justify-between text-xs py-2">
                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                     <Home size={16} className="text-indigo-500" /> Fiyat Revizyonu Önerileri
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countPriceRevisions > 0 ? "text-blue-500 bg-blue-50" : "text-slate-500 bg-slate-50"}`}>{countPriceRevisions}</span>
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />
               
               <div className="flex items-center justify-between text-xs py-2">
                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                     <MapPin size={16} className="text-emerald-500" /> Bölge Takip Hatırlatmaları
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countBolgemAlerts > 0 ? "text-emerald-500 bg-emerald-50" : "text-slate-500 bg-slate-50"}`}>{countBolgemAlerts}</span>
                  </div>
               </div>
             </div>
             
             <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-3 flex items-center">
               Tüm aksiyonları gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>
          </section>

          {/* Gelir Özeti (White style) */}
          <section className="order-10">
            <Card className="p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-900">Gelir Özeti</h3>
               <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                 <option>Bu Ay</option>
               </select>
             </div>
             <div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-[28px] font-black text-slate-900 leading-none">{formatCurrency(rvPotential).replace('₺', '')} <span className="text-xl">₺</span></span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center mb-1"><ArrowUpRight size={12} /></span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">{rvPotential === 0 ? "Gelir Verisi Yok" : (isEst ? "Tahmini Potansiyel Gelir" : "Toplam Potansiyel Gelir")}</span>
                  <span className="text-[9px] text-slate-400">{isEst && rvPotential > 0 ? "Portföylerden tahmini" : ""}</span>
                </div>
             </div>

             <div className="mt-6 space-y-4">
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">{isEst ? "Tahmini Potansiyel" : "Potansiyel"}</span>
                     <span className="text-slate-900">{formatCurrency(rvPotential)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-800" style={{width: `${Math.min(100, (rvPotential / rvMax) * 100)}%`}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">{isEst ? "Tahmini Görüşme" : "Görüşme/Ağırlıklı"}</span>
                     <span className="text-slate-900">{formatCurrency(rvExpected)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-[#00D2B4]" style={{width: `${Math.min(100, (rvExpected / rvMax) * 100)}%`}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">{isEst ? "Tahmini Teklif" : "Teklif"}</span>
                     <span className="text-slate-900">{formatCurrency(rvOffer)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-[#FF6B1A]" style={{width: `${Math.min(100, (rvOffer / rvMax) * 100)}%`}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">{isEst ? "Tahmini Kapanan" : "Kapanan"}</span>
                     <span className="text-slate-900">{formatCurrency(rvClosed)}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, (rvClosed / rvMax) * 100)}%`}}></div>
                   </div>
                </div>
             </div>

             <button onClick={() => setActiveTab && setActiveTab("crm")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-5 flex items-center">
               Funnel'ı detaylı gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>
          </section>

          {/* AI İçgörü */}
          <section className="order-5">
            <Card
              onClick={() => {
                if (!canUseAiCoach) {
                  setShowUpgradeModal(true);
                } else {
                  setActiveTab && setActiveTab("koc");
                }
              }}
              className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px] cursor-pointer group flex flex-col"
            >
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Brain size={18} className="text-slate-700" />
                   <h3 className="text-sm font-bold text-slate-900">AI İçgörü</h3>
                 </div>
               </div>
               
               <div className="flex flex-col gap-3 flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    {canUseAiCoach 
                      ? (coachInsights?.daily_tip || "Bugün için AI içgörü henüz oluşmadı. Veri biriktikçe burada öneriler görünür.")
                      : "Yapay zeka asistanınız verilerinizi analiz ederek size özel öneriler sunar."}
                  </p>
                  {canUseAiCoach && coachInsights?.daily_tip && (
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><ArrowUpRight size={10} /> Yüksek</span>
                    </div>
                  )}
               </div>
               
               <button onClick={(e) => { e.stopPropagation(); setActiveTab && setActiveTab("koc"); }} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-4 flex items-center">
                 Tüm içgörüleri gör <ArrowRight size={14} className="ml-1" />
               </button>
            </Card>
          </section>

          {/* Haftalık Momentum */}
          <section className="order-11 mb-8 lg:mb-0">
            <Card className="p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <BarChart3 size={18} className="text-slate-700" />
                 <h3 className="text-sm font-bold text-slate-900">Haftalık Momentum</h3>
               </div>
               <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                 <option>Bu Hafta</option>
               </select>
             </div>
             
             <div className="flex gap-4 items-end mt-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 stroke-current"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={hasMomentumData ? "text-[#00D2B4] stroke-current" : "text-slate-200 stroke-current"}
                      strokeWidth="3"
                      strokeDasharray={`${hasMomentumData ? momentumScore : 0}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                    <span className="text-xl font-black text-slate-900">{hasMomentumData ? momentumScore : 0}%</span>
                    <span className="text-[6px] uppercase font-bold text-slate-400">Momentum Skoru</span>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between h-14 w-full px-1 border-b border-dashed border-slate-200 relative pb-1">
                   <div className="absolute top-0 right-0 left-0 border-t border-dashed border-slate-200 pointer-events-none">
                     <span className="absolute -top-3 right-0 text-[8px] font-bold text-slate-400">Hedef 85%</span>
                   </div>
                   {hasMomentumData ? (
                     <>
                       <div className="w-2 h-[30%] bg-slate-200 rounded-t-sm" />
                       <div className="w-2 h-[60%] bg-slate-200 rounded-t-sm" />
                       <div className="w-2 h-[80%] bg-slate-200 rounded-t-sm" />
                       <div className="w-2 h-[100%] bg-[#00D2B4] rounded-t-sm" />
                       <div className="w-2 h-[50%] bg-slate-200 rounded-t-sm" />
                       <div className="w-2 h-[40%] bg-slate-200 rounded-t-sm" />
                       <div className="w-2 h-[20%] bg-slate-200 rounded-t-sm" />
                     </>
                   ) : (
                     <>
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                       <div className="w-2 h-1 bg-slate-100 rounded-t-sm" />
                     </>
                   )}
                </div>
             </div>
             
             <div className="flex justify-between pl-[5.5rem] pr-1 mt-1">
                <span className="text-[8px] font-bold text-slate-400">Pzt</span>
                <span className="text-[8px] font-bold text-slate-400">Sal</span>
                <span className="text-[8px] font-bold text-slate-400">Çar</span>
                <span className="text-[8px] font-bold text-slate-400">Per</span>
                <span className="text-[8px] font-bold text-slate-400">Cum</span>
                <span className="text-[8px] font-bold text-slate-400">Cmt</span>
                <span className="text-[8px] font-bold text-slate-400">Paz</span>
             </div>

             {!hasMomentumData && (
               <div className="mt-4 text-center">
                 <span className="text-xs font-medium text-slate-500">Henüz momentum verisi yok</span>
               </div>
             )}
          </Card>
          </section>

        </div>
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(tier) => console.log("Plan seçildi:", tier)}
        onActivateTrial={async () => {
          try {
            await subscribe("trial");
            setShowUpgradeModal(false);
          } catch (e) {
            console.error("Deneme sürümü başlatılırken hata:", e);
          }
        }}
      />
    </motion.div>
  );
};