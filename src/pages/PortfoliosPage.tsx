// Dosya: src/pages/PortfoliosPage.tsx

import React, { useState, useMemo } from 'react';
// DÜZELTME: useQuery eklendi
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import { motion } from 'motion/react';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { Property, BrokerAccount, ExternalListing, Lead, RegionEfficiencyScore, MutationResult, Task } from '../types';
import { AddPropertyModal } from '../components/portfolios/AddPropertyModal';
import { IntegrationModal } from '../components/portfolios/IntegrationModal';
import { ExternalListingsModal } from '../components/portfolios/ExternalListingsModal';
import { ImportUrlModal } from '../components/portfolios/ImportUrlModal';
import { PropertyDetailModal } from '../components/portfolios/PropertyDetailModal';
import { MarketingHubModal } from '../components/portfolios/MarketingHubModal';
import { AIContentModal } from '../components/portfolios/AIContentModal';
import { PortfoliosToolbar } from '../components/portfolios/PortfoliosToolbar';
import { PropertyGrid } from '../components/portfolios/PropertyGrid';
import { useAuth } from '../AuthContext';
import { MagicLinkButton } from '../components/premium/MagicLinkButton';

// YENİ EKLENEN MODÜLLER
import { useSmartMatch } from '../hooks/useSmartMatch';
import { SmartMatchModal } from '../components/portfolios/SmartMatchModal';

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
  syncListingsMutation: MutationResult<any, void>;
  linkPropertyMutation: MutationResult<any, { propertyId: string, externalId: string }>;
  connectIntegrationMutation: MutationResult<any, void>;
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
  setDocumentAutomationLead
}) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [instagramCaptions, setInstagramCaptions] = useState<{ corporate: string, sales: string, warm: string } | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState<{ single: string, status: string, investor: string } | null>(null);
  const [marketingHubData, setMarketingHubData] = useState<unknown | null>(null);
  const [aiMarketingType, setAiMarketingType] = useState<'listing' | 'instagram' | 'whatsapp' | 'share' | 'hub' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMarketingHub, setShowMarketingHub] = useState(false);

  const { runSmartMatchAsync } = useSmartMatch();

  const generateContentMutation = useMutation({
    mutationFn: (prop: Property) => api.generatePropertyContent(prop),
    onSuccess: (data) => {
      setAiContent(data);
      setIsGenerating(false);
    }
  });

  const generateInstagramMutation = useMutation({
    mutationFn: (prop: Property) => api.generateInstagramCaptions(prop),
    onSuccess: (data) => {
      setInstagramCaptions(data);
      setIsGenerating(false);
    }
  });

  const generateWhatsAppMutation = useMutation({
    mutationFn: (prop: Property) => api.generateWhatsAppMessages(prop),
    onSuccess: (data) => {
      setWhatsappMessages(data);
      setIsGenerating(false);
    }
  });

  const generateMarketingMutation = useMutation({
    mutationFn: (prop: Property) => api.generateMarketingModule(prop),
    onSuccess: (data) => {
      setMarketingHubData(data);
      setIsGenerating(false);
      setShowMarketingHub(true);
    }
  });

  const addPropertyMutation = useMutation({
    mutationFn: (data: Omit<Property, 'id' | 'user_id'>) => isEditing && selectedProperty 
      ? api.updateProperty(selectedProperty.id, data)
      : api.addProperty(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES, profile?.id] });
      
      setShowAddProperty(false);
      
      if (!isEditing && data) {
        const propertyId = typeof data === 'string' ? data : data.id;
        
        if (propertyId) {
          runSmartMatchAsync(propertyId)
            .catch(err => console.error("Smart Match Hatası:", err));
        }
      }

      setIsEditing(false);
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) => api.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS, profile?.id] });
      setSelectedProperty(null);
    },
    onError: (err: Error) => {
      alert("Silme işlemi sırasında bir hata oluştu: " + err.message);
      console.error("Delete Property Error:", err);
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string, file: File }) => api.uploadPropertyImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.id] });
    }
  });

  const importListingMutation = useMutation({
    mutationFn: api.importListingFromUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.id] });
      setShowImportUrlModal(false);
      setIsEditing(false);
      setShowAddProperty(true);
    }
  });

  return (
    <>
      <IntegrationModal 
        show={showIntegrationModal} 
        onClose={() => setShowIntegrationModal(false)} 
        onConnect={() => connectIntegrationMutation.mutate()}
        isPending={connectIntegrationMutation.isPending}
      />
      <ExternalListingsModal 
        show={showExternalListings} 
        onClose={() => setShowExternalListings(false)} 
        listings={externalListings}
        onSync={() => syncListingsMutation.mutate()}
        isSyncing={syncListingsMutation.isPending}
        onLink={(propertyId, externalId) => linkPropertyMutation.mutate({ propertyId, externalId })}
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
        onClose={() => { setSelectedProperty(null); setAiContent(null); }} 
        regionScores={regionScores}
        leads={leads}
        brokerAccount={brokerAccount}
        setShowAddTask={setShowAddTask}
        tasks={tasks}
        setShowDocumentAutomation={setShowDocumentAutomation}
        setDocumentAutomationProperty={setDocumentAutomationProperty}
        setDocumentAutomationLead={setDocumentAutomationLead}
        onShowExternalListings={() => setShowExternalListings(true)}
        onGenerateMarketingHub={() => { if (!selectedProperty) return; setAiMarketingType('hub'); setIsGenerating(true); generateMarketingMutation.mutate(selectedProperty); }}
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
          if (selectedProperty) uploadImageMutation.mutate({ id: selectedProperty.id, file });
        }}
        isUploading={uploadImageMutation.isPending}
        isDeleting={deletePropertyMutation.isPending} 
        magicLinkSlot={selectedProperty ? <MagicLinkButton propertyId={selectedProperty.id} /> : null}
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
        onGenerateListing={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType('listing');
          setIsGenerating(true);
          generateContentMutation.mutate(selectedProperty);
        }}
        onGenerateInstagram={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType('instagram');
          setIsGenerating(true);
          generateInstagramMutation.mutate(selectedProperty);
        }}
        onGenerateWhatsApp={() => {
          if (!selectedProperty) return;
          setShowMarketingHub(false);
          setAiMarketingType('whatsapp');
          setIsGenerating(true);
          generateWhatsAppMutation.mutate(selectedProperty);
        }}
      />
      <AIContentModal 
        aiMarketingType={aiMarketingType} 
        onClose={() => { setAiMarketingType(null); setAiContent(null); setInstagramCaptions(null); setWhatsappMessages(null); setIsGenerating(false); }} 
        isGenerating={isGenerating}
        aiContent={aiContent}
        instagramCaptions={instagramCaptions}
        whatsappMessages={whatsappMessages}
        selectedProperty={selectedProperty}
        onRegenerate={() => {
          if (!selectedProperty || !aiMarketingType) return;
          setIsGenerating(true);
          if (aiMarketingType === 'listing') generateContentMutation.mutate(selectedProperty);
          else if (aiMarketingType === 'instagram') generateInstagramMutation.mutate(selectedProperty);
          else if (aiMarketingType === 'whatsapp') generateWhatsAppMutation.mutate(selectedProperty);
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
  viewMode: 'list' | 'pipeline';
  setViewMode: (mode: 'list' | 'pipeline') => void;
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
  setShowAddProperty
}) => {
  const [showSmartMatch, setShowSmartMatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  // Eksik olan useQuery buraya eklendi
  const { data: leads = [] } = useQuery({ 
    queryKey: [QUERY_KEYS.LEADS, profile?.id], 
    queryFn: api.getLeads, 
    enabled: !!profile?.id 
  });

  const { data: blockers = [] } = useQuery({
    queryKey: ['portfolioBlockers', profile?.id],
    queryFn: () => api.momentumOs.getPortfolioBlockers(),
    enabled: !!profile?.id
  });

  const resolveBlockerMutation = useMutation({
    mutationFn: (id: string) => api.momentumOs.resolvePortfolioBlocker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioBlockers', profile?.id] });
    }
  });

  const filteredProperties = useMemo(() => { 
    return properties.filter(p => {
      const matchesDistrict = selectedDistrict === 'all' || p.address.district === selectedDistrict;
      const lowerQuery = searchQuery.toLocaleLowerCase('tr-TR');
      const matchesSearch = !searchQuery || 
        p.title.toLocaleLowerCase('tr-TR').includes(lowerQuery) ||
        p.address.district.toLocaleLowerCase('tr-TR').includes(lowerQuery) ||
        p.address.neighborhood.toLocaleLowerCase('tr-TR').includes(lowerQuery);

      return matchesDistrict && matchesSearch;
    });
  }, [properties, selectedDistrict, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen"
    >
      <PortfoliosToolbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        regionScores={regionScores}
        setShowImportUrlModal={setShowImportUrlModal}
        onOpenSmartMatch={() => setShowSmartMatch(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <PropertyGrid 
        viewMode={viewMode}
        propertiesLoading={propertiesLoading}
        filteredProperties={filteredProperties}
        setSelectedProperty={setSelectedProperty}
        setIsEditing={setIsEditing}
        setShowAddProperty={setShowAddProperty}
        renderMagicLink={(id: string) => <MagicLinkButton propertyId={id} />}
        hasActiveFilters={searchQuery !== '' || selectedDistrict !== 'all'}
        onClearFilters={() => { setSearchQuery(''); setSelectedDistrict('all'); }}
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