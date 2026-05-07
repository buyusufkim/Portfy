import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, X, Mail, Phone, MapPin, Home, Target, Award, Zap, Activity, Info, AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../../types';
import { MaskedContact } from '../shared/MaskedContact';
import { AdminUserNotes } from '../AdminUserNotes';
import { AdminUserActivitySection } from './AdminUserActivitySection';
import { getSubscriptionLabel } from '../ProfilView';
import { getEffectiveAiTokenLimitSafe, isExpiredSubscriber } from './adminPanelHelpers';

type AdminUserDetailModalProps = {
  user: UserProfile | null;
  userDetailStats: {
    properties: number;
    leads: number;
    loading: boolean;
  };
  onClose: () => void;
};

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  user,
  userDetailStats,
  onClose
}) => {
  return (
    <AnimatePresence>
      {user && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-8 max-w-2xl w-full relative z-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-amber-500" /> Kullanıcı Detayları
              </h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              {/* Profil Başlığı */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-black text-slate-900">{user.display_name || 'İsimsiz Kullanıcı'}</h2>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-medium items-center md:items-start">
                    <span className="flex items-center gap-1.5"><Mail size={16} className="text-slate-400"/> <MaskedContact type="email" value={user.email} canReveal={true} /></span>
                    {/* Not: Phone bilgisi UserProfile'da standart olmadığı için opsiyonel gösterilir */}
                    <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400"/> <MaskedContact type="phone" value={user.phone} canReveal={true} /></span>
                  </div>
                  <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                     {user.region ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold">
                         <MapPin size={14} />
                         {user.region.city} / {user.region.district}
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">
                         <MapPin size={14} /> Bölge Seçilmemiş
                       </span>
                     )}
                     {(() => {
                        const isExpired = user.subscription_end_date ? new Date(user.subscription_end_date) < new Date() : false;
                        const isActiveMaster = user.tier === 'master' && user.subscription_type !== 'trial' && !isExpired;
                        const isTrial = user.subscription_type === 'trial' && !isExpired;
                        
                        return (
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                            isActiveMaster ? 'bg-indigo-100 text-indigo-700' : 
                            isTrial ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {getSubscriptionLabel(user)}
                          </span>
                        );
                     })()}
                  </div>
                </div>
              </div>

              {/* İstatistik Kartları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2"><Home size={20} /></div>
                  <div className="text-2xl font-black text-slate-900">{userDetailStats.loading ? '...' : userDetailStats.properties}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Aktif Portföy</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2"><Target size={20} /></div>
                  <div className="text-2xl font-black text-slate-900">{userDetailStats.loading ? '...' : userDetailStats.leads}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Takipte Lead</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2"><Award size={20} /></div>
                  <div className="text-2xl font-black text-slate-900">{user.total_xp || 0}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Toplam XP</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-2"><Zap size={20} /></div>
                  <div className="text-2xl font-black text-slate-900">{user.current_streak || 0}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Mevcut Seri (Gün)</div>
                </div>
              </div>

              {/* Diğer Bilgiler */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={16} className="text-amber-500"/> Sistem & Aktivite Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Kayıt Tarihi:</span>
                    <span className="font-bold text-slate-900">{new Date(user.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Son Aktiflik:</span>
                    <span className="font-bold text-slate-900">{user.last_active_date || 'Bilinmiyor'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Abonelik Bitişi:</span>
                    <span className="font-bold text-slate-900">{user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('tr-TR') : 'Süresiz / Yok'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Broker Seviyesi:</span>
                    <span className="font-bold text-slate-900">Seviye {user.broker_level || 1}</span>
                  </div>
                </div>
              </div>

              {/* Token & Risk Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                   <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-sm">AI Token Özeti</h4>
                   <div className="flex flex-col gap-2 text-sm">
                     <div className="flex justify-between text-slate-500">
                       <span>Kullanılan:</span>
                       <span className="font-bold text-slate-900">{(user.ai_tokens_used || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Limit:</span>
                       <span className="font-bold text-slate-900">{getEffectiveAiTokenLimitSafe(user) === 0 ? 'Kapalı' : getEffectiveAiTokenLimitSafe(user).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-slate-500">
                       <span>Doluluk Oranı:</span>
                       <span className={`font-bold ${getEffectiveAiTokenLimitSafe(user) > 0 && ((user.ai_tokens_used||0)/getEffectiveAiTokenLimitSafe(user)) > 0.8 ? 'text-red-500' : 'text-emerald-500'}`}>
                         {getEffectiveAiTokenLimitSafe(user) > 0 ? Math.round(((user.ai_tokens_used||0)/getEffectiveAiTokenLimitSafe(user))*100) : 0}%
                       </span>
                     </div>
                   </div>
                   <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-start gap-1.5 font-medium">
                     <Info size={12} className="shrink-0 mt-0.5" /> Detaylı AI kullanım geçmişi (istek logları) kullanıcının kendi profil panelinde görünmektedir.
                   </div>
                </div>
                
                <AdminUserNotes userId={user.id} />
              </div>
              
              <AdminUserActivitySection userId={user.id} />

              {/* Risk Situation Banner */}
              {(() => {
                  const isExpired = isExpiredSubscriber(user);
                  const isNearLimit = (() => {
                    const lim = getEffectiveAiTokenLimitSafe(user);
                    return lim > 0 && ((user.ai_tokens_used || 0) / lim) >= 0.8;
                  })();
                  const isTrialExpiring = (() => {
                    if(user.subscription_type !== 'trial' || !user.subscription_end_date) return false;
                    const diff = new Date(user.subscription_end_date).getTime() - new Date().getTime();
                    return diff > 0 && diff <= (3 * 24 * 60 * 60 * 1000);
                  })();
                  const isRisk = isExpired || isNearLimit || isTrialExpiring;
                  return isRisk ? (
                    <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-medium flex gap-3 items-start mt-6">
                       <AlertCircle className="shrink-0 mt-0.5" size={18} />
                       <div>
                         <strong className="block mb-1">Dikkat: Bu kullanıcı risk listesinde!</strong>
                         Bu hesap limit aşımına yakın, aboneliği bitmiş veya deneme süresi dolmak üzere.
                       </div>
                    </div>
                  ) : null;
              })()}

            </div>

            <div className="pt-6 flex justify-end">
              <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
