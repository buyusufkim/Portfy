import React, { useMemo } from 'react';
import { Globe, LayoutDashboard, LayoutGrid, BarChart3, Search, Filter, Zap, X, ChevronDown, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useAuth } from '../../AuthContext';
import { RegionEfficiencyScore } from '../../types';

interface PortfoliosToolbarProps {
  viewMode: 'list' | 'grid' | 'pipeline';
  setViewMode: (mode: 'list' | 'grid' | 'pipeline') => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  categoryFilter?: 'all' | 'Satılık' | 'Kiralık';
  setCategoryFilter?: (filter: 'all' | 'Satılık' | 'Kiralık') => void;
  lifecycleFilter?: 'all' | 'active' | 'completed' | 'archived';
  setLifecycleFilter?: (filter: 'all' | 'active' | 'completed' | 'archived') => void;
  regionScores: RegionEfficiencyScore[];
  setShowImportUrlModal: (show: boolean) => void;
  onOpenSmartMatch: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const PortfoliosToolbar: React.FC<PortfoliosToolbarProps> = ({
  viewMode,
  setViewMode,
  selectedDistrict,
  setSelectedDistrict,
  selectedStatus = 'all',
  setSelectedStatus,
  categoryFilter = 'all',
  setCategoryFilter,
  lifecycleFilter = 'active',
  setLifecycleFilter,
  regionScores,
  setShowImportUrlModal,
  onOpenSmartMatch,
  searchQuery,
  setSearchQuery
}) => {
  const { profile } = useAuth();
  
  // Arka planda eşleşme sayısını hesaplamak için verileri çekiyoruz
  const { data: leads = [] } = useQuery({ queryKey: [QUERY_KEYS.LEADS, profile?.id], queryFn: api.getLeads, enabled: !!profile?.id });
  const { data: properties = [] } = useQuery({ queryKey: [QUERY_KEYS.PROPERTIES, profile?.id], queryFn: api.getProperties, enabled: !!profile?.id });

  // Eşleşen portföy sayısını hesapla
  const matchCount = useMemo(() => {
    const activeProperties = properties.filter(p => !['Satıldı', 'Kiralandı', 'Pasif'].includes(p.status));
    const activeLeads = leads.filter(l => !['Pasif'].includes(l.status) && ['Alıcı', 'Yatırımcı', 'Aday'].includes(l.type));

    const matches = activeProperties.filter(property => {
      return activeLeads.some(lead => {
        const isDistrictMatch = lead.district && property.address?.district && lead.district.toLowerCase() === property.address.district.toLowerCase();
        const isTypeMatch = lead.notes && lead.notes.toLowerCase().includes(property.type.toLowerCase());
        return isDistrictMatch || isTypeMatch;
      });
    });
    return matches.length;
  }, [properties, leads]);

  const hasActiveFilters = searchQuery !== '' || selectedDistrict !== 'all' || ((viewMode === 'list' || viewMode === 'grid') && selectedStatus !== 'all') || categoryFilter !== 'all' || lifecycleFilter !== 'active';
  const statuses = ['Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı', 'Kiralandı', 'Pasif'];

  const handleStatusChange = (status: string) => {
    setSelectedStatus?.(status);

    if (status === 'all') return;
    if (['Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık'].includes(status)) {
      setLifecycleFilter?.('active');
    } else if (['Satıldı', 'Kiralandı'].includes(status)) {
      setLifecycleFilter?.('completed');
    } else if (status === 'Pasif') {
      setLifecycleFilter?.('archived');
    }
  };

  return (
    <div className="p-3 md:p-4 bg-white border-b border-slate-100 flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Portföylerim</h1>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Kompakt Liste"
            >
              <LayoutDashboard size={14} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Görsel Grid"
            >
              <LayoutGrid size={14} />
            </button>
            <button 
              onClick={() => setViewMode('pipeline')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Kanban (Pipeline)"
            >
              <BarChart3 size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Akıllı Eşleşmeler Butonu */}
          <button 
            onClick={onOpenSmartMatch}
            className="relative px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Zap size={14} />
            <span>Eşleşmeler</span>
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm border border-white animate-pulse">
                {matchCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setShowImportUrlModal(true)}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Globe size={14} /> <span>İçe Aktar</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
        {/* İşlem Tipi ve Yaşam Durumu Filtreleri */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
            {(['all', 'Satılık', 'Kiralık'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter?.(cat)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  categoryFilter === cat 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat === 'all' ? 'Tümü' : cat}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'active', label: 'Aktif' },
              { id: 'completed', label: 'Tamamlanan' },
              { id: 'archived', label: 'Pasif/Arşiv' },
              { id: 'all', label: 'Tümü' }
            ].map(life => (
              <button
                key={life.id}
                onClick={() => {
                  setLifecycleFilter?.(life.id as 'all' | 'active' | 'completed' | 'archived');
                  setSelectedStatus?.('all');
                }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                  lifecycleFilter === life.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {life.label}
              </button>
            ))}
          </div>
        </div>

        {/* Arama ve Durum Seçici */}
        <div className="flex w-full md:w-auto flex-1 md:flex-none gap-2">
          <div className="relative flex-1 md:w-48 xl:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Portföy ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          
          {(viewMode === 'list' || viewMode === 'grid') && (
            <div className="relative w-32 md:w-40 shrink-0">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Activity size={12} />
              </div>
              <select 
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-8 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="all">Tüm Durumlar</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bölge Pilleri */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button 
          onClick={() => setSelectedDistrict('all')}
          className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center shrink-0 border ${selectedDistrict === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
        >
          Tümü
        </button>
        {regionScores.map((region) => (
          <button 
            key={region.district}
            onClick={() => setSelectedDistrict(region.district)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 border ${selectedDistrict === region.district ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {region.district}
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${selectedDistrict === region.district ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
              %{region.score}
            </span>
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mr-1">Aktif</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
              {searchQuery}
              <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedDistrict !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700">
              {selectedDistrict}
              <button onClick={() => setSelectedDistrict('all')} className="hover:text-sky-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              {categoryFilter}
              <button onClick={() => setCategoryFilter?.('all')} className="hover:text-emerald-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          {lifecycleFilter !== 'active' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-50 text-violet-700">
              {lifecycleFilter === 'completed' ? 'Tamamlanan' : lifecycleFilter === 'archived' ? 'Pasif/Arşiv' : 'Tümü'}
              <button onClick={() => { setLifecycleFilter?.('active'); setSelectedStatus?.('all'); }} className="hover:text-violet-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          {(viewMode === 'list' || viewMode === 'grid') && selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
              {selectedStatus}
              <button onClick={() => setSelectedStatus?.('all')} className="hover:text-amber-900 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          <button 
            onClick={() => { 
              setSearchQuery(''); 
              setSelectedDistrict('all'); 
              setSelectedStatus?.('all'); 
              setCategoryFilter?.('all');
              setLifecycleFilter?.('active');
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline underline-offset-2 ml-1 transition-colors"
          >
            Temizle
          </button>
        </div>
      )}
    </div>
  );
};