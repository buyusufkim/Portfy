import React from 'react';
import { Sparkles } from 'lucide-react';
import { SubscriptionTier } from '../../types/subscription';

interface PremiumBadgeProps {
  tier?: SubscriptionTier;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ tier = 'master', className = '' }) => {
  const colors: Partial<Record<SubscriptionTier, string>> = {
    free: 'bg-slate-100 text-slate-500 border-slate-200',
    trial: 'bg-amber-100 text-amber-700 border-amber-200',
    master: 'bg-slate-900 text-white border-slate-800',
    admin: 'bg-red-100 text-red-600 border-red-200'
  };

  const labels: Partial<Record<SubscriptionTier, string>> = {
    free: 'Girişimci',
    trial: 'Master Deneme',
    master: 'Master',
    admin: 'Admin'
  };

  const currentColors = colors[tier] || colors.free;
  const currentLabel = labels[tier] || labels.free;

  return (
    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${currentColors} ${className}`}>
      {tier !== 'free' && <Sparkles size={10} className={tier === 'master' ? 'text-orange-400' : ''} />}
      {currentLabel}
    </div>
  );
};
