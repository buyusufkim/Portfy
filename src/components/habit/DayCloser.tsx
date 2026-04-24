import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Star, Trophy, ArrowRight, CheckCircle2, RefreshCw, Share2, Target, AlertTriangle } from 'lucide-react';
import { DayClosure } from '../../types';

interface DayCloserProps {
  stats: {
    tasks_completed: number;
    revenue: number;
    calls: number;
    visits: number;
    social: number;
  };
  onComplete: (data: Partial<DayClosure>) => void;
  isPending?: boolean;
  onClose?: () => void;
}

export const DayCloser: React.FC<DayCloserProps> = ({ stats, onComplete, isPending, onClose }) => {
  const [step, setStep] = useState(1);
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowTop3, setTomorrowTop3] = useState(['', '', '']);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else {
      onComplete({
        completed_calls: stats.calls,
        completed_portfolio_actions: stats.visits,
        wins,
        blockers,
        tomorrow_top3: tomorrowTop3.filter(t => t.trim() !== '')
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="max-w-md w-full relative py-12">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 relative z-10"
            >
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[32px] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40"
                >
                  <Moon size={48} />
                </motion.div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-white tracking-tight">Günü Mühürle</h1>
                  <p className="text-slate-400 text-lg font-medium">Bugün harika bir disiplin sergiledin.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Görevler', value: stats.tasks_completed, icon: CheckCircle2, color: 'text-emerald-400' },
                  { label: 'Aramalar', value: stats.calls, icon: Star, color: 'text-amber-400' },
                  { label: 'Sosyal', value: stats.social, icon: Share2, color: 'text-blue-400' },
                  { label: 'Potansiyel', value: `₺${(stats.revenue / 1000).toFixed(0)}k`, icon: ArrowRight, color: 'text-indigo-400' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[32px] space-y-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <item.icon size={18} className={item.color} />
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</div>
                    </div>
                    <div className="text-3xl font-black text-white">{item.value}</div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-6 bg-white text-slate-900 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
              >
                Günü Değerlendir <ArrowRight size={24} />
              </button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 relative z-10"
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
                    <Trophy size={14} /> Bugünkü Zaferlerin (Wins)
                  </div>
                  <textarea 
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    placeholder="Bugün neyi başardın? En büyük kazanımın neydi?"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-white/90 text-sm focus:border-indigo-500 outline-none h-24 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">
                    <AlertTriangle size={14} /> Engelleyenler / Zorluklar (Blockers)
                  </div>
                  <textarea 
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="Seni ne yavaşlattı? Yarın neyi çözmelisin?"
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-white/90 text-sm focus:border-orange-500 outline-none h-24 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                    <Target size={14} /> Yarın İçin En Önemli 3 Odak
                  </div>
                  <div className="space-y-3">
                    {tomorrowTop3.map((goal, i) => (
                      <input 
                        key={i}
                        type="text" 
                        value={goal}
                        onChange={(e) => {
                          const newTop3 = [...tomorrowTop3];
                          newTop3[i] = e.target.value;
                          setTomorrowTop3(newTop3);
                        }}
                        placeholder={`Hedef ${i + 1}`}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white/90 text-sm focus:border-amber-500 outline-none transition-colors"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-6 bg-white text-slate-900 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
              >
                Sonuçları Kayla <ArrowRight size={24} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="space-y-10 relative z-10"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-32 h-32 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-[40px] mx-auto flex items-center justify-center text-white shadow-2xl shadow-orange-500/40"
                >
                  <Trophy size={64} />
                </motion.div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-black text-white tracking-tight">Efsanevi Kapanış!</h1>
                  <p className="text-slate-400 text-lg font-medium">Başarın AI tahminlerini %12 daha güçlendirdi.</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] flex items-center gap-8">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center text-yellow-500 shrink-0">
                  <Star size={40} className="fill-yellow-500" />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Kazanılan Ödül</div>
                  <div className="text-2xl font-black text-white">+150 XP & Streak</div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={isPending}
                className="w-full py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCw size={24} />
                  </motion.div>
                ) : (
                  <>Günü Tamamla <CheckCircle2 size={24} /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
