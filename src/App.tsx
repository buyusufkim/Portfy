import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  BarChart3, 
  Plus, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Clock,
  X,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Map as MapIcon,
  LogOut,
  User as UserIcon,
  CreditCard,
  ShieldCheck,
  Briefcase,
  Home,
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity,
  Heart,
  Share2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Bell,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Globe,
  Trophy,
  Zap,
  Circle,
  Check,
  Mic,
  Brain,
  Lock,
  Moon,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, Task, Building, Property, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, PersonalTask, UserNote, DailyStats } from './types';
import { api } from './services/api';
import { locationService } from './services/locationService';
import { AuthProvider, useAuth } from './AuthContext';
import { Badge } from './components/UI';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardView } from './components/DashboardView';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { ProfilView } from './components/ProfilView';
import { CRMPage } from './pages/CRMPage';
import { NotesView } from './components/NotesView';
import { RegionSetupModal } from './components/RegionSetupModal';
import { DailyRadar } from './components/habit/DailyRadar';
import { DayCloser } from './components/habit/DayCloser';
import { AICoachPanel } from './components/ai/AICoachPanel';
import { RevenueOverview } from './components/revenue/RevenueOverview';
import { PipelineFunnel } from './components/revenue/PipelineFunnel';
import { useRevenueStats } from './hooks/useRevenueStats';
import { formatCurrency } from './lib/revenueUtils';
import { useCategories } from './hooks/useCategories';
import { QUERY_KEYS } from './constants/queryKeys';

import { MainContentRouter, NavigationProps, LeadProps, PortfolioProps, UtilityProps } from './components/app/MainContentRouter';
import { AppModals } from './components/app/AppModals';
import { LoadingFallback } from './components/app/LoadingFallback';
import { CoachView } from './components/app/CoachView';
import { LoginScreen } from './components/app/LoginScreen';
import { NotificationCenter } from './components/app/NotificationCenter';
import { IntroSequence } from './components/app/IntroSequence';
import { AppTour } from './components/app/AppTour';
import { QuickAddMenu } from './components/app/QuickAddMenu';
import { RitualOverlays } from './components/app/RitualOverlays';
import { DesktopSidebar, MobileNav } from './components/app/Navigation';
import { Header } from './components/app/Header';
import { NotificationToast, GlobalToast } from './components/app/Toasts';
import { FloatingActionButton } from './components/app/FloatingActionButton';

const PricingScreen = React.lazy(() => import('./components/PricingScreen'));

// --- React Query Client ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 dakika cache
    },
  },
});

function MainApp() {
  const queryClient = useQueryClient();
  const { profile, logout, completeTour } = useAuth();
  const { categories } = useCategories();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [notification, setNotification] = useState<{ task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified' } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Modal Visibility State ---
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showVoiceQuickAdd, setShowVoiceQuickAdd] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false);
  const [showDailyRadar, setShowDailyRadar] = useState(false);
  const [showDayCloser, setShowDayCloser] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showExternalListings, setShowExternalListings] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);
  const [showRegionSetup, setShowRegionSetup] = useState(false);

  const closeAllModals = () => {
    setShowQuickAdd(false);
    setShowVoiceQuickAdd(false);
    setShowAddProperty(false);
    setShowAddLead(false);
    setShowAddVisit(false);
    setShowWhatsAppImport(false);
    setShowDailyRadar(false);
    setShowDayCloser(false);
    setShowIntegrationModal(false);
    setShowExternalListings(false);
    setShowImportUrlModal(false);
    setShowMissedOpportunities(false);
    setShowRegionSetup(false);
  };

  // --- Data Selection & Analysis State ---
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | 'all'>('all');
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  // --- Queries ---
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: [QUERY_KEYS.LEADS, profile?.uid],
    queryFn: api.getLeads,
    enabled: !!profile?.uid
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, profile?.uid],
    queryFn: api.getProperties,
    enabled: !!profile?.uid
  });

  const { data: personalTasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.uid],
    queryFn: api.getPersonalTasks,
    enabled: !!profile?.uid
  });

  const { data: gamifiedTasks = [], isLoading: isGamifiedTasksLoading } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.uid
  });

  const { data: fieldVisits = [] } = useQuery({
    queryKey: [QUERY_KEYS.FIELD_VISITS, profile?.uid],
    queryFn: api.getFieldVisits,
    enabled: !!profile?.uid
  });

  const { data: tasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, profile?.uid],
    queryFn: api.getTasks,
    enabled: !!profile?.uid
  });

  const { data: regionScores = [] } = useQuery({
    queryKey: [QUERY_KEYS.REGION_SCORES, profile?.uid],
    queryFn: api.getRegionEfficiencyScores,
    enabled: !!profile?.uid
  });

  const { data: templates = [] } = useQuery({
    queryKey: [QUERY_KEYS.TEMPLATES, profile?.uid],
    queryFn: api.getMessageTemplates,
    enabled: !!profile?.uid
  });

  const { data: brokerAccount } = useQuery({
    queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profile?.uid],
    queryFn: api.getBrokerAccount,
    enabled: !!profile?.uid
  });

  const { data: externalListings = [] } = useQuery({
    queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profile?.uid],
    queryFn: api.getExternalListings,
    enabled: !!profile?.uid
  });

  const { data: rescueSession } = useQuery({
    queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid],
    queryFn: api.getRescueSession,
    enabled: !!profile?.uid
  });

  const { data: missedOpportunities = [] } = useQuery({
    queryKey: [QUERY_KEYS.MISSED_OPPORTUNITIES, profile?.uid],
    queryFn: api.getMissedOpportunities,
    enabled: !!profile?.uid
  });

  const { data: dailyRadarData } = useQuery({
    queryKey: [QUERY_KEYS.DAILY_RADAR, profile?.uid],
    queryFn: api.getDailyRadar,
    enabled: !!profile?.uid && showDailyRadar
  });

  // --- Mutations ---
  const addLeadMutation = useMutation({
    mutationFn: api.addLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES, profile?.uid] });
      setShowAddLead(false);
      setShowQuickAdd(false);
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Lead> }) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] });
      setShowAddLead(false);
      setIsEditingLead(false);
      setSelectedLead(null);
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: api.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] });
      setSelectedLead(null);
    }
  });

  const addVisitMutation = useMutation({
    mutationFn: api.addVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FIELD_VISITS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES, profile?.uid] });
      setShowAddVisit(false);
      setShowQuickAdd(false);
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: api.addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.uid] });
    }
  });

  const addTemplateMutation = useMutation({
    mutationFn: api.addMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TEMPLATES, profile?.uid] });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: api.deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TEMPLATES, profile?.uid] });
    }
  });

  const updatePersonalTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<PersonalTask> }) => api.updatePersonalTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.uid] })
  });

  const updateGamifiedTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<GamifiedTask> }) => api.updateGamifiedTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] })
  });

  const completeMorningRitualMutation = useMutation({
    mutationFn: async () => {
      await api.startDay();
      return api.completeMorningRitual();
    },
    onSuccess: () => {
      if (profile?.uid) {
        const todayISO = new Date().toISOString().split('T')[0];
        localStorage.setItem(`day_started_${profile.uid}_${todayISO}`, new Date().toISOString());
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] });
      setShowDailyRadar(false);
      setToast({ message: "Güne harika bir başlangıç yaptın!", type: 'success' });
    },
    onError: (error: Error) => {
      console.error("Morning ritual error:", error);
      // Even if XP award fails (e.g. already awarded), we should allow the user to enter the app
      setShowDailyRadar(false);
      
      // Invalidate queries anyway to ensure we have the latest state (e.g. if startDay succeeded but completeMorningRitual failed)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] });

      if (error.message.includes("already awarded")) {
        setToast({ message: "Güne zaten başlamıştın, başarılar!", type: 'info' });
      } else {
        setToast({ message: "Güne başlarken bir sorun oluştu ama devam edebilirsin.", type: 'error' });
      }
    }
  });

  const completeEveningRitualMutation = useMutation({
    mutationFn: async (stats: { tasks_completed: number, revenue: number, calls: number, visits: number }) => {
      await api.endDay(stats);
      return api.completeEveningRitual(stats);
    },
    onSuccess: () => {
      if (profile?.uid) {
        const todayISO = new Date().toISOString().split('T')[0];
        localStorage.setItem(`day_ended_${profile.uid}_${todayISO}`, new Date().toISOString());
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DAILY_STATS, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid] });
      setShowDayCloser(false);
      setToast({ message: "Günü başarıyla kapattın. İyi dinlenmeler!", type: 'success' });
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF3D00', '#3b82f6', '#10b981']
      });
    },
    onError: (error: Error) => {
      setToast({ message: "Günü kapatırken bir hata oluştu: " + error.message, type: 'error' });
    }
  });

  const cancelRescueMutation = useMutation({
    mutationFn: api.cancelRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid] });
    }
  });

  const completeRescueTaskMutation = useMutation({
    mutationFn: ({ sessionId, taskId }: { sessionId: string, taskId: string }) => api.completeRescueTask(sessionId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS, profile?.uid] });
    }
  });

  const analyzeLeadsMutation = useMutation({
    mutationFn: api.analyzeLeads,
    onSuccess: (data) => {
      setLeadAnalysis(data);
      setIsAnalyzingLeads(false);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<UserProfile> }) => api.updateProfile(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
    }
  });

  const syncListingsMutation = useMutation({
    mutationFn: api.syncExternalListings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profile?.uid] });
    }
  });

  const linkPropertyMutation = useMutation({
    mutationFn: ({ propertyId, externalId }: { propertyId: string, externalId: string }) => 
      api.linkPropertyToExternal(propertyId, externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profile?.uid] });
    }
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: api.connectSahibinden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profile?.uid] });
    }
  });

  const handleWhatsAppShare = (property: Property, content?: string) => {
    if (content) {
      const url = `https://wa.me/?text=${encodeURIComponent(content)}`;
      window.open(url, '_blank');
      return;
    }

    const text = `Merhaba, sizin için harika bir portföyüm var: ${property.title}. Fiyat: ₺${property.price.toLocaleString()}. Detaylar için iletişime geçebilirsiniz.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleNotify = (task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified') => {
    setNotification({ task, type });
    if (type === 'personal') {
      updatePersonalTaskMutation.mutate({ id: task.id, data: { notified: true } });
    } else {
      updateGamifiedTaskMutation.mutate({ id: task.id, data: { notified: true } });
    }
  };

  // --- Grouped Props ---
  const navigationProps: NavigationProps = {
    activeTab,
    setActiveTab,
    showAdminPanel,
    setShowAdminPanel,
    logout,
    profile,
    updateProfileMutation
  };

  const leadProps: LeadProps = {
    leads,
    leadsLoading,
    categories,
    setShowWhatsAppImport,
    setShowAddLead,
    setIsAnalyzingLeads,
    analyzeLeadsMutation,
    isAnalyzingLeads,
    addLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
    leadAnalysis,
    setLeadAnalysis,
    showAddLead,
    showWhatsAppImport,
    selectedLead,
    setSelectedLead,
    isEditingLead,
    setIsEditingLead
  };

  const portfolioProps: PortfolioProps = {
    properties,
    propertiesLoading,
    setSelectedProperty,
    selectedDistrict,
    setSelectedDistrict,
    viewMode,
    setViewMode,
    setShowImportUrlModal,
    regionScores,
    brokerAccount,
    setShowExternalListings,
    setShowIntegrationModal,
    syncListingsMutation,
    linkPropertyMutation,
    connectIntegrationMutation,
    showAddProperty,
    setShowAddProperty,
    showImportUrlModal,
    showIntegrationModal,
    showExternalListings,
    selectedProperty,
    externalListings,
    isEditing,
    setIsEditing,
    setShowRegionSetup
  };

  const utilityProps: UtilityProps = {
    gamifiedTasks,
    personalTasks,
    tasks,
    rescueSession,
    missedOpportunities,
    setShowDailyRadar,
    setShowDayCloser,
    setShowMissedOpportunities,
    setToast,
    completeMorningRitualMutation,
    showVoiceQuickAdd,
    setShowVoiceQuickAdd,
    addTaskMutation,
    showAddVisit,
    setShowAddVisit,
    addVisitMutation,
    fieldVisits,
    cancelRescueMutation,
    completeRescueTaskMutation,
    showMissedOpportunities,
    setActiveTab
  };

  const appProps = {
    navigation: navigationProps,
    leads: leadProps,
    portfolios: portfolioProps,
    utilities: utilityProps
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-0 font-sans text-slate-900 selection:bg-orange-100 overflow-x-hidden">
      {/* Mandatory & Manual Region Setup */}
      {(profile && (!profile.region || !profile.region.city)) || showRegionSetup ? (
        <RegionSetupModal 
          profile={profile!} 
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] });
            setShowRegionSetup(false);
          }} 
        />
      ) : null}
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row w-full min-h-screen">
        <RitualOverlays 
          showDailyRadar={showDailyRadar}
          setShowDailyRadar={setShowDailyRadar}
          dailyRadarData={dailyRadarData}
          showDayCloser={showDayCloser}
          setShowDayCloser={setShowDayCloser}
          completeMorningRitualMutation={completeMorningRitualMutation}
          completeEveningRitualMutation={completeEveningRitualMutation}
          gamifiedTasks={gamifiedTasks}
          personalTasks={personalTasks}
          properties={properties}
          tasks={tasks}
        />

        <DesktopSidebar 
          activeTab={activeTab}
          showAdminPanel={showAdminPanel}
          profile={profile}
          onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }}
          onAdminClick={() => setShowAdminPanel(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {activeTab !== 'bolgem' && (
            <Header 
              activeTab={activeTab}
              profile={profile}
            />
          )}

          <main className={`flex-1 w-full max-w-[1600px] mx-auto ${activeTab === 'bolgem' ? '' : 'px-4 md:px-8 py-6'}`}>
            <MainContentRouter {...appProps} />
          </main>
        </div>
      </div>

      {/* Background Logic */}
      <NotificationCenter 
        personalTasks={personalTasks} 
        gamifiedTasks={gamifiedTasks} 
        onNotify={handleNotify} 
      />

      {/* Overlays & Toasts */}
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      <GlobalToast toast={toast} />

      <FloatingActionButton onClick={() => setShowQuickAdd(true)} />

      {/* Quick Add Menu */}
      <QuickAddMenu 
        show={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onVoice={() => { closeAllModals(); setShowVoiceQuickAdd(true); }}
        onVisit={() => { closeAllModals(); setShowAddVisit(true); }}
        onLead={() => { closeAllModals(); setShowAddLead(true); }}
        onPortfolio={() => { closeAllModals(); setIsEditing(false); setShowAddProperty(true); }}
      />
      
      {/* Modals */}
      <AppModals {...appProps} />

      {/* Bottom Navigation (Mobile Only) */}
      <MobileNav 
        activeTab={activeTab}
        showAdminPanel={showAdminPanel}
        profile={profile}
        onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      {/* Onboarding Tour */}
      {profile && !profile.has_seen_tour && activeTab === 'dashboard' && (
        <AppTour onComplete={() => completeTour()} />
      )}
    </div>
  );
}

const AppContent = () => {
  const { user, profile, loading, isSubscribed, completeOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  
  if (profile && !profile.has_seen_onboarding) {
    return <IntroSequence onComplete={() => completeOnboarding()} />;
  }

  if (!isSubscribed) return (
    <React.Suspense fallback={<LoadingFallback />}>
      <PricingScreen />
    </React.Suspense>
  );

  return <MainApp />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
