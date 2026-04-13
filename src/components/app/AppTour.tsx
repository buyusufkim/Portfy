import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface AppTourProps {
  onComplete: () => void;
}

export const AppTour = ({ onComplete }: AppTourProps) => {
  const [step, setStep] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const tourSteps = [
    {
      id: 'momentum-card',
      title: 'Momentum ve AI Koç',
      desc: 'Buradan günlük performansınızı ve yapay zeka destekli koç önerilerinizi takip edebilirsiniz.',
      position: 'bottom'
    },
    {
      id: 'points-card',
      title: 'Puan ve Seviye',
      desc: 'Tamamladığınız her görev size puan kazandırır ve seviyenizi yükseltir.',
      position: 'bottom'
    },
    {
      id: 'streak-card',
      title: 'Peş Peşe Seri',
      desc: 'Her gün giriş yaparak serinizi bozmayın ve ekstra çarpanlar kazanın!',
      position: 'bottom'
    },
    {
      id: 'daily-tasks',
      title: 'Günlük Görevler',
      desc: 'Sizin için özel hazırlanan ana ve akıllı görevleri buradan yönetin.',
      position: 'top'
    },
    {
      id: 'quick-add-fab',
      title: 'Hızlı Ekleme',
      desc: 'Yeni mülk, müşteri veya ziyaret kaydını buradan saniyeler içinde yapın.',
      position: 'left'
    },
    {
      id: window.innerWidth >= 768 ? 'desktop-sidebar' : 'bottom-nav',
      title: 'Navigasyon',
      desc: 'Dashboard, CRM, Harita ve Portföy arasında buradan geçiş yapın.',
      position: window.innerWidth >= 768 ? 'right' : 'top'
    }
  ];

  useEffect(() => {
    const updatePosition = () => {
      const el = document.getElementById(tourSteps[step].id);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetPos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    const el = document.getElementById(tourSteps[step].id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true for capturing phase to catch all scrolls
    
    // Also update position periodically in case layout shifts (e.g. images loading)
    const interval = setInterval(updatePosition, 500);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(interval);
    };
  }, [step]);

  const nextStep = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with hole */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-500" style={{
        clipPath: `polygon(0% 0%, 0% 100%, ${targetPos.left}px 100%, ${targetPos.left}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px 100%, 100% 100%, 100% 0%)`
      }} />

      {/* Tooltip Bubble */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-[280px] pointer-events-auto"
        style={{
          top: tourSteps[step].position === 'bottom' ? targetPos.top + targetPos.height + 20 : 
               tourSteps[step].position === 'top' ? targetPos.top - 180 : 
               targetPos.top + targetPos.height / 2 - 90,
          left: window.innerWidth < 640 ? 20 : (
                tourSteps[step].position === 'left' ? targetPos.left - 300 : 
                tourSteps[step].position === 'right' ? targetPos.left + targetPos.width + 20 :
                Math.max(20, Math.min(window.innerWidth - 300, targetPos.left + targetPos.width / 2 - 140))
          ),
          width: window.innerWidth < 640 ? window.innerWidth - 40 : 280
        }}
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-sm">
            {step + 1}
          </div>
          <h3 className="font-bold text-slate-900 pr-4">{tourSteps[step].title}</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {tourSteps[step].desc}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-4 bg-orange-500' : 'w-1 bg-slate-200'}`} />
            ))}
          </div>
          <button 
            onClick={nextStep}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-slate-200"
          >
            {step === tourSteps.length - 1 ? 'Anladım!' : 'Sıradaki'}
          </button>
        </div>
      </motion.div>

      {/* Highlight Border */}
      <motion.div 
        animate={{ 
          top: targetPos.top - 4, 
          left: targetPos.left - 4, 
          width: targetPos.width + 8, 
          height: targetPos.height + 8 
        }}
        className="absolute border-2 border-orange-500 rounded-[32px] shadow-[0_0_20px_rgba(249,115,22,0.4)] pointer-events-none"
      />
    </div>
  );
};
