import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Zap, Shield, Star, Award, ArrowRight } from 'lucide-react';
import { SubscriptionTier } from '../../types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (tier: SubscriptionTier) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSelectPlan }) => {
  const plans = [
    { 
      id: 'free', 
      name: 'Free', 
      price: '0₺', 
      features: ['Temel CRM', 'Günlük 5 Görev', '10 Portföy'],
      color: 'slate'
    },
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
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
                    onClick={() => onSelectPlan(plan.id as SubscriptionTier)}
                    className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      plan.popular 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Seç <ArrowRight size={16} />
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
