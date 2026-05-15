import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Sparkles, 
  Users, 
  User as UserIcon, 
  Phone,
  AlertTriangle,
  Globe,
  BellOff,
  Zap,
  BarChart3,
  ArrowRight,
  X
} from 'lucide-react';
import { CRMFinanceTab } from './crm/CRMFinanceTab';
import { Lead, LeadAlert, UserProfile, Property, Referral, MutationResult } from '../types';
import { Card, Badge, Skeleton } from './UI';
import { PageIntroCard } from './ui/PageIntroCard';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface LeadCategory {
  label: string;
  color: string;
}

interface CRMViewProps {
  leads: Lead[];
  leadsLoading: boolean;
  setShowWhatsAppImport: (show: boolean) => void;
  setShowAddLead: (show: boolean) => void;
  isAnalyzingLeads: boolean;
  setIsAnalyzingLeads: (analyzing: boolean) => void;
  analyzeLeadsMutation: MutationResult<string, unknown>;
  leadAnalysis?: string | null;
  categories: LeadCategory[];
  onSelectLead: (lead: Lead) => void;
  leadAlerts?: LeadAlert[];
  profile?: UserProfile | null;
  properties?: Property[];
}

const parseContactDate = (value?: string) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const CRMView: React.FC<CRMViewProps> = ({
  leads,
  leadsLoading,
  setShowWhatsAppImport,
  setShowAddLead,
  isAnalyzingLeads,
  setIsAnalyzingLeads,
  analyzeLeadsMutation,
  leadAnalysis,
  categories,
  onSelectLead,
  leadAlerts = [],
  profile,
  properties = []
}) => {
  const [activeTab, setActiveTab] = useState<'rehber' | 'araclar' | 'finans'>('rehber');
  const [crmSegment, setCrmSegment] = useState<'all' | 'customers' | 'network' | 'hot' | 'silent'>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  
  // Araçlar - Sahip Portalı
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'owner_portal_traffic' | 'referral_engine' | null>(null);

  // Araçlar - Referral Motoru
  const queryClient = useQueryClient();
  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', profile?.id],
    queryFn: () => api.momentumOs.getReferrals(),
    enabled: !!profile?.id && activeTab === 'araclar'
  });

  const [showReferralInput, setShowReferralInput] = useState(false);
  const [newReferralName, setNewReferralName] = useState('');
  
  const addReferralMutation = useMutation({
    mutationFn: (name: string) => api.momentumOs.addReferral({ referred_name: name, referrer_name: 'Davet Linki', status: 'İstendi' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals', profile?.id] });
      setNewReferralName('');
      setShowReferralInput(false);
      toast.success("Referral başarıyla eklendi.");
    }
  });

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api.momentumOs.updateReferral(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals', profile?.id] });
      toast.success("Referral durumu güncellendi.");
    }
  });

  const { data: portalEvents = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_PORTAL_EVENTS, profile?.id],
    queryFn: () => api.momentumOs.getOwnerPortalEventsSummary(),
    enabled: !!profile?.id && activeTab === 'araclar'
  });

  const getPropertyTraffic = (propertyId: string) => {
    const stat = portalEvents.find(e => e.property_id === propertyId);
    return {
      views: stat ? stat.views : 0,
      lastView: stat ? stat.last_seen : null
    };
  };

  const handleCreatePortal = async (propertyId: string) => {
    try {
      const response = await api.momentumOs.createPortalToken(propertyId);
      const link = `${window.location.origin}/portal/${response.token}`;
      setPortalLink(link);
      toast.success("Portföy portal linki oluşturuldu!");
    } catch (error) {
      console.error("Portal creation error:", error);
      toast.error("Portal linki oluşturulamadı.");
    }
  };
  const [statusFilter, setStatusFilter] = React.useState<'all' | Lead['status']>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | Lead['type']>('all');
  const [sortBy, setSortBy] = React.useState<'recent' | 'name'>('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const leadTypes = React.useMemo(() => {
    if (!leads) return [];
    return Array.from(new Set(leads.map(l => l.type || 'Bilinmiyor'))).sort((a, b) => a.localeCompare(b, 'tr')) as Lead['type'][];
  }, [leads]);

  const isSilentLead = React.useCallback((lead: Lead) => {
    const isAlerted = leadAlerts.some(a =>
      a.lead_id === lead.id &&
      (
        a.alert_type === 'silence' ||
        ['stale_3d', 'stale_7d', 'stale_14d', 'hot_48h_silence', 'inactive_lead', 'Sessiz Müşteri'].includes(a.alert_type)
      )
    );
    const isRisky = lead.silence_risk_level === 'high' || lead.silence_risk_level === 'medium';
    return isAlerted || isRisky;
  }, [leadAlerts]);

  const filteredLeads = React.useMemo(() => {
    if (!leads) return [];
    const normalizedQuery = debouncedSearchTerm.trim().toLocaleLowerCase('tr');
    const result = leads.filter((lead) => {
      if (!lead) return false;
      const matchesSearch = !normalizedQuery || [lead.name, lead.phone, lead.district].some((value) =>
        (value || '').toLocaleLowerCase('tr').includes(normalizedQuery)
      );
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      
      let matchesSegment = true;
      if (crmSegment === 'customers') matchesSegment = lead.type !== 'Bölge Network';
      else if (crmSegment === 'network') matchesSegment = lead.type === 'Bölge Network';
      else if (crmSegment === 'hot') matchesSegment = lead.status === 'Sıcak' || lead.temperature === 'hot';
      else if (crmSegment === 'silent') {
        matchesSegment = isSilentLead(lead);
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesSegment;
    });

    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '', 'tr');
      }
      // Hem last_contact hem last_contacted_at'e bakıyoruz
      const dateB = b.last_contacted_at || b.last_contact || b.created_at;
      const dateA = a.last_contacted_at || a.last_contact || a.created_at;
      return parseContactDate(dateB) - parseContactDate(dateA);
    });
  }, [leads, debouncedSearchTerm, statusFilter, typeFilter, sortBy, crmSegment, isSilentLead]);

  const hotLeadCount = leads.filter((lead) => lead.status === 'Sıcak' || lead.temperature === 'hot').length;
  const hasActiveFilters = searchTerm.length > 0 || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'recent';

  const silentLeadAlerts = React.useMemo(() => {
    return leadAlerts.filter(a => 
      a.alert_type === 'silence' ||
      ['stale_3d', 'stale_7d', 'stale_14d', 'hot_48h_silence', 'inactive_lead', 'Sessiz Müşteri'].includes(a.alert_type)
    );
  }, [leadAlerts]);

  const filterPills = [
    statusFilter !== 'all' ? { key: 'status', label: `Durum: ${statusFilter}` } : null,
    typeFilter !== 'all' ? { key: 'type', label: `Tip: ${typeFilter}` } : null,
    sortBy !== 'recent' ? { key: 'sort', label: 'Sıralama: İsme Göre' } : null,
    debouncedSearchTerm.trim() ? { key: 'search', label: `Arama: ${debouncedSearchTerm}` } : null
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('recent');
  };

  const renderCRMSummary = () => (
    <Card className="p-5 border-slate-100 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Users size={18} className="text-blue-500" /> CRM Özeti
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
           <p className="text-[10px] text-slate-500 font-bold mb-1">Toplam Kayıt</p>
           <p className="text-2xl font-black text-slate-900">{leads.length}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col justify-center">
           <p className="text-[10px] text-orange-800 font-bold mb-1">Sıcak Lead</p>
           <p className="text-2xl font-black text-orange-600">{hotLeadCount}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col justify-center">
           <p className="text-[10px] text-red-800 font-bold mb-1">Sessiz Risk</p>
           <p className="text-2xl font-black text-red-600">{leads.filter(isSilentLead).length}</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center">
           <p className="text-[10px] text-emerald-800 font-bold mb-1">Bölge Network</p>
           <p className="text-2xl font-black text-emerald-600">{leads.filter(l => l.type === 'Bölge Network').length}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto"
    >
      {/* 1. Başlık & 2. Üst aksiyonlar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM</h1>
           <p className="text-sm font-medium text-slate-500">Müşteri, lead ve network takibini tek merkezden yönet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="btn-add-lead" 
            onClick={() => setShowAddLead(true)} 
            className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 flex justify-center items-center gap-2 text-sm font-bold hover:bg-slate-800 transition"
          >
            <Plus size={18} /> Yeni Kayıt
          </button>
          <button 
            onClick={() => setShowWhatsAppImport(true)} 
            className="flex-1 md:flex-none justify-center px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-emerald-100 transition"
          >
            <MessageSquare size={18} /> <span className="md:inline hidden">WhatsApp Aktar</span><span className="md:hidden">WhatsApp</span>
          </button>
          <button 
            onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
            disabled={isAnalyzingLeads || leads.length === 0}
            className="flex-1 md:flex-none justify-center px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-purple-100 transition disabled:opacity-50"
          >
            {isAnalyzingLeads ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={18} /></motion.div>
            ) : <Sparkles size={18} />}
            AI Analiz
          </button>
        </div>
      </div>

      <PageIntroCard 
        pageKey="crm"
        title="CRM Nasıl Kullanılır?"
        description="Rehberinizdeki ve bölgenizdeki kişileri Müşteri, Bölge Ağı, Sıcak Lead gibi etiketlerle ayırıp gelişmiş filtreleme yapabilirsiniz."
        tips={[
          "Rehber sekmesinden listeye erişebilir ve kişiye tıklayarak detayını açabilirsiniz.",
          "WhatsApp Aktar butonuyla telefonunuzdaki listeyi buraya transfer edin."
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* SOL ANA KOLON */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* 3. Tablar */}
          <div className="flex border-b border-slate-200 w-full mb-2">
            <button 
              onClick={() => setActiveTab('rehber')} 
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'rehber' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <UserIcon size={16} /> Rehber
            </button>
            <button 
              onClick={() => setActiveTab('araclar')} 
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'araclar' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Globe size={16} /> Araçlar
            </button>
            <button 
              onClick={() => setActiveTab('finans')} 
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'finans' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <BarChart3 size={16} /> Finans
            </button>
          </div>

          {activeTab === 'finans' && (
             <CRMFinanceTab profile={profile} properties={properties} />
          )}

          {activeTab === 'rehber' && (
            <>
              {/* 4. Arama ve filtreler */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="w-full md:flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ara (isim, telefon, vb.)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="w-full md:w-auto bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm shadow-sm text-slate-700"
                  >
                    <option value="all">Durum</option>
                    <option value="Aday">Aday</option>
                    <option value="Sıcak">Sıcak</option>
                    <option value="Yetki Alındı">Yetki Alındı</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as Lead['type'] | 'all')}
                    className="w-full md:w-auto bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm shadow-sm text-slate-700"
                  >
                    <option value="all">Tip</option>
                    {leadTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
                    className="col-span-2 w-full md:col-span-1 md:w-auto bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm shadow-sm text-slate-700"
                  >
                    <option value="recent">Sırala: Son</option>
                    <option value="name">Sırala: İsim</option>
                  </select>
                </div>
              </div>

              {/* 5. Segment chipleri */}
              <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'customers', label: 'Müşteriler' },
                  { id: 'network', label: 'Bölge Network' },
                  { id: 'hot', label: 'Sıcak', dot: 'bg-orange-500' },
                  { id: 'silent', label: 'Sessiz', dot: 'bg-slate-400' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCrmSegment(tab.id as 'all' | 'customers' | 'network' | 'hot' | 'silent')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      crmSegment === tab.id 
                        ? 'bg-emerald-500 text-white shadow-sm border border-emerald-600' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CRM Özeti Kompakt (Sadece Mobilde) - 6. mobil sıra */}
              <div className="block xl:hidden">
                {renderCRMSummary()}
              </div>

              {/* 6(7). Takip uyarı bannerı */}
              {silentLeadAlerts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <span className="text-orange-800 font-bold text-sm">
                      {silentLeadAlerts.length} sessiz müşteri, bugün temas bekliyor.
                    </span>
                  </div>
                  <button onClick={() => setCrmSegment('silent')} className="text-orange-600 font-semibold text-xs flex items-center gap-1">
                    Tümünü Gör &rarr;
                  </button>
                </motion.div>
              )}

              {/* 7(8). Lead listesi */}
              <div className="space-y-3">
                {leadsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={`skeleton-${i}`} className="flex items-center justify-between p-4">
                      <div className="flex gap-4 items-center">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-20 h-3" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <Card className="text-center p-12 bg-slate-50 border border-dashed border-slate-200 space-y-3">
                    <p className="text-slate-500 text-sm">{
                      leads.length === 0 
                        ? "Henüz CRM kaydı yok. İlk müşterini, leadini veya bölge network kişini ekleyerek takibe başla."
                        : "Bu filtrelerle eşleşen kayıt bulunamadı."
                    }</p>
                    <button
                      onClick={leads.length === 0 ? () => setShowAddLead(true) : clearFilters}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700"
                    >
                      {leads.length === 0 ? "Yeni Kayıt" : "Filtreleri temizle"}
                    </button>
                  </Card>
                ) : (
                  filteredLeads.map(lead => {
                    const category = categories.find(c => c.label === lead.type);
                    const iconBg = category ? `${category.color}20` : '#f1f5f9';
                    const iconColor = category ? category.color : '#64748b';
                    const hasPhone = typeof lead.phone === 'string' && lead.phone.trim().length > 3;

                    return (
                      <Card key={lead.id} className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer" onClick={() => onSelectLead(lead)}>
                        {/* Üst Satır (Mobil) / Sol Kolon (Desktop): Avatar, İsim, Type, Status, Son Görüşme */}
                        <div className="flex items-center justify-between gap-3 w-full md:flex-1">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-base md:text-lg" style={{ backgroundColor: iconBg, color: iconColor }}>
                              {lead.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden flex flex-col w-full">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{lead.name}</h4>
                                <span className="text-[10px] md:text-xs text-slate-400 whitespace-nowrap shrink-0">
                                  Son: {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('tr-TR', {day:'numeric', month:'short'}) : '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge className="text-[10px] px-1.5 py-0 border-none bg-slate-100 text-slate-500 font-medium truncate">{lead.type}</Badge>
                                <Badge variant={
                                  lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'warning' :
                                  lead.temperature === 'cold' ? 'default' : 'success'
                                } className="text-[10px] px-1.5 py-0 border-none truncate md:hidden">
                                  {lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'Sıcak' :
                                   lead.temperature === 'cold' ? 'Soğuk' : 'Ilık'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Alt Satır (Mobil) / Sağ Kolon (Desktop): Aksiyonlar */}
                        <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                          <Badge variant={
                            lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'warning' :
                            lead.temperature === 'cold' ? 'default' : 'success'
                          } className="hidden md:inline-flex mr-2">
                            {lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'Sıcak' :
                             lead.temperature === 'cold' ? 'Soğuk' : 'Ilık'}
                          </Badge>
                          
                          {hasPhone ? (
                            <>
                              <button onClick={() => {
                                sessionStorage.setItem('trigger_call_form', 'true');
                                onSelectLead(lead);
                                window.location.href = `tel:${lead.phone}`;
                              }} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold">
                                <Phone size={14} /> <span className="md:hidden">Ara</span>
                              </button>
                              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold">
                                <MessageSquare size={14} /> <span className="md:hidden">WhatsApp</span>
                              </a>
                            </>
                          ) : null}
                          <button onClick={() => onSelectLead(lead)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 h-9 px-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
                            <span className="hidden md:inline font-bold tracking-widest leading-none">...</span>
                            <span className="md:hidden">Detay</span>
                          </button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'araclar' && (
            <div className="space-y-6">
              {!activeTool && (
                <>
                  <div className="mb-2">
                    <h2 className="text-xl font-black text-slate-800">Araçlar</h2>
                    <p className="text-slate-500 text-sm">İşinizi otomatize edecek performans araçları.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sahip Portalı Motoru Kartı */}
                    <button 
                      onClick={() => setActiveTool('owner_portal_traffic')} 
                      className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 text-left transition-all group flex flex-col h-full items-start"
                    >
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Globe size={24} />
                      </div>
                      <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Otomasyon</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Sahip Portalı Trafik Motoru</h3>
                      <p className="text-sm font-medium text-slate-500 mb-6 flex-1">Müşterilerinize şeffaf portföy raporu sunun.</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mt-auto">
                        Aç <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* Referral Motoru Kartı */}
                    <button 
                      onClick={() => setActiveTool('referral_engine')} 
                      className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-200 text-left transition-all group flex flex-col h-full items-start"
                    >
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                      </div>
                      <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Network</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Referral Motoru</h3>
                      <p className="text-sm font-medium text-slate-500 mb-6 flex-1">Referans kaynaklarını takip et ve yeni fırsat üret.</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 mt-auto">
                        Aç <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Araç Modal/Bottom Sheet */}
        <AnimatePresence>
          {activeTab === 'araclar' && activeTool && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl"
            >
              <motion.div 
                initial={{ y: '100%', opacity: 0, scale: 1 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: '100%', opacity: 0, scale: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-t-3xl sm:rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl pointer-events-auto flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 shrink-0">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden" />
                  <div className="flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activeTool === 'owner_portal_traffic' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {activeTool === 'owner_portal_traffic' ? <Globe size={24} /> : <Users size={24} />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {activeTool === 'owner_portal_traffic' ? 'Sahip Portalı Trafik Motoru' : 'Referral Motoru'}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                           {activeTool === 'owner_portal_traffic' ? 'Müşterilerinize şeffaf rapor sunun.' : 'Referans kaynaklarını takip et ve fırsat üret.'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTool(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pb-4 md:pr-2">
                  {activeTool === 'owner_portal_traffic' && (
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <p className="text-sm font-medium text-blue-800">Aktif portföylerinizi seçip sahipleri için rapor linkleri oluşturabilirsiniz.</p>
                      </div>
                      {properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {properties.map(prop => {
                            const traffic = getPropertyTraffic(prop.id);
                            return (
                              <Card key={prop.id} className="p-4 bg-white border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
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
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0"
                                    title="Portal Linki Oluştur"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                                {traffic.lastView && (
                                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                    Son: {new Date(traffic.lastView).toLocaleDateString('tr-TR')}
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="text-sm font-medium text-slate-500">Henüz hiç portföyünüz yok.</p>
                        </div>
                      )}
                      
                      {portalLink && (
                        <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Portal Linki Hazır</span>
                          </div>
                          <div className="text-[10px] font-medium text-slate-600 break-all bg-white p-2 rounded-lg border border-emerald-100/50">
                            {portalLink}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTool === 'referral_engine' && (
                    <div className="space-y-6">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Kişi Adı (örn: Ahmet Yılmaz)" 
                          value={newReferralName}
                          onChange={(e) => setNewReferralName(e.target.value)}
                          className="flex-1 p-3 text-sm rounded-xl border border-slate-200 outline-none bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                        />
                        <button 
                          onClick={() => newReferralName.trim() && addReferralMutation.mutate(newReferralName)}
                          disabled={addReferralMutation.isPending || !newReferralName.trim()}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                        >
                          Ekle
                        </button>
                      </div>

                      {referrals.length > 0 && (
                        <div className="space-y-2">
                          {referrals.map((ref: any) => (
                            <div key={ref.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-sm shadow-sm hover:border-emerald-100 transition-colors">
                              <span className="font-bold text-slate-700">{ref.referred_name || 'İsimsiz'}</span>
                              <select 
                                className="text-xs px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 outline-none hover:bg-emerald-50 hover:text-emerald-700 focus:border-emerald-300 font-bold transition-colors cursor-pointer"
                                value={ref.status}
                                onChange={(e) => updateReferralMutation.mutate({ id: ref.id, status: e.target.value })}
                                disabled={updateReferralMutation.isPending}
                              >
                                <option value="İstendi">İstendi</option>
                                <option value="Alındı">Alındı</option>
                                <option value="Görüşmeye döndü">Görüşmeye Döndü</option>
                                <option value="Kapanış">Kapanış</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SAĞ KOLON (Desktop) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Sadece Desktop Özeti */}
          <div className="hidden xl:block">
            {renderCRMSummary()}
          </div>

          {/* 9. Takip Uyarıları */}
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><BellOff size={16} className="text-orange-500" /> Takip Uyarıları</h3>
              <button className="text-xs text-blue-600 font-medium" onClick={() => {setActiveTab('rehber'); setCrmSegment('silent');}}>Tümünü Gör</button>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {silentLeadAlerts.slice(0, 3).map((alert, i) => {
                const l = leads.find(l => l.id === alert.lead_id);
                if (!l) return null;
                return (
                 <div key={i} className="p-4 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0 self-start" />
                   <div className="flex-1">
                     <p className="text-sm font-bold text-slate-800 line-clamp-1">{l.name}</p>
                     <p className="text-[11px] text-slate-500">{alert.alert_type === 'silent_lead' ? 'Uzun süredir temassız' : alert.alert_type === 'hot_lead_followup' ? 'Sıcak takip zamanı' : 'Temas bekleniyor'}</p>
                   </div>
                   <Badge className="shrink-0 text-[10px] px-1.5 leading-tight py-0.5" variant={l.status === 'Sıcak' || l.temperature === 'hot' ? 'warning' : l.temperature === 'cold' ? 'default' : 'success'}>
                     {l.status === 'Sıcak' || l.temperature === 'hot' ? 'Sıcak' : l.temperature === 'cold' ? 'Soğuk' : 'Ilık'}
                   </Badge>
                 </div>
                )
              })}
              {silentLeadAlerts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Şu an için takip uyarısı yok.
                </div>
              )}
            </div>
          </Card>

          {/* 10. AI CRM Özeti */}
          <Card className="border-purple-100 shadow-sm overflow-hidden">
            <div className="border-b border-purple-50 p-4 flex items-center justify-between bg-purple-50/30">
              <h3 className="font-bold text-purple-900 flex items-center gap-2 text-sm"><Sparkles size={16} className="text-purple-500"/> AI CRM Özeti</h3>
              <Badge className="bg-purple-100 text-purple-700 border-none text-[10px]">AI</Badge>
            </div>
            <div className="p-4 bg-white text-sm text-slate-600 prose prose-sm prose-purple max-h-64 overflow-auto">
              {leadAnalysis ? (
                <div className="whitespace-pre-wrap leading-relaxed">{leadAnalysis.replace(/\*\*/g, '')}</div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-500">AI CRM özeti için AI Analiz'i çalıştır.</p>
                  <button 
                    onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
                    disabled={isAnalyzingLeads || leads.length === 0}
                    className="mx-auto px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100"
                  >
                    AI Analiz
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* 11. Araçlar Kısayolları */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Araçlar Kısayolları</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setActiveTab('araclar')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Globe size={20} className="text-emerald-600"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Sahip<br/>Portalı</span>
              </button>
              <button onClick={() => setActiveTab('araclar')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Users size={20} className="text-orange-500"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Referral<br/>Motoru</span>
              </button>
              <button onClick={() => setShowAddLead(true)} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Plus size={20} className="text-blue-500"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Hızlı<br/>Kayıt</span>
              </button>
            </div>
          </Card>

        </div>
      </div>
    </motion.div>
  );
};
