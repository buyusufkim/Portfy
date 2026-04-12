import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Check, Clock } from 'lucide-react';

import { RescueSession, RescueTask } from '../../../types';

interface RescueModeModalProps {
  rescueSession: RescueSession | null;
  cancelRescueMutation: any;
  completeRescueTaskMutation: any;
}

export const RescueModeModal: React.FC<RescueModeModalProps> = ({ 
  rescueSession, 
  cancelRescueMutation, 
  completeRescueTaskMutation 
}) => {
  if (!rescueSession || rescueSession.status !== 'active') return null;

  const completedCount = rescueSession.tasks.filter((t: RescueTask) => t.is_completed).length;
  const totalCount = rescueSession.tasks.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <button 
            onClick={() => cancelRescueMutation.mutate(rescueSession.id)}
            className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
          >
            <X size={20} />
          </button>

          <div className="text-center space-y-2 relative z-10">
            <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mx-auto mb-4 shadow-lg shadow-orange-100">
              <Zap size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Günü Kurtar Modu</h2>
            <p className="text-sm text-slate-500">Henüz her şey bitmedi! Bu 3 kritik görevi tamamla, günü %100 verimle kapat.</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>İlerleme</span>
              <span>%{Math.round(progress)}</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-orange-500 h-full shadow-sm"
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {rescueSession.tasks.map((task: RescueTask) => (
              <button
                key={task.id}
                onClick={() => !task.is_completed && completeRescueTaskMutation.mutate({ sessionId: rescueSession.id, taskId: task.id })}
                disabled={task.is_completed || completeRescueTaskMutation.isPending}
                className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${
                  task.is_completed 
                    ? 'bg-emerald-50 border-emerald-100 opacity-60' 
                    : 'bg-slate-50 border-slate-100 hover:border-orange-200 active:scale-95'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  task.is_completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                }`}>
                  {task.is_completed ? <Check size={20} /> : <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${task.is_completed ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {task.estimated_minutes} dk
                    </span>
                    <span className="text-[10px] font-bold text-orange-600">+{task.points} Puan</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-center text-slate-400 italic">
              "Disiplin, vazgeçmediğin her an yeniden başlar."
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
