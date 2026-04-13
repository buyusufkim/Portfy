import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin, Brain, Zap, ChevronRight } from 'lucide-react';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence = ({ onComplete }: IntroSequenceProps) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Hoş Geldiniz!",
      desc: "Portfy AI ile emlak dünyasında yeni bir döneme başlıyorsunuz.",
      icon: <Sparkles size={48} className="text-orange-500" />
    },
    {
      title: "Bölgenize Hakim Olun",
      desc: "Harita üzerinden saha ziyaretlerinizi yönetin ve bölge verimliliğinizi artırın.",
      icon: <MapPin size={48} className="text-emerald-500" />
    },
    {
      title: "AI Koç Yanınızda",
      desc: "Davranışsal analizler ve günlük görevlerle performansınızı zirveye taşıyın.",
      icon: <Brain size={48} className="text-orange-600" />
    },
    {
      title: "Hadi Başlayalım!",
      desc: "Bugün hedeflerinize ulaşmak için ilk adımı atın.",
      icon: <Zap size={48} className="text-amber-500" />
    }
  ];

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden" 
      onClick={() => {
        if (step < steps.length - 1) setStep(step + 1);
        else onComplete();
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="space-y-8 z-10"
        >
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[32px] flex items-center justify-center mx-auto shadow-2xl border border-white/10">
            {steps[step].icon}
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
              {steps[step].title}
            </h2>
            <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
              {steps[step].desc}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-16 flex gap-2">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-orange-500' : 'w-2 bg-slate-700'}`} 
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-slate-500 text-xs flex items-center gap-2"
      >
        <span>Devam etmek için dokunun</span>
        <ChevronRight size={14} />
      </motion.div>
    </div>
  );
};
