import React from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { FeatureKey } from '../../types/subscription';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

interface LockedOverlayProps {
  featureKey: FeatureKey;
  onUpgrade?: () => void;
}

export const LockedOverlay: React.FC<LockedOverlayProps> = ({ featureKey, onUpgrade }) => {
  const { getFeatureConfig } = useFeatureAccess();
  const config = getFeatureConfig(featureKey);

  if (!config) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-slate-50/80 backdrop-blur-md rounded-[inherit] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 mb-5 relative group">
        <div className="absolute inset-0 bg-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity blur-md" />
        <Lock size={26} className="relative z-10" />
      </div>
      
      <div className="space-y-2 mb-6 max-w-[280px]">
        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
          {config.label} Master ile Açılır
        </h4>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          Portfy'nin yapay zeka, CRM ve strateji araçlarını tam kapasite kullanmak için Master plana geç.
        </p>
      </div>

      <button 
        onClick={onUpgrade}
        className="px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
      >
        Planları Gör <ArrowRight size={16} />
      </button>

      <div className="mt-8 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Sparkles size={12} className="text-indigo-400" /> Premium Özellik
      </div>
    </motion.div>
  );
};
