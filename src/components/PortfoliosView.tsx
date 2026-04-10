import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  LayoutDashboard, 
  BarChart3, 
  Search, 
  Filter, 
  Home 
} from 'lucide-react';
import { Property } from '../types';
import { PropertyCard, PipelineColumn } from './PropertyComponents';

interface PortfoliosViewProps {
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

export const PortfoliosView: React.FC<PortfoliosViewProps> = ({
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
  const statuses = ['Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı'];
  
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
      {/* Sub Header */}
      <div className="p-6 pb-2 space-y-4 bg-white border-b border-slate-100">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portföylerim</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowImportUrlModal(true)}
              className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 text-xs font-bold"
            >
              <Globe size={18} /> URL İçe Aktar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              <LayoutDashboard size={20} />
            </button>
            <button 
              onClick={() => setViewMode('pipeline')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'pipeline' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              <BarChart3 size={20} />
            </button>
          </div>
        </div>
        
        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Portföy ara..." 
                className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button className="p-3 bg-slate-100 rounded-2xl text-slate-600">
              <Filter size={20} />
            </button>
          </div>

          {/* District Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            <button 
              onClick={() => setSelectedDistrict('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${selectedDistrict === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}
            >
              Tümü
            </button>
            {regionScores.map((region: any) => (
              <button 
                key={region.district}
                onClick={() => setSelectedDistrict(region.district)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap flex items-center gap-2 transition-all ${selectedDistrict === region.district ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                {region.district}
                <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${selectedDistrict === region.district ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                  %{region.score}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {viewMode === 'list' ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {propertiesLoading ? (
              <div className="text-center p-12 text-slate-400 col-span-full">Yükleniyor...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center p-20 space-y-4 col-span-full">
                <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
                  <Home size={40} />
                </div>
                <p className="text-slate-500 text-sm">Bu bölgede henüz portföy yok.</p>
              </div>
            ) : filteredProperties.map(p => (
              <PropertyCard key={p.id} property={p} onClick={() => setSelectedProperty(p)} />
            ))}
          </div>
        ) : (
          <div className="p-6 flex gap-6 overflow-x-auto h-full items-start">
            {statuses.map(status => (
              <PipelineColumn 
                key={status} 
                title={status} 
                status={status}
                properties={filteredProperties.filter(p => p.status === status)} 
                onPropertyClick={(p) => setSelectedProperty(p)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
