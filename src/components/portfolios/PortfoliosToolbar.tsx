import React, { useMemo } from 'react';
import { Globe, LayoutDashboard, BarChart3, Search, Filter, Zap, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useAuth } from '../../AuthContext';
import { RegionEfficiencyScore } from '../../types';

interface PortfoliosToolbarProps {
  viewMode: 'list' | 'pipeline';
  setViewMode: (mode: 'list' | 'pipeline') => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
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
    const activeProperties = properties.filter(p => !['Satıldı', 'Pasif'].includes(p.status));
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

  const hasActiveFilters = searchQuery !== '' || selectedDistrict !== 'all';

  return (
    <div className="p-6 pb-2 space-y-4 bg-white border-b border-slate-100">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portföylerim</h1>
        <div className="flex gap-2">
          
          {/* YENİ: Akıllı Eşleşmeler Butonu */}
          <button 
            onClick={onOpenSmartMatch}
            className="relative p-2 px-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <Zap size={18} />
            <span className="hidden sm:inline">Eşleşmeler</span>
            {matchCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md border-2 border-white animate-pulse">
                {matchCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setShowImportUrlModal(true)}
            className="p-2 px-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <Globe size={18} /> <span className="hidden sm:inline">İçe Aktar</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-1"></div>

          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <LayoutDashboard size={20} />
          </button>
          <button 
            onClick={() => setViewMode('pipeline')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'pipeline' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <BarChart3 size={20} />
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Portföy ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors">
            <Filter size={20} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
          <button 
            onClick={() => setSelectedDistrict('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${selectedDistrict === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Tümü
          </button>
          {regionScores.map((region) => (
            <button 
              key={region.district}
              onClick={() => setSelectedDistrict(region.district)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap flex items-center gap-2 transition-all ${selectedDistrict === region.district ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {region.district}
              <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${selectedDistrict === region.district ? 'bg-white/20 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                %{region.score}
              </span>
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 mr-1">Aktif Filtreler:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-orange-900 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedDistrict !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                {selectedDistrict}
                <button onClick={() => setSelectedDistrict('all')} className="hover:text-orange-900 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
            <button 
              onClick={() => { setSearchQuery(''); setSelectedDistrict('all'); }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline underline-offset-2 ml-2 transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};