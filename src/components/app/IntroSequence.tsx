import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Users, Zap, Compass, ChevronRight } from 'lucide-react';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence = ({ onComplete }: IntroSequenceProps) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Portfy'ye Hoş Geldin",
      desc: "Portfy, boş bir CRM değildir. Günlük aksiyonlarını planlayan ve seni disiplinde tutan dijital mentoründür.",
      icon: <Compass size={48} className="text-blue-500" />
    },
    {
      title: "Gününü Ne Yönetecek?",
      desc: "Bugünün Öncelikleri, Mikro Hedefler ve Günlük Akış ile gününü dağılmadan yönet.",
      icon: <Target size={48} className="text-orange-500" />
    },
    {
      title: "Takipsiz CRM Mezarlıktır",
      desc: "Lead, follow-up, sessiz aday ve portföy sağlığını tek merkezde, kayıpsız yönet.",
      icon: <Users size={48} className="text-emerald-500" />
    },
    {
      title: "İlk 90 Gün Her Şeyi Değiştirir",
      desc: "90 Gün Kampı ile günlük görev, eğitim ve saha ritmini kur. Her adımda yanındayız.",
      icon: <Zap size={48} className="text-amber-500" />
    }
  ];

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden" 
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="space-y-10 z-10 w-full max-w-sm"
        >
          <div className="w-28 h-28 bg-white/5 backdrop-blur-2xl rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/10 ring-1 ring-white/5">
            {steps[step].icon}
          </div>
          <div className="space-y-5">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {steps[step].title}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mx-auto leading-relaxed font-medium">
              {steps[step].desc}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-24 flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-orange-500' : 'w-2 bg-slate-700'}`} 
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-6 w-full max-w-sm px-6"
      >
        <button 
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else onComplete();
          }}
          className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-white/5"
        >
          {step < steps.length - 1 ? 'İleri' : "Portfy'ye Başla"}
          {step < steps.length - 1 && <ChevronRight size={20} className="text-slate-400" />}
        </button>
      </motion.div>
    </div>
  );
};
