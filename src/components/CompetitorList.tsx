import React from 'react';
import { Building2 } from 'lucide-react';
import { MapPin as MapPinType } from '../types';

interface CompetitorListProps {
  filteredPins: MapPinType[];
  allPinTypes: { id: string; label?: string; name?: string; icon: React.ElementType | string; color: string; kind?: string }[];
}

export const CompetitorList: React.FC<CompetitorListProps> = ({ filteredPins, allPinTypes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPins.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm col-span-full">Sonuç bulunamadı.</div>
      ) : (
        filteredPins.map((pin: MapPinType) => {
          const typeObj = allPinTypes.find(t => t.id === pin.type);
          const Icon = typeObj?.icon || Building2;
          return (
            <div key={pin.id} className="bg-white p-3.5 rounded-[16px] shadow-sm border border-slate-100 flex gap-3 hover:shadow-md transition-all">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: typeObj?.color || '#eab308' }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{pin.title}</h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-2">{typeObj?.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1.5 truncate">{pin.address}</p>
                {pin.notes && (
                  <p className="text-[10px] text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg line-clamp-1 italic">
                    "{pin.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
