import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Check, Clock, AlertCircle } from 'lucide-react';

import { RescueSession, RescueTask } from '../../../types';

interface RescueModeModalProps {
  rescueSession: RescueSession | null;
  isOpen: boolean;
  onClose: () => void;
  cancelRescueMutation: any;
  completeRescueTaskMutation: any;
}

export const RescueModeModal: React.FC<RescueModeModalProps> = ({ 
  rescueSession,
  isOpen,
  onClose,
  cancelRescueMutation, 
  completeRescueTaskMutation 
}) => {
  const [taskStatus, setTaskStatus] = useState<Record<string, { loading?: boolean, error?: string }>>({});

  if (!isOpen || !rescueSession || rescueSession.status !== 'active') return null;

  const completedCount = rescueSession.tasks.filter((t: RescueTask) => t.is_completed).length;
  const totalCount = rescueSession.tasks.length;
  const progress = (completedCount / totalCount) * 100;

  const handleComplete = async (taskId: string) => {
    setTaskStatus(prev => ({ ...prev, [taskId]: { loading: true, error: undefined } }));
    try {
      await completeRescueTaskMutation.mutateAsync({ sessionId: rescueSession.id, taskId });
      setTaskStatus(prev => ({ ...prev, [taskId]: { loading: false, error: undefined } }));
    } catch (err: any) {
      console.error("Rescue task completion failed:", err);
      let msg = err.message || "Görev tamamlanamadı";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.error) msg = parsed.error;
      } catch (e) {}
      setTaskStatus(prev => ({ ...prev, [taskId]: { loading: false, error: msg } }));
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white w-full max-w-[400px] max-h-[85dvh] overflow-y-auto rounded-3xl p-5 space-y-5 shadow-2xl relative no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
          >
            <X size={18} />
          </button>

          <div className="text-center space-y-1 relative z-10 pt-2">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-2 shadow-sm shadow-orange-100">
              <Zap size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Günü Kurtar Modu</h2>
            <p className="text-[12px] text-slate-500 line-clamp-2 px-2 leading-relaxed">Henüz her şey bitmedi! Bu 3 kritik görevi tamamla, günü %100 verimle kapat.</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 px-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>İlerleme</span>
              <span className="text-orange-600">%{Math.round(progress)}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="bg-orange-500 h-full shadow-sm"
              />
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2 px-1">
            {rescueSession.tasks.map((task: RescueTask) => {
              const status = taskStatus[task.id] || {};
              const isChecking = status.loading;
              const isCompleted = task.is_completed;
              
              return (
              <div key={task.id} className="flex flex-col gap-1">
                <button
                  onClick={() => !isCompleted && !isChecking && handleComplete(task.id)}
                  disabled={isCompleted || isChecking}
                  className={`w-full p-3 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left ${
                    isCompleted 
                      ? 'bg-emerald-50 border-emerald-100 opacity-60' 
                      : 'bg-slate-50 border-slate-100 hover:border-orange-200 active:scale-95'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm border border-slate-100'
                    }`}>
                      {isCompleted ? <Check size={16} /> : isChecking ? <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[12px] font-bold leading-snug line-clamp-2 ${isCompleted ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {task.estimated_minutes} dk
                        </span>
                        <span className="text-[9px] font-bold text-orange-600">+{task.points} Puan</span>
                      </div>
                    </div>
                  </div>
                </button>
                {status.error && (
                  <div className="text-[10px] text-red-500 font-medium px-2 py-1 flex items-center gap-1">
                    <AlertCircle size={10} />
                    {status.error}
                  </div>
                )}
              </div>
            )})}
          </div>

          <div className="pt-2 pb-1">
            <p className="text-[9px] text-center text-slate-400 italic">
              "Disiplin, vazgeçmediğin her an yeniden başlar."
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
