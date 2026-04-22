import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Edit3, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectScan: () => void;
}

export const LeadEntryMethodModal = ({ isOpen, onClose, onSelectManual, onSelectScan }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative p-6"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 transition-colors">
              <X size={24} />
            </button>
            
            <div className="text-center mb-8 mt-2">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Müşteri Ekle</h2>
              <p className="text-slate-500 text-sm font-medium">Nasıl devam etmek istersiniz?</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={onSelectScan}
                className="w-full flex items-center gap-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-4 rounded-2xl transition-all border border-emerald-100 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Camera size={24} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Kartvizit Okut (AI)</div>
                  <div className="text-xs text-emerald-600/80 mt-0.5">Saniyeler içinde otomatik doldur</div>
                </div>
              </button>

              <button 
                onClick={onSelectManual}
                className="w-full flex items-center gap-4 bg-slate-50 hover:bg-slate-100 text-slate-700 p-4 rounded-2xl transition-all border border-slate-200 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Edit3 size={24} className="text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Manuel Gir</div>
                  <div className="text-xs text-slate-500 mt-0.5">Klasik form ile detaylı kayıt ekle</div>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};