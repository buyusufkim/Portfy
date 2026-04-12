import React from 'react';
import { motion } from 'motion/react';
import { Brain } from 'lucide-react';
import { AICoachPanel } from '../ai/AICoachPanel';

export const CoachView = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 pb-32"
    >
      <header className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
          <Brain size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfy AI Koç</h1>
          <p className="text-slate-500 text-sm">Davranışsal gelişim asistanı</p>
        </div>
      </header>

      <AICoachPanel />
    </motion.div>
  );
};
