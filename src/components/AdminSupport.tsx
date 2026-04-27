import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await api.getAdminSupportTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateAdminSupportTicket(id, { status });
      fetchTickets();
    } catch (e) {
      alert("Hata");
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      {tickets.length === 0 && <p className="text-slate-500">Talep bulunmuyor.</p>}
      {tickets.map(t => (
        <div key={t.id} className="p-4 bg-white rounded-2xl border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <span className={`px-2 py-1 text-xs font-bold rounded-lg ${t.status === 'open' ? 'bg-red-100 text-red-700' : t.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {t.status.toUpperCase()}
              </span>
              <h4 className="font-bold text-lg mt-2">{t.subject}</h4>
              <p className="text-sm text-slate-500">{t.user?.display_name} ({t.user?.email})</p>
            </div>
            <div className="text-sm">
              <select value={t.status} onChange={e => handleUpdateStatus(t.id, e.target.value)} className="border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="open">Açık</option>
                <option value="reviewing">İnceleniyor</option>
                <option value="resolved">Çözüldü</option>
              </select>
            </div>
          </div>
          <p className="mt-4 text-slate-700 bg-slate-50 p-3 rounded-lg text-sm">{t.message}</p>
        </div>
      ))}
    </div>
  );
};
