import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Zap, Shield, Star, Award, ArrowRight } from 'lucide-react';
import { SubscriptionTier } from '../../types/subscription';

import { useAuth } from '../../AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (tier: SubscriptionTier) => void;
  onActivateTrial?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSelectPlan, onActivateTrial }) => {
  const { profile } = useAuth();
  const isEligibleForTrial = profile?.subscription_type === 'none';

  const [showManualMessage, setShowManualMessage] = React.useState(false);

  const handlePaidPlanClick = () => {
    setShowManualMessage(true);
    setTimeout(() => setShowManualMessage(false), 5000);
  };

  const plans = [
    { 
      id: 'pro', 
      name: 'Pro', 
      price: '299₺', 
      features: ['AI Koç', 'WhatsApp Analizi', 'Gelişmiş İstatistikler', 'Sınırsız Görev'],
      color: 'orange',
      popular: true
    },
    { 
      id: 'elite', 
      name: 'Elite', 
      price: '599₺', 
      features: ['Sınırsız Lead', 'Sınırsız Portföy', 'Ekip Çalışması', 'Öncelikli Destek'],
      color: 'indigo'
    },
    { 
      id: 'master', 
      name: 'Master', 
      price: '999₺', 
      features: ['Özel Markalama', 'API Erişimi', 'Vip Danışmanlık', 'Reklam Desteği'],
      color: 'slate-900'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[110] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Planını Yükselt</h2>
                <p className="text-slate-500 text-sm font-medium">Sana en uygun paketi seç ve işini büyüt.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {showManualMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm font-medium text-center"
              >
                Ücretli planlar şu an sadece manuel aktivasyon ile sunulmaktadır. Lütfen destek ekibimizle iletişime geçin.
              </motion.div>
            )}

            {isEligibleForTrial && (
              <div className="mb-8 p-6 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-slate-200 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Zap size={24} className="text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">7 Günlük Ücretsiz Deneme</h3>
                    <p className="text-slate-400 text-xs font-medium">Tüm Pro özellikleri hemen test edin.</p>
                  </div>
                </div>
                <button 
                  onClick={() => onActivateTrial ? onActivateTrial() : onSelectPlan('pro' as SubscriptionTier)}
                  className="w-full md:w-auto px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  Şimdi Başlat <ArrowRight size={18} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-12">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`p-6 rounded-[32px] border-2 flex flex-col justify-between gap-6 transition-all relative ${
                    plan.popular ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 bg-white'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-orange-200">
                      En Popüler
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                        <div className="text-2xl font-black text-slate-900">{plan.price}<span className="text-xs text-slate-400 font-bold">/ay</span></div>
                      </div>
                    </div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Check size={12} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={handlePaidPlanClick}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      plan.popular 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Aktivasyon Talebi <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
