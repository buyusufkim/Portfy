import React from 'react';
import { motion } from 'motion/react';
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
  AlertTriangle
} from 'lucide-react';
import { Lead } from '../types';
import { Card, Badge, Skeleton } from './UI';

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
  onSelectLead
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
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

  const silentLeads = React.useMemo(() => {
    if (!leads || !Array.isArray(leads)) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return leads.filter(lead => {
      if (!lead) return false;
      if (lead.status === 'Kapalı' || lead.status === 'Pasif') return false;
      const dateStr = lead.last_contacted_at || lead.last_contact || lead.created_at;
      if (!dateStr) return true; // Eğer hiçbir tarih yoksa sessiz kabul edelim
      const contactDate = new Date(dateStr);
      if (isNaN(contactDate.getTime())) return false; // Parse edilemiyorsa false dönelim
      return contactDate.getTime() < sevenDaysAgo.getTime();
    });
  }, [leads]);

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
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteri Rehberi</h1>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowWhatsAppImport(true)} 
          className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-2 text-xs font-bold"
        >
          <MessageSquare size={18} />
          WhatsApp'tan Aktar
        </button>
        <button onClick={() => setShowAddLead(true)} className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
          <Plus size={20} />
        </button>
      </div>
    </div>

    {silentLeads.length > 0 && (
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
              <strong>{silentLeads.length}</strong> aktif müşterinizle son 7 gündür hiçbir iletişim kurulmadı. 
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
            className="flex items-center justify-between p-4 cursor-pointer hover:border-orange-200 transition-colors group"
            onClick={() => onSelectLead(lead)}
          >
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
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <a 
                href={`tel:${lead.phone}`}
                aria-label={`${lead.name} ara`}
                title={`${lead.name} ara`}
                className="p-2 bg-slate-50 rounded-xl text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Phone size={18} />
              </a>
              <a 
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`${lead.name} ile WhatsApp üzerinden yazış`}
                title={`${lead.name} ile WhatsApp üzerinden yazış`}
                className="p-2 bg-slate-50 rounded-xl text-emerald-500 hover:bg-emerald-50 transition-colors"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </Card>
        );
      })}
    </div>
    </motion.div>
  );
};