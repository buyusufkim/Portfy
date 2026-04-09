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
      className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[4px] rounded-[inherit] flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 mb-6">
        <Lock size={32} />
      </div>
      
      <div className="space-y-2 mb-8 max-w-[240px]">
        <h4 className="text-xl font-bold text-slate-900 tracking-tight">
          {config.label} Kilitli
        </h4>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          Bu özelliği kullanmak için en az <span className="text-orange-600 font-bold uppercase">{config.minTier}</span> planına geçmelisiniz.
        </p>
      </div>

      <button 
        onClick={onUpgrade}
        className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95"
      >
        Planı Yükselt <ArrowRight size={16} />
      </button>

      <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Sparkles size={12} className="text-orange-500" /> Premium Özellik
      </div>
    </motion.div>
  );
};
