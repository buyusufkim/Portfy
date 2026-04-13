import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe } from 'lucide-react';

interface IntegrationModalProps {
  show: boolean;
  onClose: () => void;
  onConnect: (apiKey: string) => void;
  isPending: boolean;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  show,
  onClose,
  onConnect,
  isPending
}) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

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
          className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">sahibinden.com Bağla</h2>
                <p className="text-xs text-slate-500">Resmi API entegrasyonu</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-[10px] text-orange-700 leading-relaxed">
                Bu entegrasyon sadece <strong>Kurumsal Mağaza</strong> sahipleri içindir. sahibinden.com panelinizden aldığınız API anahtarlarını kullanın.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Secret</label>
              <input 
                type="password" 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                if (!apiKey || !apiSecret) return;
                onConnect(apiKey);
              }}
              disabled={isPending || !apiKey || !apiSecret}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200 disabled:opacity-50"
            >
              {isPending ? 'Bağlanıyor...' : 'Entegrasyonu Tamamla'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
