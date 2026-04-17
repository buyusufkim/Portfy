import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react'; // Eksik olan satır burasıydı
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './services/api';
import { AuthProvider, useAuth } from './AuthContext';
import { MainContentRouter, NavigationProps, LeadProps, PortfolioProps, UtilityProps } from './components/app/MainContentRouter';
import { AppModals } from './components/app/AppModals';
import { LoadingFallback } from './components/app/LoadingFallback';
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
import { RegionSetupModal } from './components/RegionSetupModal';

// Limit ve Premium Sistemleri
import { useFeatureAccess } from './hooks/useFeatureAccess';
import { UpgradeModal } from './components/premium/UpgradeModal';
import { PricingScreen } from './components/PricingScreen';
import { QUERY_KEYS } from './constants/queryKeys';
import { useCategories } from './hooks/useCategories';

// SİHİRLİ LİNK İÇİN MÜŞTERİ SUNUM SAYFASI
import { PublicPresentation } from './pages/PublicPresentation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

function MainApp() {
  const queryClient = useQueryClient();
  const { profile, logout, completeTour } = useAuth();
  const { categories } = useCategories();
  const { isFree, subscribe } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [notification, setNotification] = useState<any>(null);

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const closeAllModals = () => {
    setShowQuickAdd(false); setShowVoiceQuickAdd(false); setShowAddProperty(false);
    setShowAddLead(false); setShowAddVisit(false); setShowWhatsAppImport(false);
    setShowDailyRadar(false); setShowDayCloser(false); setShowIntegrationModal(false);
    setShowExternalListings(false); setShowImportUrlModal(false); setShowMissedOpportunities(false);
    setShowRegionSetup(false);
  };

  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | 'all'>('all');
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  const { data: leads = [], isLoading: leadsLoading } = useQuery({ queryKey: [QUERY_KEYS.LEADS, profile?.uid], queryFn: api.getLeads, enabled: !!profile?.uid });
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.uid], queryFn: api.getProperties, enabled: !!profile?.uid });
  const { data: personalTasks = [] } = useQuery({ queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.uid], queryFn: api.getPersonalTasks, enabled: !!profile?.uid });
  const { data: gamifiedTasks = [] } = useQuery({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid], queryFn: () => api.getDailyGamifiedTasks(), enabled: !!profile?.uid });
  const { data: fieldVisits = [] } = useQuery({ queryKey: [QUERY_KEYS.FIELD_VISITS, profile?.uid], queryFn: api.getFieldVisits, enabled: !!profile?.uid });
  const { data: tasks = [] } = useQuery({ queryKey: [QUERY_KEYS.TASKS, profile?.uid], queryFn: api.getTasks, enabled: !!profile?.uid });
  const { data: regionScores = [] } = useQuery({ queryKey: [QUERY_KEYS.REGION_SCORES, profile?.uid], queryFn: api.getRegionEfficiencyScores, enabled: !!profile?.uid });
  const { data: brokerAccount } = useQuery({ queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profile?.uid], queryFn: api.getBrokerAccount, enabled: !!profile?.uid });
  const { data: externalListings = [] } = useQuery({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profile?.uid], queryFn: api.getExternalListings, enabled: !!profile?.uid });
  const { data: rescueSession } = useQuery({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid], queryFn: api.getRescueSession, enabled: !!profile?.uid });
  const { data: missedOpportunities = [] } = useQuery({ queryKey: [QUERY_KEYS.MISSED_OPPORTUNITIES, profile?.uid], queryFn: api.getMissedOpportunities, enabled: !!profile?.uid });
  const { data: dailyRadarData } = useQuery({ queryKey: [QUERY_KEYS.DAILY_RADAR, profile?.uid], queryFn: api.getDailyRadar, enabled: !!profile?.uid && showDailyRadar });

  const addLeadMutation = useMutation({ mutationFn: api.addLead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] }); setShowAddLead(false); setShowQuickAdd(false); }});
  const updateLeadMutation = useMutation({ mutationFn: ({ id, data }: any) => api.updateLead(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] }); setShowAddLead(false); setIsEditingLead(false); setSelectedLead(null); }});
  const deleteLeadMutation = useMutation({ mutationFn: api.deleteLead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS, profile?.uid] }); setSelectedLead(null); }});
  const addVisitMutation = useMutation({ mutationFn: api.addVisit, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FIELD_VISITS, profile?.uid] }); setShowAddVisit(false); setShowQuickAdd(false); }});
  const addTaskMutation = useMutation({ mutationFn: api.addTask, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.uid] }); }});
  const completeMorningRitualMutation = useMutation({ mutationFn: async () => { await api.startDay(); return api.completeMorningRitual(); }, onSuccess: () => { setShowDailyRadar(false); setToast({ message: "Güne harika bir başlangıç yaptın!", type: 'success' }); }, onError: () => { setShowDailyRadar(false); setToast({ message: "Güne zaten başlamıştın.", type: 'info' }); }});
  const completeEveningRitualMutation = useMutation({ mutationFn: async (stats: any) => { await api.endDay(stats); return api.completeEveningRitual(stats); }, onSuccess: () => { setShowDayCloser(false); setToast({ message: "Günü başarıyla kapattın. İyi dinlenmeler!", type: 'success' }); confetti(); }});
  const cancelRescueMutation = useMutation({ mutationFn: api.cancelRescueSession, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid] }); }});
  const completeRescueTaskMutation = useMutation({ mutationFn: ({ sessionId, taskId }: any) => api.completeRescueTask(sessionId, taskId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION, profile?.uid] }); }});
  const analyzeLeadsMutation = useMutation({ mutationFn: api.analyzeLeads, onSuccess: (data) => { setLeadAnalysis(data); setIsAnalyzingLeads(false); }});
  const updateProfileMutation = useMutation({ mutationFn: ({ uid, data }: any) => api.updateProfile(uid, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] }); }});
  const syncListingsMutation = useMutation({ mutationFn: api.syncExternalListings, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS, profile?.uid] }); }});
  const linkPropertyMutation = useMutation({ mutationFn: ({ propertyId, externalId }: any) => api.linkPropertyToExternal(propertyId, externalId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.uid] }); }});
  const connectIntegrationMutation = useMutation({ mutationFn: api.connectSahibinden, onSuccess: () => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BROKER_ACCOUNT, profile?.uid] }); }});

  const checkPortfoliosLimit = () => { if (isFree && properties.length >= 5) { setShowQuickAdd(false); setShowUpgradeModal(true); return false; } return true; };
  const checkLeadsLimit = () => { if (isFree && leads.length >= 10) { setShowQuickAdd(false); setShowUpgradeModal(true); return false; } return true; };

  const navigationProps: NavigationProps = { activeTab, setActiveTab, showAdminPanel, setShowAdminPanel, logout, profile, updateProfileMutation };
  const leadProps: LeadProps = { leads, leadsLoading, categories, setShowWhatsAppImport, setShowAddLead: (show) => { if (show && !checkLeadsLimit()) return; setShowAddLead(show); }, setIsAnalyzingLeads, analyzeLeadsMutation, isAnalyzingLeads, addLeadMutation, updateLeadMutation, deleteLeadMutation, leadAnalysis, setLeadAnalysis, showAddLead, showWhatsAppImport, selectedLead, setSelectedLead, isEditingLead, setIsEditingLead };
  const portfolioProps: PortfolioProps = { properties, propertiesLoading, setSelectedProperty, selectedDistrict, setSelectedDistrict, viewMode, setViewMode, setShowImportUrlModal, regionScores, brokerAccount, setShowExternalListings, setShowIntegrationModal, syncListingsMutation, linkPropertyMutation, connectIntegrationMutation, showAddProperty, setShowAddProperty: (show) => { if (show && !checkPortfoliosLimit()) return; setShowAddProperty(show); }, showImportUrlModal, showIntegrationModal, showExternalListings, selectedProperty, externalListings, isEditing, setIsEditing, setShowRegionSetup };
  const utilityProps: UtilityProps = { gamifiedTasks, personalTasks, tasks, rescueSession, missedOpportunities, setShowDailyRadar, setShowDayCloser, setShowMissedOpportunities, setToast, completeMorningRitualMutation, showVoiceQuickAdd, setShowVoiceQuickAdd, addTaskMutation, showAddVisit, setShowAddVisit, addVisitMutation, fieldVisits, cancelRescueMutation, completeRescueTaskMutation, showMissedOpportunities, setActiveTab };

  const appProps = { navigation: navigationProps, leads: leadProps, portfolios: portfolioProps, utilities: utilityProps };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-0 font-sans text-slate-900 overflow-x-hidden">
      {(profile && (!profile.region || !profile.region.city)) || showRegionSetup ? (
        <RegionSetupModal profile={profile!} onComplete={() => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE, profile?.uid] }); setShowRegionSetup(false); }} />
      ) : null}
      
      <div className="flex flex-col md:flex-row w-full min-h-screen">
        <RitualOverlays showDailyRadar={showDailyRadar} setShowDailyRadar={setShowDailyRadar} dailyRadarData={dailyRadarData} showDayCloser={showDayCloser} setShowDayCloser={setShowDayCloser} completeMorningRitualMutation={completeMorningRitualMutation} completeEveningRitualMutation={completeEveningRitualMutation} gamifiedTasks={gamifiedTasks} personalTasks={personalTasks} properties={properties} tasks={tasks} />
        <DesktopSidebar activeTab={activeTab} showAdminPanel={showAdminPanel} profile={profile} onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }} onAdminClick={() => setShowAdminPanel(true)} />
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab !== 'bolgem' && <Header activeTab={activeTab} profile={profile} />}
          <main className={`flex-1 w-full max-w-[1600px] mx-auto ${activeTab === 'bolgem' ? '' : 'px-4 md:px-8 py-6'}`}>
            <MainContentRouter {...appProps} />
          </main>
        </div>
      </div>

      <NotificationCenter personalTasks={personalTasks} gamifiedTasks={gamifiedTasks} onNotify={(task) => setNotification(task)} />
      <NotificationToast notification={notification} onClose={() => setNotification(null)} />
      <GlobalToast toast={toast} />
      <FloatingActionButton onClick={() => setShowQuickAdd(true)} />

      <QuickAddMenu show={showQuickAdd} onClose={() => setShowQuickAdd(false)} onVoice={() => { closeAllModals(); setShowVoiceQuickAdd(true); }} onVisit={() => { closeAllModals(); setShowAddVisit(true); }} onLead={() => { if(checkLeadsLimit()) { closeAllModals(); setShowAddLead(true); } }} onPortfolio={() => { if(checkPortfoliosLimit()) { closeAllModals(); setIsEditing(false); setShowAddProperty(true); } }} />
      
      <AppModals {...appProps} />
      <MobileNav activeTab={activeTab} showAdminPanel={showAdminPanel} profile={profile} onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }} onAdminClick={() => setShowAdminPanel(true)} />
      {profile && !profile.has_seen_tour && activeTab === 'dashboard' && <AppTour onComplete={() => completeTour()} />}
      
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}

const AppContent = () => {
  const { user, profile, loading, isSubscribed, completeOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  if (profile && !profile.has_seen_onboarding) return <IntroSequence onComplete={() => completeOnboarding()} />;
  
  if (!isSubscribed) return (
    <React.Suspense fallback={<LoadingFallback />}>
      <PricingScreen />
    </React.Suspense>
  );

  return <MainApp />;
};

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith('/p/')) {
    const propertyId = path.split('/p/')[1];
    return (
      <QueryClientProvider client={queryClient}>
        <PublicPresentation propertyId={propertyId} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}