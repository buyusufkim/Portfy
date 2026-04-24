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
  Filter,
  Flame,
  ArrowUpDown,
  AlertTriangle,
  Globe,
  Zap,
  Copy
} from 'lucide-react';
import { Lead, LeadAlert, UserProfile, Property, Referral } from '../types';
import { Card, Badge, Skeleton } from './UI';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface LeadCategory {
  label: string;
  color: string;
}

interface AnalyzeLeadsMutation {
  mutate: (leads: Lead[]) => void;
}

interface CRMViewProps {
  leads: Lead[];
  leadsLoading: boolean;
  setShowWhatsAppImport: (show: boolean) => void;
  setShowAddLead: (show: boolean) => void;
  isAnalyzingLeads: boolean;
  setIsAnalyzingLeads: (analyzing: boolean) => void;
  analyzeLeadsMutation: AnalyzeLeadsMutation;
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
  categories,
  onSelectLead,
  leadAlerts = [],
  profile,
  properties = []
}) => {
  const [activeTab, setActiveTab] = useState<'rehber' | 'araclar'>('rehber');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  
  // Araçlar - Sahip Portalı
  const [portalLink, setPortalLink] = useState<string | null>(null);

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
      return matchesSearch && matchesStatus && matchesType;
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
  }, [leads, debouncedSearchTerm, statusFilter, typeFilter, sortBy]);

  const hotLeadCount = leads.filter((lead) => lead.status === 'Sıcak').length;
  const buyerCount = leads.filter((lead) => lead.type === 'Alıcı').length;
  const sellerCount = leads.filter((lead) => lead.type === 'Satıcı').length;
  const hasActiveFilters = searchTerm.length > 0 || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'recent';

  const silentLeadAlerts = React.useMemo(() => {
    return leadAlerts.filter(a => 
      ['stale_3d', 'stale_7d', 'stale_14d', 'hot_48h_silence', 'inactive_lead'].includes(a.alert_type) ||
      a.alert_type === 'Sessiz Müşteri'
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeTab === 'rehber' ? 'Müşteri Rehberi' : 'CRM Araçları'}</h1>
      {activeTab === 'rehber' && (
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWhatsAppImport(true)} 
            className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-2 text-xs font-bold"
          >
            <MessageSquare size={18} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button id="btn-add-lead" onClick={() => setShowAddLead(true)} className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
            <Plus size={20} />
          </button>
        </div>
      )}
    </div>

    {/* YENİ: TAB MENÜSÜ */}
    <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-sm mx-auto mb-6">
      <button 
        onClick={() => setActiveTab('rehber')} 
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'rehber' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
      >
        Rehber
      </button>
      <button 
        onClick={() => setActiveTab('araclar')} 
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'araclar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
      >
        Araçlar
      </button>
    </div>

    {activeTab === 'rehber' && (
      <div className="space-y-6">
        {silentLeadAlerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="bg-red-100 text-red-600 p-2 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
            <h3 className="text-red-800 font-bold text-sm">Sessizleşen Müşteriler (Müşteri Unutma Koruması)</h3>
            <p className="text-red-600 text-xs mt-1 leading-relaxed">
              <strong>{silentLeadAlerts.length}</strong> aktif müşterinizle son dönemde yeterli iletişim kurulmadı. Hemen aksiyon alın!
            </p>
          </div>
        </div>
      </motion.div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="p-4 border-orange-100 bg-orange-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Toplam Rehber</p>
            <p className="text-lg font-black text-slate-900">{leads.length}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 border-red-100 bg-red-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Flame size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sıcak Müşteri</p>
            <p className="text-lg font-black text-slate-900">{hotLeadCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4 border-emerald-100 bg-emerald-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Filter size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Alıcı / Satıcı</p>
            <p className="text-lg font-black text-slate-900">{buyerCount} / {sellerCount}</p>
          </div>
        </div>
      </Card>
    </div>

    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Müşteri ara..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm shadow-sm"
        />
      </div>
      <button 
        onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
        disabled={isAnalyzingLeads || leads.length === 0}
        className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center gap-2 text-xs font-bold disabled:opacity-50"
      >
        {isAnalyzingLeads ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={16} /></motion.div>
        ) : <Sparkles size={16} />}
        Rehber Analizi
      </button>
    </div>

    <div className="space-y-3">
      <button
        onClick={() => setShowAdvancedFilters(prev => !prev)}
        className="w-full md:w-auto bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm shadow-sm text-slate-700 flex items-center justify-center gap-2"
      >
        <Filter size={16} />
        {showAdvancedFilters ? 'Gelişmiş Filtreleri Gizle' : 'Gelişmiş Filtreleri Aç'}
      </button>

      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm shadow-sm text-slate-700"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Aday">Aday</option>
            <option value="Sıcak">Sıcak</option>
            <option value="Yetki Alındı">Yetki Alındı</option>
            <option value="Pasif">Pasif</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as Lead['type'] | 'all')}
            className="bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm shadow-sm text-slate-700"
          >
            <option value="all">Tüm Tipler</option>
            {leadTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortBy(sortBy === 'recent' ? 'name' : 'recent')}
            className="bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm shadow-sm text-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowUpDown size={16} />
            {sortBy === 'recent' ? 'Son Temasa Göre' : 'İsme Göre'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="bg-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700"
            >
              Filtreleri Sıfırla
            </button>
          )}
        </div>
      )}

      {filterPills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterPills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100"
            >
              {pill.label}
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leadsLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          </Card>
        ))
      ) : leads.length === 0 ? (
        <div className="text-center p-20 space-y-4 col-span-full">
          <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
            <Users size={40} />
          </div>
          <p className="text-slate-500 text-sm">Henüz müşteri kaydetmedin.</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center p-20 space-y-4 col-span-full bg-white rounded-3xl border border-slate-100">
          <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
            <Search size={36} />
          </div>
          <p className="text-slate-700 text-sm font-semibold">Filtreye uygun müşteri bulunamadı.</p>
          <p className="text-slate-400 text-xs">Arama veya filtre ayarlarını değiştirip tekrar deneyebilirsin.</p>
          <button
            onClick={clearFilters}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : filteredLeads.map(lead => {
        const category = categories.find(c => c.label === lead.type);
        const iconColor = category ? category.color : (lead.type === 'Alıcı' ? '#ea580c' : '#9333ea');
        const iconBg = category ? `${category.color}20` : (lead.type === 'Alıcı' ? '#fff7ed' : '#faf5ff');
        
        return (
          <Card 
            key={lead.id} 
            className="flex flex-col p-4 cursor-pointer hover:border-orange-200 transition-colors group gap-3"
            onClick={() => onSelectLead(lead)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: iconBg, color: iconColor }}
                >
                  <UserIcon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={lead.status === 'Sıcak' ? 'warning' : 'default'}>{lead.status}</Badge>
                    <span className="text-[10px] text-slate-400">{lead.type}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
              <a 
                href={`tel:${lead.phone}`}
                onClick={() => {
                  sessionStorage.setItem('trigger_call_form', 'true');
                  onSelectLead(lead);
                }}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-orange-600 rounded-xl text-white font-bold hover:bg-orange-700 transition-colors shadow-sm"
              >
                <Phone size={18} />
                Ara
              </a>
              <a 
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </Card>
        );
      })}
    </div>
    </div>
    )}

    {activeTab === 'araclar' && (
      <div className="space-y-6">
        <section className="space-y-4">
          <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay border-[1px] border-dashed border-white" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-4 text-white">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                  <Globe size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Sahip Portalı Trafik Motoru
                    <div className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded tracking-widest border border-white/20 uppercase">OTOMASYON</div>
                  </h3>
                  <p className="text-xs text-blue-100 mt-1 font-medium max-w-sm leading-relaxed">
                    Müşterilerinize şeffaf rapor sunun. Rapor linkini her açtıklarında onlara diğer portföylerini satmayı teklif edeceğiz.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {properties.map(prop => {
                const traffic = getPropertyTraffic(prop.id);
                return (
                  <Card key={prop.id} className="p-4 bg-white border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
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
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                        title="Portal Linki Oluştur"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {traffic.lastView && (
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Son İzlenme: {new Date(traffic.lastView).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="text-sm font-medium text-slate-500">Bu aracı kullanmak için henüz hiç portföyünüz yok.</p>
            </div>
          )}

          {portalLink && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Portal Linki Hazır</span>
                <button onClick={() => { navigator.clipboard.writeText(portalLink); toast.success("Kopyalandı!"); }} className="p-2 bg-white text-emerald-600 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-2 text-[10px] font-bold shadow-sm">
                  <Copy size={12} /> Kopyala
                </button>
              </div>
              <div className="text-[10px] font-medium text-slate-600 break-all bg-white/50 p-2 rounded-lg border border-emerald-100/50">
                {portalLink}
              </div>
            </div>
          )}
        </section>

        {/* REFERRAL ENGINE CARD */}
        <section className="space-y-4">
          <Card className="flex flex-col gap-4 border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">Referral Motoru <div className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">GÜNLÜK HEDEF</div></h4>
                <p className="text-xs text-slate-500">Ağından yeni fırsatlar (Bu Ay)</p>
              </div>
              <button 
                onClick={() => setShowReferralInput(!showReferralInput)}
                className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition flex items-center gap-1.5 px-3"
              >
                <Plus size={16} /> <span className="text-xs font-bold">Yeni Talep Ekle</span>
              </button>
            </div>
            
            {showReferralInput && (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Talep Edilen Kişi Adı" 
                  value={newReferralName}
                  onChange={(e) => setNewReferralName(e.target.value)}
                  className="flex-1 p-2.5 text-sm rounded-xl border border-emerald-200 outline-none focus:border-emerald-500 bg-white"
                />
                <button 
                  onClick={() => newReferralName.trim() && addReferralMutation.mutate(newReferralName)}
                  disabled={addReferralMutation.isPending}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20"
                >
                  Ekle
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'İstendi', statuses: ['İstendi', 'asked', 'Bekliyor'] },
                { label: 'Alındı', statuses: ['Alındı', 'received', 'Görüşüldü', 'Aday'] },
                { label: 'Görüşmeye Döndü', statuses: ['Görüşmeye döndü', 'converted', 'Kazanıldı', 'İşleme Döndü', 'Görüşülüyor'] },
                { label: 'Kapanış', statuses: ['Kapanış'] }
              ].map(stage => {
                const currentMonthCount = referrals.filter((r: Referral) => stage.statuses.includes(r.status) && new Date((r as any).created_at || Date.now()).getMonth() === new Date().getMonth()).length;
                const allTimeCount = referrals.filter((r: Referral) => stage.statuses.includes(r.status)).length;
                
                return (
                  <div key={stage.label} className="bg-white/80 p-2 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-500 mb-1 leading-tight">{stage.label}</span>
                    <span className="text-xl font-black text-emerald-600">{currentMonthCount}</span>
                    <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Toplam: {allTimeCount}</span>
                  </div>
                );
              })}
            </div>

            {referrals.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {referrals.map((ref: Referral) => (
                  <div key={ref.id} className="bg-white p-3 rounded-xl border border-emerald-50 flex justify-between items-center text-sm shadow-sm hover:border-emerald-200 transition-colors">
                    <span className="font-medium text-slate-700">{ref.referred_name || (ref as any).referred_email || 'İsimsiz'}</span>
                    <select 
                      className="text-xs p-1.5 rounded-lg bg-emerald-50 border-none outline-none text-emerald-700 font-bold"
                      value={
                        (['Kapanış'].includes(ref.status)) ? 'Kapanış' :
                        (['Görüşmeye döndü', 'converted', 'Kazanıldı', 'İşleme Döndü', 'Görüşülüyor'].includes(ref.status)) ? 'Görüşmeye döndü' : 
                        (['Alındı', 'received', 'Görüşüldü', 'Aday'].includes(ref.status)) ? 'Alındı' : 
                        'İstendi'
                      }
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
          </Card>
        </section>
      </div>
    )}
    </motion.div>
  );
};