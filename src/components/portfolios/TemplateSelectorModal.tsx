import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { MessageTemplate, Property } from '../../types';

interface TemplateSelectorModalProps {
  show: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  selectedProperty: Property | null;
  whatsappMessages: { single: string, status: string, investor: string } | null;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  show,
  onClose,
  templates,
  selectedProperty,
  whatsappMessages
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Şablon Seç</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-auto pr-2">
              {templates.map(t => (
                <button 
                  key={t.id}
                  onClick={() => {
                    const phone = selectedProperty?.owner.phone.replace(/\s/g, '');
                    const text = encodeURIComponent(whatsappMessages?.single || '');
                    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
                    onClose();
                  }}
                  className="w-full p-4 bg-slate-50 rounded-2xl text-left hover:bg-slate-100 transition-all border border-slate-100"
                >
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{t.content}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
