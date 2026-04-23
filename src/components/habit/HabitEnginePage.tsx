import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ArrowRight, CheckCircle2, Sparkles, Trophy, Zap, Shield, Star, Award } from 'lucide-react';
import { useHabitEngine } from '../../hooks/useHabitEngine';
import { DailyRadar } from './DailyRadar';
import { DayCloser } from './DayCloser';

export const HabitEnginePage: React.FC = () => {
  const { 
    profile, 
    gamifiedTasks, 
    dailyStats, 
    isLoading, 
    startDay, 
    endDay, 
    level, 
    levelProgress, 
    levelName 
  } = useHabitEngine();

  const [showRadar, setShowRadar] = useState(false);
  const [showCloser, setShowCloser] = useState(false);

  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const todayISO = getTodayStr();
  const localStarted = profile?.id ? localStorage.getItem(`day_started_${profile.id}_${todayISO}`) : null;
  const localEnded = profile?.id ? localStorage.getItem(`day_ended_${profile.id}_${todayISO}`) : null;
  
  const isDayStarted = (profile?.last_day_started_at?.startsWith(todayISO)) || 
                       (profile?.last_active_date === todayISO) || 
                       !!localStarted;
  
  const dayStartTimestamp = profile?.last_day_started_at || localStarted || '';
  const isDayEnded = !!localEnded || (
    !!profile?.last_ritual_completed_at?.startsWith(todayISO) && 
    profile.last_ritual_completed_at > dayStartTimestamp
  );

  useEffect(() => {
    if (profile) {
      const today = getTodayStr();
      const lastRitual = profile.last_ritual_completed_at ? profile.last_ritual_completed_at.split('T')[0] : (profile.last_active_date || null);
      
      if (lastRitual !== today && !localStarted) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
          setShowRadar(true);
        }
      }
    }
  }, [profile, localStarted]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <AnimatePresence>
        {showRadar && (
          <DailyRadar 
            tasks={["Dünkü görüşmeleri takip et", "Yeni portföy fotoğraflarını yükle", "Aday listeni gözden geçir"]}
            insight="Bugün harika bir gün olacak, odaklan ve başar!"
            onComplete={() => {
              startDay(undefined);
              setShowRadar(false);
            }}
          />
        )}

        {showCloser && (
          <DayCloser 
            stats={{
              tasks_completed: gamifiedTasks.filter(t => t.is_completed).length,
              revenue: 150000, // Example revenue
              calls: 12,
              visits: 3,
              social: 0
            }}
            onComplete={() => {
              endDay({
                tasks_completed: gamifiedTasks.filter(t => t.is_completed).length,
                revenue: 150000,
                calls: 12,
                visits: 3,
                social: 0
              });
              setShowCloser(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portfy Habit Engine</h1>
            <p className="text-slate-500 text-sm font-medium">Günlük disiplin ve satış pusulası.</p>
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} alt="Profile" referrerPolicy="no-referrer" />
          </div>
        </header>

        {/* Day Closer Trigger */}
        {isDayStarted && !isDayEnded && (
          <section>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCloser(true)}
              className="w-full bg-slate-900 text-white p-8 rounded-[40px] flex items-center justify-between group shadow-2xl shadow-slate-900/20"
            >
              <div className="flex items-center gap-5 text-left">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                  <Moon size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">Günü Kapat</h4>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowRight size={24} />
              </div>
            </motion.button>
          </section>
        )}

        {/* Weekly Stats Summary */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award size={20} className="text-orange-500" />
            Haftalık Özet
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {dailyStats.slice(0, 4).map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(stat.date).toLocaleDateString('tr-TR', { weekday: 'long' })}</div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">+{stat.xp_earned} XP</div>
                  <div className="text-xs font-bold text-emerald-600">%{Math.round((stat.tasks_completed / 5) * 100)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
