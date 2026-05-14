import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, History } from 'lucide-react';
import { api } from '../services/api';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getAdminAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col flex-1 items-center justify-center p-12 text-slate-500">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-medium">Kayıtlar Yükleniyor...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
         <div>
           <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Activity className="text-indigo-600" size={20}/> Audit Log
           </h3>
           <p className="text-sm font-medium text-slate-500 mt-1">Yönetici tarafından yapılan son 100 işlemin geçmişi.</p>
         </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-4">Tarih</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">İşlem</th>
              <th className="px-6 py-4">Hedef</th>
              <th className="px-6 py-4 text-right">Metadata</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
             {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <History size={24} />
                      </div>
                      Kayıt bulunamadı.
                    </div>
                  </td>
                </tr>
             )}
             {logs.map(log => (
               <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs font-medium">{new Date(log.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                 <td className="px-6 py-4 font-bold text-slate-900">{log.admin?.display_name || 'Sistem'}</td>
                 <td className="px-6 py-4"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100">{log.action}</span></td>
                 <td className="px-6 py-4 text-slate-600 font-medium">{log.target?.display_name || '-'}</td>
                 <td className="px-6 py-4 text-slate-400 font-mono text-[10px] break-all max-w-[200px] text-right">
                    {JSON.stringify(log.metadata) === "{}" ? "-" : JSON.stringify(log.metadata)}
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
