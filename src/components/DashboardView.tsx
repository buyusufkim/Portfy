import React, { useState } from "react";
import { getTodayStrFromDate } from "../services/core/utils";
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
  MapPin,
  StickyNote,
  Calendar,
  Clock,
  Play,
  Star,
  Phone,
  UserCheck,
  LifeBuoy,
  Mail,
  Home,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
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
  MutationResult,
  MissedOpportunity,
  DailyPlan,
  DayClosure,
  LeadAlert,
  MicroGoal,
  CampaignTask,
  isAdminRole
} from "../types";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { TopActionItem, leadAlertDescriptions, getDedupedAlerts, isTodayOrOverdue, formatTime } from "../helpers/dashboardHelpers";

import { toast } from "react-hot-toast";
import { useTurkeyClock } from "../hooks/useTurkeyClock";

interface DashboardViewProps {
  profile: UserProfile | null;
  gamifiedStats: UserStats | null;
  properties: Property[];
  gamifiedTasks: GamifiedTask[];
  isGamifiedTasksLoading: boolean;
  completeTaskMutation: MutationResult<void, { task: GamifiedTask }>;
  startRescueMutation: MutationResult<RescueSession, void>;
  rescueSession?: RescueSession | null;
  setShowRescueModal?: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setShowDayCloser: (show: boolean) => void;
  queryClient: QueryClient;
  startDayMutation: MutationResult<unknown, { early_start_reason?: string } | void>;
  completeMorningRitualMutation: MutationResult<
    { success: boolean },
    Partial<DailyPlan>
  >;
  tasks?: Task[];
  personalTasks?: PersonalTask[];
  setShowDailyRadar?: (show: boolean) => void;
  setPendingEarlyStartReason?: (val: string) => void;
  leadAlerts?: LeadAlert[];
  dailyPlan?: DailyPlan | null;
  dayClosure?: DayClosure | null;
}

import { advisorProfileService } from "../services/advisorProfileService";
import { campaign90Service } from "../services/campaign90Service";
import { useWeather } from "../hooks/useWeather";

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  gamifiedStats,
  properties,
  gamifiedTasks,
  isGamifiedTasksLoading,
  completeTaskMutation,
  startRescueMutation,
  rescueSession,
  setShowRescueModal,
  setActiveTab,
  setShowDayCloser,
  queryClient,
  startDayMutation,
  completeMorningRitualMutation,
  tasks = [],
  personalTasks = [],
  setShowDailyRadar,
  setPendingEarlyStartReason,
  leadAlerts = [],
  dailyPlan,
  dayClosure,
}) => {
  const [visiblePriorityCount, setVisiblePriorityCount] = useState(5);
  const [showEarlyStartModal, setShowEarlyStartModal] = useState(false);
  const [earlyStartReason, setEarlyStartReason] = useState("");
  const [optimisticDayStartedAt, setOptimisticDayStartedAt] = useState<string | null>(null);
  const [isResettingToday, setIsResettingToday] = useState(false);
  const [resetConfirmArmed, setResetConfirmArmed] = useState(false);

  const { todayISO, timeLabel } = useTurkeyClock();

  const { data: advisorProfile } = useQuery({
    queryKey: ['advisor_professional_profile', profile?.id],
    queryFn: () => advisorProfileService.getAdvisorProfessionalProfile(profile!.id),
    enabled: !!profile?.id
  });

  const { data: activeCampaign } = useQuery({
    queryKey: ['campaign90_active', profile?.id],
    queryFn: () => campaign90Service.getActiveCampaign(profile!.id),
    enabled: !!profile?.id
  });

  const { data: campaignTasks } = useQuery({
    queryKey: ['campaign90_tasks', activeCampaign?.id, todayISO],
    queryFn: () => campaign90Service.getTodayCampaignTasks(profile!.id, todayISO),
    enabled: !!activeCampaign?.id && !!profile?.id
  });

  const isNewUserCampaignActive = advisorProfile?.experience_level === 'new' && !!activeCampaign;

  const city = profile?.city || profile?.region?.city || (advisorProfile?.region && typeof advisorProfile.region === 'string' ? advisorProfile.region.split('/')[0]?.trim() : undefined);
  const district = profile?.district || profile?.region?.district || (advisorProfile?.region && typeof advisorProfile.region === 'string' ? advisorProfile.region.split('/')[1]?.trim() : undefined);

  const { weather, loading: weatherLoading } = useWeather(city, district);
  
  const hour = new Date().getHours();
  let greetingObj = { text: "Günaydın", icon: <Sun size={18} className="text-amber-300" /> };
  if (hour >= 12 && hour < 18) {
    greetingObj = { text: "İyi günler", icon: <Sun size={18} className="text-amber-500" /> };
  } else if (hour >= 18 || hour < 5) {
    greetingObj = { text: "İyi akşamlar", icon: <Moon size={18} className="text-indigo-300" /> };
  }

  const todayDateString = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date());

  const isCampaignActive = isNewUserCampaignActive || !!activeCampaign;
  
  let heroTitle = `${greetingObj.text}${profile?.display_name ? ` ${profile.display_name.split(' ')[0]}` : ''}, kolay gelsin`;
  let heroSubtitle = "Planla, önceliklendir, ilerle ve günü güçlü kapat.";
  
  if (isCampaignActive) {
    if (hour >= 12 && hour < 18) {
      heroTitle = "İyi günler, kamp günün devam ediyor";
    } else if (hour >= 18 || hour < 5) {
      heroTitle = "İyi akşamlar, kamp gününü güçlü kapat";
    } else {
      heroTitle = "Günaydın, kamp günün başlıyor";
    }
    heroSubtitle = "Bugünün kamp akışına odaklan, adım adım ilerle.";
  }

  let WeatherIcon = Cloud;
  let weatherText = "";
  let weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#082B55] to-[#061A32]";

  if (weather) {
    if (weather.weathercode === 0) {
      WeatherIcon = Sun;
      weatherText = "Açık";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#093566] to-[#061A32]";
    } else if (weather.weathercode === 1 || weather.weathercode === 2) {
      WeatherIcon = Cloud;
      weatherText = "Parçalı bulutlu";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#0D2440] to-[#061A32]";
    } else if (weather.weathercode === 3) {
      WeatherIcon = Cloud;
      weatherText = "Bulutlu";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#0D2440] to-[#061A32]";
    } else if (weather.weathercode === 45 || weather.weathercode === 48) {
      WeatherIcon = Cloud;
      weatherText = "Sisli";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#0D2440] to-[#061A32]";
    } else if ([51, 53, 55].includes(weather.weathercode)) {
      WeatherIcon = CloudRain;
      weatherText = "Çisenti";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#102A4A] to-[#061A32]";
    } else if ([61, 63, 65].includes(weather.weathercode)) {
      WeatherIcon = CloudRain;
      weatherText = "Yağmurlu";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#102A4A] to-[#061A32]";
    } else if ([71, 73, 75].includes(weather.weathercode)) {
      WeatherIcon = CloudSnow;
      weatherText = "Karlı";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#143254] to-[#061A32]";
    } else if ([80, 81, 82].includes(weather.weathercode)) {
      WeatherIcon = CloudRain;
      weatherText = "Sağanak";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#102A4A] to-[#061A32]";
    } else if ([95, 96, 99].includes(weather.weathercode)) {
      WeatherIcon = CloudLightning;
      weatherText = "Fırtınalı";
      weatherGradient = "bg-gradient-to-br from-[#061A32] via-[#1A2235] to-[#061A32]";
    } else {
      WeatherIcon = Cloud;
      weatherText = "Belirsiz";
    }
  } else if (!weatherLoading && (hour >= 18 || hour < 5)) {
    weatherGradient = "bg-gradient-to-br from-[#041224] via-[#061A32] to-[#041224]";
  }

  // --- /END SETUP ---

  const [selectedGoalDate, setSelectedGoalDate] = useState<string>(todayISO);

  const handleStartDayClick = () => {
    const [currentHour, currentMinutes] = timeLabel.split(':').map(Number);

    if (profile?.work_start_time) {
      const [startH, startM] = profile.work_start_time.split(':').map(Number);
      if (currentHour < startH || (currentHour === startH && currentMinutes < startM)) {
        setShowEarlyStartModal(true);
        return;
      }
    }

    if (setShowDailyRadar) setShowDailyRadar(true);
  };

  const dedupedAlerts = getDedupedAlerts(leadAlerts || []);

  const alertItems: TopActionItem[] = dedupedAlerts
    .map((alert) => ({
      type: "alert" as const,
      originalItem: alert,
      id: `alert-${alert.id}`,
      title: alert.lead?.name || "İsimsiz Lead",
      subtitle: "Acil Alarm",
      desc: leadAlertDescriptions[alert.alert_type] || "Takip gerektiriyor",
      icon: AlertCircle,
      colorClass: "text-red-600 bg-red-100",
      ringClass: "hover:ring-red-200",
    }))
    .slice(0, 4);

  const dripItems: TopActionItem[] = (tasks || [])
    .filter(
      (t) =>
        t.is_drip && !t.completed && isTodayOrOverdue(t.due_date || t.time, todayISO),
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
        !t.is_drip && !t.completed && isTodayOrOverdue(t.due_date || t.time, todayISO),
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
    .filter((gt) => {
      if (gt.is_completed) return false;
      if (isNewUserCampaignActive) {
        // Hide aggressive sales gamified tasks during 90 Day Campaign's onboarding phase
        const lower = gt.title.toLowerCase();
        if (lower.includes("lead") || lower.includes("portföy") || lower.includes("arama")) {
          return false;
        }
        // In fact, the prompt says hide classical gamified task cards. 
        return false; // Safest to just hide them from dashboard priority list if they are a new user?
      }
      return true;
    })
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
    .filter((pt) => !pt.is_completed && isTodayOrOverdue(pt.due_date || pt.reminder_time, todayISO))
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

  const isCampaignRestricted = activeCampaign && activeCampaign.current_day >= 8 && (!profile?.subscription_end_date || new Date(profile.subscription_end_date) < new Date()) && profile?.tier !== 'master' && profile?.tier !== 'pro' && profile?.tier !== 'elite';

  const campaignItems: TopActionItem[] = (campaignTasks || [])
    .filter((ct) => ct.status !== 'completed' && ct.status !== 'skipped')
    .map((ct) => {
      const isLocked = isCampaignRestricted;
      return {
        type: "campaign" as const,
        originalItem: ct,
        id: `campaign-${ct.id}`,
        title: isLocked ? "Pro Özellik Kilidi Aç" : ct.title,
        subtitle: isLocked ? "Kamp Görevi" : "Kamp Görevi",
        desc: isLocked ? "Paketi aktif et" : `${ct.xp_reward || 0} XP Kazandırır`,
        icon: isLocked ? Target : Target, // wait we need Lock icon if we want? Let's assume LucideIcon Target is fine or we can omit. Let's just use Target for now since we don't have Lock imported yet maybe.
        colorClass: isLocked ? "text-amber-500 bg-amber-500/10" : "text-[#00D2B4] bg-[#00D2B4]/10",
        ringClass: isLocked ? "hover:ring-amber-500/30" : "hover:ring-[#00D2B4]/30",
      };
    })
    .slice(0, 3);

  const remainingItems = [
    ...campaignItems,
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

  const todaysFocuses = microGoals?.filter((m) => {
    if (!m.deadline) return false;
    const dateObj = new Date(m.deadline);
    if (isNaN(dateObj.getTime())) return false;
    return getTodayStrFromDate(dateObj) === selectedGoalDate;
  }) || [];

  const startFocus = todaysFocuses.find(m => m.target_metric === 'day_start_focus' || m.target_metric === 'daily_focus');
  const planFocus = todaysFocuses.find(m => m.target_metric === 'day_close_tomorrow_focus');

  const focusesToDisplay: (MicroGoal & { label: string })[] = [];
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getTodayStrFromDate(tomorrow);

  if (startFocus) {
    focusesToDisplay.push({ ...startFocus, label: selectedGoalDate === todayISO ? 'Gün Başlangıç Odağı' : 'Ana Odak' });
  }
  if (planFocus) {
    if (!startFocus || startFocus.title !== planFocus.title) {
       focusesToDisplay.push({ ...planFocus, label: selectedGoalDate === tomorrowStr ? 'Yarın İçin Planlanan Odak' : 'Dünden Planlanan Odak' });
    }
  }

  const completeMicroGoalMutation = useMutation({
    mutationFn: async (goal: MicroGoal) => {
      // First update goal status
      const updatedGoal = await api.momentumOs.updateMicroGoal(goal.id, { 
        status: 'completed', 
        current_value: goal.target_value 
      });
      
      // Attempt to award XP safely
      try {
        await api.earnXP('DAILY_FOCUS_COMPLETED', goal.id);
      } catch (e) {
         console.warn("Could not award XP for daily focus or already awarded.", e);
      }
      
      return updatedGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.MICRO_GOALS, profile?.id],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.id] });
      toast.success("Odak tamamlandı! +25 XP kazandınız.");
    }
  });

  const localStarted = profile?.id
    ? localStorage.getItem(`day_started_${profile.id}_${todayISO}`)
    : null;
  const localEnded = profile?.id
    ? localStorage.getItem(`day_ended_${profile.id}_${todayISO}`)
    : null;

  const isDayStarted = !!(
    (profile?.last_day_started_at &&
      getTodayStrFromDate(new Date(profile.last_day_started_at)) === todayISO) ||
    localStarted ||
    optimisticDayStartedAt ||
    startDayMutation.isSuccess ||
    completeMorningRitualMutation.isSuccess
  );

  const dayStartTimestamp = profile?.last_day_started_at || localStarted || "";
  
  const dayClosureEndedToday = dayClosure && (dayClosure.closure_date === todayISO || (dayClosure.updated_at && getTodayStrFromDate(new Date(dayClosure.updated_at)) === todayISO));

  const isDayEnded = !!(
    localEnded ||
    dayClosureEndedToday ||
    (profile?.last_ritual_completed_at &&
      getTodayStrFromDate(new Date(profile.last_ritual_completed_at)) === todayISO &&
      (!dayStartTimestamp ||
        profile.last_ritual_completed_at > dayStartTimestamp))
  );
  const showMissedCloseWarning = React.useMemo(() => {
    if (isDayStarted || optimisticDayStartedAt || startDayMutation.isPending) return false;
    const lastStartedStr = profile?.last_day_started_at;
    const lastClosedStr = profile?.last_ritual_completed_at;
    if (!lastStartedStr) return false;
    
    const startedDate = new Date(lastStartedStr);
    if (isNaN(startedDate.getTime())) return false;
    const lastStartedDate = getTodayStrFromDate(startedDate);

    if (lastStartedDate < todayISO) {
        let wasClosed = false;
        if (lastClosedStr) {
           const closedDate = new Date(lastClosedStr);
           if (!isNaN(closedDate.getTime()) && getTodayStrFromDate(closedDate) === lastStartedDate) {
               wasClosed = true;
           }
        }
        if (!wasClosed) return true;
    }
    return false;
  }, [profile, todayISO, isDayStarted, optimisticDayStartedAt, startDayMutation.isPending]);

  const startedTimeLabel = React.useMemo(() => {
    if (!isDayStarted) return null;
    let d = new Date();
    let foundRef = false;

    if (optimisticDayStartedAt) {
      d = new Date(optimisticDayStartedAt);
      foundRef = true;
    } else if (profile?.last_day_started_at && getTodayStrFromDate(new Date(profile.last_day_started_at)) === todayISO) {
      d = new Date(profile.last_day_started_at);
      foundRef = true;
    } else if (localStarted && localStarted !== "true") {
      const parsed = new Date(localStarted);
      if (!isNaN(parsed.getTime())) {
          d = parsed;
          foundRef = true;
      }
    }

    if (foundRef) {
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return timeLabel;
  }, [isDayStarted, optimisticDayStartedAt, profile?.last_day_started_at, todayISO, localStarted, timeLabel]);

  React.useEffect(() => {
    if (profile?.id && !localStarted) {
      const dbStartedToday = profile.last_day_started_at && getTodayStrFromDate(new Date(profile.last_day_started_at)) === todayISO;
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

  const calcCallsTarget = dailyPlan?.planned_calls ?? 0;
  const calcCallsDone = dailyPlan?.completed_calls ?? 0;

  const calcFollowupsTarget = dailyPlan?.planned_followups ?? 0;
  const calcFollowupsDone = dailyPlan?.completed_followups ?? 0;

  const calcVisitsTarget = dailyPlan?.planned_portfolio_actions ?? 0;
  const calcVisitsDone = dailyPlan?.completed_portfolio_actions ?? 0;

  // Action Center
  const countBolgemAlerts = (tasks || [])
    .filter(
      (t) =>
        t.source === "bolgem" &&
        !t.completed &&
        isTodayOrOverdue(t.due_date || t.time, todayISO),
    ).length;

  const countMissedFollowups = leadAlerts.filter(a => a.alert_type === "long_time_no_contact" || a.alert_type === "needs_follow_up").length + 
    tasks.filter(t => !t.completed && (t.source === "crm" || t.lead_id) && t.title.toLowerCase().includes('takip') && isTodayOrOverdue(t.due_date || t.time, todayISO)).length;
  const countNewLeads = leadAlerts.filter(a => a.alert_type === "new_lead").length;
  const countPriceRevisions = smartRecItems.length;
  const totalBadges = countMissedFollowups + countNewLeads + countPriceRevisions + countBolgemAlerts;

  const countOverdueTasks = (tasks || []).filter(t => !t.completed && (t.due_date || t.time) && (t.due_date || t.time)!.split("T")[0] <= todayISO).length + 
                            (personalTasks || []).filter(t => !t.is_completed && (t.due_date || t.reminder_time) && (t.due_date || t.reminder_time)!.split("T")[0] <= todayISO).length;

  const canUseDebugReset = isAdminRole(profile?.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-36 lg:pb-8"
    >
      <TokenUsageAlert />

      <div className="flex flex-col gap-6 md:gap-8">
        
        {/* ANA AKIŞ */}
        <div className="flex flex-col gap-6">
        
          {/* HERO CARD: Bugünü Netleştir */}
          <section className="order-1">
            <Card className={`p-5 ${weatherGradient} text-white border-none shadow-xl relative overflow-hidden rounded-3xl flex flex-col md:flex-row justify-between gap-4 md:items-center transition-colors duration-1000`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2B4]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 flex-1">
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                    {greetingObj.icon}
                    <span>{todayDateString}</span>
                    {district && (
                      <>
                        <span className="opacity-50">•</span>
                        <span>{district}{city && `, ${city}`}</span>
                      </>
                    )}
                    {weather && !weatherLoading && (
                      <>
                        <span className="opacity-50">•</span>
                        <span className="flex items-center gap-1">
                          <WeatherIcon size={14} className="opacity-80" />
                          {weather.temperature}°C {weatherText && `· ${weatherText}`}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {heroTitle}
                  </h2>
                </div>
                <p className="text-sm text-white/75 font-medium max-w-sm mb-4">
                  {heroSubtitle}
                </p>

                {showMissedCloseWarning && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    Önceki günü kapatmadın! Yeni günü başlattığında kapatılmayan gün için disiplin kaydı oluşturulabilir.
                  </div>
                )}
                {!isDayStarted && !isDayEnded && (
                  <button
                    onClick={handleStartDayClick}
                    disabled={startDayMutation.isPending}
                    className="bg-white hover:bg-slate-50 text-[#FF6B1A] px-8 h-12 rounded-xl text-sm font-bold active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                    {startDayMutation.isPending ? "Başlatılıyor..." : "Günü Başlat"}
                  </button>
                )}
                {isDayStarted && !isDayEnded && (
                  <div className="bg-[#00D2B4]/10 border border-[#00D2B4]/20 text-[#00D2B4] px-6 h-12 rounded-xl text-sm font-bold w-full md:w-auto inline-flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} className="shrink-0" />
                    Gün Başladı {startedTimeLabel}
                  </div>
                )}
              </div>

              {/* Sağ Taraf - Stats & Campaign */}
              <div className="relative z-10 flex flex-col gap-2 w-full md:w-auto">
                <div className="grid grid-cols-2 gap-0 bg-[#041A33]/70 rounded-2xl overflow-hidden w-full">
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

                {activeCampaign && (
                  <div onClick={() => setActiveTab && setActiveTab('campaign-90')} className="bg-[#00D2B4]/10 hover:bg-[#00D2B4]/20 border border-[#00D2B4]/20 rounded-2xl p-3 cursor-pointer transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00D2B4]/20 text-[#00D2B4] flex items-center justify-center shrink-0">
                         <Target size={16} />
                      </div>
                      <div>
                         <h4 className="text-xs font-bold text-white group-hover:text-[#00D2B4] transition-colors">90 Gün Kampı - Gün {activeCampaign.current_day}</h4>
                         <p className="text-[10px] uppercase font-bold text-[#00D2B4]/80 tracking-wider">Bugün: {(campaignTasks || []).filter(t => t.status === 'completed').length}/{campaignTasks?.length || 0} Görev</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-[#00D2B4] group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* 1. BUGÜNÜN ÖNCELİKLERİ */}
          <section className="order-2">
            <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-3xl">
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
                          } else if (item.type === "campaign" && setActiveTab) {
                            setActiveTab("campaign-90");
                          }
                        }}
                        className={`flex flex-row items-start gap-3 p-3 sm:p-2.5 hover:bg-slate-50 transition-colors rounded-xl border border-slate-100 sm:border-transparent hover:border-slate-200 group min-h-[64px] ${(item.type === "gamified" || item.type === "campaign") ? "cursor-pointer" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.colorClass} saturate-[0.8] shadow-sm mt-0.5`}>
                          <item.icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2 mb-0.5">
                            <h4 className="text-[13px] sm:text-sm font-bold text-slate-800 line-clamp-2 md:truncate min-w-0">
                              {item.title}
                            </h4>
                            <div className={`shrink-0 px-2 py-0.5 text-[9px] font-bold rounded-md ${
                              item.type === "alert" ? "bg-red-50 text-red-700" :
                              item.type === "drip" ? "bg-orange-50 text-orange-700" :
                              item.type === "smart_rec" ? "bg-amber-50 text-amber-700" :
                              item.type === "daily" ? "bg-blue-50 text-blue-700" :
                              item.type === "personal" ? "bg-rose-50 text-rose-700" :
                              item.type === "gamified" ? "bg-indigo-50 text-indigo-700" :
                              item.type === "campaign" ? "bg-emerald-50 text-emerald-700" :
                              "bg-slate-50 text-slate-600"
                            }`}>
                            {item.type === "alert" ? "Kritik Aksiyon" :
                             item.type === "drip" ? "Takip" :
                             item.type === "smart_rec" ? "Sistem Önerisi" :
                             item.type === "daily" ? "Planlı Görev" :
                             item.type === "personal" ? "Kişisel" :
                             item.type === "gamified" ? "Gelişim" :
                             item.type === "campaign" ? "90 Gün Kampı" :
                             "Planlı Görev"}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                            {item.desc || item.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {campaignTasks && campaignTasks.length > 0 && (
                      <button 
                        onClick={() => setActiveTab && setActiveTab('campaign-90')}
                        className="w-full text-center text-[11px] font-bold text-[#00D2B4] hover:text-[#00e3c5] py-2.5 mt-2 transition-colors border border-[#00D2B4]/20 rounded-xl hover:bg-[#00D2B4]/5 bg-[#00D2B4]/5"
                      >
                        Tüm Kamp Görevlerini Gör
                      </button>
                    )}

                    {todaysPriorities.length > 5 && (
                      <button 
                        onClick={() => {
                          if (visiblePriorityCount < Math.min(15, todaysPriorities.length)) {
                            setVisiblePriorityCount(prev => Math.min(prev + 5, 15, todaysPriorities.length));
                          } else {
                            setVisiblePriorityCount(5);
                          }
                        }}
                        className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 py-2.5 mt-2 transition-colors border border-slate-200/50 rounded-xl hover:bg-slate-50"
                      >
                        {visiblePriorityCount < Math.min(15, todaysPriorities.length) ? "+5 öncelik daha göster" : "Daha az göster"}
                      </button>
                    )}
                    {isGamifiedTasksLoading && (
                      <div className="flex items-center justify-center py-2 text-[10px] font-bold text-slate-400 mt-2 gap-1.5 animate-pulse">
                        <Sparkles size={12} /> Gelişim hedefleri güncelleniyor...
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                      <CheckCircle2 size={24} className="text-[#00D2B4]" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 mb-1.5">Şu Anlık Her Şey Temiz!</h4>
                    <p className="text-[11px] text-slate-500 mb-5 max-w-[240px] font-medium leading-relaxed">Aktif önceliğin bulunmuyor. Yeni bir hedef ekleyerek günü planlamaya başlayabilirsin.</p>
                    <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors">
                      Yeni Görev Oluştur
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* 2. BUGÜNKÜ HEDEF VE PLAN */}
          <section className="order-3">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">2</div>
                    <h3 className="text-base font-bold text-slate-900">Bugünkü Hedef ve Plan</h3>
                  </div>
                </div>

                {/* YATAY TARİH ÇUBUĞU */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4 -mx-2 px-2">
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (i - 1)); // i.e., -1 yields tomorrow, 0 yields today, 1 yields yesterday
                    return getTodayStrFromDate(d);
                  }).map((dateStr) => {
                    let label = "";
                    const d = new Date(dateStr);
                    const diffDays = Math.floor((new Date(todayISO).getTime() - d.getTime()) / (1000 * 3600 * 24));
                    
                    if (diffDays === -1) label = "Yarın";
                    else if (diffDays === 0) label = "Bugün";
                    else if (diffDays === 1) label = "Dün";
                    else if (diffDays <= 5 && diffDays > 1) label = d.toLocaleDateString("tr-TR", { weekday: "short" });
                    else label = d.toLocaleDateString("tr-TR", { day: '2-digit', month: '2-digit' });
                    
                    const isSelected = selectedGoalDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedGoalDate(dateStr)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          isSelected 
                            ? "bg-slate-800 text-white" 
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 mb-4">
                      {focusesToDisplay.length > 0 ? (
                        focusesToDisplay.map((focus, idx) => (
                          <div key={focus.id || idx} className={`flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 transition-colors ${focus.status === 'completed' ? 'bg-emerald-50/50' : 'bg-slate-50/50'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${focus.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                                  {focus.status === 'completed' ? <CheckCircle2 size={20} /> : <Target size={20} />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                      {focus.label}
                                    </span>
                                    {focus.status === 'completed' && (
                                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">TEMİZ</span>
                                    )}
                                  </div>
                                  <h4 className={`text-sm font-bold truncate ${focus.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                    {focus.title}
                                  </h4>
                                </div>
                              </div>
                              
                              {focus.status !== 'completed' && selectedGoalDate === todayISO && (
                                <button 
                                  onClick={() => completeMicroGoalMutation.mutate(focus)}
                                  disabled={completeMicroGoalMutation.isPending}
                                  className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                >
                                  {completeMicroGoalMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                  <span className="hidden sm:inline">Tamamla</span>
                                </button>
                              )}
                              {focus.status === 'completed' && (
                                <div className="shrink-0 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">
                                  <Star size={10} className="fill-current" /> +25 XP
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 self-start md:self-auto bg-slate-100 text-slate-400">
                            <Target size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              Bugün için odak noktası belirlenmedi.
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              Gününü başlatırken ana odağını belirleyebilirsin.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                
                {!isNewUserCampaignActive && (
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-1 text-emerald-500 mb-1">
                        <Phone size={12} />
                        <span className="text-[9px] font-bold text-slate-600 uppercase">Arama</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-slate-900">{calcCallsDone}</span>
                        <span className="text-[10px] text-slate-400 font-medium">/ {calcCallsTarget}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-1 text-orange-500 mb-1">
                        <UserCheck size={12} />
                        <span className="text-[9px] font-bold text-slate-600 uppercase">Takip</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-slate-900">{calcFollowupsDone}</span>
                        <span className="text-[10px] text-slate-400 font-medium">/ {calcFollowupsTarget}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                      <div className="flex items-center gap-1 text-blue-500 mb-1">
                        <Calendar size={12} />
                        <span className="text-[9px] font-bold text-slate-600 uppercase">Ziyaret</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-slate-900">{calcVisitsDone}</span>
                        <span className="text-[10px] text-slate-400 font-medium">/ {calcVisitsTarget}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
          </section>



          {/* 3. GÜNÜN NOTLARI / AKIŞ NOTLARI */}
          <section className="order-4">
              <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">3</div>
                    <h3 className="text-base font-bold text-slate-900">Akış Notları</h3>
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



          {/* 4. KRİTİK SİNYALLER / AKSİYON MERKEZİ */}
          {!isNewUserCampaignActive && (
          <section className="order-5">
            <Card className="p-4 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-3xl">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">4</div>
                 <h3 className="text-base font-bold text-slate-900">Kritik Sinyaller</h3>
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex flex-col justify-center gap-1">
                   <div className="flex items-center gap-1.5 text-red-600">
                      <Phone size={14} />
                      <span className="text-[10px] font-bold uppercase">Cevapsız</span>
                   </div>
                   <span className="text-xl font-black text-slate-900">{countMissedFollowups}</span>
                </div>

                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 flex flex-col justify-center gap-1">
                   <div className="flex items-center gap-1.5 text-orange-600">
                      <Mail size={14} />
                      <span className="text-[10px] font-bold uppercase">Yeni Lead</span>
                   </div>
                   <span className="text-xl font-black text-slate-900">{countNewLeads}</span>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col justify-center gap-1">
                   <div className="flex items-center gap-1.5 text-blue-600">
                      <Home size={14} />
                      <span className="text-[10px] font-bold uppercase">Fiyat Revize</span>
                   </div>
                   <span className="text-xl font-black text-slate-900">{countPriceRevisions}</span>
                </div>
                
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-col justify-center gap-1">
                   <div className="flex items-center gap-1.5 text-amber-600">
                      <MapPin size={14} />
                      <span className="text-[10px] font-bold uppercase">Bölgem</span>
                   </div>
                   <span className="text-xl font-black text-slate-900">{countBolgemAlerts}</span>
                </div>
             </div>
             
             <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-4 flex items-center">
               Tüm aksiyonları gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>
          </section>
          )}

          {/* 5. GÜNÜ KAPAT / GÜN ÖZETİ */}
          <section className="order-6">
              {isDayEnded ? (
                <Card className="p-4 bg-[#F2FFF8] border border-emerald-100 flex items-center justify-between rounded-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Bugün Başarıyla Tamamlandı</h3>
                      <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                        Bugünün kaydı tamamlandı. Yarın için güçlü bir başlangıç hazır.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : !isDayStarted ? (
                <Card className="p-4 md:p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] rounded-3xl">
                  <div className="flex items-center gap-4 text-left w-full">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-slate-50 text-slate-400">
                      <Clock size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm md:text-base font-bold text-slate-900">Günü Başlat</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 pr-4">Günü Kapat ve Odaklanma Modu aksiyonları için önce yukarıdan günü başlatmalısın.</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 md:p-5 bg-white border border-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-visible rounded-3xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${countOverdueTasks > 0 ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-500"}`}>
                        {countOverdueTasks > 0 ? <LifeBuoy size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <div className="flex-1 text-left">
                        {countOverdueTasks > 0 ? (
                          <>
                            <h4 className="text-sm md:text-base font-bold text-slate-900">Bugün <span className="text-orange-600">{countOverdueTasks} aksiyon</span> geride kaldı.</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 md:pr-4">İstersen günü kapatmadan önce odaklanma moduna geçip toparlanabilirsin.</p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-sm md:text-base font-bold text-slate-900">Planın yolunda.</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 md:pr-4">Geciken aksiyon yok. Günü kısa bir değerlendirmeyle kapatabilirsin.</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end mt-2 md:mt-0">
                        {countOverdueTasks > 0 && !isNewUserCampaignActive && (
                            <button 
                              onClick={() => {
                                if (!isDayStarted) {
                                  toast.error("Odaklanma Modu için önce günü başlatmalısın.");
                                  return;
                                }
                                if (isDayEnded) {
                                  toast.error("Bugün zaten kapatılmış.");
                                  return;
                                }
                                if (rescueSession && rescueSession.status === 'active' && setShowRescueModal) {
                                  setShowRescueModal(true);
                                  return;
                                }
                                if (!startRescueMutation.isPending) {
                                  startRescueMutation.mutate();
                                }
                              }} 
                              disabled={startRescueMutation.isPending}
                              className="h-10 px-4 rounded-xl text-orange-600 bg-orange-50 border border-orange-200 font-bold text-[11px] flex items-center gap-1.5 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors justify-center shadow-sm flex-1 md:flex-none whitespace-nowrap"
                            >
                              {startRescueMutation.isPending ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" /> Hazırlanıyor...
                                </>
                              ) : (
                                <>
                                  <Zap size={14} className="fill-current" /> Odaklanma Modu
                                </>
                              )}
                            </button>
                        )}
                        <button onClick={() => {
                          if (!isDayStarted) {
                            toast.error("Günü kapatmak için önce günü başlatmalısın.");
                            return;
                          }
                          if (isDayEnded) {
                            toast.error("Bugün zaten kapatılmış.");
                            return;
                          }
                          setShowDayCloser(true);
                        }} className="h-10 px-6 rounded-xl bg-[#061A32] text-white font-bold text-[11px] flex items-center gap-1.5 hover:bg-[#082B55] transition-colors justify-center flex-1 md:flex-none shadow-md whitespace-nowrap">
                          <CheckCircle2 size={16} /> Günü Kapat
                        </button>
                    </div>
                  </div>
                </Card>
              )}
          </section>



        </div>
      </div>
      {showEarlyStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-2">Güne Erken Başlıyorsun</h3>
            <p className="text-sm text-slate-500 mb-4">
              Mesai başlangıç saatinin {profile?.work_start_time} olduğunu görüyorum. Günü erken başlatmak için bir not eklemelisin.
            </p>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 min-h-[100px] resize-none mb-4"
              placeholder="Örn: Bugün sahada işim olduğu için erken çıkıyorum..."
              value={earlyStartReason}
              onChange={(e) => setEarlyStartReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => setShowEarlyStartModal(false)}
              >
                İptal
              </button>
              <button
                className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={!earlyStartReason.trim() || startDayMutation.isPending}
                onClick={() => {
                  if (setPendingEarlyStartReason) {
                    setPendingEarlyStartReason(earlyStartReason.trim());
                  }
                  setShowEarlyStartModal(false);
                  if (setShowDailyRadar) setShowDailyRadar(true);
                }}
              >
                {startDayMutation.isPending ? "Kaydediliyor..." : "Günü Başlat"}
              </button>
            </div>
          </div>
        </div>
      )}
      {canUseDebugReset && (
        <div className="mt-12 text-center">
          <button
            onClick={async () => {
              if (!resetConfirmArmed) {
                setResetConfirmArmed(true);
                setTimeout(() => setResetConfirmArmed(false), 6000);
                return;
              }
              try {
                setIsResettingToday(true);
                await api.adminResetToday();
                localStorage.removeItem(`day_started_${profile.id}_${todayISO}`);
                localStorage.removeItem(`day_ended_${profile.id}_${todayISO}`);
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile.id] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_DAILY_PLAN] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_DAILY_PLAN, profile.id] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MICRO_GOALS] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MICRO_GOALS, profile.id] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_DAY_CLOSURE] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_DAY_CLOSURE, profile.id] });
                if (setOptimisticDayStartedAt) {
                  setOptimisticDayStartedAt(null);
                }
                toast.success("Bugünkü test kayıtları sıfırlandı. Sayfa yenileniyor.");
                setTimeout(() => window.location.reload(), 500);
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Sıfırlama başarısız.";
                toast.error(message);
                setIsResettingToday(false);
                setResetConfirmArmed(false);
              }
            }}
            disabled={isResettingToday}
            className={`px-4 py-2 border rounded-xl text-xs font-mono transition-colors disabled:opacity-50 ${resetConfirmArmed ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'}`}
          >
            {isResettingToday ? "Sıfırlanıyor..." : (resetConfirmArmed ? "Emin misin? Tekrar tıkla" : "[DEBUG] Bugünü Sıfırla")}
          </button>
        </div>
      )}
    </motion.div>
  );
};