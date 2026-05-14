import React, { useState, useEffect } from 'react';
import { adminSystemHealthService, AdminSystemHealth, RuntimeErrorLog, RuntimeErrorSummary } from '../../services/adminSystemHealthService';
import { maskEmail } from '../../utils/masking';
import { Activity, Server, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw, Search, HardDrive, Cpu, AlertOctagon } from 'lucide-react';

type AdminSystemHealthTabProps = {
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
};

export const AdminSystemHealthTab: React.FC<AdminSystemHealthTabProps> = ({ showAdminToast }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [logs, setLogs] = useState<RuntimeErrorLog[]>([]);
  const [summary, setSummary] = useState<RuntimeErrorSummary | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [sourceFilter, setSourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (resetPage = false, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setPage(1);
        setHasMore(true);
      }

      // Sadece sayfa 1 iken health API çağır veya refresh ise
      if (currentPage === 1) {
        const h = await adminSystemHealthService.getSystemHealth();
        setHealth(h);
      }

      const limit = 50;
      const fetchedLogs = await adminSystemHealthService.getRuntimeErrorLogs({
        limit: limit * currentPage,
        sourceFilter,
        severityFilter,
        search: searchQuery
      });

      setLogs(fetchedLogs);
      
      // Calculate summary based on current fetched logs (simplified MVP)
      if (currentPage === 1 && !searchQuery && sourceFilter === 'all' && severityFilter === 'all') {
         setSummary(adminSystemHealthService.calculateSummary(fetchedLogs));
      }

      if (fetchedLogs.length < limit * currentPage && !searchQuery) {
        setHasMore(false);
      }

    } catch (err: unknown) {
      showAdminToast('error', 'Hata!', err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [sourceFilter, severityFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      loadData(true);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (page > 1) {
      loadData(false);
    }
  }, [page]);

  const handleRefresh = () => {
    loadData(true, true);
  };

  const getHealthStatusColor = (ok: boolean) => ok ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50';
  
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">Critical</span>;
      case 'error': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">Error</span>;
      case 'warning': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">Warning</span>;
      case 'info': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 uppercase">Info</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">{sev}</span>;
    }
  };

  const getSourceBadge = (src: string) => {
    switch (src) {
      case 'server': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">{src}</span>;
      case 'ai': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 border border-purple-100 text-purple-700 uppercase">{src}</span>;
      case 'market': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 border border-orange-100 text-orange-700 uppercase">{src}</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 uppercase">{src}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sistem Sağlığı & Loglar</h2>
          <p className="text-sm text-slate-500">API, Supabase, AI sağlayıcı, market servisi ve runtime hata takibi.</p>
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

      {loading && !health && (
        <div className="h-40 flex items-center justify-center text-slate-500 font-medium font-mono">
          Yükleniyor...
        </div>
      )}

      {/* API Health Cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-slate-700 font-bold"><Server size={18} /> Master API</div>
               <div className={`p-1.5 rounded-lg ${getHealthStatusColor(health.checks.api.ok)}`}>
                 {health.checks.api.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
               </div>
             </div>
             <div className="text-sm font-medium text-slate-500">Node: {health.nodeVersion}</div>
             <div className="text-xs text-slate-400">Çalışma: {Math.floor(health.uptimeSeconds / 60)} dk</div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-slate-700 font-bold"><HardDrive size={18} /> Supabase</div>
               <div className={`p-1.5 rounded-lg ${getHealthStatusColor(health.checks.supabase.ok)}`}>
                 {health.checks.supabase.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
               </div>
             </div>
             <div className="text-sm font-medium text-slate-500 truncate">{health.checks.supabase.message}</div>
             {health.checks.supabase.latencyMs > 0 && <div className="text-xs text-slate-400">Gecikme: {health.checks.supabase.latencyMs}ms</div>}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-slate-700 font-bold"><Cpu size={18} /> AI Provider</div>
               <div className={`p-1.5 rounded-lg ${getHealthStatusColor(health.checks.aiProvider.ok)}`}>
                 {health.checks.aiProvider.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
               </div>
             </div>
             <div className="text-sm font-medium text-slate-500">{health.checks.aiProvider.message}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-slate-700 font-bold"><Activity size={18} /> Market Scraper</div>
               <div className={`p-1.5 rounded-lg ${getHealthStatusColor(health.checks.marketProvider.ok)}`}>
                 {health.checks.marketProvider.ok ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
               </div>
             </div>
             <div className="text-sm font-medium text-slate-500">{health.checks.marketProvider.message}</div>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
             <div className="text-xs font-bold text-slate-400 mb-1">Toplam (Önbellek)</div>
             <div className="text-2xl font-black text-slate-700">{summary.totalCount}</div>
           </div>
           <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col justify-center items-center text-center">
             <div className="text-xs font-bold text-rose-400 mb-1">Critical</div>
             <div className="text-2xl font-black text-rose-600">{summary.criticalCount}</div>
           </div>
           <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-center items-center text-center">
             <div className="text-xs font-bold text-red-400 mb-1">Error</div>
             <div className="text-2xl font-black text-red-600">{summary.errorCount}</div>
           </div>
           <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-center items-center text-center">
             <div className="text-xs font-bold text-amber-500 mb-1">Warning</div>
             <div className="text-2xl font-black text-amber-600">{summary.warningCount}</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center hidden lg:flex">
             <div className="text-xs font-bold text-slate-400 mb-1">Son 24 Saat</div>
             <div className="text-2xl font-black text-indigo-600">{summary.last24HoursCount}</div>
           </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2">
          <select 
            value={sourceFilter} 
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Kaynaklar</option>
            <option value="server">Server</option>
            <option value="ai">AI</option>
            <option value="market">Market</option>
            <option value="portal">Portal</option>
            <option value="meta">Meta</option>
            <option value="unknown">Unknown</option>
          </select>

          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">Tüm Seviyeler</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Mesaj, Request ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Tarih</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Kaynak</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Seviye</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Durum</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase">Mesaj / API</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    Henüz runtime hata kaydı yok.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 w-32 align-top">
                     <div className="text-[11px] font-mono text-slate-500">
                       {new Date(log.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                     </div>
                  </td>
                  <td className="py-3 px-4 w-24 align-top">
                    {getSourceBadge(log.source)}
                  </td>
                  <td className="py-3 px-4 w-24 align-top">
                    {getSeverityBadge(log.severity)}
                  </td>
                  <td className="py-3 px-4 w-20 align-top">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.status_code || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 align-top">
                     <div className="text-sm font-bold text-slate-800 break-words mb-1">
                       {log.message}
                     </div>
                     <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wide mt-2">
                       {log.route && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{log.method} {log.route}</span>}
                       {log.user && <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded max-w-xs truncate" title={log.user.email}>User: {maskEmail(log.user.email)}</span>}
                       {log.request_id && <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono" title={log.request_id}>Req: {log.request_id.split('-')[0]}...</span>}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && !searchQuery && logs.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all border border-slate-200 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
