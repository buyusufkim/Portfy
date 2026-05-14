import React, { useState, useEffect } from 'react';
import { adminOperationsService, AdminOperationsOverview, AdminOperationsUser } from '../../services/adminOperationsService';
import { maskEmail, maskPhone } from '../../utils/masking';
import { RefreshCw, Search, Briefcase, Users, AlertTriangle, AlertOctagon, CheckCircle2, TrendingUp, TrendingDown, Eye, Home, Phone, Star, MapPin } from 'lucide-react';

type AdminOperationsTabProps = {
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
};

export const AdminOperationsTab: React.FC<AdminOperationsTabProps> = ({ showAdminToast }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [overview, setOverview] = useState<AdminOperationsOverview | null>(null);
  const [users, setUsers] = useState<AdminOperationsUser[]>([]);
  
  const [segment, setSegment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [o, u] = await Promise.all([
         adminOperationsService.getAdminOperationsOverview(),
         adminOperationsService.getAdminOperationsUsers({ segment })
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
    loadData();
  }, [segment]);

  const handleRefresh = () => {
    loadData(true);
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

  // Local Search
  const filteredUsers = users.filter(u => {
     if (!searchQuery) return true;
     const q = searchQuery.toLowerCase();
     return (u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q) || u.district?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">CRM & Portföy Operasyon Görünürlüğü</h2>
          <p className="text-sm text-slate-500">Kullanıcıların CRM, portföy girişi ve bölgesel aktivite analizleri.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl transition-all"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          <span>Yenile</span>
        </button>
      </div>

      {loading && !overview && (
        <div className="h-40 flex items-center justify-center text-slate-500 font-medium font-mono">
          Yükleniyor...
        </div>
      )}

      {/* OVERVIEW CARDS */}
      {overview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Home size={14}/> Toplam Portföy</div>
               <div className="text-2xl font-black text-slate-700">{overview.totalProperties}</div>
               <div className="text-xs text-emerald-600 font-medium mt-1">{overview.activeProperties} Aktif</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Users size={14}/> Toplam Lead</div>
               <div className="text-2xl font-black text-slate-700">{overview.totalLeads}</div>
               <div className="text-xs text-orange-600 font-medium mt-1">{overview.hotLeads} Sıcak</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm">
               <div className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1.5 mb-1"><AlertTriangle size={14}/> CRM Boş (Kullanıcı)</div>
               <div className="text-2xl font-black text-rose-600">{overview.usersWithNoCrmActivity}</div>
               <div className="text-xs text-rose-500 font-medium mt-1">{overview.usersWithNoProperties} portföysüz</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Star size={14}/> Pazarlama Üretimi</div>
               <div className="text-2xl font-black text-indigo-600">{overview.marketingOutputsCount}</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
               <div className="text-[11px] font-bold text-amber-500 uppercase flex items-center gap-1.5 mb-1"><AlertOctagon size={14}/> Veri Eksik</div>
               <div className="text-lg font-black text-amber-600">{overview.propertiesMissingPhotos} <span className="text-[10px] font-bold text-amber-500 uppercase">Fotoğrafsız</span></div>
               <div className="text-xs text-amber-600/80 font-medium">{overview.propertiesMissingLocation} konumsuz</div>
            </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
               <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-1"><MapPin size={14}/> Saha Aktivitesi</div>
               <div className="text-2xl font-black text-teal-600">{overview.mapPinsCount}</div>
               <div className="text-xs text-slate-500 font-medium mt-1">Harita iğnesi</div>
            </div>
          </div>
        </>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <select 
            value={segment} 
            onChange={(e) => setSegment(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Kullanıcılar</option>
            <option value="portfolio_active">Aktif Portföyü Olanlar</option>
            <option value="crm_active">Kayıtlı Leadi Olanlar</option>
            <option value="no_properties">Hiç Portföy Eklemeyenler</option>
            <option value="no_leads">Hiç Lead Eklemeyenler</option>
            <option value="no_crm_activity">Portföy ve Lead Sıfır (CRM Boş)</option>
            <option value="risk">Churn / Risk Taşıyanlar</option>
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
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Portföy</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Müşteri</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Kullanım Skoru</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase text-center">Risk Durumu</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Son Aktivite</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    Belirtilen kritere uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.user_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 align-top w-1/3">
                    <div className="font-bold text-slate-800 flex items-center gap-2 mb-0.5">
                       {user.display_name}
                       {user.tier === 'pro' && <span className="bg-amber-100 text-amber-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-black">Pro</span>}
                       {user.tier === 'elite' && <span className="bg-purple-100 text-purple-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-black">Elite</span>}
                       {user.tier === 'master' && <span className="bg-rose-100 text-rose-700 text-[9px] uppercase px-1.5 py-0.5 rounded font-black">Master</span>}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                       {maskEmail(user.email)}
                    </div>
                    {user.city && (
                      <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                         {user.city} {user.district ? `/ ${user.district}` : ''}
                      </div>
                    )}
                  </td>
                  
                  <td className="py-4 px-4 align-top text-center border-l border-slate-50 decoration-slate-100">
                    <div className="flex flex-col items-center">
                       <span className={`text-xl font-black ${user.properties_count === 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                         {user.properties_count}
                       </span>
                       {user.active_properties_count > 0 && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded mt-1">{user.active_properties_count} Aktif</span>}
                    </div>
                  </td>
                  
                  <td className="py-4 px-4 align-top text-center border-l border-slate-50">
                    <div className="flex flex-col items-center">
                       <span className={`text-xl font-black ${user.leads_count === 0 ? 'text-amber-400' : 'text-slate-700'}`}>
                         {user.leads_count}
                       </span>
                       {user.hot_leads_count > 0 && <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-1.5 rounded mt-1">{user.hot_leads_count} Sıcak</span>}
                    </div>
                  </td>

                  <td className="py-4 px-4 align-top text-center border-l border-slate-50">
                    <div className="flex flex-col items-center">
                       <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                         {user.usage_score} / 100
                       </span>
                       {user.marketing_outputs_count > 0 && (
                          <span className="text-[10px] text-slate-400 mt-1" title="Pazarlama çıktısı üretmiş">
                            +{user.marketing_outputs_count} AI Üretim
                          </span>
                       )}
                    </div>
                  </td>

                  <td className="py-4 px-4 align-top text-center border-l border-slate-50">
                    <div className="flex flex-col items-center gap-1.5">
                       {getRiskBadge(user.risk_level)}
                       {user.risk_reasons.length > 0 && (
                          <div className="text-[9px] text-slate-400 leading-tight max-w-[140px] mt-1" title={user.risk_reasons.join(", ")}>
                             {user.risk_reasons[0]} {user.risk_reasons.length > 1 && `(+${user.risk_reasons.length-1})`}
                          </div>
                       )}
                    </div>
                  </td>

                  <td className="py-4 px-4 align-top border-l border-slate-50">
                     <div className="text-xs font-semibold text-slate-700 flex flex-col gap-1 mt-1">
                       {user.last_activity_at ? (
                         <>
                            <span className="text-slate-500">Son İşlem:</span>
                            <span>{new Date(user.last_activity_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                         </>
                       ) : (
                         <span className="text-slate-400 italic">Hiç aktivite yok</span>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
