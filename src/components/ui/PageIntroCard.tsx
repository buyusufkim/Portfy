import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PageIntroCardProps {
  pageKey: string;
  title: string;
  description: string;
  tips: string[];
}

export const PageIntroCard: React.FC<PageIntroCardProps> = ({ pageKey, title, description, tips }) => {
  const [isVisible, setIsVisible] = useState(false);
  const localStorageKey = `portfy_intro_hidden_${pageKey}`;

  useEffect(() => {
    const isHidden = localStorage.getItem(localStorageKey);
    if (!isHidden) {
      setIsVisible(true);
    }
  }, [localStorageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(localStorageKey, "true");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 p-1.5 text-indigo-400 hover:text-indigo-600 bg-white/50 hover:bg-white rounded-full transition-colors z-10"
        >
          <X size={16} />
        </button>
        
        <div className="flex gap-3 relative z-10">
          <div className="shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Info size={16} />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-indigo-900 mb-1">{title}</h3>
            <p className="text-xs font-medium text-indigo-700/80 mb-3">{description}</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium text-indigo-900/70">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1" />
                  <span className="flex-1">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
