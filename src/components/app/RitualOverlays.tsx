import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyRadar } from '../habit/DailyRadar';
import { DayCloser } from '../habit/DayCloser';
import { GamifiedTask, PersonalTask, Property, Task } from '../../types';

interface RitualOverlaysProps {
  showDailyRadar: boolean;
  dailyRadarData: { tasks: string[], insight: string } | null;
  showDayCloser: boolean;
  completeMorningRitualMutation: any;
  completeEveningRitualMutation: any;
  gamifiedTasks: GamifiedTask[];
  personalTasks: PersonalTask[];
  properties: Property[];
  tasks: Task[];
}

export const RitualOverlays = ({ 
  showDailyRadar, 
  dailyRadarData, 
  showDayCloser, 
  completeMorningRitualMutation, 
  completeEveningRitualMutation, 
  gamifiedTasks, 
  personalTasks, 
  properties, 
  tasks 
}: RitualOverlaysProps) => (
  <AnimatePresence>
    {showDailyRadar && (
      dailyRadarData ? (
        <DailyRadar 
          tasks={dailyRadarData.tasks}
          insight={dailyRadarData.insight}
          onComplete={() => completeMorningRitualMutation.mutate()}
          isPending={completeMorningRitualMutation.isPending}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"
            />
            <p className="text-orange-500 font-bold animate-pulse">Radar Hazırlanıyor...</p>
          </div>
        </motion.div>
      )
    )}

    {showDayCloser && (
      <DayCloser 
        isPending={completeEveningRitualMutation.isPending}
        stats={{
          tasks_completed: gamifiedTasks.filter(t => t.is_completed).length + personalTasks.filter(t => t.is_completed).length,
          revenue: properties.reduce((acc, p) => acc + ((p.price * p.commission_rate) / 100) * (p.sale_probability || 0.5), 0),
          calls: tasks.filter(t => t.type === 'Arama' && t.completed).length,
          visits: tasks.filter(t => t.type === 'Saha' && t.completed).length,
          social: tasks.filter(t => t.type === 'Sosyal Medya' && t.completed).length
        }}
        onComplete={() => {
          completeEveningRitualMutation.mutate({
            tasks_completed: gamifiedTasks.filter(t => t.is_completed).length + personalTasks.filter(t => t.is_completed).length,
            revenue: properties.reduce((acc, p) => acc + ((p.price * p.commission_rate) / 100) * (p.sale_probability || 0.5), 0),
            calls: tasks.filter(t => t.type === 'Arama' && t.completed).length,
            visits: tasks.filter(t => t.type === 'Saha' && t.completed).length,
            social: tasks.filter(t => t.type === 'Sosyal Medya' && t.completed).length
          });
        }}
      />
    )}
  </AnimatePresence>
);
