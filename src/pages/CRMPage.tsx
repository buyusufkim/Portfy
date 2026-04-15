import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { CRMView } from '../components/CRMView';
import { Lead, UserProfile, Category, MutationResult, Property } from '../types';

interface CRMPageProps {
  profile: UserProfile | null;
  leads: Lead[];
  leadsLoading: boolean;
  categories: Category[];
  setShowWhatsAppImport: (show: boolean) => void;
  setShowAddLead: (show: boolean) => void;
  setIsAnalyzingLeads: (analyzing: boolean) => void;
  analyzeLeadsMutation: MutationResult<string, any>;
  isAnalyzingLeads: boolean;
  properties: Property[];
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
}

export const CRMPage: React.FC<CRMPageProps> = ({
  profile,
  leads,
  leadsLoading,
  categories,
  setShowWhatsAppImport,
  setShowAddLead,
  setIsAnalyzingLeads,
  analyzeLeadsMutation,
  isAnalyzingLeads,
  properties,
  selectedLead,
  setSelectedLead
}) => {
  return (
    <CRMView 
      setShowWhatsAppImport={setShowWhatsAppImport}
      setShowAddLead={setShowAddLead}
      setIsAnalyzingLeads={setIsAnalyzingLeads}
      analyzeLeadsMutation={analyzeLeadsMutation}
      leads={leads}
      leadsLoading={leadsLoading}
      categories={categories}
      isAnalyzingLeads={isAnalyzingLeads}
      onSelectLead={setSelectedLead}
    />
  );
};
