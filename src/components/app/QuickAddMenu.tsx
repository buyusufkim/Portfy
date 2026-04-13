import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MapPin, Users, Home } from 'lucide-react';

const QuickAddBtn = ({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group">
    <div className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center transition-transform group-active:scale-90`}>
      {icon}
    </div>
    <span className="text-xs font-bold text-slate-600">{label}</span>
  </button>
);

interface QuickAddMenuProps {
  show: boolean;
  onClose: () => void;
  onVoice: () => void;
  onVisit: () => void;
  onLead: () => void;
  onPortfolio: () => void;
}

export const QuickAddMenu = ({ 
  show, 
  onClose, 
  onVoice, 
  onVisit, 
  onLead, 
  onPortfolio 
}: QuickAddMenuProps) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] shadow-2xl"
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Hızlı Kayıt</h2>
          <div className="grid grid-cols-4 gap-4">
            <QuickAddBtn 
              onClick={onVoice}
              icon={<Mic size={24} />} 
              label="Sesli" 
              color="bg-red-50 text-red-600" 
            />
            <QuickAddBtn 
              onClick={onVisit}
              icon={<MapPin size={24} />} 
              label="Ziyaret" 
              color="bg-orange-50 text-orange-600" 
            />
            <QuickAddBtn 
              onClick={onLead}
              icon={<Users size={24} />} 
              label="Lead" 
              color="bg-emerald-50 text-emerald-600" 
            />
            <QuickAddBtn 
              onClick={onPortfolio}
              icon={<Home size={24} />} 
              label="Portföy" 
              color="bg-purple-50 text-purple-600" 
            />
          </div>
          <button 
            onClick={onClose}
            className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
          >
            Vazgeç
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
