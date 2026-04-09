import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, Sun } from 'lucide-react';

interface DailyRadarProps {
  tasks: string[];
  insight: string;
  onComplete: () => void;
}

export const DailyRadar: React.FC<DailyRadarProps> = ({ tasks, insight, onComplete }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full space-y-8">
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
              <p className="text-white font-medium">{task}</p>
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
          <p className="text-orange-100 italic leading-relaxed">
            "{insight}"
          </p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onComplete}
          className="w-full py-5 bg-white text-slate-900 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
        >
          Sahaya İniyorum <ArrowRight size={20} />
        </motion.button>
      </div>
    </motion.div>
  );
};
