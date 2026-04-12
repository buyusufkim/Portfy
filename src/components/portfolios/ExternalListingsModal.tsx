import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, RefreshCw } from 'lucide-react';
import { Property } from '../../types';

interface ExternalListingsModalProps {
  show: boolean;
  onClose: () => void;
  listings: any[];
  onSync: () => void;
  onLink: (propertyId: string, externalId: string) => void;
  isSyncing: boolean;
  selectedProperty: Property | null;
}

export const ExternalListingsModal: React.FC<ExternalListingsModalProps> = ({
  show,
  onClose,
  listings,
  onSync,
  onLink,
  isSyncing,
  selectedProperty
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-2xl rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[80vh] overflow-auto"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Aktif İlanların</h2>
                <p className="text-xs text-slate-500">sahibinden.com üzerindeki ilanların</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={onSync}
                className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200"
              >
                <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              </button>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {listings.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Henüz ilan bulunamadı.</div>
            ) : listings.map((listing: any) => (
              <div key={listing.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-center">
                <img src={listing.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">{listing.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{listing.externalId}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 text-orange-600 rounded-lg">{listing.price} TL</span>
                  </div>
                </div>
                <button 
                  onClick={() => selectedProperty && onLink(selectedProperty.id, listing.externalId)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Eşleştir
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
