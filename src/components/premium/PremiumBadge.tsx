import React from 'react';
import { Sparkles } from 'lucide-react';
import { SubscriptionTier } from '../../types/subscription';

interface PremiumBadgeProps {
  tier?: SubscriptionTier;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ tier = 'pro', className = '' }) => {
  const colors = {
    free: 'bg-slate-100 text-slate-500 border-slate-200',
    pro: 'bg-orange-100 text-orange-600 border-orange-200',
    elite: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    master: 'bg-slate-900 text-white border-slate-800'
  };

  return (
    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${colors[tier]} ${className}`}>
      {tier !== 'free' && <Sparkles size={10} className={tier === 'master' ? 'text-orange-400' : ''} />}
      {tier}
    </div>
  );
};
