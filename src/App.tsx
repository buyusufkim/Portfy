import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./services/api";
import { AuthProvider, useAuth } from "./AuthContext";
import {
  MainContentRouter,
  NavigationProps,
  LeadProps,
  PortfolioProps,
  UtilityProps,
} from "./components/app/MainContentRouter";
import { AppModals } from "./components/app/AppModals";
import { LoadingFallback } from "./components/app/LoadingFallback";
import { LoginScreen } from "./components/app/LoginScreen";
import { NotificationCenter } from "./components/app/NotificationCenter";
import { IntroSequence } from "./components/app/IntroSequence";
import { AppTour } from "./components/app/AppTour";
import { QuickAddMenu } from "./components/app/QuickAddMenu";
import { RitualOverlays } from "./components/app/RitualOverlays";
import { DesktopSidebar, MobileNav } from "./components/app/Navigation";
import { Header } from "./components/app/Header";
import { NotificationToast, GlobalToast } from "./components/app/Toasts";
import { FloatingActionButton } from "./components/app/FloatingActionButton";
import { RegionSetupModal } from "./components/RegionSetupModal";
import {
  UserProfile,
  Lead,
  Property,
  DailyPlan,
  DayClosure,
  GamifiedTask,
  PersonalTask,
} from "./types";

import { useFeatureAccess } from "./hooks/useFeatureAccess";
import { UpgradeModal } from "./components/premium/UpgradeModal";
import { PricingScreen } from "./components/PricingScreen";
import { QUERY_KEYS } from "./constants/queryKeys";
import { useCategories } from "./hooks/useCategories";
import { useMainQueries } from "./hooks/useMainQueries";
import { useMainMutations } from "./hooks/useMainMutations";
import { PublicPresentation } from "./pages/PublicPresentation";
import { ClientPortalPage } from "./pages/ClientPortalPage";
import { LeadEntryMethodModal } from "./components/crm/LeadEntryMethodModal";
import { BusinessCardScannerModal } from "./components/crm/BusinessCardScannerModal";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

function MainApp() {
  const queryClient = useQueryClient();
  const { profile, logout, completeTour } = useAuth();
  const { categories } = useCategories();
  const { isFree } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [notification, setNotification] = useState<{
    task: GamifiedTask | PersonalTask;
    type: "personal" | "gamified";
  } | null>(null);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showVoiceQuickAdd, setShowVoiceQuickAdd] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false);
  const [showDailyRadar, setShowDailyRadar] = useState(false);
  const [pendingEarlyStartReason, setPendingEarlyStartReason] = useState<string | undefined>();
  const [showDayCloser, setShowDayCloser] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showExternalListings, setShowExternalListings] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);
  const [showRegionSetup, setShowRegionSetup] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showDocumentAutomation, setShowDocumentAutomation] = useState(false);
  const [documentAutomationProperty, setDocumentAutomationProperty] =
    useState<Property | null>(null);
  const [documentAutomationLead, setDocumentAutomationLead] =
    useState<Lead | null>(null);

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
    setShowAddTask(false);
    setShowDocumentAutomation(false);
    setShowRegionSetup(false);
    setShowLeadMethodModal(false);
    setShowScanner(false);
  };

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | "all">(
    "all",
  );
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  const {
    leads,
    properties,
    personalTasks,
    gamifiedTasks,
    tasksLoading,
    tasksError,
    fieldVisits,
    tasks,
    regionScores,
    brokerAccount,
    externalListings,
    rescueSession,
    missedOpportunities,
    dailyRadarData,
  } = useMainQueries(profile?.id, showDailyRadar);

  const {
    addLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
    addVisitMutation,
    addTaskMutation,
    addPersonalTaskMutation,
    completeMorningRitualMutation,
    completeEveningRitualMutation,
    cancelRescueMutation,
    completeRescueTaskMutation,
    analyzeLeadsMutation,
    updateProfileMutation,
    syncListingsMutation,
    linkPropertyMutation,
    connectIntegrationMutation,
  } = useMainMutations({
    profileId: profile?.id,
    setToast,
    setShowAddLead,
    setShowQuickAdd,
    setIsEditingLead,
    setSelectedLead,
    setShowAddVisit,
    setShowDailyRadar,
    setShowDayCloser,
    setLeadAnalysis,
    setIsAnalyzingLeads,
    setShowIntegrationModal,
  });

  const checkPortfoliosLimit = () => {
    if (isFree && properties.length >= 5) {
      setShowQuickAdd(false);
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };
  const checkLeadsLimit = () => {
    if (isFree && leads.length >= 10) {
      setShowQuickAdd(false);
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  React.useEffect(() => {
    const handleOpenTask = () => setShowAddTask(true);
    const handleOpenLead = () => {
      if (checkLeadsLimit()) setShowAddLead(true);
    };
    const handleOpenQuickAdd = () => setShowQuickAdd(true);
    const handleOpenUpgrade = () => setShowUpgradeModal(true);

    window.addEventListener("open-add-task", handleOpenTask);
    window.addEventListener("open-add-lead", handleOpenLead);
    window.addEventListener("open-quick-add", handleOpenQuickAdd);
    window.addEventListener("open-upgrade-modal", handleOpenUpgrade);

    return () => {
      window.removeEventListener("open-add-task", handleOpenTask);
      window.removeEventListener("open-add-lead", handleOpenLead);
      window.removeEventListener("open-quick-add", handleOpenQuickAdd);
      window.removeEventListener("open-upgrade-modal", handleOpenUpgrade);
    };
  }, [isFree, leads.length]);

  const navigationProps: NavigationProps = {
    activeTab,
    setActiveTab,
    showAdminPanel,
    setShowAdminPanel,
    logout,
    profile,
    updateProfileMutation,
  };
  const leadProps: LeadProps = {
    leads,
    leadsLoading: false,
    categories,
    setShowWhatsAppImport,
    setShowAddLead: (show) => {
      if (show && !checkLeadsLimit()) return;
      setShowAddLead(show);
    },
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
    setIsEditingLead,
    setShowDocumentAutomation,
    setDocumentAutomationLead,
    setDocumentAutomationProperty,
  };
  const portfolioProps: PortfolioProps = {
    properties,
    propertiesLoading: false,
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
    setShowAddProperty: (show) => {
      if (show && !checkPortfoliosLimit()) return;
      setShowAddProperty(show);
    },
    showImportUrlModal,
    showIntegrationModal,
    showExternalListings,
    selectedProperty,
    externalListings,
    isEditing,
    setIsEditing,
    setShowRegionSetup,
    setShowAddTask,
    tasks,
    setShowDocumentAutomation,
    setDocumentAutomationProperty,
    setDocumentAutomationLead,
  };
  const utilityProps: UtilityProps = {
    gamifiedTasks,
    tasksLoading,
    tasksError,
    personalTasks,
    tasks,
    rescueSession,
    missedOpportunities,
    setShowDailyRadar,
    setPendingEarlyStartReason,
    setShowDayCloser,
    setShowMissedOpportunities,
    setToast,
    completeMorningRitualMutation,
    showVoiceQuickAdd,
    setShowVoiceQuickAdd,
    showAddTask,
    setShowAddTask,
    addTaskMutation,
    addPersonalTaskMutation,
    showAddVisit,
    setShowAddVisit,
    addVisitMutation,
    fieldVisits,
    cancelRescueMutation,
    completeRescueTaskMutation,
    showMissedOpportunities,
    setActiveTab,
    leads,
    properties,
    showDocumentAutomation,
    setShowDocumentAutomation,
    documentAutomationProperty,
    documentAutomationLead,
    profile,
    addLeadMutation,
  };

  const appProps = {
    navigation: navigationProps,
    leads: leadProps,
    portfolios: portfolioProps,
    utilities: utilityProps,
  };
  const [showLeadMethodModal, setShowLeadMethodModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-0 font-sans text-slate-900 overflow-x-hidden">
      {(profile && (!profile.region || !profile.region.city)) ||
      showRegionSetup ? (
        <RegionSetupModal
          profile={profile!}
          onComplete={() => {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.PROFILE, profile?.id],
            });
            setShowRegionSetup(false);
          }}
        />
      ) : null}

      <div className="flex flex-col md:flex-row w-full min-h-screen">
        <RitualOverlays
          profile={profile}
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
          onTabChange={(tab) => {
            setActiveTab(tab);
            setShowAdminPanel(false);
          }}
          onAdminClick={() => setShowAdminPanel(true)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {activeTab !== "bolgem" && (
            <Header activeTab={activeTab} profile={profile} />
          )}
          <main
            className={`flex-1 w-full max-w-[1600px] mx-auto ${activeTab === "bolgem" ? "" : "px-4 md:px-8 py-6"}`}
          >
            <MainContentRouter {...appProps} />
          </main>
        </div>
      </div>

      <NotificationCenter
        personalTasks={personalTasks}
        gamifiedTasks={gamifiedTasks}
        onNotify={(task, type) => setNotification({ task, type })}
      />
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <GlobalToast
        toast={toast}
        onClose={() => setToast(null)} // Bu kısım state'i sıfırlayarak bildirimi kapatır
      />
      <FloatingActionButton onClick={() => setShowQuickAdd(true)} />

      <QuickAddMenu
        show={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onVoice={() => {
          closeAllModals();
          setShowVoiceQuickAdd(true);
        }}
        onVisit={() => {
          closeAllModals();
          setShowAddVisit(true);
        }}
        onLead={() => {
          if (checkLeadsLimit()) {
            closeAllModals();
            setShowLeadMethodModal(true);
          }
        }}
        onPortfolio={() => {
          if (checkPortfoliosLimit()) {
            closeAllModals();
            setIsEditing(false);
            setShowAddProperty(true);
          }
        }}
      />
      <LeadEntryMethodModal
        isOpen={showLeadMethodModal}
        onClose={() => setShowLeadMethodModal(false)}
        onSelectManual={() => {
          setShowLeadMethodModal(false);
          setShowAddLead(true);
        }}
        onSelectScan={() => {
          setShowLeadMethodModal(false);
          setShowScanner(true);
        }}
      />

      <BusinessCardScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={(scannedData) => {
          setShowScanner(false);
          addLeadMutation.mutate(scannedData, {
            onSuccess: () => {
              setToast({
                message: "Kartvizit başarıyla Lead olarak kaydedildi!",
                type: "success",
              });
            },
          });
        }}
      />

      <AppModals {...appProps} />
      <MobileNav
        activeTab={activeTab}
        showAdminPanel={showAdminPanel}
        profile={profile}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setShowAdminPanel(false);
        }}
        onAdminClick={() => setShowAdminPanel(true)}
      />
      {profile && !profile.has_seen_tour && activeTab === "dashboard" && (
        <AppTour onComplete={() => completeTour()} />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

const AppContent = () => {
  const { user, profile, loading, isSubscribed, completeOnboarding } =
    useAuth();

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
  if (profile && !profile.has_seen_onboarding)
    return <IntroSequence onComplete={() => completeOnboarding()} />;

  // ERİŞİM KONTROLÜ:
  // 1. Ücretli aboneliği varsa (isSubscribed)
  // 2. VEYA ücretsiz planı açıkça seçmişse (tier === 'free') içeri girer.
  // Yeni kullanıcılar tier='none' başladığı için PricingScreen görürler.
  const hasAccess = isSubscribed || profile;

  if (!hasAccess)
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <PricingScreen />
      </React.Suspense>
    );

  return <MainApp />;
};

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/p/")) {
    const propertyId = path.split("/p/")[1];
    return (
      <QueryClientProvider client={queryClient}>
        <PublicPresentation propertyId={propertyId} />
      </QueryClientProvider>
    );
  }

  if (path.startsWith("/portal/")) {
    return (
      <QueryClientProvider client={queryClient}>
        <ClientPortalPage />
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
