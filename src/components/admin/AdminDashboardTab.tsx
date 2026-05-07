import React from 'react';
import { 
  DollarSign, 
  Crown, 
  Users, 
  Activity, 
  Check, 
  TrendingUp, 
  AlertCircle, 
  Zap, 
  Award 
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AdminDashboardMetrics } from './adminPanelHelpers';
import { maskEmail } from '../../utils/masking';
import { getSubscriptionLabel } from '../ProfilView';

type AdminDashboardTabProps = {
  metrics: AdminDashboardMetrics;
  handleOpenUserDetail: (user: UserProfile) => void;
};

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ 
  metrics, 
  handleOpenUserDetail 
}) => {
  const {
    totalUsers,
    masterUsers,
    trialUsers,
    freeUsers,
    onlineToday,
    newUsers7d,
    active7d,
    topTokenUsers,
    trialExpiring3dUsers,
    expiredUsersList,
    inactiveFor14dList,
    approachingLimitUsers,
    totalTokensUsed,
    estimatedAiCost,
    estimatedMRR,
    conversionRate
  } = metrics;

  return (
    <div className="space-y-6">
      {/* Temel Metrikler (Gelir & Kullanıcı) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Aylık Tahmini</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-sm font-bold">Aylık Gelir (MRR)</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{estimatedMRR.toLocaleString('tr-TR')} ₺</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 transition-colors">
                <Crown size={24} />
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">Ödeyen</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-sm font-bold">Master Üyeler</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{masterUsers || 0}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Dönüşüm Oranı</span>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">%{(conversionRate)}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                <Users size={24} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Kayıtlı</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-sm font-bold">Toplam Üye</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{totalUsers || 0}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span><span className="text-xs font-bold text-slate-500">{freeUsers || 0} Girişimci</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-xs font-bold text-amber-600">{trialUsers || 0} Deneme</span></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100">
                <Activity size={24} />
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Canlı</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-sm font-bold">Bugün Aktif Olanlar</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{onlineToday || 0}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 hover:text-slate-700"><Check size={12}/> Aktif/Toplam Oranı: {totalUsers > 0 ? ((onlineToday/totalUsers)*100).toFixed(0) : 0}%</span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">7G: +{active7d} Aktif</span>
            </div>
          </div>
        </div>

        {/* SAAS HEALTH AND RISKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Etkileşim Skoru ve Büyüme (Sağlık) */}
            <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm overflow-hidden relative">
              <h3 className="font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <TrendingUp className="text-indigo-500" size={20} /> SaaS Büyüme Özeti
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Son 7G Yeni</span>
                    <span className="text-2xl font-black text-slate-900">+{newUsers7d}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">7G Aktif</span>
                    <span className="text-2xl font-black text-slate-900">{active7d}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Deneme Süresi</span>
                    <span className="text-2xl font-black text-amber-600">{trialUsers}</span>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4 flex gap-3 flex-col border border-red-100">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">3G İçi Biten (Deneme)</span>
                    <span className="text-2xl font-black text-red-600">{trialExpiring3dUsers.length}</span>
                  </div>
              </div>
            </div>

            {/* Riskli Kullanıcılar Listesi */}
            <div className="bg-white border border-rose-100 rounded-[24px] p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-amber-300"></div>
              <h3 className="font-bold tracking-tight text-slate-900 mb-6 flex justify-between items-center text-lg">
                  <span className="flex items-center gap-2"><AlertCircle className="text-rose-500" size={20} /> Dikkat Gerekenler</span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{expiredUsersList.length + approachingLimitUsers.length + inactiveFor14dList.length} Kullanıcı</span>
              </h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {trialExpiring3dUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{u.display_name || maskEmail(u.email)}</div>
                          <div className="text-xs text-amber-700 mt-0.5">Deneme sürümü yakında bitiyor</div>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200/50 text-amber-800 px-2 py-1 rounded-lg uppercase tracking-wider">Önlem Al</span>
                    </div>
                  ))}
                  {expiredUsersList.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-100 cursor-pointer hover:border-rose-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{u.display_name || maskEmail(u.email)}</div>
                          <div className="text-xs text-rose-700 mt-0.5">Abonelik süresi doldu</div>
                        </div>
                        <span className="text-[10px] font-bold bg-rose-200/50 text-rose-800 px-2 py-1 rounded-lg uppercase tracking-wider">Süresi Bitti</span>
                    </div>
                  ))}
                  {approachingLimitUsers.filter(u => !trialExpiring3dUsers.find(t=>t.id===u.id) && !expiredUsersList.find(e=>e.id===u.id)).map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-indigo-50 border border-indigo-100 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{u.display_name || maskEmail(u.email)}</div>
                          <div className="text-xs text-indigo-700 mt-0.5">Token limiti dolmak üzere</div>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-200/50 text-indigo-800 px-2 py-1 rounded-lg uppercase tracking-wider">Satış Fırsatı</span>
                    </div>
                  ))}
                  {inactiveFor14dList.slice(0,5).filter(u => !trialExpiring3dUsers.find(t=>t.id===u.id) && !expiredUsersList.find(e=>e.id===u.id) && !approachingLimitUsers.find(a=>a.id===u.id)).map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{u.display_name || maskEmail(u.email)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">14 günden uzun süredir pasif</div>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wider">Uyandır</span>
                    </div>
                  ))}
                  {(trialExpiring3dUsers.length + expiredUsersList.length + approachingLimitUsers.length + inactiveFor14dList.length) === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm font-medium flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                        <Check size={24} />
                      </div>
                      Riskli kategoride kullanıcı bulunmuyor.
                    </div>
                  )}
              </div>
            </div>

          </div>

          <div className="col-span-1 space-y-6">
              <div className="bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800 text-white relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                    <Zap size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold tracking-tight text-white/90">Toplam Token</h3>
                    <p className="text-xs text-slate-400 font-medium">Tüm zamanlar</p>
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                    {totalTokensUsed ? totalTokensUsed.toLocaleString() : "0"}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-400">Tahmini Maliyet:</span>
                    <span className="text-lg font-bold text-red-400">{estimatedAiCost.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none transform group-hover:scale-110 transition-transform duration-1000" />
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="text-indigo-500" size={20} /> AI Liderleri (Top 5)
                </h3>
                <div className="space-y-4">
                  {topTokenUsers.map((u, idx) => (
                      <div key={u.id} className="flex justify-between items-center group cursor-pointer" onClick={() => handleOpenUserDetail(u)}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-black text-slate-500 flex items-center justify-center text-xs group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">#{idx + 1}</div>
                            <div>
                              <div className="font-bold text-sm text-slate-900">{u.display_name?.split(' ')[0] || 'Kullanıcı'}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-widest">{getSubscriptionLabel(u)}</div>
                            </div>
                        </div>
                        <div className="font-black text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded font-mono group-hover:text-indigo-600">
                            {(u.ai_tokens_used || 0).toLocaleString()}
                        </div>
                      </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

    </div>
  );
};
