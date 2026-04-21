import React, { useState } from 'react';
import { TokenUsageAlert } from './TokenUsageAlert.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Sparkles, Trophy, Zap, CheckCircle2, 
  RefreshCw, Circle, Moon, ArrowRight, AlertCircle, ClipboardList, Lock
} from 'lucide-react';
import { Card, Badge, Skeleton } from './UI';
import { RevenueOverview } from './revenue/RevenueOverview';
import { PipelineFunnel } from './revenue/PipelineFunnel';
import { QUERY_KEYS } from '../constants/queryKeys';
import { UserProfile, GamifiedTask, Property, Task, PersonalTask, RescueSession, UserStats, CoachInsight, MutationResult } from '../types';
import { RevenueStats } from '../types/revenue';
import { QueryClient } from '@tanstack/react-query';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeModal } from './premium/UpgradeModal';

interface DashboardViewProps {
  profile: UserProfile | null;
  gamifiedStats: UserStats | null;
  properties: Property[];
  coachInsights: CoachInsight | null;
  gamifiedTasks: GamifiedTask[];
  rescueSession: RescueSession | null;
  isGamifiedTasksLoading: boolean;
  isGamifiedTasksError: boolean;
  refreshTasksMutation: MutationResult<any, any>;
  completeTaskMutation: MutationResult<any, any>;
  startRescueMutation: MutationResult<any, any>;
  revenueStats: RevenueStats | null;
  revenueLoading: boolean;
  setActiveTab: (tab: string) => void;
  setShowDayCloser: (show: boolean) => void;
  queryClient: QueryClient;
  startDayMutation: MutationResult<any, any>;
  completeMorningRitualMutation: MutationResult<any, any>;
  tasks?: Task[];
  personalTasks?: PersonalTask[];
  setShowAdminPanel?: (show: boolean) => void;
  setShowDailyRadar?: (show: boolean) => void;
  setShowMissedOpportunities?: (show: boolean) => void;
  missedOpportunities?: any[];
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
  completeMorningRitualMutation
}) => {
  const [dashboardTab, setDashboardTab] = useState<'action' | 'analysis'>('action');
  
  // Premium Erişim Kontrolleri
  const { hasAccess, subscribe } = useFeatureAccess();
  const canUseAiCoach = hasAccess('ai_coach');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const potentialRevenue = (properties || []).reduce((acc, p) => {
    if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
    return acc + (((p.price || 0) * (p.commission_rate || 0)) / 100) * (p.sale_probability || 0.5);
  }, 0);

  const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayISO = getTodayStr();
  const localStarted = profile?.uid ? localStorage.getItem(`day_started_${profile.uid}_${todayISO}`) : null;
  const localEnded = profile?.uid ? localStorage.getItem(`day_ended_${profile.uid}_${todayISO}`) : null;
  
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

  const isTasksDisabled = (!isDayStarted || isDayEnded) && !startDayMutation.isSuccess && !completeMorningRitualMutation.isSuccess;

  React.useEffect(() => {
    if (profile?.uid && !localStarted) {
      const dbStartedToday = profile.last_day_started_at?.startsWith(todayISO) || profile.last_active_date === todayISO;
      if (dbStartedToday) {
        localStorage.setItem(`day_started_${profile.uid}_${todayISO}`, profile.last_day_started_at || new Date().toISOString());
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
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} alt="Profile" referrerPolicy="no-referrer" />
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

      <div className="flex p-1 bg-slate-100 rounded-2xl">
        <button 
          onClick={() => setDashboardTab('action')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'action' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Aksiyon Merkezi
        </button>
        <button 
          onClick={() => setDashboardTab('analysis')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${dashboardTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          Gelir & Analiz
        </button>
      </div>

      <AnimatePresence mode="wait">
        {dashboardTab === 'action' ? (
          <motion.div 
            key="action-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 🔥 MÜKEMMEL, SADE, YENİ AI KOÇ KART KİLİDİ 🔥 */}
              <Card 
                onClick={() => {
                  if (!canUseAiCoach) {
                    setShowUpgradeModal(true);
                  } else {
                    setActiveTab('koc');
                  }
                }}
                className="p-4 md:p-6 !bg-slate-900 !text-white border-none overflow-hidden relative md:col-span-2 shadow-2xl cursor-pointer group"
              >
                <div className="relative z-10 flex items-center gap-4 md:gap-6">
                  {/* Momentum Halkası - Her Halükarda Görünür */}
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
                  
                  {/* Sağ Taraf - Yazı Bölümü */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-500">
                        <Sparkles size={14} className="md:size-16" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">AI Koç Önerisi</span>
                      </div>
                      {/* Ücretsiz Üyeler İçin Minik Kilit */}
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
                       
                       {/* Ücretsiz Üyeler İçin Yazı Üstünde Çıkan Buton */}
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

            {(() => {
              const currentHour = new Date().getHours();
              const isLowProgress = (gamifiedStats?.daily_progress || 0) < 40;
              const canRescue = currentHour >= 15 && isLowProgress && !rescueSession;
              if (!canRescue) return null;

              return (
                <Card className="bg-orange-50 border-orange-100 p-6 relative overflow-hidden">
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
                      onClick={() => startRescueMutation.mutate(undefined)}
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

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Akıllı Öneriler</h2>
              {(properties || []).some(p => p.market_analysis?.status === 'Pahalı' && p.status === 'Yayında') ? (
                (properties || []).filter(p => p.market_analysis?.status === 'Pahalı' && p.status === 'Yayında').slice(0, 1).map(p => (
                  <Card key={`alert-${p.id}`} className="p-4 md:p-6 bg-amber-50 border-amber-100">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Fiyat Revizesi Önerisi</h4>
                        <p className="text-xs text-amber-700 mt-1">"{p.title}" portföyü piyasa ortalamasının üzerinde. %5 indirim satışı hızlandırabilir.</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-4 md:p-6 bg-emerald-50 border-emerald-100">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Her Şey Yolunda</h4>
                      <p className="text-xs text-emerald-700 mt-1">Şu an acil aksiyon gerektiren bir portföyün bulunmuyor.</p>
                    </div>
                  </div>
                </Card>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Günün Görevleri</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => refreshTasksMutation.mutate(undefined)}
                    disabled={refreshTasksMutation.isPending || isGamifiedTasksLoading}
                    className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors disabled:opacity-50"
                    title="Görevleri Yeniden Oluştur"
                  >
                    <RefreshCw size={14} className={refreshTasksMutation.isPending || isGamifiedTasksLoading ? 'animate-spin' : ''} />
                  </button>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {gamifiedStats?.tasks_completed_today}/{gamifiedStats?.total_tasks_today}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {isGamifiedTasksLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={`skeleton-${i}`} className="p-4 md:p-5 border-none shadow-sm">
                        <div className="flex items-center gap-4 md:gap-5">
                          <Skeleton className="w-12 h-12 rounded-2xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : isGamifiedTasksError ? (
                  <div className="py-12 text-center space-y-3 bg-red-50/50 rounded-[32px] border border-red-100/50 shadow-sm">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-2">
                      <AlertCircle size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-red-900">Bir Hata Oluştu</h4>
                    <p className="text-xs text-red-700 px-8">Görevler yüklenirken bir sorun oluştu.</p>
                    <button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] })}
                      className="mt-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                ) : (gamifiedTasks || []).length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-2">
                      <ClipboardList size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Görevler Bulunamadı</h4>
                    <p className="text-xs text-slate-400 px-8">Bugün için henüz görevlerin oluşturulmadı.</p>
                    <button 
                      onClick={() => refreshTasksMutation.mutate(undefined)}
                      disabled={refreshTasksMutation.isPending}
                      className="mt-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                    >
                      {refreshTasksMutation.isPending ? 'Oluşturuluyor...' : 'Görevleri Oluştur'}
                    </button>
                  </div>
                ) : (gamifiedTasks || []).filter(t => !t.is_completed).length === 0 ? (
                  <Card className="p-6 md:p-8 text-center bg-emerald-50/30 border-emerald-100/50">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-900">Harika İş!</h4>
                    <p className="text-xs text-emerald-700 mt-1">Bugünkü tüm görevlerini tamamladın.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {(gamifiedTasks || []).filter(t => !t.is_completed).slice(0, 3).map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            onClick={() => !completeTaskMutation.isPending && completeTaskMutation.mutate({ task })}
                            className={`p-4 md:p-5 transition-all border-none shadow-sm hover:shadow-md hover:ring-1 hover:ring-orange-100 cursor-pointer active:scale-[0.98] group ${completeTaskMutation.isPending && completeTaskMutation.variables?.task.id === task.id ? 'opacity-70 bg-orange-50/50' : ''}`}
                          >
                            <div className="flex items-center gap-4 md:gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${completeTaskMutation.isPending && completeTaskMutation.variables?.task.id === task.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                                {completeTaskMutation.isPending && completeTaskMutation.variables?.task.id === task.id ? (
                                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={24} /></motion.div>
                                ) : <Circle size={24} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                                  {task.category === 'main' && <Badge variant="warning" className="text-[8px] px-1.5 py-0">Kritik</Badge>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{task.ai_reason || 'Günlük gelişim görevi'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-orange-600">+{task.points}</div>
                                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">XP</div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {(gamifiedTasks || []).filter(t => t.is_completed).length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamamlananlar</div>
                      <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {(gamifiedTasks || []).filter(t => t.is_completed).length} Görev
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {(gamifiedTasks || []).filter(t => t.is_completed).map(task => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={task.id} 
                            className="flex-shrink-0 bg-white text-slate-600 px-4 py-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-slate-100 shadow-sm snap-start"
                          >
                            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                              <CheckCircle2 size={12} />
                            </div>
                            {task.title}
                          </motion.div>
                        ))}
                      </div>
                      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {isDayStarted && !isDayEnded && (
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
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="analysis-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Gelir Görünümü</h2>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Canlı Pipeline</div>
              </div>
              {revenueStats && <RevenueOverview stats={revenueStats} loading={revenueLoading} />}
            </section>

            <section className="space-y-4">
              <PipelineFunnel properties={properties || []} />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Gerçek Upgrade Modal Çağrısı */}
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