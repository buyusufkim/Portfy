import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyRadar } from '../habit/DailyRadar';
import { DayCloser } from '../habit/DayCloser';
import { GamifiedTask, PersonalTask, Property, Task, DailyPlan, DayClosure } from '../../types';
import { UseMutationResult } from '@tanstack/react-query';

interface RitualOverlaysProps {
  showDailyRadar: boolean;
  dailyRadarData: { tasks: string[], insight: string } | null;
  setShowDailyRadar: (val: boolean) => void;
  showDayCloser: boolean;
  setShowDayCloser: (val: boolean) => void;
  completeMorningRitualMutation: UseMutationResult<unknown, Error, Partial<DailyPlan>, unknown>;
  completeEveningRitualMutation: UseMutationResult<unknown, Error, Partial<DayClosure>, unknown>;
  gamifiedTasks: GamifiedTask[];
  personalTasks: PersonalTask[];
  properties: Property[];
  tasks: Task[];
}

export const RitualOverlays = ({ 
  showDailyRadar, 
  setShowDailyRadar,
  dailyRadarData, 
  showDayCloser, 
  setShowDayCloser,
  completeMorningRitualMutation,
  completeEveningRitualMutation, 
  gamifiedTasks, 
  personalTasks, 
  properties, 
  tasks 
}: RitualOverlaysProps) => {

  // Görsel XP Ödülü Ekranı İçin State Yönetimi
  const [showReward, setShowReward] = useState(false);
  const [rewardContent, setRewardContent] = useState({ title: "", xp: "" });

  // Haptik Geri Bildirim Yardımcısı
  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Ekranlar açıldığında hafif bir dokunsal geri bildirim ver
  useEffect(() => {
    if (showDailyRadar || showDayCloser) {
      triggerHaptic(15); 
    }
  }, [showDailyRadar, showDayCloser]);

  // Sabah Ritüeli Tamamlanma Senaryosu
  const handleMorningComplete = (payload: Partial<DailyPlan>) => {
    triggerHaptic([30, 50, 30, 50, 100]); // Başarı hissi veren titreşim deseni
    setRewardContent({ title: "Güne Harika Başladın!", xp: "+50 XP" });
    setShowReward(true);
    
    // Sinematik gecikme ile mutation'ı tetikle
    setTimeout(() => {
      setShowReward(false);
      completeMorningRitualMutation.mutate({
        planned_calls: payload.planned_calls,
        planned_followups: payload.planned_followups,
        planned_portfolio_actions: payload.planned_portfolio_actions,
        top3: payload.top3
      });
    }, 2000);
  };

  // Akşam Ritüeli Tamamlanma Senaryosu
  const handleEveningComplete = (payload: Partial<DayClosure>) => {
    triggerHaptic([30, 50, 30, 50, 150]); // Daha güçlü başarı titreşimi
    setRewardContent({ title: "Gün Başarıyla Kapatıldı!", xp: "+100 XP" });
    setShowReward(true);
    
    // Sinematik gecikme ile mutation'ı tetikle
    setTimeout(() => {
      setShowReward(false);
      completeEveningRitualMutation.mutate(payload);
    }, 2000);
  };

  return (
    <>
      <AnimatePresence>
        {/* Ödül / XP Kazanım Görsel Katmanı */}
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Arka Plan Glow Efekti */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0] }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]"
            />

            {/* Parçacık (Particle) Efektleri */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0,
                  scale: Math.random() * 2 + 1,
                  x: (Math.random() - 0.5) * 500,
                  y: (Math.random() - 0.5) * 500 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full bg-orange-400"
                style={{ left: '50%', top: '50%' }}
              />
            ))}

            {/* İçerik */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="relative z-10 text-center flex flex-col items-center"
            >
              <div className="text-6xl mb-6">🏆</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                {rewardContent.title}
              </h2>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 font-bold text-xl tracking-wider shadow-[0_0_30px_rgba(249,115,22,0.3)]"
              >
                {rewardContent.xp}
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Sabah Ritüeli (Daily Radar) */}
        {showDailyRadar && (
          dailyRadarData ? (
            <DailyRadar 
              tasks={dailyRadarData.tasks}
              insight={dailyRadarData.insight}
              onComplete={handleMorningComplete}
              isPending={completeMorningRitualMutation.isPending || showReward}
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              className="fixed inset-0 z-[100] bg-slate-950/80 flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="relative flex flex-col items-center">
                {/* Sinematik Yükleme Animasyonu */}
                <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl"
                  />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 border-[1px] border-orange-500/30 border-t-orange-500 rounded-full"
                  />
                  <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse" />
                </div>
                
                <h3 className="text-slate-300 font-light tracking-[0.2em] uppercase text-sm mb-2">Yapay Zeka Analizi</h3>
                <p className="text-orange-400/80 font-medium tracking-widest text-xs animate-pulse mb-8">RADAR HAZIRLANIYOR...</p>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDailyRadar(false)}
                  className="px-6 py-2.5 border border-slate-800 text-slate-400 text-xs tracking-wider rounded-xl hover:bg-slate-800/50 hover:text-slate-300 transition-all"
                >
                  İPTAL ET
                </motion.button>
              </div>
            </motion.div>
          )
        )}

        {/* Akşam Ritüeli (Day Closer) */}
        {showDayCloser && (
          <DayCloser 
            isPending={completeEveningRitualMutation.isPending || showReward}
            onClose={() => setShowDayCloser(false)}
            stats={{
              tasks_completed: gamifiedTasks.filter(t => t.is_completed).length + personalTasks.filter(t => t.is_completed).length,
              revenue: properties.reduce((acc, p) => acc + ((p.price * p.commission_rate) / 100) * (p.sale_probability || 0.5), 0),
              calls: tasks.filter(t => t.type === 'Arama' && t.completed).length,
              visits: tasks.filter(t => t.type === 'Saha' && t.completed).length,
              social: tasks.filter(t => t.type === 'Sosyal Medya' && t.completed).length
            }}
            onComplete={handleEveningComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
};