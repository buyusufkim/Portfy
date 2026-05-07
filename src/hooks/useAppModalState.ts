import { useState, useCallback } from 'react';
import { Property, Lead } from '../types';

export function useAppModalState() {
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
  const [documentAutomationProperty, setDocumentAutomationProperty] = useState<Property | null>(null);
  const [documentAutomationLead, setDocumentAutomationLead] = useState<Lead | null>(null);
  const [showLeadMethodModal, setShowLeadMethodModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const closeAllModals = useCallback(() => {
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
    setShowAddTask(false);
    setShowDocumentAutomation(false);
    setShowRegionSetup(false);
    setShowLeadMethodModal(false);
    setShowScanner(false);
  }, []);

  return {
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
    closeAllModals,
  };
}
