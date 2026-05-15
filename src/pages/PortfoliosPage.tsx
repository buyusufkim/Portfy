// Dosya: src/pages/PortfoliosPage.tsx

import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
// DÜZELTME: useQuery eklendi
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "../services/api";
import { QUERY_KEYS } from "../constants/queryKeys";
import { PageIntroCard } from "../components/ui/PageIntroCard";
import {
  Property,
  BrokerAccount,
  ExternalListing,
  Lead,
  RegionEfficiencyScore,
  MutationResult,
  Task,
} from "../types";
import { MarketingHubData } from "../components/portfolios/MarketingHubModal";
import { AddPropertyModal } from "../components/portfolios/AddPropertyModal";
import { IntegrationModal } from "../components/portfolios/IntegrationModal";
import { ExternalListingsModal } from "../components/portfolios/ExternalListingsModal";
import { ImportUrlModal } from "../components/portfolios/ImportUrlModal";
import { PropertyDetailModal } from "../components/portfolios/PropertyDetailModal";
import { MarketingHubModal } from "../components/portfolios/MarketingHubModal";
import { AIContentModal } from "../components/portfolios/AIContentModal";
import { PortfoliosToolbar } from "../components/portfolios/PortfoliosToolbar";
import { PropertyGrid } from "../components/portfolios/PropertyGrid";
import { useAuth } from "../AuthContext";
import { MagicLinkButton } from "../components/premium/MagicLinkButton";

// YENİ EKLENEN MODÜLLER
import { useSmartMatch } from "../hooks/useSmartMatch";
import { SmartMatchModal } from "../components/portfolios/SmartMatchModal";

interface PortfolioModalsProps {
  showAddProperty: boolean;
  setShowAddProperty: (show: boolean) => void;
  showImportUrlModal: boolean;
  setShowImportUrlModal: (show: boolean) => void;
  showIntegrationModal: boolean;
  setShowIntegrationModal: (show: boolean) => void;
  showExternalListings: boolean;
  setShowExternalListings: (show: boolean) => void;
  selectedProperty: Property | null;
  setSelectedProperty: (p: Property | null) => void;
  brokerAccount: BrokerAccount | null;
  externalListings: ExternalListing[];
  syncListingsMutation: MutationResult<unknown, void>;
  linkPropertyMutation: MutationResult<
    unknown,
    { propertyId: string; externalId: string }
  >;
  connectIntegrationMutation: MutationResult<unknown, string>;
  leads: Lead[];
  regionScores: RegionEfficiencyScore[];
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  setShowAddTask: (show: boolean) => void;
  tasks: Task[];
  setShowDocumentAutomation: (show: boolean) => void;
  setDocumentAutomationProperty: (p: Property | null) => void;
  setDocumentAutomationLead: (l: Lead | null) => void;
}

export const PortfolioModals: React.FC<PortfolioModalsProps> = ({
  showAddProperty,
  setShowAddProperty,
  showImportUrlModal,
  setShowImportUrlModal,
  showIntegrationModal,
  setShowIntegrationModal,
  showExternalListings,
  setShowExternalListings,
  selectedProperty,
  setSelectedProperty,
  brokerAccount,
  externalListings,
  syncListingsMutation,
  linkPropertyMutation,
  connectIntegrationMutation,
  leads,
  regionScores,
  isEditing,
  setIsEditing,
  setShowAddTask,
  tasks,
  setShowDocumentAutomation,
  setDocumentAutomationProperty,
  setDocumentAutomationLead,
}) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [instagramCaptions, setInstagramCaptions] = useState<{
    corporate: string;
    sales: string;
    warm: string;
  } | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState<{
    single: string;
    status: string;
    investor: string;
  } | null>(null);
  const [marketingHubData, setMarketingHubData] =
    useState<MarketingHubData | null>(null);
  const [aiMarketingType, setAiMarketingType] = useState<
    "listing" | "instagram" | "whatsapp" | "share" | "hub" | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMarketingHub, setShowMarketingHub] = useState(false);

  const { runSmartMatchAsync } = useSmartMatch();

  const handleAiError = (error: any) => {
    setIsGenerating(false);
    const msg = error?.message || '';
    if (msg.includes('403') || msg.includes('limit')) {
      toast.error('Bu AI özelliği hesabında aktif değil veya kullanım limitin doldu.', { duration: 5000 });
    } else if (msg.includes('401')) {
      toast.error('Oturum süren dolmuş olabilir. Tekrar giriş yap.');
    } else if (msg.includes('413')) {
      toast.error('Girdi çok uzun. Portföy notlarını kısaltıp tekrar dene.');
    } else if (msg.includes('invalid_ai_feature') || msg.includes('400')) {
      toast.error('AI özelliği yapılandırması eksik veya geçersiz.');
    } else {
      toast.error('AI üretim sırasında hata oluştu. Biraz sonra tekrar dene.');
    }
  };

  const generateContentMutation = useMutation({
    mutationFn: (prop: Property) => api.generatePropertyContent(prop),
    onSuccess: (data) => {
      setAiContent(data);
      setIsGenerating(false);
    },
    onError: handleAiError,
  });

  const generateInstagramMutation = useMutation({
    mutationFn: (prop: Property) => api.generateInstagramCaptions(prop),
    onSuccess: (data) => {
      setInstagramCaptions(data);
      setIsGenerating(false);
    },
    onError: handleAiError,
  });

  const generateWhatsAppMutation = useMutation({
    mutationFn: (prop: Property) => api.generateWhatsAppMessages(prop),
    onSuccess: (data) => {
      setWhatsappMessages(data);
      setIsGenerating(false);
    },
    onError: handleAiError,
  });

  const generateMarketingMutation = useMutation({
    mutationFn: (prop: Property) => api.generateMarketingModule(prop),
    onSuccess: (data) => {
      setMarketingHubData(data as unknown as MarketingHubData);
      setIsGenerating(false);
      setShowMarketingHub(true);
      toast.success('Pazarlama içerikleri portföye kaydedildi.');
    },
    onError: handleAiError,
  });

  const { data: blockers = [] } = useQuery({
    queryKey: ["portfolioBlockers", profile?.id],
    queryFn: () => api.momentumOs.getPortfolioBlockers(),
    enabled: !!profile?.id,
  });

  const resolveBlockerMutation = useMutation({
    mutationFn: (id: string) => api.momentumOs.resolvePortfolioBlocker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["portfolioBlockers", profile?.id],
      });
    },
  });

  const addPropertyMutation = useMutation({
    mutationFn: (data: Omit<Property, "id" | "user_id">) =>
      isEditing && selectedProperty
        ? api.updateProperty(selectedProperty.id, data)
        : api.addProperty(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTIES, profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD_STATS, profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.REGION_SCORES, profile?.id],
      });

      setShowAddProperty(false);

      if (!isEditing && data) {
        const propertyId = typeof data === "string" ? data : data.id;

        if (propertyId) {
          runSmartMatchAsync(propertyId).catch((err) =>
            console.error("Smart Match Hatası:", err),
          );
        }
      }

      setIsEditing(false);
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) => api.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTIES, profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DASHBOARD_STATS, profile?.id],
      });
      setSelectedProperty(null);
    },
    onError: (err: Error) => {
      toast.error("Silme işlemi sırasında bir hata oluştu: " + err.message);
      console.error("Delete Property Error:", err);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      api.uploadPropertyImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTIES, profile?.id],
      });
    },
  });

  const importListingMutation = useMutation({
    mutationFn: api.importListingFromUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROPERTIES, profile?.id],
      });
      setShowImportUrlModal(false);
      setIsEditing(false);
      setShowAddProperty(true);
    },
  });

  return (
    <>
      <IntegrationModal
        show={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        onConnect={(apiKey) => connectIntegrationMutation.mutate(apiKey)}
        isPending={connectIntegrationMutation.isPending}
      />
      <ExternalListingsModal
        show={showExternalListings}
        onClose={() => setShowExternalListings(false)}
        listings={externalListings}
        onSync={() => syncListingsMutation.mutate()}
        isSyncing={syncListingsMutation.isPending}
        onLink={(propertyId, externalId) =>
          linkPropertyMutation.mutate({ propertyId, externalId })
        }
        selectedProperty={selectedProperty}
      />
      <ImportUrlModal
        show={showImportUrlModal}
        onClose={() => setShowImportUrlModal(false)}
        onImport={(url) => importListingMutation.mutate(url)}
        isImporting={importListingMutation.isPending}
      />
      <PropertyDetailModal
        selectedProperty={showAddProperty ? null : selectedProperty}
        onClose={() => {
          setSelectedProperty(null);
          setAiContent(null);
          setMarketingHubData(null);
        }}
        regionScores={regionScores}
        leads={leads}
        brokerAccount={brokerAccount}
        blockers={blockers}
        onResolveBlocker={(id: string) => resolveBlockerMutation.mutate(id)}
        setShowAddTask={setShowAddTask}
        tasks={tasks}
        setShowDocumentAutomation={setShowDocumentAutomation}
        setDocumentAutomationProperty={setDocumentAutomationProperty}
        setDocumentAutomationLead={setDocumentAutomationLead}
        onShowExternalListings={() => setShowExternalListings(true)}
        isGeneratingMarketingHub={isGenerating && aiMarketingType === "hub"}
        onGenerateMarketingHub={async () => {
          if (!selectedProperty) return;
          setAiMarketingType("hub");
          setMarketingHubData(null);
          setIsGenerating(true);
          setShowMarketingHub(true);
          
          try {
            const data = await api.getMarketingOutput(selectedProperty.id);
            if (data && Object.keys(data).length > 0) {
              setMarketingHubData(data as unknown as MarketingHubData);
              setIsGenerating(false);
            } else {
              generateMarketingMutation.mutate(selectedProperty);
            }
          } catch (err) {
            generateMarketingMutation.mutate(selectedProperty);
          }
        }}
        onEdit={() => {
          setIsEditing(true);
          setShowAddProperty(true);
        }}
        onDelete={() => {
          if (selectedProperty) {
            deletePropertyMutation.mutate(selectedProperty.id);
          }
        }}
        onUploadImage={(file) => {
          if (selectedProperty)
            uploadImageMutation.mutate({ id: selectedProperty.id, file });
        }}
        isUploading={uploadImageMutation.isPending}
        isDeleting={deletePropertyMutation.isPending}
        magicLinkSlot={
          selectedProperty ? (
            <MagicLinkButton propertyId={selectedProperty.id} />
          ) : null
        }
      />
      <AddPropertyModal
        show={showAddProperty}
        onClose={() => {
          setShowAddProperty(false);
          setIsEditing(false);
        }}
        onSubmit={(data) => addPropertyMutation.mutateAsync(data)}
        isPending={addPropertyMutation.isPending}
        initialData={isEditing ? selectedProperty : null}
        leads={leads}
      />
      <MarketingHubModal
        show={showMarketingHub}
        onClose={() => setShowMarketingHub(false)}
        marketingHubData={marketingHubData}
        isGenerating={isGenerating && aiMarketingType === "hub"}
        onRegenerate={() => {
          if (!selectedProperty) return;
          setAiMarketingType("hub");
          setIsGenerating(true);
          generateMarketingMutation.mutate(selectedProperty);
        }}
        onGenerateListing={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType("listing");
          if (marketingHubData?.portal_description) {
               setAiContent(marketingHubData.portal_description as string);
               setIsGenerating(false);
          } else {
               setIsGenerating(true);
               generateContentMutation.mutate(selectedProperty);
          }
        }}
        onGenerateInstagram={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType("instagram");
          if (marketingHubData?.instagram_posts && marketingHubData.instagram_posts.length > 0) {
              const posts: any = marketingHubData.instagram_posts || [];
              const kurumsal = posts.find((p: any) => p.tone === 'kurumsal') || posts[0];
              const satis = posts.find((p: any) => p.tone === 'satis_odakli') || posts[1] || posts[0];
              const samimi = posts.find((p: any) => p.tone === 'samimi') || posts[2] || posts[0];
              
              setInstagramCaptions({
                  corporate: kurumsal?.caption || '',
                  sales: satis?.caption || '',
                  warm: samimi?.caption || ''
              });
              setIsGenerating(false);
          } else {
              setIsGenerating(true);
              generateInstagramMutation.mutate(selectedProperty);
          }
        }}
        onGenerateWhatsApp={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType("whatsapp");
          if (marketingHubData?.whatsapp_messages && Object.keys(marketingHubData.whatsapp_messages).length > 0) {
              let statuses: any = marketingHubData.whatsapp_messages;
              if (Array.isArray(marketingHubData.whatsapp_messages)) {
                  const arr = marketingHubData.whatsapp_messages as any[];
                  statuses = {
                      single: arr.find(m => m.type === 'single')?.text || '',
                      status: arr.find(m => m.type === 'status')?.text || '',
                      investor: arr.find(m => m.type === 'investor')?.text || ''
                  };
              }
              setWhatsappMessages({
                  single: statuses.single || '',
                  status: statuses.status || '',
                  investor: statuses.investor || ''
              });
              setIsGenerating(false);
          } else {
              setIsGenerating(true);
              generateWhatsAppMutation.mutate(selectedProperty);
          }
        }}
      />
      <AIContentModal
        aiMarketingType={aiMarketingType}
        onClose={() => {
          setAiMarketingType(null);
          setAiContent(null);
          setInstagramCaptions(null);
          setWhatsappMessages(null);
          setIsGenerating(false);
        }}
        isGenerating={isGenerating}
        aiContent={aiContent}
        instagramCaptions={instagramCaptions}
        whatsappMessages={whatsappMessages}
        selectedProperty={selectedProperty}
        onRegenerate={() => {
          if (!selectedProperty || !aiMarketingType) return;
          setIsGenerating(true);
          if (aiMarketingType === "listing")
            generateContentMutation.mutate(selectedProperty);
          else if (aiMarketingType === "instagram")
            generateInstagramMutation.mutate(selectedProperty);
          else if (aiMarketingType === "whatsapp")
            generateWhatsAppMutation.mutate(selectedProperty);
        }}
      />
    </>
  );
};

interface PortfoliosPageProps {
  properties: Property[];
  propertiesLoading: boolean;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  regionScores: RegionEfficiencyScore[];
  viewMode: "list" | "grid" | "pipeline";
  setViewMode: (mode: "list" | "grid" | "pipeline") => void;
  setShowImportUrlModal: (show: boolean) => void;
  setSelectedProperty: (p: Property) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  showAddProperty?: boolean;
  setShowAddProperty?: (show: boolean) => void;
}

export const PortfoliosPage: React.FC<PortfoliosPageProps> = ({
  properties,
  propertiesLoading,
  selectedDistrict,
  setSelectedDistrict,
  regionScores,
  viewMode,
  setViewMode,
  setShowImportUrlModal,
  setSelectedProperty,
  isEditing,
  setIsEditing,
  showAddProperty,
  setShowAddProperty,
}) => {
  const [showSmartMatch, setShowSmartMatch] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "Satılık" | "Kiralık"
  >("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<
    "all" | "active" | "completed" | "archived"
  >("active");
  const [searchQuery, setSearchQuery] = useState("");
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Eksik olan useQuery buraya eklendi
  const { data: leads = [] } = useQuery({
    queryKey: [QUERY_KEYS.LEADS, profile?.id],
    queryFn: api.getLeads,
    enabled: !!profile?.id,
  });

  const { data: blockers = [] } = useQuery({
    queryKey: ["portfolioBlockers", profile?.id],
    queryFn: () => api.momentumOs.getPortfolioBlockers(),
    enabled: !!profile?.id,
  });

  const resolveBlockerMutation = useMutation({
    mutationFn: (id: string) => api.momentumOs.resolvePortfolioBlocker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["portfolioBlockers", profile?.id],
      });
    },
  });

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesDistrict =
        selectedDistrict === "all" || p.address.district === selectedDistrict;
      const matchesStatus =
        viewMode === "pipeline" ||
        selectedStatus === "all" ||
        p.status === selectedStatus;
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;

      let matchesLifecycle = true;
      if (lifecycleFilter === "active") {
        matchesLifecycle = [
          "Yeni",
          "Hazırlanıyor",
          "Yayında",
          "İlgi Var",
          "Pazarlık",
        ].includes(p.status);
      } else if (lifecycleFilter === "completed") {
        matchesLifecycle = ["Satıldı", "Kiralandı"].includes(p.status);
      } else if (lifecycleFilter === "archived") {
        matchesLifecycle = p.status === "Pasif";
      }

      const lowerQuery = searchQuery.toLocaleLowerCase("tr-TR");
      const matchesSearch =
        !searchQuery ||
        p.title.toLocaleLowerCase("tr-TR").includes(lowerQuery) ||
        p.address.district.toLocaleLowerCase("tr-TR").includes(lowerQuery) ||
        p.address.neighborhood.toLocaleLowerCase("tr-TR").includes(lowerQuery);

      return (
        matchesDistrict &&
        matchesStatus &&
        matchesCategory &&
        matchesLifecycle &&
        matchesSearch
      );
    });
  }, [
    properties,
    selectedDistrict,
    selectedStatus,
    categoryFilter,
    lifecycleFilter,
    searchQuery,
    viewMode,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col flex-1 min-h-0"
    >
      <PortfoliosToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        lifecycleFilter={lifecycleFilter}
        setLifecycleFilter={setLifecycleFilter}
        regionScores={regionScores}
        setShowImportUrlModal={setShowImportUrlModal}
        onOpenSmartMatch={() => setShowSmartMatch(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="px-4">
        <PageIntroCard 
          pageKey="portfolios"
          title="Portföylerim Nasıl Kullanılır?"
          description="Satılık ve kiralık portföylerinizi ekleyip, durumlarını takip edebilir, alıcılarla eşleştirebilirsiniz."
          tips={[
            "Akıllı Eşleşme ile elinizdeki portföye uygun alıcıları CRM'den eşleştirin.",
            "Pipeline (Kanban) moduyla portföylerinizi süreç aşamalarına göre yönetin."
          ]}
        />
      </div>

      <PropertyGrid
        viewMode={viewMode}
        propertiesLoading={propertiesLoading}
        filteredProperties={filteredProperties}
        setSelectedProperty={setSelectedProperty}
        setIsEditing={setIsEditing}
        setShowAddProperty={setShowAddProperty}
        renderMagicLink={(id: string) => <MagicLinkButton propertyId={id} />}
        hasActiveFilters={
          searchQuery !== "" ||
          selectedDistrict !== "all" ||
          selectedStatus !== "all" ||
          categoryFilter !== "all" ||
          lifecycleFilter !== "active"
        }
        onClearFilters={() => {
          setSearchQuery("");
          setSelectedDistrict("all");
          setSelectedStatus("all");
          setCategoryFilter("all");
          setLifecycleFilter("active");
        }}
        blockers={blockers}
        onResolveBlocker={(id: string) => resolveBlockerMutation.mutate(id)}
      />

      <SmartMatchModal
        show={showSmartMatch}
        onClose={() => setShowSmartMatch(false)}
        properties={properties}
        leads={leads}
      />
    </motion.div>
  );
};
