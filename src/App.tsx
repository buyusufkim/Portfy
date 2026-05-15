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
import { ArrowRight } from "lucide-react";
import { Card } from "./components/UI";
import { QuickAddMenu } from "./components/app/QuickAddMenu";
import { RitualOverlays } from "./components/app/RitualOverlays";
import { DesktopSidebar, MobileNav } from "./components/app/Navigation";
import { Header } from "./components/app/Header";
import { NotificationToast, GlobalToast } from "./components/app/Toasts";
import { FloatingActionButton } from "./components/app/FloatingActionButton";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
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
import { advisorProfileService } from "./services/advisorProfileService";
import { campaign90Service } from "./services/campaign90Service";
import { CampaignStartWizard } from "./components/campaign90/CampaignStartWizard";
import { AdvisorProfessionalProfile } from "./types";
import { supabase } from "./lib/supabase";
import { useAppModalState } from "./hooks/useAppModalState";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60 * 5 } },
});

function MainApp() {
  const queryClient = useQueryClient();
  const { profile, logout, completeTour, subscribe, updateProfileData } = useAuth();
  const { categories } = useCategories();
  const { isFree } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "pipeline">("list");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [notification, setNotification] = useState<{
    task: GamifiedTask | PersonalTask;
    type: "personal" | "gamified";
  } | null>(null);

  const { data: advisorProfile, isLoading: advProfileLoading, isError: advProfileError, refetch: refetchAdvProfile } = useQuery({
    queryKey: ['advisor_professional_profile', profile?.id],
    queryFn: () => advisorProfileService.getAdvisorProfessionalProfile(profile!.id),
    enabled: !!profile?.id
  });

  const { data: activeCampaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['campaign90_active', profile?.id],
    queryFn: () => campaign90Service.getActiveCampaign(profile!.id),
    enabled: !!profile?.id
  });

  const [showCampaignPromo, setShowCampaignPromo] = useState(false);
  const [promoPayload, setPromoPayload] = useState<Partial<AdvisorProfessionalProfile> | null>(null);

  const startCampaignMutation = useMutation({
    mutationFn: async (payload: Partial<AdvisorProfessionalProfile>) => {
      let isSubscribedToPro = profile?.subscription_type && profile.subscription_type !== 'none';
      if (!isSubscribedToPro) {
          const res = await subscribe('trial');
          if (res) {
              isSubscribedToPro = true;
          } else {
             // If subscribe('trial') returned false or failed, and user still has no subscription (already used trial)
              throw new Error("trial_ended");
          }
      }
      
      const res = await campaign90Service.startCampaign({
          region: payload.region,
          niche: payload.niche,
          daily_contact_target: payload.daily_contact_target,
          weekly_contact_target: payload.weekly_contact_target
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign90_active'] });
      setShowCampaignPromo(false);
      setActiveTab("campaign-90");
    },
    onError: (err: Error | unknown) => {
        if (err instanceof Error && err.message === 'trial_ended') {
            setToast({ message: "Kampı başlatmak için Pro pakete geçmen gerekiyor.", type: 'error' });
        } else {
            setToast({ message: "Kamp başlatılırken bir hata oluştu.", type: 'error' });
        }
    }
  });

  const upsertAdvisorProfileMutation = useMutation({
    mutationFn: async (payload: Partial<AdvisorProfessionalProfile> & { package_action?: 'free' | 'trial' | 'pro_request' }) => {
      if (!profile?.id) throw new Error("No user");
      
      if (payload.region || payload.niche) {
          const profileUpdate: Partial<UserProfile> = {};
          if (payload.region) {
              profileUpdate.district = payload.region;
              // format is usually "City / District / N1, N2"
              const parts = payload.region.split('/').map(p => p.trim());
              profileUpdate.region = { 
                  city: parts[0] || '', 
                  district: parts[1] || payload.region, 
                  neighborhoods: parts[2] ? parts[2].split(',').map(n => n.trim()) : [] 
              };
          }
          if (payload.niche) {
              profileUpdate.expertise_areas = payload.niche.split(',').map((x: string) => x.trim());
          }
          await updateProfileData(profileUpdate);
      }

      if (payload.package_action === 'pro_request') {
          try {
              await supabase.from('support_tickets').insert({
                  user_id: profile?.id,
                  subject: "Portfy Pro Paket Talebi",
                  message: `E-posta: ${profile?.email || 'Yok'}\nDeneyim: ${payload.experience_level}\nBölge: ${payload.region}\nUzmanlık: ${payload.niche}`,
                  category: 'billing'
              });
          } catch(e) {
              console.error("Support ticket error", e);
          }
      }

      if (payload.package_action === 'trial' || (payload.package_action === 'pro_request' && profile?.subscription_type === 'none')) {
          if (!profile?.subscription_type || profile.subscription_type === 'none') {
              const res = await subscribe('trial');
              if (res) {
                 if (payload.package_action === 'trial') setToast({ message: "7 Günlük Deneme süreniz başladı!", type: 'success' });
                 if (payload.package_action === 'pro_request') setToast({ message: "Talebin alındı. 7 günlük deneme süren başladı. Aktivasyon tamamlanmazsa ücretsiz paketten devam edersin.", type: 'success' });
              }
          } else {
             if (payload.package_action === 'trial') setToast({ message: "Deneme süren daha önce kullanılmış veya aktif paketiniz var. Ücretsiz paketten başlatıyoruz.", type: 'error' });
             if (payload.package_action === 'pro_request') setToast({ message: "Talebin alındı. Ekibimiz seninle iletişime geçecek.", type: 'success' });
          }
      }
      
      const { package_action, ...basePayload } = payload;
      return advisorProfileService.upsertAdvisorProfessionalProfile({ ...basePayload, user_id: profile.id });
    },
    onSuccess: (updatedProfile, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advisor_professional_profile', profile?.id] });
      
      if (variables.experience_level === 'new') {
        setPromoPayload(variables);
        setShowCampaignPromo(true);
      }
    },
    onError: (err: unknown) => {
        console.error("Profile update error:", err);
    }
  });

  const {
    showQuickAdd, setShowQuickAdd,
    showVoiceQuickAdd, setShowVoiceQuickAdd,
    showAddProperty, setShowAddProperty,
    showAddLead, setShowAddLead,
    showAddVisit, setShowAddVisit,
    showWhatsAppImport, setShowWhatsAppImport,
    showDailyRadar, setShowDailyRadar,
    pendingEarlyStartReason, setPendingEarlyStartReason,
    showDayCloser, setShowDayCloser,
    showIntegrationModal, setShowIntegrationModal,
    showExternalListings, setShowExternalListings,
    showImportUrlModal, setShowImportUrlModal,
    showMissedOpportunities, setShowMissedOpportunities,
    showRegionSetup, setShowRegionSetup,
    showUpgradeModal, setShowUpgradeModal,
    showAddTask, setShowAddTask,
    showDocumentAutomation, setShowDocumentAutomation,
    documentAutomationProperty, setDocumentAutomationProperty,
    documentAutomationLead, setDocumentAutomationLead,
    showLeadMethodModal, setShowLeadMethodModal,
    showScanner, setShowScanner,
    showRescueModal, setShowRescueModal,
    closeAllModals,
  } = useAppModalState();

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
    const handleSwitchTab = (e: CustomEvent<string>) => {
      setActiveTab(e.detail);
    };

    window.addEventListener("open-add-task", handleOpenTask);
    window.addEventListener("open-add-lead", handleOpenLead);
    window.addEventListener("open-quick-add", handleOpenQuickAdd);
    window.addEventListener("open-upgrade-modal", handleOpenUpgrade);
    window.addEventListener("switch-tab", handleSwitchTab as EventListener);

    return () => {
      window.removeEventListener("open-add-task", handleOpenTask);
      window.removeEventListener("open-add-lead", handleOpenLead);
      window.removeEventListener("open-quick-add", handleOpenQuickAdd);
      window.removeEventListener("open-upgrade-modal", handleOpenUpgrade);
      window.removeEventListener("switch-tab", handleSwitchTab as EventListener);
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
    showRescueModal,
    setShowRescueModal,
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
  const [bypassAdvProfileError, setBypassAdvProfileError] = useState(false);

  const showOnboarding = profile && !advProfileLoading && !advProfileError && (!advisorProfile || !advisorProfile.onboarding_completed) && !showCampaignPromo && !bypassAdvProfileError;

  return (
    <div className={
      activeTab === "bolgem"
        ? "h-[100dvh] bg-slate-50 font-sans text-slate-900 overflow-hidden"
        : "min-h-screen bg-slate-50 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-0 font-sans text-slate-900 overflow-x-hidden"
    }>
      
      {advProfileLoading && !bypassAdvProfileError && profile && (
        <div className="fixed inset-0 z-50 bg-slate-50 w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="font-medium text-sm">Profil bilgileri kontrol ediliyor...</div>
            </div>
        </div>
      )}

      {advProfileError && !bypassAdvProfileError && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 w-full h-full p-4 flex items-center justify-center">
            <Card className="max-w-md w-full p-6 text-center shadow-xl">
                <h2 className="text-xl font-bold mb-3">Profesyonel profil bilgileri alınamadı.</h2>
                <p className="text-slate-500 mb-6 text-sm">Sunucuya bağlanırken bir sorun oluştu. Daha sonra tekrar deneyebilir veya Dashboard'a geçebilirsiniz.</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => refetchAdvProfile()} className="px-4 py-2 bg-[#00D2B4] text-slate-900 rounded-xl font-bold hover:bg-[#00e3c5] transition">Tekrar Dene</button>
                    <button onClick={() => setBypassAdvProfileError(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">Dashboard'a Devam Et</button>
                </div>
            </Card>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-50 w-full h-full p-4">
          <CampaignStartWizard 
            mode="profile_onboarding"
            isPending={upsertAdvisorProfileMutation.isPending} 
            onComplete={payload => upsertAdvisorProfileMutation.mutate(payload)} 
          />
        </div>
      )}

      {showCampaignPromo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm w-full h-full p-4 flex items-center justify-center">
             <Card className="bg-white border-2 border-[#00D2B4] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative shadow-[#00D2B4]/20">
                 <h2 className="text-2xl font-black text-slate-900 mb-4">Yeni danışmanlar için 90 Gün Kampı hazır</h2>
                 <p className="text-slate-600 font-medium mb-6">
                    İlk 90 gün, önümüzdeki 10 yılın temelini atar. Portfy 90 Gün Kampı seni ilk günlerde sahaya kontrolsüz sürmez; önce MYK, ofis, yetki, sözleşme ve güvenli çalışma zeminini kurar. Sonra günlük eğitim, görev ve takip disipliniyle ilerletir.
                 </p>
                 <div className="flex flex-col gap-3">
                    <button 
                       onClick={() => promoPayload && startCampaignMutation.mutate(promoPayload)}
                       disabled={startCampaignMutation.isPending}
                       className="w-full bg-[#00D2B4] hover:bg-[#00e3c5] text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                       {startCampaignMutation.isPending ? 'Başlatılıyor...' : '90 Gün Kampı\'na Başla'} <ArrowRight size={18} />
                    </button>
                    <button 
                       onClick={() => setShowCampaignPromo(false)}
                       className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl transition-colors"
                    >
                       Şimdilik Geç
                    </button>
                 </div>
             </Card>
        </div>
      )}



      {showRegionSetup ? (
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

      <div className={`flex flex-col md:flex-row w-full ${activeTab === "bolgem" ? "h-full overflow-hidden" : "min-h-screen"}`}>
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
          advisorProfile={advisorProfile}
          activeCampaign={activeCampaign}
          campaignLoading={campaignLoading}
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
        <div className={`flex-1 flex flex-col min-w-0 ${activeTab === "bolgem" ? "h-full overflow-hidden" : ""}`}>
          {activeTab !== "bolgem" && (
            <Header activeTab={activeTab} profile={profile} />
          )}
          <main
            className={
              activeTab === "bolgem"
                ? "flex-1 min-h-0 h-full w-full max-w-none mx-0 flex flex-col overflow-hidden"
                : "flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6"
            }
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
      
      <PWAInstallPrompt disabled={
        showQuickAdd || showVoiceQuickAdd || showAddProperty || showAddLead || showAddVisit ||
        showWhatsAppImport || showDailyRadar || showDayCloser || showIntegrationModal ||
        showExternalListings || showImportUrlModal || showMissedOpportunities || showRegionSetup ||
        showUpgradeModal || showAddTask || showDocumentAutomation || showLeadMethodModal || showScanner ||
        showRescueModal || showCampaignPromo || showOnboarding || selectedProperty !== null || selectedLead !== null
      } />

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
      {profile && !profile.has_seen_tour && activeTab === "dashboard" && advisorProfile?.onboarding_completed && !showOnboarding && !showCampaignPromo && (
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
