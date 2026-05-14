import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, Info } from 'lucide-react';

export type AdminToastType = 'success' | 'error' | 'warning' | 'info';

export type AdminToast = {
  id: string;
  type: AdminToastType;
  title: string;
  message?: string;
};

export type AdminConfirmIntent = 'danger' | 'warning' | 'info';

export type AdminConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  intent: AdminConfirmIntent;
  onConfirm: () => void | Promise<void>;
};

export const useAdminFeedback = () => {
  const [adminToasts, setAdminToasts] = useState<AdminToast[]>([]);
  const [adminConfirm, setAdminConfirm] = useState<AdminConfirmState | null>(null);

  const showAdminToast = useCallback((type: AdminToastType, title: string, message?: string) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    setAdminToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setAdminToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeAdminToast = useCallback((id: string) => {
    setAdminToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openAdminConfirm = useCallback((config: Omit<AdminConfirmState, 'open'>) => {
    setAdminConfirm({ ...config, open: true });
  }, []);

  const closeAdminConfirm = useCallback(() => {
    setAdminConfirm(null);
  }, []);

  return {
    adminToasts,
    adminConfirm,
    showAdminToast,
    removeAdminToast,
    openAdminConfirm,
    closeAdminConfirm
  };
};

export const AdminToastViewport = ({ toasts, onRemove }: { toasts: AdminToast[], onRemove: (id: string) => void }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`p-4 rounded-xl shadow-lg border w-80 flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-600 text-white' :
              toast.type === 'error' ? 'bg-red-500/90 border-red-600 text-white' :
              toast.type === 'warning' ? 'bg-amber-500/90 border-amber-600 text-white' :
              'bg-slate-800/90 border-slate-700 text-white'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{toast.title}</div>
              {toast.message && <div className="text-xs opacity-90 mt-0.5 line-clamp-2">{toast.message}</div>}
            </div>
            <button 
              onClick={() => onRemove(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const AdminConfirmModal = ({ confirm, onClose }: { confirm: AdminConfirmState | null, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {confirm?.open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-slate-100 p-6 flex flex-col items-center text-center"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              confirm.intent === 'danger' ? 'bg-red-50 text-red-500' :
              confirm.intent === 'warning' ? 'bg-amber-50 text-amber-500' :
              'bg-slate-50 text-slate-500'
            }`}>
              {confirm.intent === 'danger' ? <AlertCircle size={32} /> :
               confirm.intent === 'warning' ? <AlertCircle size={32} /> :
               <Info size={32} />}
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">{confirm.title}</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">{confirm.message}</p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={onClose} 
                className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {confirm.cancelLabel || 'İptal'}
              </button>
              <button 
                onClick={confirm.onConfirm} 
                className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-colors shadow-lg ${
                  confirm.intent === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                  confirm.intent === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                  'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
