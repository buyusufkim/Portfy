import React from 'react';
import { Building2 } from 'lucide-react';
import { MapPin as MapPinType } from '../types';

interface CompetitorListProps {
  filteredPins: MapPinType[];
  allPinTypes: any[];
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
            <div key={pin.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-all">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: typeObj?.color || '#eab308' }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 truncate">{pin.title}</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0 ml-2">{typeObj?.label}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2 truncate">{pin.address}</p>
                {pin.notes && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg line-clamp-2 italic">
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
