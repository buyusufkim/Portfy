import React, { useState } from 'react';
import { TokenUsageAlert } from './TokenUsageAlert';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Sparkles, Trophy, Zap, CheckCircle2, 
  RefreshCw, Circle, Moon, ArrowRight, AlertCircle, ClipboardList, Lock,
  MessageSquare, Send, Copy, Ghost, Sun, Target, Globe, Plus
} from 'lucide-react';
import { Card, Badge, Skeleton } from './UI';
import { api } from '../services/api';
import { RevenueOverview } from './revenue/RevenueOverview';
import { PipelineFunnel } from './revenue/PipelineFunnel';
import { QUERY_KEYS } from '../constants/queryKeys';
import { UserProfile, GamifiedTask, Property, Task, PersonalTask, RescueSession, UserStats, CoachInsight, MutationResult, MissedOpportunity, DailyPlan, DayClosure, WeeklyReport, LeadAlert, Lead } from '../types';
import { RevenueStats } from '../types/revenue';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { LucideIcon } from 'lucide-react';

type BaseActionItem = {
  id: string;
  title: string;
  subtitle: string;
  desc?: string;
  icon: LucideIcon;
  colorClass: string;
  ringClass: string;
};

type TopActionItem = BaseActionItem & (
  | { type: 'alert'; originalItem: LeadAlert }
  | { type: 'smart_rec'; originalItem: Property }
  | { type: 'drip'; originalItem: Task }
  | { type: 'gamified'; originalItem: GamifiedTask }
  | { type: 'daily'; originalItem: Task }
);

import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeModal } from './premium/UpgradeModal';
import { toast } from 'react-hot-toast';

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
  completeMorningRitualMutation: MutationResult<void, { morning_notes: string }>;
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
  rescueSession,
  isGamifiedTasksLoading,
  isGamifiedTasksError,
  refreshTasksMutation,
  completeTaskMutation,
  startRescueMutation,
  revenueStats,
  revenueLoading,
  setActiveTab,
  setShowDayCloser,
  queryClient,
  startDayMutation,
  completeMorningRitualMutation,
  tasks = [],
  setShowDailyRadar,
  leadAlerts = [],
  dailyPlan,
  dayClosure,
  weeklyReports = [],
  setSelectedLead,
  setSelectedProperty
}) => {
  const [dashboardTab, setDashboardTab] = useState<'action' | 'revenue'>('action');
  const [microGoalInput, setMicroGoalInput] = useState('');
  const [showMicroGoalForm, setShowMicroGoalForm] = useState(false);
  const [visiblePriorityCount, setVisiblePriorityCount] = useState(5);

  // --- Bugünün Öncelikleri Logic ---
  const alertItems: TopActionItem[] = leadAlerts.map(alert => ({
    type: 'alert' as const,
    originalItem: alert,
    id: `alert-${alert.id}`,
    title: alert.lead?.name || 'İsimsiz Lead',
    subtitle: 'Acil Alarm',
    desc: alert.alert_type,
    icon: AlertCircle,
    colorClass: 'text-red-600 bg-red-100',
    ringClass: 'hover:ring-red-200'
  })).slice(0, 4);

  const dripItems: TopActionItem[] = (tasks || []).filter(t => t.is_drip && !t.completed).map(task => ({
    type: 'drip' as const,
    originalItem: task,
    id: `drip-${task.id}`,
    title: task.title,
    subtitle: 'Akıllı Takip',
    desc: task.ai_suggestion || 'Müşteri ile tekrar iletişime geçme zamanı geldi.',
    icon: Ghost,
    colorClass: 'text-orange-600 bg-orange-100',
    ringClass: 'hover:ring-orange-200'
  })).slice(0, 3);

  const smartRecItems: TopActionItem[] = (properties || []).filter(p => p.market_analysis?.status === 'Pahalı' && p.status === 'Yayında').map(p => ({
    type: 'smart_rec' as const,
    originalItem: p,
    id: `prop-${p.id}`,
    title: 'Fiyat Revizesi Önerisi',
    subtitle: p.title,
    desc: "Piyasa ortalamasının üzerinde. Fiyat aksiyonu almalısın.",
    icon: Sparkles,
    colorClass: 'text-amber-600 bg-amber-100',
    ringClass: 'hover:ring-amber-200'
  })).slice(0, 3);

  const dailyItems: TopActionItem[] = (tasks || []).filter(t => !t.is_drip && !t.completed).map(task => ({
    type: 'daily' as const,
    originalItem: task,
    id: `daily-${task.id}`,
    title: task.title,
    subtitle: 'Günlük Görev',
    desc: 'Bugün yapman gereken standart bir görev.',
    icon: ClipboardList,
    colorClass: 'text-blue-600 bg-blue-100',
    ringClass: 'hover:ring-blue-200'
  }));

  const gamifiedItems: TopActionItem[] = (gamifiedTasks || []).filter(t => !t.is_completed).map(task => ({
    type: 'gamified' as const,
    originalItem: task,
    id: `gtask-${task.id}`,
    title: task.title,
    subtitle: task.category === 'main' ? 'Kritik Gelişim' : 'Mikro Gelişim',
    desc: task.ai_reason || 'Gelişimin için önerilen görev.',
    icon: Trophy,
    colorClass: 'text-indigo-600 bg-indigo-100',
    ringClass: 'hover:ring-indigo-200'
  }));

  const todaysPriorities: TopActionItem[] = [
    ...alertItems,
    ...dripItems,
    ...smartRecItems,
    ...dailyItems,
    ...gamifiedItems
  ].slice(0, 15);

  const visiblePriorities = todaysPriorities.slice(0, visiblePriorityCount);

  const { data: microGoals } = useQuery({
    queryKey: [QUERY_KEYS.MICRO_GOALS, profile?.id],
    queryFn: api.momentumOs.getMicroGoals,
    enabled: !!profile?.id
  });

  const activeMicroGoal = microGoals?.find(m => m.status === 'pending');

  const addMicroGoalMutation = useMutation({
    mutationFn: (title: string) => api.momentumOs.addMicroGoal({ 
      title, 
      status: 'pending',
      deadline: new Date().toISOString(),
      target_metric: 'daily_focus',
      target_value: 1,
      current_value: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MICRO_GOALS, profile?.id] });
      setMicroGoalInput('');
      setShowMicroGoalForm(false);
      toast.success("Mikro hedef başarıyla belirlendi!");
    }
  });
  
  // Premium Erişim Kontrolleri
  const { hasAccess, subscribe } = useFeatureAccess();
  const canUseAiCoach = hasAccess('ai_coach');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayISO = getTodayStr();
  const localStarted = profile?.id ? localStorage.getItem(`day_started_${profile.id}_${todayISO}`) : null;
  const localEnded = profile?.id ? localStorage.getItem(`day_ended_${profile.id}_${todayISO}`) : null;
  
  const isDayStarted = !!(
    (profile?.last_day_started_at && profile.last_day_started_at.startsWith(todayISO)) || 
    (profile?.last_active_date === todayISO) || 
    localStarted ||
    startDayMutation.isSuccess ||
    completeMorningRitualMutation.isSuccess
  );
  
  const dayStartTimestamp = profile?.last_day_started_at || localStarted || '';
  const isDayEnded = !!(
    localEnded || 
    (profile?.last_ritual_completed_at && 
     profile.last_ritual_completed_at.startsWith(todayISO) && 
     (!dayStartTimestamp || profile.last_ritual_completed_at > dayStartTimestamp))
  );

  React.useEffect(() => {
    if (profile?.id && !localStarted) {
      const dbStartedToday = profile.last_day_started_at?.startsWith(todayISO) || profile.last_active_date === todayISO;
      if (dbStartedToday) {
        localStorage.setItem(`day_started_${profile.id}_${todayISO}`, profile.last_day_started_at || new Date().toISOString());
      }
    }
  }, [profile, localStarted, todayISO]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-6 md:space-y-8 pb-32"
    >
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Portfy</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bölge Hakimiyeti</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{profile?.display_name}</div>
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{gamifiedStats?.level_name || 'Broker'}</div>
          </div>
          <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('profil')}>
            <div className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} alt="Profile" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
        </div>
      </header>

      <TokenUsageAlert />

      {isDayStarted && isDayEnded && (
        <Card className="p-6 bg-slate-50 border-slate-200 border-dashed">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bugün Başarıyla Tamamlandı</h3>
              <p className="text-[10px] font-medium uppercase tracking-wider">İyi dinlenmeler şampiyon!</p>
            </div>
          </div>
        </Card>
      )}

      {/* TOP SUMMARY CARDS */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="p-4 md:p-6 !bg-orange-600 !text-white border-none shadow-lg shadow-orange-200">
          <div className="flex justify-between items-start">
            <Trophy size={20} className="text-white opacity-80" />
            <Badge variant="info" className="!bg-white !text-orange-600 border-none">{gamifiedStats?.level_name || '...'}</Badge>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              {gamifiedStats ? (gamifiedStats.points || 0).toLocaleString() : <Skeleton className="h-8 w-20 bg-white/20" />}
            </div>
            <div className="text-white font-bold text-[10px] uppercase tracking-wider mt-1">Toplam Puan</div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex justify-between items-start">
            <Zap size={20} className="text-amber-500" />
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seri</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">
              {gamifiedStats ? `${gamifiedStats.streak || 0} Gün` : <Skeleton className="h-8 w-16" />}
            </div>
            <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider mt-1">Peş Peşe Seri</div>
          </div>
        </Card>
      </section>

      {/* AI KOÇ KART */}
      <section>
        <Card 
          onClick={() => {
            if (!canUseAiCoach) {
              setShowUpgradeModal(true);
            } else {
              setActiveTab('koc');
            }
          }}
          className="p-4 md:p-6 !bg-slate-900 !text-white border-none overflow-hidden relative shadow-2xl cursor-pointer group"
        >
          <div className="relative z-10 flex items-center gap-4 md:gap-6">
            <div className="relative w-16 h-16 shrink-0 md:w-20 md:h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-800 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={`${gamifiedStats?.momentum && gamifiedStats.momentum < 40 ? 'text-red-500' : gamifiedStats?.momentum && gamifiedStats.momentum < 70 ? 'text-amber-500' : 'text-emerald-500'} stroke-current`} strokeWidth="3" strokeDasharray={`${gamifiedStats?.momentum || 0}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg md:text-xl font-bold text-white">{gamifiedStats?.momentum || 0}</span>
                <span className="text-[7px] md:text-[8px] uppercase font-bold text-slate-400">Momentum</span>
              </div>
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-500">
                  <Sparkles size={14} className="md:size-16" />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">AI Koç Önerisi</span>
                </div>
                {!canUseAiCoach && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-white/50 group-hover:text-white transition-colors">
                    <Lock size={10} />
                    <span className="text-[8px] uppercase font-bold tracking-wider">Kilitli</span>
                  </div>
                )}
              </div>
              
              <div className="relative">
                 {canUseAiCoach ? (
                   <div className="text-sm font-bold leading-relaxed text-white italic line-clamp-2">
                     {coachInsights?.daily_tip ? `"${coachInsights.daily_tip}"` : <Skeleton className="h-4 w-full bg-white/10" />}
                   </div>
                 ) : (
                   <div className="text-sm font-bold leading-relaxed text-white/30 italic blur-[3px] select-none line-clamp-2">
                     Yapay zeka asistanınız bugün kime odaklanmanız gerektiğini analiz etti. Görmek için tıklayın...
                   </div>
                 )}
                 
                 {!canUseAiCoach && (
                   <div className="absolute inset-0 flex items-center justify-start">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-orange-500/20 shadow-xl group-hover:bg-slate-800 transition-colors">
                        Planı Yükselt
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        </Card>
      </section>

      {/* SEKMELER */}
      <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
        <button 
          onClick={() => setDashboardTab('action')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'action' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Aksiyon Merkezi
        </button>
        <button 
          onClick={() => setDashboardTab('revenue')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Gelir
        </button>
      </div>

      <AnimatePresence mode="wait">
        {dashboardTab === 'action' ? (
          <motion.div 
            key="action-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {!isDayStarted && !isDayEnded && (
              <section>
                <Card className="p-4 md:p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Sun size={24} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-orange-900">Sabah 10 Dakika Planı</h3>
                        <div className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase">Ritüel</div>
                      </div>
                      <p className="text-xs text-orange-800/70 font-medium mt-1 mb-4 leading-relaxed">
                        Güne başlamadan mikro hedefini belirle. Bugünü kazanmak için tek ve en kritik odak noktanı yaz.
                      </p>
                      <div className="space-y-3 relative z-10 w-full mb-4">
                        <textarea
                          placeholder="Örn: En kârlı 5 müşterimi arayıp yeni portföyleri sunmak."
                          value={microGoalInput}
                          onChange={(e) => setMicroGoalInput(e.target.value)}
                          className="w-full bg-white/80 border border-orange-200 rounded-xl p-3 text-orange-900 text-sm focus:border-orange-400 outline-none transition-all placeholder:text-orange-900/40 min-h-[80px] shadow-inner"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (!microGoalInput.trim()) {
                            toast.error("Güne başlamak için mikro hedefini yaz.");
                            return;
                          }
                          addMicroGoalMutation.mutate(microGoalInput);
                          if (setShowDailyRadar) setShowDailyRadar(true);
                        }}
                        disabled={!microGoalInput.trim() || addMicroGoalMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all w-full md:w-auto disabled:opacity-50"
                      >
                        {addMicroGoalMutation.isPending ? 'Kaydediliyor...' : 'Planı Kaydet & Güne Başla'}
                      </button>
                    </div>
                  </div>
                </Card>
              </section>
            )}

            {isDayStarted && !isDayEnded && (
              <>
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Bugünün Öncelikleri <Target size={20} className="text-blue-500 fill-blue-500/20" />
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Odaklanman gereken en önemli işler</p>
                  </div>
                </div>
              
              {visiblePriorities.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {visiblePriorities.map(item => (
                    <Card key={item.id} className={`p-4 bg-white border border-slate-100 shadow-sm transition-all flex flex-col gap-3 group hover:ring-1 hover:shadow-md ${item.ringClass}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-1 items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.colorClass}`}>
                            <item.icon size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subtitle}</div>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.title}</h4>
                          </div>
                        </div>

                        {/* AKSİYON BUTONLARI */}
                        {item.type === 'gamified' && (
                          <button 
                            onClick={() => !completeTaskMutation.isPending && completeTaskMutation.mutate({ task: item.originalItem })}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm shrink-0"
                          >
                            Tamamla (+${item.originalItem.points}XP)
                          </button>
                        )}
                        {item.type === 'daily' && (
                          <button 
                            onClick={() => {
                              api.updateTaskStatus(item.originalItem.id, true)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] });
                                  toast.success("Görev başarıyla tamamlandı!");
                                })
                                .catch(() => toast.error("Görev durumu güncellenirken hata oluştu."));
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm shrink-0"
                          >
                            Tamamla
                          </button>
                        )}
                        {item.type === 'drip' && (
                          <button 
                            onClick={() => {
                              api.updateTaskStatus(item.originalItem.id, true)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] });
                                  toast.success("Takip görevi başarıyla tamamlandı!");
                                })
                                .catch(() => toast.error("Görev durumu güncellenirken hata oluştu."));
                            }}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm shrink-0"
                          >
                            İletildi
                          </button>
                        )}
                        {item.type === 'alert' && (
                          <button 
                            onClick={() => {
                              if (setSelectedLead && item.originalItem.lead && item.originalItem.lead.id) {
                                setSelectedLead(item.originalItem.lead as Lead);
                              }
                              setActiveTab('crm');
                            }} 
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm shrink-0"
                          >
                            İncele
                          </button>
                        )}
                        {item.type === 'smart_rec' && (
                          <button 
                            onClick={() => {
                              if (setSelectedProperty) {
                                setSelectedProperty(item.originalItem);
                              }
                              setActiveTab('portfoyler');
                            }} 
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm shrink-0"
                          >
                            Düzenle
                          </button>
                        )}
                      </div>
                      {item.desc && (
                         <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl italic font-medium leading-relaxed">
                           {item.desc}
                         </div>
                      )}
                    </Card>
                  ))}

                  {todaysPriorities.length > 5 && (
                    <div className="flex gap-2 pt-1">
                      {todaysPriorities.length > visiblePriorityCount && (
                        <button 
                          onClick={() => setVisiblePriorityCount(prev => Math.min(prev + 5, todaysPriorities.length))}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          {Math.min(5, todaysPriorities.length - visiblePriorityCount)} öncelik daha göster
                        </button>
                      )}
                      {visiblePriorityCount > 5 && (
                        <button 
                          onClick={() => setVisiblePriorityCount(5)}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          Daha az göster
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">Mükemmel Gidiyorsun!</h4>
                  <p className="text-xs text-emerald-700 mt-1">Günün önceliklerini tamamladın.</p>
                </div>
              )}
            </section>
            {(activeMicroGoal || microGoalInput.trim()) && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-center gap-4 mt-4 mb-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Target size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-0.5">MİKRO HEDEF</h3>
                  <p className="text-sm text-indigo-700 font-bold">{activeMicroGoal?.title || microGoalInput}</p>
                </div>
              </div>
            )}

            {dailyPlan && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arama</div>
                  <div className="text-lg font-black text-indigo-900">{dailyPlan.completed_calls}/{dailyPlan.planned_calls}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Takip</div>
                  <div className="text-lg font-black text-indigo-900">{dailyPlan.completed_followups}/{dailyPlan.planned_followups}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portföy</div>
                  <div className="text-lg font-black text-indigo-900">{dailyPlan.completed_portfolio_actions}/{dailyPlan.planned_portfolio_actions}</div>
                </div>
              </div>
            )}

            {dayClosure && (
              <Card className="p-4 bg-emerald-50 border-emerald-100 mt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Trophy size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">Günün Özeti Hazır</h4>
                    <p className="text-[10px] text-emerald-700 font-medium">"{dayClosure.wins?.slice(0, 50)}..."</p>
                  </div>
                </div>
              </Card>
            )}

            {/* RESCUE CONDITION */}
            {(() => {
              const currentHour = new Date().getHours();
              const isLowProgress = (gamifiedStats?.daily_progress || 0) < 40;
              const canRescue = isLowProgress && currentHour >= 16 && !rescueSession;
              if (!canRescue) return null;

              return (
                <Card className="bg-orange-50 border-orange-100 p-6 relative overflow-hidden mt-8">
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-orange-900">Günü Kurtarma Zamanı!</h4>
                        <p className="text-xs text-orange-700 mt-1">Günü %100 verimle kapatmak için hala vaktin var.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => startRescueMutation.mutate()}
                      disabled={startRescueMutation.isPending}
                      className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                    >
                      {startRescueMutation.isPending ? 'Hazırlanıyor...' : 'Başlat'}
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                </Card>
              );
            })()}

            {/* GÜNÜ KAPAT */}
            <section className="pt-4">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDayCloser(true)}
                className="w-full bg-slate-900 text-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex items-center justify-between group shadow-2xl shadow-slate-900/20 relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                    <Moon size={24} className="md:hidden" />
                    <Moon size={32} className="hidden md:block" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xl text-white">Günü Kapat</h4>
                      <Badge variant="info" className="!bg-slate-800 !text-slate-400 border-none text-[10px]">{todayStr}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Bugünkü performansını mühürle ve serini koru.</p>
                  </div>
                </div>
                <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ArrowRight size={24} />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              </motion.button>
            </section>
          </>
        )}
          </motion.div>
        ) : (
          <motion.div
            key="revenue-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {revenueLoading && !revenueStats ? (
              <div className="flex justify-center py-20 bg-slate-50 rounded-[32px]">
                <RefreshCw className="animate-spin text-slate-400" size={32} />
              </div>
            ) : revenueStats ? (
               <>
                 <RevenueOverview stats={revenueStats} />
                 <PipelineFunnel properties={properties} />
               </>
            ) : (
               <Card className="p-8 text-center bg-white">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Target size={32} className="text-slate-400" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">Henüz Veri Yok</h3>
                 <p className="text-slate-500 text-sm mt-2">Satış ve gelirlerinizi takip etmek için portföy ve CRM kullanmaya başlayın.</p>
               </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(tier) => console.log('Plan seçildi:', tier)}
        onActivateTrial={async () => {
          try {
            await subscribe('trial');
            setShowUpgradeModal(false);
          } catch (e) {
            console.error("Deneme sürümü başlatılırken hata:", e);
          }
        }}
      />
    </motion.div>
  );
};