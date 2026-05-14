import React, { useState, useEffect } from 'react';
import { adminCampaign90Service, AdminCampaignOverview, AdminCampaignUser } from '../../services/adminCampaign90Service';
import { AdminCampaign90DayContentsSection } from './AdminCampaign90DayContentsSection';
import { AdminCampaign90UserDetailModal } from './AdminCampaign90UserDetailModal';
import { maskEmail } from '../../utils/masking';
import { Activity, RefreshCw, Search, Users, Target, CheckCircle2, AlertTriangle, AlertOctagon, TrendingDown, Eye, MessageCircle, Settings, LayoutDashboard, FileText, ChevronRight } from 'lucide-react';

type AdminCampaign90TabProps = {
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
};

export const AdminCampaign90Tab: React.FC<AdminCampaign90TabProps> = ({ showAdminToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'day_contents'>('overview');
  const [selectedUserIdDetail, setSelectedUserIdDetail] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [overview, setOverview] = useState<AdminCampaignOverview | null>(null);
  const [users, setUsers] = useState<AdminCampaignUser[]>([]);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [dayRange, setDayRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [o, u] = await Promise.all([
         adminCampaign90Service.getAdminCampaignOverview(),
         adminCampaign90Service.getAdminCampaignUsers({ statusFilter, dayRange })
      ]);

      setOverview(o);
      setUsers(u);
    } catch (err: unknown) {
      showAdminToast('error', 'Hata!', err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'overview') {
       loadData();
    }
  }, [statusFilter, dayRange, activeSubTab]);

  const handleRefresh = () => {
    if (activeSubTab === 'overview') loadData(true);
  };

  const getRiskBadge = (level: string) => {
     switch (level) {
        case 'critical': return <span className="flex items-center gap-1 px-2 py-1 rounded border font-bold text-[10px] uppercase bg-rose-50 border-rose-100 text-rose-600"><AlertOctagon size={12}/> Critical</span>;
        case 'risk': return <span className="flex items-center gap-1 px-2 py-1 rounded border font-bold text-[10px] uppercase bg-red-50 border-red-100 text-red-600"><AlertTriangle size={12}/> Risk</span>;
        case 'watch': return <span className="flex items-center gap-1 px-2 py-1 rounded border font-bold text-[10px] uppercase bg-amber-50 border-amber-100 text-amber-600"><Eye size={12}/> Watch</span>;
        case 'healthy': return <span className="flex items-center gap-1 px-2 py-1 rounded border font-bold text-[10px] uppercase bg-emerald-50 border-emerald-100 text-emerald-600"><CheckCircle2 size={12}/> Healthy</span>;
        default: return <span className="px-2 py-1 rounded border font-bold text-[10px] uppercase bg-slate-50 border-slate-100 text-slate-600">{level}</span>;
     }
  };

  const getReflectionBadge = (user: AdminCampaignUser) => {
      switch (user.reflectionStatus) {
         case 'answered_today': return <span className="px-2 py-1 rounded-md border font-bold text-[10px] uppercase bg-indigo-50 border-indigo-100 text-indigo-600">Bugün Cevapladı</span>;
         case 'missing_today': return <span className="px-2 py-1 rounded-md border font-bold text-[10px] uppercase bg-amber-50 border-amber-100 text-amber-600">Bugün Eksik</span>;
         case 'stale': return <span className="px-2 py-1 rounded-md border font-bold text-[10px] uppercase bg-rose-50 border-rose-100 text-rose-600">3+ Gün Yok</span>;
         case 'none': return <span className="px-2 py-1 rounded-md border font-bold text-[10px] uppercase bg-slate-50 border-slate-200 text-slate-500">Hiç Yok</span>;
         default: return null;
      }
  };

  // Local Search Filter
  const filteredUsers = users.filter(u => {
     if (!searchQuery) return true;
     const q = searchQuery.toLowerCase();
     return (u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.region?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">90 Gün Danışman Kampı Yönetimi</h2>
          <p className="text-sm text-slate-500">Kampanyaya katılan kullanıcıların izlenmesi ve gün içeriklerinin düzenlenmesi.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleRefresh}
             disabled={refreshing || loading || activeSubTab !== 'overview'}
             className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl transition-all"
             title="Yenile (Sadece Genel Bakış için)"
           >
             <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
             <span className="hidden md:inline">Yenile</span>
           </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutDashboard size={18} />
          Genel Bakış & Kullanıcılar
        </button>
        <button
          onClick={() => setActiveSubTab('day_contents')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'day_contents' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} />
          Gün İçerikleri 
        </button>
      </div>

      {activeSubTab === 'day_contents' && (
         <AdminCampaign90DayContentsSection showAdminToast={showAdminToast} />
      )}

      {activeSubTab === 'overview' && (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {loading && !overview && (
        <div className="h-40 flex items-center justify-center text-slate-500 font-medium font-mono">
          Yükleniyor...
        </div>
      )}

      {/* OVERVIEW CARDS */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Target size={14}/> Aktif Kamp.</div>
             <div className="text-2xl font-black text-indigo-600">{overview.activeCampaigns}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Tamamlanan</div>
             <div className="text-2xl font-black text-emerald-500">{overview.completedCampaigns}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Ort. İlerleme</div>
             <div className="text-2xl font-black text-slate-700">%{overview.averageProgressPercent}</div>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1.5 mb-1"><AlertOctagon size={14}/> Riskli / Kopan</div>
             <div className="text-2xl font-black text-rose-600">{overview.riskUserCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Bugün Start</div>
             <div className="text-2xl font-black text-teal-600">{overview.startedTodayCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Bugün Kapanış</div>
             <div className="text-2xl font-black text-blue-600">{overview.closedTodayCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Görev (Bugün)</div>
             <div className="text-2xl font-black text-amber-600">{overview.tasksCompletedTodayCount}</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-center">
             <div className="text-[11px] font-bold text-indigo-500 uppercase flex items-center gap-1.5 mb-1"><MessageCircle size={14}/> Yansıma (Bugün)</div>
             <div className="text-2xl font-black text-indigo-700">{overview.reflectionsTodayCount}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center col-span-2 md:col-span-1">
             <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1">Yansıması Eksik / Kopuk</div>
             <div className="text-2xl font-black text-slate-700">
                <span className="text-rose-500" title="Bugün cevabı eksik olan aktif kullanıcılar">{overview.missingReflectionsTodayCount}</span>
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-slate-500" title="3+ gündür hiç yansıma bırakmayanlar">{overview.staleReflectionsCount}</span>
             </div>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Kampanyalar</option>
            <option value="completed">Tamamlananlar</option>
            <option value="inactive_7d">Kopma Riski (7+ Gün Pasif)</option>
            <option value="no_start_today">Bugün Başlatmayanlar</option>
            <option value="low_completion">Düşük Tamamlama ({"< %40"})</option>
            <option disabled>───────</option>
            <option value="answered_today">Bugün Yansıma Bırakanlar</option>
            <option value="missing_today">Bugün Yansıması Eksik (Aktif)</option>
            <option value="stale_reflections">3+ Gündür Yansıma Yok</option>
            <option value="no_reflections">Hiç Yansıma Yok (Aktif)</option>
          </select>

          <select 
            value={dayRange} 
            onChange={(e) => setDayRange(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Günler (1-90)</option>
            <option value="1-30">Başlangıç (1-30)</option>
            <option value="31-60">Gelişme (31-60)</option>
            <option value="61-90">İleri (61-90)</option>
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="İsim, email, şehir..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Kullanıcı</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Gün</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Tümü %</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Bugün</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Risk & Yansıma</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Son Aktivite</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    Belirtilen filtrelere uygun kampanya kaydı bulunamadı.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.campaign_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 align-middle">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                       {user.display_name} 
                       {user.tier === 'pro' && <span className="bg-amber-100 text-amber-700 text-[9px] uppercase px-1.5 py-0.5 rounded">Pro</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                       {maskEmail(user.email)}
                    </div>
                    {user.region && user.region !== '-' && (
                      <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{user.region}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                    <div className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-black text-sm border border-indigo-100">
                      {user.current_day}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                    <div className="flex flex-col items-center">
                       <span className={`text-sm font-bold ${user.overall_completion_percent < 40 ? 'text-red-500' : 'text-emerald-600'}`}>
                         %{user.overall_completion_percent}
                       </span>
                       <span className="text-[10px] text-slate-400">{user.completed_tasks_count} / {user.total_tasks_count}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                     <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold">
                           <span className={`px-1.5 py-0.5 rounded ${user.today_started ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>S</span>
                           <span className={`px-1.5 py-0.5 rounded ${user.today_closed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>C</span>
                        </div>
                        {user.today_tasks_total > 0 && (
                          <div className="text-xs font-medium text-slate-600 leading-tight">
                            {user.today_tasks_completed}/{user.today_tasks_total} gör.
                          </div>
                        )}
                     </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-center">
                    <div className="flex flex-col items-center gap-1">
                       {getRiskBadge(user.risk_level)}
                       {getReflectionBadge(user)}
                       {user.openFollowupCount > 0 && (
                          <div className={`px-2 py-0.5 mt-1 rounded text-[10px] font-bold border max-w-fit mx-auto truncate
                             ${user.latestFollowupPriority === 'urgent' || user.latestFollowupPriority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
                          `} title="Açık Takip Notu">
                             Açık Takip ({user.openFollowupCount})
                          </div>
                       )}
                       {user.risk_reasons.length > 0 && (
                          <div className="text-[9px] text-slate-400 max-w-[120px] leading-tight mt-1 truncate" title={user.risk_reasons.join(", ")}>
                             {user.risk_reasons[0]} {user.risk_reasons.length > 1 && `+${user.risk_reasons.length-1}`}
                          </div>
                       )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                     <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 delay-200">
                       <Activity size={14} className="text-slate-400"/>
                       {new Date(user.last_activity_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short' })}
                     </div>
                  </td>
                  <td className="py-3 px-4 align-middle text-right">
                     <div className="flex items-center justify-end gap-2">
                        {user.phone && user.phone.length > 8 && (
                           <a 
                             href={`https://wa.me/${user.phone.replace(/[^0-9]/g, '')}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                             title="WhatsApp'tan Yaz"
                           >
                              <MessageCircle size={16} />
                           </a>
                        )}
                        <button 
                           onClick={() => setSelectedUserIdDetail(user.user_id)}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-bold border border-indigo-100"
                           title="Kullanıcı Detayı"
                        >
                           <Eye size={14} />
                           <span className="hidden sm:inline">Detay</span>
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {selectedUserIdDetail && (
         <AdminCampaign90UserDetailModal
            userId={selectedUserIdDetail}
            onClose={() => setSelectedUserIdDetail(null)}
            showAdminToast={showAdminToast}
         />
      )}
    </div>
  );
};
