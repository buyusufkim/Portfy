import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface AppTourProps {
  onComplete: () => void;
}

export const AppTour = ({ onComplete }: AppTourProps) => {
  const [step, setStep] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const isDesktop = window.innerWidth >= 1024;

  const tourSteps = [
    {
      id: isDesktop ? 'tour-d-dashboard' : 'tour-m-dashboard',
      title: 'Dashboard / Öncelikler',
      desc: 'Güne buradan başlarsın. Sistem, bugün odaklanman gereken en kritik işleri burada toplar.',
      position: isDesktop ? 'right' : 'top'
    },
    {
      id: isDesktop ? 'tour-d-tasks' : 'tour-m-tasks',
      title: 'Günlük Akış',
      desc: 'Görevlerini, takiplerini ve kişisel akışını tek listede görürsün. Dağınıklığı azaltır, günü kontrol altına alırsın.',
      position: isDesktop ? 'right' : 'top'
    },
    {
      id: isDesktop ? 'tour-d-crm' : 'tour-m-more',
      title: 'CRM Disiplini',
      desc: 'Lead’lerini sadece kaydetmezsin; sıcaklık, sessizlik ve takip disiplinini de yönetirsin.',
      position: isDesktop ? 'right' : 'top'
    },
    {
      id: isDesktop ? 'tour-d-portfoyler' : 'tour-m-portfoyler',
      title: 'Portföy Sağlığı',
      desc: 'Portföylerini ekler, zayıf yanlarını izler ve pazarlanabilir ilanları ayırırsın.',
      position: isDesktop ? 'right' : 'top'
    },
    {
      id: isDesktop ? 'tour-d-campaign' : 'tour-m-more',
      title: '90 Gün Kampı',
      desc: 'Yeniysen sistemi kurar, tecrübeliysen disiplinini güçlendirirsin. Her gün görev ve saha ritmi sunar.',
      position: isDesktop ? 'right' : 'top'
    },
    {
      id: isDesktop ? 'tour-d-koc' : 'tour-m-more',
      title: 'AI Koç',
      desc: 'Performansına bakar, seni uyarır ve odak kaybını azaltır.',
      position: isDesktop ? 'right' : 'top'
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
    window.addEventListener('scroll', updatePosition, true);
    
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
      <div className="absolute inset-0 bg-[#061A32]/70 backdrop-blur-[2px] transition-all duration-500" style={{
        clipPath: `polygon(0% 0%, 0% 100%, ${targetPos.left}px 100%, ${targetPos.left}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px 100%, 100% 100%, 100% 0%)`
      }} />

      {/* Tooltip Bubble */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute bg-white rounded-2xl p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-slate-100/50 max-w-[300px] pointer-events-auto"
        style={{
          top: tourSteps[step].position === 'bottom' ? targetPos.top + targetPos.height + 16 : 
               tourSteps[step].position === 'top' ? targetPos.top - 180 : 
               targetPos.top + targetPos.height / 2 - 80,
          left: window.innerWidth < 640 ? 20 : (
                tourSteps[step].position === 'left' ? targetPos.left - 320 : 
                tourSteps[step].position === 'right' ? targetPos.left + targetPos.width + 16 :
                Math.max(20, Math.min(window.innerWidth - 320, targetPos.left + targetPos.width / 2 - 150))
          ),
          width: window.innerWidth < 640 ? window.innerWidth - 40 : 300
        }}
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
            {step + 1}
          </div>
          <h3 className="font-bold text-[#061A32] pr-4 leading-tight">{tourSteps[step].title}</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-5 font-medium">
          {tourSteps[step].desc}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1.5 flex-1 mr-4">
            {tourSteps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <button 
            onClick={nextStep}
            className="px-5 py-2 bg-[#061A32] text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-[#061A32]/20 shrink-0"
          >
            {step === tourSteps.length - 1 ? 'Portfy\'yi Başlat' : 'Sıradaki'}
          </button>
        </div>
      </motion.div>

      {/* Highlight Border */}
      <motion.div 
        animate={{ 
          top: targetPos.top - 6, 
          left: targetPos.left - 6, 
          width: targetPos.width + 12, 
          height: targetPos.height + 12 
        }}
        className="absolute border-[3px] border-blue-500 rounded-3xl shadow-[0_0_20px_rgba(59,130,246,0.3)] pointer-events-none"
      />
    </div>
  );
};
