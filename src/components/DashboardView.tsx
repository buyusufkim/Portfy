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
import { UserProfile, GamifiedTask, Property, Task, PersonalTask, RescueSession, UserStats, CoachInsight, MutationResult, MissedOpportunity, DailyPlan, DayClosure, WeeklyReport } from '../types';
import { RevenueStats } from '../types/revenue';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
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
  setToast?: (toast: { message: string, type: 'success' | 'error' | 'info' } | null) => void;
  leadAlerts?: any[];
  dailyPlan?: DailyPlan | null;
  dayClosure?: DayClosure | null;
  weeklyReports?: WeeklyReport[];
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
  setToast,
  tasks = [],
  setShowDailyRadar,
  leadAlerts = [],
  dailyPlan,
  dayClosure,
  weeklyReports = []
}) => {
  const [dashboardTab, setDashboardTab] = useState<'action' | 'analysis'>('action');
  const [microGoalInput, setMicroGoalInput] = useState('');
  const [showMicroGoalForm, setShowMicroGoalForm] = useState(false);

  const addMicroGoalMutation = useMutation({
    mutationFn: (title: string) => api.momentumOs.addMicroGoal({ 
      title, 
      status: 'pending',
      deadline: new Date().toISOString() 
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
  const [portalLink, setPortalLink] = useState<string | null>(null);

  const handleCreatePortal = async (propertyId: string) => {
    try {
      const response = await api.momentumOs.createPortalToken(propertyId);
      const link = `${window.location.origin}/portal/${response.token}`;
      setPortalLink(link);
      setToast?.({ message: "Portföy portal linki oluşturuldu!", type: 'success' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_PORTAL_EVENTS] });
    } catch (error) {
      setToast?.({ message: "Portal oluşturulamadı.", type: 'error' });
    }
  };

  const { data: portalEvents = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_PORTAL_EVENTS, profile?.id],
    queryFn: () => api.momentumOs.getOwnerPortalEventsSummary(),
    enabled: !!profile?.id
  });

  const getPropertyTraffic = (propertyId: string) => {
    const stat = portalEvents.find(e => e.property_id === propertyId);
    return {
      views: stat ? stat.views : 0,
      lastView: stat ? stat.last_seen : null
    };
  };

  const potentialRevenue = (properties || []).reduce((acc, p) => {
    if (['Satıldı', 'Pasif'].includes(p.status)) return acc;
    return acc + (((p.price || 0) * (p.commission_rate || 0)) / 100) * (p.sale_probability || 0.5);
  }, 0);

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

  const isTasksDisabled = (!isDayStarted || isDayEnded) && !startDayMutation.isSuccess && !completeMorningRitualMutation.isSuccess;

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
            {isDayStarted && !isDayEnded && !completeMorningRitualMutation.isSuccess && (
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
                        Bugün odaklanman gereken en önemli 3 kişi/iş nedir? Güne rastgele değil, planlı başla.
                      </p>
                      <button 
                        onClick={() => {
                          if (setShowDailyRadar) setShowDailyRadar(true);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                      >
                        Planı Kaydet & Güne Başla
                      </button>
                    </div>
                  </div>
                </Card>
              </section>
            )}

            {isDayStarted && !isDayEnded && (
              <section className="space-y-4">
                <div className="rounded-[32px] p-4 md:p-6 bg-slate-900 relative overflow-hidden group border border-slate-800 shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <Target size={24} className="text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white tracking-tight">Bugünü Kazan: Mikro Hedef</h3>
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">GÜNLÜK ODAK</Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Bugünü kazanmak için tamamlaman gereken en kritik tek iş nedir?
                        </p>
                      </div>
                    </div>

                    {!showMicroGoalForm ? (
                      <button 
                        onClick={() => setShowMicroGoalForm(true)}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Mikro Hedef Belirle
                      </button>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <textarea
                          placeholder="Örn: Daha önce aramadığım 5 FSBO satıcısını ara."
                          value={microGoalInput}
                          onChange={(e) => setMicroGoalInput(e.target.value)}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-4 text-white text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 min-h-[100px]"
                        />
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setShowMicroGoalForm(false)}
                            className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                          >
                            İptal
                          </button>
                          <button 
                            onClick={() => microGoalInput.trim() && addMicroGoalMutation.mutate(microGoalInput)}
                            disabled={!microGoalInput.trim() || addMicroGoalMutation.isPending}
                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50"
                          >
                            {addMicroGoalMutation.isPending ? 'Kaydediliyor...' : 'Hedefi Başlat'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {dailyPlan && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arama</div>
                      <div className="text-lg font-black text-white">{dailyPlan.completed_calls}/{dailyPlan.planned_calls}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Takip</div>
                      <div className="text-lg font-black text-white">{dailyPlan.completed_followups}/{dailyPlan.planned_followups}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portföy</div>
                      <div className="text-lg font-black text-white">{dailyPlan.completed_portfolio_actions}/{dailyPlan.planned_portfolio_actions}</div>
                    </div>
                  </div>
                )}

                {dayClosure && (
                  <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Trophy size={18} className="text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Günün Özeti Hazır</h4>
                        <p className="text-[10px] text-emerald-400 font-medium">"{dayClosure.wins?.slice(0, 50)}..."</p>
                      </div>
                    </div>
                  </Card>
                )}
              </section>
            )}

            {/* SAHİP PORTALI TRAFİK MOTORU */}
            <section className="space-y-4">
              <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay border-[1px] border-dashed border-white" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4 text-white">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                      <Globe size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        Sahip Portalı Trafik Motoru
                        <div className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded tracking-widest border border-white/20 uppercase">OTOMASYON</div>
                      </h3>
                      <p className="text-xs text-blue-100 mt-1 font-medium max-w-sm leading-relaxed">
                        Müşterilerinize şeffaf rapor sunun. Rapor linkini her açtıklarında onlara diğer portföylerini satmayı teklif edeceğiz.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {properties.slice(0, 4).map(prop => {
                  const traffic = getPropertyTraffic(prop.id);
                  return (
                    <Card key={prop.id} className="p-4 bg-white border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-2">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{prop.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[8px] bg-slate-100 text-slate-500 border-none">{prop.status}</Badge>
                            {traffic.views > 0 && <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1"><Zap size={8} /> {traffic.views} İzlenme</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCreatePortal(prop.id)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                          title="Portal Linki Oluştur"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {traffic.lastView && (
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          Son İzlenme: {new Date(traffic.lastView).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {portalLink && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Portal Linki Hazır</span>
                    <button onClick={() => { navigator.clipboard.writeText(portalLink); toast.success("Kopyalandı!"); }} className="p-2 bg-white text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-2 text-[10px] font-bold shadow-sm">
                      <Copy size={12} /> Kopyala
                    </button>
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 break-all bg-white/50 p-2 rounded-lg border border-emerald-100/50">
                    {portalLink}
                  </div>
                </div>
              )}
            </section>

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

            {/* Ghosting Önleyici Akıllı Hatırlatıcılar */}
            {(leadAlerts.length > 0 || (tasks || []).filter(t => t.is_drip && !t.completed).length > 0) && (
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <Ghost size={18} className="text-orange-500" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Ghosting Önleyici</h2>
                  </div>
                  <Badge variant="warning" className="bg-orange-100 text-orange-600 border-none px-2 py-0.5">
                    {leadAlerts.length + (tasks || []).filter(t => t.is_drip && !t.completed).length} Kritik Takip
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {/* Yeni Lead Alert Verileri */}
                  {leadAlerts.map(alert => (
                    <Card key={alert.id} className="p-4 md:p-6 bg-white border-l-4 border-l-red-500 shadow-xl shadow-red-500/5 group hover:ring-1 hover:ring-red-500/20 transition-all">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                              <AlertCircle size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{alert.lead_name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{alert.alert_type || 'Sessiz Müşteri'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                // Navigate to lead or show detail
                                if (profile?.id) {
                                  // Logic to open lead detail
                                  setToast?.({ message: 'Lead detayına yönlendiriliyorsunuz...', type: 'info' });
                                }
                              }}
                              className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors"
                            >
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/50 relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={12} className="text-red-500" />
                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Kritik Uyarı</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* Mevcut Drip Task'lar */}
                  {(tasks || []).filter(t => t.is_drip && !t.completed).map(task => (
                    <Card key={task.id} className="p-4 md:p-6 bg-white border-l-4 border-l-orange-500 shadow-xl shadow-orange-500/5 group">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                              <MessageSquare size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akıllı Hatırlatıcı</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => api.updateTaskStatus(task.id, true).then(() => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] }))}
                            className="p-2 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                        
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={12} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">AI Koç Önerisi</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            {task.ai_suggestion}
                          </p>
                          <div className="mt-4 flex gap-2">
                            <button 
                              onClick={() => {
                                const msg = task.ai_suggestion?.match(/"([^"]+)"/)?.[1] || task.ai_suggestion;
                                navigator.clipboard.writeText(msg || '');
                                toast.success("Kopyalandı!");
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            >
                              <Copy size={12} />
                              Mesajı Kopyala
                            </button>
                            <button 
                              onClick={() => {
                                const msg = task.ai_suggestion?.match(/"([^"]+)"/)?.[1] || task.ai_suggestion;
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg || '')}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                            >
                              <Send size={12} />
                              Hemen Gönder
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Günün Görevleri</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => refreshTasksMutation.mutate()}
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
                
                {/* İLK 7 GÜN AKTİVASYON */}
                {profile && new Date(profile.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Target size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-900">İlk 7 Gün Aktivasyon Programı</h4>
                        <p className="text-[10px] text-blue-700 mt-0.5">Sisteme hızlı adapte olmak için bu görevleri tamamla</p>
                      </div>
                    </div>
                    <div className="space-y-2 relative z-10">
                      {[
                        { title: 'İlk Müşterini Kaydet', completed: true },
                        { title: 'İlk Portföyünü Ekle', completed: (properties || []).length > 0 },
                        { title: 'Bölgemi Keşfet', completed: profile.region && profile.region.district },
                        { title: 'Profile Fotoğraf Ekle', completed: false }
                      ].map((task, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/60 p-2.5 rounded-xl border border-blue-100/50">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${task.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <CheckCircle2 size={12} />
                          </div>
                          <span className={`text-xs font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

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
                      onClick={() => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.id] })}
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
                      onClick={() => refreshTasksMutation.mutate()}
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

            <section className="space-y-4">
              <div className="flex justify-between items-center mt-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Haftalık İş Sonucu Panosu</h2>
                <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">Momentum OS</div>
              </div>
              
              {weeklyReports.length > 0 ? (
                <div className="space-y-4">
                  {weeklyReports.slice(0, 2).map((report, idx) => (
                    <Card key={idx} className={`p-6 border-slate-100 shadow-sm ${idx === 0 ? 'bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-100' : 'bg-white'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4 text-indigo-600">
                          <div className={`w-10 h-10 ${idx === 0 ? 'bg-indigo-100' : 'bg-slate-100'} rounded-xl flex items-center justify-center`}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{idx === 0 ? 'Bu Haftaki Performans' : 'Geçen Haftaki Performans'}</h3>
                            <p className="text-xs text-indigo-500/70 font-medium">Momentum OS Raporu</p>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-lg border border-slate-200">
                          {new Date(report.week_start_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Aramalar</div>
                          <div className="text-2xl font-black text-slate-900">{report.metrics?.calls_made || 0}</div>
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block">Verimli</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ziyaretler</div>
                          <div className="text-2xl font-black text-slate-900">{report.metrics?.property_visits || 0}</div>
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-2 inline-block">Saha</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Yeni Lead</div>
                          <div className="text-2xl font-black text-slate-900">{report.metrics?.leads_acquired || 0}</div>
                          <div className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded mt-2 inline-block">Büyüme</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gelir</div>
                          <div className="text-2xl font-black text-slate-900">₺{((report.metrics?.closed_volume || 0) / 1000).toFixed(0)}k</div>
                          <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded mt-2 inline-block">Nakit</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-100">
                  <div className="flex items-center gap-4 text-indigo-600 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Bu Haftaki Performans</h3>
                      <p className="text-xs text-indigo-500/70 font-medium">Satış ve görüşmelerinizin özeti</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Toplam Görüşme</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{tasks?.filter(t => t.completed && t.type === 'Arama').length || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Saha Ziyareti</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{tasks?.filter(t => t.completed && t.type === 'Saha').length || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Yeni Portföy</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{properties?.filter(p => p.status === 'Yeni').length || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Satış & Kiralama</p>
                      <p className="text-xl font-black text-slate-900 mt-1">{properties?.filter(p => p.status === 'Satıldı').length || 0}</p>
                    </div>
                  </div>
                </Card>
              )}
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