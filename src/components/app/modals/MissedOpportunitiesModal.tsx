import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '../../UI';

import { MissedOpportunity } from '../../../types';

interface MissedOpportunitiesModalProps {
  showMissedOpportunities: boolean;
  setShowMissedOpportunities: (val: boolean) => void;
  missedOpportunities: MissedOpportunity[];
  setActiveTab: (tab: string) => void;
}

export const MissedOpportunitiesModal: React.FC<MissedOpportunitiesModalProps> = ({ 
  showMissedOpportunities, 
  setShowMissedOpportunities, 
  missedOpportunities, 
  setActiveTab 
}) => {
  if (!showMissedOpportunities) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[180] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[80vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                <AlertCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Kaçırılan Fırsatlar</h2>
                <p className="text-xs text-slate-500">Gözden kaçan {missedOpportunities.length} kritik aksiyon</p>
              </div>
            </div>
            <button onClick={() => setShowMissedOpportunities(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {missedOpportunities.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <ShieldCheck size={40} />
                </div>
                <p className="text-slate-500 text-sm font-medium">Harika! Şu an kaçan bir fırsat görünmüyor.</p>
              </div>
            ) : missedOpportunities.map((opp: MissedOpportunity) => (
              <div key={opp.id} className={`p-5 rounded-3xl border-2 transition-all space-y-3 ${
                opp.priority === 'high' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">{opp.title}</h4>
                      {opp.priority === 'high' && <Badge variant="error">Kritik</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{opp.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {opp.days_delayed > 0 ? `${opp.days_delayed} Gün Gecikme` : 'Hemen Aksiyon'}
                    </span>
                    {opp.potential_value && (
                      <span className="text-[10px] font-bold text-emerald-600">+{opp.potential_value} Puan</span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setShowMissedOpportunities(false);
                      if (opp.type === 'lead_followup') setActiveTab('crm');
                      if (opp.type === 'property_stale' || opp.type === 'price_drop_potential') setActiveTab('portfoyler');
                      if (opp.type === 'visit_stale') setActiveTab('bolgem');
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm active:scale-95 transition-all"
                  >
                    Hemen Düzelt
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowMissedOpportunities(false)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200"
          >
            Anladım, Aksiyona Geçiyorum
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
