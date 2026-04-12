import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { Property, MessageTemplate } from '../types';
import { AddPropertyModal } from '../components/portfolios/AddPropertyModal';
import { IntegrationModal } from '../components/portfolios/IntegrationModal';
import { ExternalListingsModal } from '../components/portfolios/ExternalListingsModal';
import { ImportUrlModal } from '../components/portfolios/ImportUrlModal';
import { PropertyDetailModal } from '../components/portfolios/PropertyDetailModal';
import { SharePanel } from '../components/portfolios/SharePanel';
import { MarketingHubModal } from '../components/portfolios/MarketingHubModal';
import { AIContentModal } from '../components/portfolios/AIContentModal';
import { TemplateSelectorModal } from '../components/portfolios/TemplateSelectorModal';
import { PortfoliosToolbar } from '../components/portfolios/PortfoliosToolbar';
import { PropertyGrid } from '../components/portfolios/PropertyGrid';

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
  brokerAccount: any;
  externalListings: any[];
  syncListingsMutation: any;
  linkPropertyMutation: any;
  connectIntegrationMutation: any;
  templates: MessageTemplate[];
  showTemplateSelector: boolean;
  setShowTemplateSelector: (show: boolean) => void;
  leads: any[];
  regionScores: any[];
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
  templates,
  showTemplateSelector,
  setShowTemplateSelector,
  leads,
  regionScores
}) => {
  const queryClient = useQueryClient();
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [instagramCaptions, setInstagramCaptions] = useState<{ corporate: string, sales: string, warm: string } | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState<{ single: string, status: string, investor: string } | null>(null);
  const [marketingHubData, setMarketingHubData] = useState<any | null>(null);
  const [aiMarketingType, setAiMarketingType] = useState<'listing' | 'instagram' | 'whatsapp' | 'share' | 'hub' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showMarketingHub, setShowMarketingHub] = useState(false);

  // AI Mutations
  const generateContentMutation = useMutation({
    mutationFn: api.generatePropertyContent,
    onSuccess: (data) => {
      setAiContent(data);
      setIsGenerating(false);
    }
  });

  const generateInstagramMutation = useMutation({
    mutationFn: api.generateInstagramCaptions,
    onSuccess: (data) => {
      setInstagramCaptions(data);
      setIsGenerating(false);
    }
  });

  const generateWhatsAppMutation = useMutation({
    mutationFn: api.generateWhatsAppMessages,
    onSuccess: (data) => {
      setWhatsappMessages(data);
      setIsGenerating(false);
    }
  });

  const generateMarketingMutation = useMutation({
    mutationFn: api.generateMarketingModule,
    onSuccess: (data) => {
      setMarketingHubData(data);
      setIsGenerating(false);
      setShowMarketingHub(true);
    }
  });

  const addPropertyMutation = useMutation({
    mutationFn: api.addProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES] });
      setShowAddProperty(false);
    }
  });

  const importListingMutation = useMutation({
    mutationFn: api.importListingFromUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
      setShowImportUrlModal(false);
      setShowAddProperty(true);
    }
  });

  return (
    <>
      <AddPropertyModal 
        show={showAddProperty} 
        onClose={() => setShowAddProperty(false)} 
        onSubmit={addPropertyMutation.mutate}
        isPending={addPropertyMutation.isPending}
      />
      <IntegrationModal 
        show={showIntegrationModal} 
        onClose={() => setShowIntegrationModal(false)} 
        onConnect={connectIntegrationMutation.mutate}
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
        onImport={importListingMutation.mutate}
        isImporting={importListingMutation.isPending}
      />
      <PropertyDetailModal 
        selectedProperty={selectedProperty} 
        onClose={() => { setSelectedProperty(null); setAiContent(null); }} 
        regionScores={regionScores}
        leads={leads}
        brokerAccount={brokerAccount}
        onShowExternalListings={() => setShowExternalListings(true)}
        onShowSharePanel={() => setShowSharePanel(true)}
        onGenerateMarketingHub={() => { setAiMarketingType('hub'); setIsGenerating(true); generateMarketingMutation.mutate(selectedProperty!); }}
        onGenerateListing={() => { setAiMarketingType('listing'); setIsGenerating(true); generateContentMutation.mutate(selectedProperty!); }}
        onGenerateInstagram={() => { setAiMarketingType('instagram'); setIsGenerating(true); generateInstagramMutation.mutate(selectedProperty!); }}
        onGenerateWhatsApp={() => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty!); }}
        isGenerating={isGenerating}
        aiMarketingType={aiMarketingType}
        aiContent={aiContent}
        instagramCaptions={instagramCaptions}
        whatsappMessages={whatsappMessages}
      />
      <SharePanel 
        show={showSharePanel} 
        onClose={() => setShowSharePanel(false)} 
        selectedProperty={selectedProperty}
        onAction={(type) => {
          if (!selectedProperty) return;
          setAiMarketingType(type);
          setIsGenerating(true);
          if (type === 'whatsapp') generateWhatsAppMutation.mutate(selectedProperty);
          else if (type === 'hub') generateMarketingMutation.mutate(selectedProperty);
          else if (type === 'instagram') generateInstagramMutation.mutate(selectedProperty);
          else if (type === 'listing') generateContentMutation.mutate(selectedProperty);
          setShowSharePanel(false);
        }}
      />
      <MarketingHubModal 
        show={showMarketingHub} 
        onClose={() => setShowMarketingHub(false)} 
        marketingHubData={marketingHubData}
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
        onShowTemplateSelector={() => setShowTemplateSelector(true)}
      />
      <TemplateSelectorModal 
        show={showTemplateSelector} 
        onClose={() => setShowTemplateSelector(false)} 
        templates={templates}
        selectedProperty={selectedProperty}
        whatsappMessages={whatsappMessages}
      />
    </>
  );
};

interface PortfoliosPageProps {
  properties: Property[];
  propertiesLoading: boolean;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  regionScores: any[];
  viewMode: 'list' | 'pipeline';
  setViewMode: (mode: 'list' | 'pipeline') => void;
  setShowImportUrlModal: (show: boolean) => void;
  setSelectedProperty: (p: Property) => void;
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
  setSelectedProperty
}) => {
  const filteredProperties = properties.filter(p => {
    const matchesDistrict = selectedDistrict === 'all' || p.address.district === selectedDistrict;
    return matchesDistrict;
  });

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
      />
      <PropertyGrid 
        viewMode={viewMode}
        propertiesLoading={propertiesLoading}
        filteredProperties={filteredProperties}
        setSelectedProperty={setSelectedProperty}
      />
    </motion.div>
  );
};
