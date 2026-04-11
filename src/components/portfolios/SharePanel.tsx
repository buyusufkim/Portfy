import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Instagram, FileText } from 'lucide-react';
import { Property } from '../../types';

interface SharePanelProps {
  show: boolean;
  onClose: () => void;
  selectedProperty: Property | null;
  onAction: (type: 'whatsapp' | 'hub' | 'instagram' | 'listing') => void;
}

export const SharePanel: React.FC<SharePanelProps> = ({
  show,
  onClose,
  selectedProperty,
  onAction
}) => {
  if (!show || !selectedProperty) return null;

  const shareOptions = [
    { 
      id: 'whatsapp', 
      label: 'WhatsApp', 
      icon: <MessageCircle size={24} />, 
      color: 'bg-emerald-50 text-emerald-600',
      action: () => onAction('whatsapp')
    },
    { 
      id: 'hub', 
      label: 'Marketing Hub', 
      icon: <Sparkles size={24} />, 
      color: 'bg-orange-50 text-orange-600',
      action: () => onAction('hub')
    },
    { 
      id: 'instagram', 
      label: 'Instagram', 
      icon: <Instagram size={24} />, 
      color: 'bg-pink-50 text-pink-600',
      action: () => onAction('instagram')
    },
    { 
      id: 'listing', 
      label: 'İlan Metni', 
      icon: <FileText size={24} />, 
      color: 'bg-blue-50 text-blue-600',
      action: () => onAction('listing')
    }
  ] as const;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[120] shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Portföyü Paylaş</h2>
        <div className="grid grid-cols-4 gap-4">
          {shareOptions.map(opt => (
            <button key={opt.id} onClick={opt.action} className="flex flex-col items-center gap-3 group">
              <div className={`w-16 h-16 ${opt.color} rounded-3xl flex items-center justify-center transition-transform group-active:scale-90`}>
                {opt.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center">{opt.label}</span>
            </button>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
        >
          Vazgeç
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
