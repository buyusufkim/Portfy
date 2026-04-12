import React from 'react';
import { Globe, LayoutDashboard, BarChart3, Search, Filter } from 'lucide-react';

interface PortfoliosToolbarProps {
  viewMode: 'list' | 'pipeline';
  setViewMode: (mode: 'list' | 'pipeline') => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  regionScores: any[];
  setShowImportUrlModal: (show: boolean) => void;
}

export const PortfoliosToolbar: React.FC<PortfoliosToolbarProps> = ({
  viewMode,
  setViewMode,
  selectedDistrict,
  setSelectedDistrict,
  regionScores,
  setShowImportUrlModal
}) => {
  return (
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
  );
};
