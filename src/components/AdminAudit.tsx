import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
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

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
         <h3 className="font-bold flex items-center gap-2"><Activity className="text-indigo-500"/> Audit Log (Son 100 İşlem)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Tarih</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">İşlem</th>
              <th className="px-6 py-4">Hedef</th>
              <th className="px-6 py-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
             {logs.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
             )}
             {logs.map(log => (
               <tr key={log.id} className="hover:bg-slate-50">
                 <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                 <td className="px-6 py-3 font-medium text-slate-900">{log.admin?.display_name || 'Sistem'}</td>
                 <td className="px-6 py-3"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-mono text-[10px] uppercase rounded">{log.action}</span></td>
                 <td className="px-6 py-3 text-slate-600">{log.target?.display_name || '-'}</td>
                 <td className="px-6 py-3 text-slate-400 font-mono text-[10px] break-all max-w-[200px]">
                    {JSON.stringify(log.metadata)}
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
