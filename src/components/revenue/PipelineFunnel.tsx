import React from 'react';
import { motion } from 'motion/react';
import { Property } from '../../types';

interface PipelineFunnelProps {
  properties: Property[];
}

const STAGES = [
  { key: 'Yeni', label: 'Yeni', color: 'bg-slate-200' },
  { key: 'Hazırlanıyor', label: 'Hazırlık', color: 'bg-blue-200' },
  { key: 'Yayında', label: 'Yayında', color: 'bg-emerald-200' },
  { key: 'İlgi Var', label: 'İlgi', color: 'bg-amber-200' },
  { key: 'Pazarlık', label: 'Pazarlık', color: 'bg-orange-200' },
  { key: 'Satıldı', label: 'Satıldı', color: 'bg-emerald-500' },
];

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ properties }) => {
  const counts = STAGES.reduce((acc, stage) => {
    acc[stage.key] = properties.filter(p => p.status === stage.key).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Satış Hunisi</h3>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Portföyler</div>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage) => {
          const count = counts[stage.key] || 0;
          const percentage = (count / maxCount) * 100;

          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>{stage.label}</span>
                <span className="text-slate-900">{count}</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className={`h-full ${stage.color} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
