import React from "react";
import {
  Search,
  Eye,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { UserProfile } from "../types";

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
  getRemainingDays,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Üye ve Abonelik Yönetimi</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Sistemdeki tüm kullanıcıları, paketlerini ve token durumlarını yönetin.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="İsim veya E-posta ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 bg-white rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium text-slate-700 outline-none transition-all shadow-sm"
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Kullanıcı Bilgisi
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Abonelik Durumu
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  AI Token Tüketimi
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const used = u.ai_tokens_used || 0;
                let limit = 5000;
                if (
                  u.ai_token_limit !== undefined &&
                  u.ai_token_limit !== null
                ) {
                  limit = u.ai_token_limit;
                } else if (u.tier === "master") {
                  limit = 100000;
                } else if (u.tier === "pro") {
                  limit = 10000;
                }
                const ratio =
                  limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                const isWarning = limit > 0 && ratio >= 80;
                const isDanger =
                  (limit > 0 && ratio >= 100) || (limit === 0 && used > 0);

                const remainingText = getRemainingDays(u.subscription_end_date);
                const isExpired = remainingText === "Süresi Doldu";

                const isActiveMaster = u.tier === "master" && !isExpired;
                const isTrial = u.subscription_type === "trial" && !isExpired;
                const isPassive = !isActiveMaster && !isTrial;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => handleOpenUserDetail(u)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm group-hover:shadow-md transition-shadow">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-base">
                            {u.display_name || "İsimsiz Kullanıcı"}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mb-1">{u.email}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock size={10} />
                            Son Aktif: <span className="font-bold text-slate-500">{u.last_active_date || "Bilinmiyor"}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            isActiveMaster
                              ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              : isTrial
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {isActiveMaster
                            ? "Master"
                            : isTrial
                              ? "Deneme"
                              : isPassive
                                ? isExpired
                                  ? "Süresi Doldu / Pasif"
                                  : "Başlangıç"
                                : "Başlangıç"}
                        </span>
                        {!isPassive && remainingText && (
                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${isExpired ? "text-red-500" : "text-emerald-600"}`}
                          >
                            {isExpired ? (
                              <AlertCircle size={12} />
                            ) : (
                              <Clock size={12} />
                            )}
                            {remainingText}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 w-64">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">
                          {used.toLocaleString()} /{" "}
                          {limit === 0
                            ? "0 \u00b7 Kapal\u0131"
                            : limit.toLocaleString()}
                        </span>
                        {limit > 0 && (
                          <span
                            className={`font-bold ${isDanger ? "text-red-500" : isWarning ? "text-orange-500" : "text-emerald-500"}`}
                          >
                            %{Math.round(ratio)}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isDanger ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-emerald-500"}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="px-3 py-2 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-100 rounded-lg transition-all shadow-sm flex items-center gap-1.5 font-bold text-xs"
                          title="Detayları İncele"
                        >
                          <Eye size={14} /> Detaylar
                        </button>
                        <button
                          onClick={() => handleResetToken(u.id)}
                          className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-sm"
                          title="Token Sıfırla"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                          title="Aboneliği Düzenle"
                        >
                          <Edit2 size={14} /> Düzenle
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteUser(
                              u.id,
                              u.display_name || "Kullanıcı",
                            )
                          }
                          className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500 font-medium"
                  >
                    Aramanıza uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
