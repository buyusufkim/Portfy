import React from 'react';
import { motion } from 'motion/react';
import { AICoachPanel } from '../ai/AICoachPanel';

export const CoachView = ({ setActiveTab }: { setActiveTab?: (tab: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 pb-32"
    >
      <AICoachPanel setActiveTab={setActiveTab} />
    </motion.div>
  );
};
