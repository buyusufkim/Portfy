import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Briefcase, Clock, Save } from 'lucide-react';
import { UserProfile } from '../../types';
import { maskEmail } from '../../utils/masking';

type AdminUserSubscriptionModalProps = {
  user: UserProfile | null;
  loading: boolean;
  editTier: string;
  editSubDuration: string;
  editEndDate: string;
  setEditTier: (value: string) => void;
  setEditSubDuration: (value: string) => void;
  setEditEndDate: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  setEditEndDateToTrial: () => void;
  addMonthsToEndDate: (months: number, subtype: string) => void;
};

export const AdminUserSubscriptionModal: React.FC<AdminUserSubscriptionModalProps> = ({
  user,
  loading,
  editTier,
  editSubDuration,
  editEndDate,
  setEditTier,
  setEditSubDuration,
  setEditEndDate,
  onClose,
  onSave,
  setEditEndDateToTrial,
  addMonthsToEndDate
}) => {
  return (
    <AnimatePresence>
      {user && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Crown className="text-amber-500" /> Abonelik Yönetimi
              </h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              {/* Kullanıcı Özeti */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Profile" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{user.display_name || 'İsimsiz Kullanıcı'}</div>
                  <div className="text-xs text-slate-500">{maskEmail(user.email)}</div>
                </div>
              </div>

              {/* Paket Seçimi */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Paket Seçimi</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setEditTier('free')}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'free' ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <Briefcase size={20} className={editTier === 'free' ? 'text-slate-300' : 'text-slate-400'}/> 
                    Girişimci
                  </button>
                  <button 
                    onClick={() => setEditTier('trial')}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'trial' ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <Clock size={20} className={editTier === 'trial' ? 'text-amber-200' : 'text-slate-400'}/> 
                    Deneme
                  </button>
                  <button 
                    onClick={() => {
                      setEditTier('master');
                      if (!['1-month', '3-month', '6-month', '12-month'].includes(editSubDuration)) {
                        setEditSubDuration('1-month');
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'master' ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <Crown size={20} className={editTier === 'master' ? 'text-indigo-200' : 'text-slate-400'}/> 
                    Master
                  </button>
                </div>
              </div>

              {/* Süre Ekleme */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Abonelik Bitiş Tarihi</label>
                <div className="flex items-center mb-4">
                  <input 
                    type="date" 
                    value={editEndDate} 
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-bold bg-slate-50 focus:bg-white outline-none transition-all cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                    <button onClick={() => setEditEndDateToTrial()} className={`py-2.5 text-xs font-bold rounded-xl transition-all border ${editTier === 'trial' ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'}`}>7 Gün Deneme</button>
                    <button onClick={() => addMonthsToEndDate(1, '1-month')} className={`py-2.5 text-xs font-bold rounded-xl transition-all border ${editTier === 'master' && editSubDuration === '1-month' ? 'bg-slate-200 text-slate-800 border-slate-400 ring-2 ring-slate-500/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'}`}>+1 Ay</button>
                    <button onClick={() => addMonthsToEndDate(3, '3-month')} className={`py-2.5 text-xs font-bold rounded-xl transition-all border ${editTier === 'master' && editSubDuration === '3-month' ? 'bg-slate-200 text-slate-800 border-slate-400 ring-2 ring-slate-500/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'}`}>+3 Ay</button>
                    <button onClick={() => addMonthsToEndDate(6, '6-month')} className={`py-2.5 text-xs font-bold rounded-xl transition-all border ${editTier === 'master' && editSubDuration === '6-month' ? 'bg-slate-200 text-slate-800 border-slate-400 ring-2 ring-slate-500/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'}`}>+6 Ay</button>
                    <button onClick={() => addMonthsToEndDate(12, '12-month')} className={`py-2.5 text-xs font-bold rounded-xl transition-all border ${editTier === 'master' && editSubDuration === '12-month' ? 'bg-slate-200 text-slate-800 border-slate-400 ring-2 ring-slate-500/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'}`}>+12 Ay</button>
                </div>
              </div>

            </div>

            <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
              <button onClick={onSave} disabled={loading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2">
                <Save size={18} className={loading ? "animate-pulse" : ""} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
