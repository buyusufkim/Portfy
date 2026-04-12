import React from 'react';
import { motion } from 'motion/react';

export const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center p-12">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full"
    />
  </div>
);
