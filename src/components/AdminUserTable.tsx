import React from 'react';
import { Search, Eye, RefreshCw, Edit2, Trash2, AlertCircle, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminUserTableProps {
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredUsers: UserProfile[];
  handleOpenUserDetail: (user: UserProfile) => void;
  handleResetToken: (id: string) => void;
  openEditUser: (user: UserProfile) => void;
  handleDeleteUser: (id: string, name: string) => void;
  getRemainingDays: (endDateStr?: string) => string | null;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({
  loading,
  searchQuery,
  setSearchQuery,
  filteredUsers,
  handleOpenUserDetail,
  handleResetToken,
  openEditUser,
  handleDeleteUser,
  getRemainingDays
}) => {
  return (
    <div className="space-y-6"> 
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Üye ve Abonelik Yönetimi</h2>
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="İsim veya E-posta ile ara..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
             <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
             Üyeler Yükleniyor...
          </div>
        ) : (
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kullanıcı Bilgisi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Abonelik Durumu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">AI Token Tüketimi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const used = u.ai_tokens_used || 0;
                const limit = (u as any).ai_token_limit || (u.tier === 'master' ? 100000 : 5000);
                const ratio = Math.min((used / limit) * 100, 100);
                const isWarning = ratio >= 80;
                const isDanger = ratio >= 100;
                
                const remainingText = getRemainingDays(u.subscription_end_date);
                const isExpired = remainingText === "Süresi Doldu";

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleOpenUserDetail(u)}>
                      <div className="font-bold text-slate-900 hover:text-orange-600 transition-colors">{u.display_name || 'İsimsiz Kullanıcı'}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Son Aktif: <span className="font-bold">{u.last_active_date || 'Bilinmiyor'}</span></div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          u.tier === 'master' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 
                          u.tier === 'trial' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {u.tier === 'master' ? 'Master' : u.tier === 'trial' ? 'Deneme' : 'Başlangıç'}
                        </span>
                        {(u.tier === 'master' || u.tier === 'trial') && remainingText && (
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isExpired ? <AlertCircle size={12}/> : <Clock size={12}/>}
                            {remainingText}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 w-64">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">{used.toLocaleString()} / {limit.toLocaleString()}</span>
                        <span className={`font-bold ${isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-emerald-500'}`}>
                          %{Math.round(ratio)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenUserDetail(u)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg transition-all shadow-sm" title="Detayları İncele"><Eye size={16} /></button>
                        <button onClick={() => handleResetToken(u.id)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-sm" title="Token Sıfırla"><RefreshCw size={16} /></button>
                        <button onClick={() => openEditUser(u)} className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2" title="Aboneliği Düzenle"><Edit2 size={14} /> Düzenle</button>
                        <button onClick={() => handleDeleteUser(u.id, u.display_name || 'Kullanıcı')} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm" title="Kullanıcıyı Sil"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Aramanıza uygun kullanıcı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
