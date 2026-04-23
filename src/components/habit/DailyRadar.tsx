import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, Sun, Phone, Calendar, Briefcase, Plus, X } from 'lucide-react';

interface DailyRadarProps {
  tasks: string[];
  insight: string;
  onComplete: (data: any) => void;
  isPending?: boolean;
}

export const DailyRadar: React.FC<DailyRadarProps> = ({ tasks, insight, onComplete, isPending }) => {
  const [step, setStep] = useState(1);
  const [plannedCalls, setPlannedCalls] = useState(5);
  const [plannedFollowups, setPlannedFollowups] = useState(3);
  const [plannedPortfolioActions, setPlannedPortfolioActions] = useState(2);
  const [top3, setTop3] = useState(['', '', '']);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
      onComplete({
        planned_calls: plannedCalls,
        planned_followups: plannedFollowups,
        planned_portfolio_actions: plannedPortfolioActions,
        top3: top3.filter(t => t.trim() !== '')
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-900 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-md w-full py-12">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-orange-500/20"
                >
                  <Sun size={40} />
                </motion.div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Günaydın Şampiyon!</h1>
                <p className="text-slate-400 text-lg">Bugün senin günün. İşte radarındaki kritik hamleler:</p>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700 p-5 rounded-3xl flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-white font-medium text-sm">{task}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl space-y-2"
              >
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-wider">
                  <Sparkles size={16} />
                  AI Koç İçgörüsü
                </div>
                <p className="text-orange-100 italic leading-relaxed text-sm">
                  "{insight}"
                </p>
              </motion.div>

              <button
                onClick={handleNext}
                className="w-full py-5 bg-white text-slate-900 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
              >
                Planlamaya Geç <ArrowRight size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Bugünkü Oyun Planın</h2>
                <p className="text-slate-400 text-sm">Hedeflerini belirle, günü domine et.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Arama', value: plannedCalls, setter: setPlannedCalls, icon: Phone, color: 'text-blue-400' },
                  { label: 'Takip', value: plannedFollowups, setter: setPlannedFollowups, icon: Calendar, color: 'text-emerald-400' },
                  { label: 'Portföy', value: plannedPortfolioActions, setter: setPlannedPortfolioActions, icon: Briefcase, color: 'text-purple-400' }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-3xl text-center space-y-2">
                    <item.icon size={16} className={`mx-auto ${item.color}`} />
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</div>
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => item.setter(Math.max(0, item.value - 1))} className="text-white hover:text-orange-500"><X size={14} /></button>
                      <span className="text-xl font-black text-white">{item.value}</span>
                      <button onClick={() => item.setter(item.value + 1)} className="text-white hover:text-orange-500"><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bugünün En Önemli 3 Odağı</div>
                {top3.map((goal, i) => (
                  <div key={i} className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500/20 text-orange-500 rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</div>
                    <input 
                      type="text" 
                      value={goal}
                      onChange={(e) => {
                        const newTop3 = [...top3];
                        newTop3[i] = e.target.value;
                        setTop3(newTop3);
                      }}
                      placeholder={i === 0 ? "Örn: Ahmet Bey'in satış kapaması" : i === 1 ? "Örn: Bölge taraması" : "Örn: 3 yeni FSBO girişi"}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-medium focus:border-orange-500 outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={isPending || top3.every(t => t.trim() === '')}
                className="w-full py-5 bg-orange-600 text-white rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-700 transition-colors shadow-2xl shadow-orange-600/30 active:scale-95 disabled:opacity-50"
              >
                {isPending ? 'Hazırlanıyor...' : 'Sahaya İniyorum'} <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
