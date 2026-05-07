import React, { useState, useEffect } from 'react';
import { adminAiUsageService, AdminAiUsageSummary } from '../../services/adminAiUsageService';
import { featureKeyToLabel, modelToLabel, formatTRY, formatToken } from '../../utils/aiCostHelpers';
import { maskEmail } from '../../utils/masking';
import { Cpu, Zap, Activity, AlertTriangle, Search, ChevronDown } from 'lucide-react';

type AdminAiUsageTabProps = {
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
};

export const AdminAiUsageTab: React.FC<AdminAiUsageTabProps> = ({ showAdminToast }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdminAiUsageSummary | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setPage(1);
        setLogs([]);
        setHasMore(true);
      }

      let dateFrom = undefined;
      const now = new Date();
      if (dateRange === 'today') {
        dateFrom = new Date(now.setHours(0,0,0,0)).toISOString();
      } else if (dateRange === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dateFrom = d.toISOString();
      } else if (dateRange === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        dateFrom = d.toISOString();
      }

      // Fetch summary
      if (resetPage) {
        const sum = await adminAiUsageService.getAdminAiUsageSummary({
          dateFrom,
          featureFilter
        });
        setSummary(sum);
      }

      // Fetch logs
      const limit = 20;
      const offset = (currentPage - 1) * limit;
      // Note: We're not doing real DB offset pagination here to keep it simple with existing service method,
      // just fetching limit and handling "more" if we get full limit back. Actually, our service only takes limit.
      // We will adjust service or just fetch larger chunks. We didn't add offset to service.
      const fetchedLogs = await adminAiUsageService.getAdminAiUsageLogs({
        dateFrom,
        featureFilter,
        userSearch: searchQuery || undefined,
        limit: limit * currentPage
      });
      
      setLogs(fetchedLogs);
      if (fetchedLogs.length < limit * currentPage && !searchQuery) {
        setHasMore(false);
      }

    } catch (err: unknown) {
      showAdminToast('error', 'Hata!', err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [dateRange, featureFilter]);
  
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      loadData(true);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  useEffect(() => {
    if (page > 1) {
      loadData(false);
    }
  }, [page]);

  return (
    <div className="space-y-6">
      
      {/* Filtreler */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="today">Bugün</option>
            <option value="7d">Son 7 Gün</option>
            <option value="30d">Son 30 Gün</option>
            <option value="all">Tüm Zamanlar</option>
          </select>

          <select 
            value={featureFilter} 
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Özellikler</option>
            <option value="chat">Genel Sohbet</option>
            <option value="dashboard_coach">Dashboard AI Koç</option>
            <option value="portfolio_marketing">Portföy Pazarlama</option>
            <option value="whatsapp_analysis">WhatsApp Analizi</option>
            <option value="smart_match">Smart Match</option>
            <option value="document_automation">Doküman Otomasyonu</option>
            <option value="admin_sql">Admin Raporu</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Kullanıcı ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading && !summary && (
        <div className="h-40 flex items-center justify-center text-slate-500 font-medium font-mono">
          Yükleniyor...
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-slate-500 font-bold mb-1">Toplam AI İsteği</div><div className="text-2xl font-black">{formatToken(summary.totalRequests)}</div></div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center"><Activity /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-slate-500 font-bold mb-1">Toplam Token</div><div className="text-2xl font-black">{formatToken(summary.totalTokens)}</div></div>
            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center"><Cpu /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-slate-500 font-bold mb-1">Tahmini Maliyet</div><div className="text-2xl font-black">{formatTRY(summary.estimatedCostTRY)}</div></div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><Zap /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-slate-500 font-bold mb-1">Ort. Token / İstek</div><div className="text-2xl font-black">{formatToken(summary.avgTokensPerRequest)}</div></div>
            <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center"><ChevronDown /></div>
          </div>
          {summary.errorCount > 0 && (
            <div className="col-span-full md:col-span-2 lg:col-span-4 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24}/>
              <div>
                <div className="font-bold text-red-800">Hatalı İstekler Saptandı</div>
                <div className="text-sm text-red-600">Seçili aralıkta {summary.errorCount} adet hata dondüren (4xx/5xx) istek bulundu.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breakdowns */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Features */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 lg:col-span-1">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Cpu size={18}/> Özellik Bazlı Kullanım</h3>
            <div className="space-y-4">
              {summary.topFeatures.length === 0 && <div className="text-sm text-slate-500 font-medium">Veri yok.</div>}
              {summary.topFeatures.map(f => (
                <div key={f.label} className="flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-700 truncate">{featureKeyToLabel(f.label)}</div>
                    <div className="text-xs text-slate-500">{formatToken(f.requests)} İstek</div>
                  </div>
                  <div className="text-right whitespace-nowrap ml-4">
                    <div className="text-sm font-bold text-slate-900">{formatTRY(f.cost)}</div>
                    <div className="text-xs text-slate-500">{formatToken(f.tokens)} tkn</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18}/> En Çok Token Harcayanlar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 text-xs font-bold text-slate-400">Kullanıcı</th>
                    <th className="py-2 text-xs font-bold text-slate-400">Paket</th>
                    <th className="py-2 text-xs font-bold text-slate-400 text-right">İstek</th>
                    <th className="py-2 text-xs font-bold text-slate-400 text-right">Token</th>
                    <th className="py-2 text-xs font-bold text-slate-400 text-right">Tahmini Maliyet</th>
                  </tr>
                </thead>
                <tbody>
                  {(!summary.topUsers || summary.topUsers.length === 0) && (
                    <tr><td colSpan={5} className="py-4 text-center text-sm text-slate-500">Veri yok.</td></tr>
                  )}
                  {summary.topUsers?.map(u => (
                    <tr key={u.userId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{u.name}</div>
                        <div className="text-xs text-slate-500">{maskEmail(u.email)}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded">{u.tier}</span>
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-600">{formatToken(u.requests)}</td>
                      <td className="py-3 text-right text-sm font-bold text-slate-700">{formatToken(u.tokens)}</td>
                      <td className="py-3 text-right text-sm font-black text-rose-500">{formatTRY(u.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Zap size={18}/> Son AI Kullanım Kayıtları</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Tarih</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Kullanıcı</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Özellik / Model</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Prmpt / Comp / Toplam</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Durum</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    Henüz AI kullanım kaydı yok. Yeni başarılı AI istekleri burada görünür.
                  </td>
                </tr>
              )}
              {logs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{log.user_profile?.display_name || 'Bilinmiyor'}</div>
                    <div className="text-xs text-slate-500">{log.user_profile?.email ? maskEmail(log.user_profile.email) : ''}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-bold text-slate-700">{featureKeyToLabel(log.feature_key)}</div>
                    <div className="text-xs text-slate-500">{modelToLabel(log.model_name)}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-xs text-slate-500 space-x-1">
                      <span className="inline-block" title="Prompt Tokens">{formatToken(log.prompt_tokens || 0)}</span>
                      <span>/</span>
                      <span className="inline-block" title="Completion Tokens">{formatToken(log.completion_tokens || 0)}</span>
                    </div>
                    <div className="text-sm font-black text-indigo-600 font-mono mt-0.5">{formatToken(log.total_tokens || 0)}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(log.status_code && log.status_code >= 400) ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Hata {log.status_code}</span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">200 OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMore && !searchQuery && logs.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
