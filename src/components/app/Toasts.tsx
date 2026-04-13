import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PersonalTask, GamifiedTask } from '../../types';

interface NotificationToastProps {
  notification: { task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified' } | null;
  onClose: () => void;
}

export const NotificationToast = ({ notification, onClose }: NotificationToastProps) => (
  <AnimatePresence>
    {notification && (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
      >
        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Görev Hatırlatıcısı</h4>
            <p className="text-xs text-slate-400 mt-1">{notification.task.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface GlobalToastProps {
  toast: { message: string, type: 'success' | 'error' | 'info' } | null;
}

export const GlobalToast = ({ toast }: GlobalToastProps) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        style={{ zIndex: 9999 }}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${
          toast.type === 'error' 
            ? 'bg-red-500 text-white border-red-400' 
            : toast.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-900 text-white border-slate-700'
        }`}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight">{toast.type === 'error' ? 'Hata' : 'Başarılı'}</span>
          <span className="text-xs font-medium opacity-90">{toast.message}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
