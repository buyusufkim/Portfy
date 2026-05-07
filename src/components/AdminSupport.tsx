import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, SearchX } from 'lucide-react';
import { api } from '../services/api';
import { maskEmail } from '../utils/masking';

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

  if (loading) return (
    <div className="flex flex-col flex-1 items-center justify-center p-12 text-slate-500">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-medium">Destek Talepleri Yükleniyor...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {tickets.length === 0 && (
         <div className="bg-white rounded-[24px] border border-slate-100 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
               <SearchX size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Kayıt Bulunamadı</h3>
            <p className="text-slate-500 font-medium mt-1">Şu anda yanıt bekleyen bir destek talebi bulunmuyor.</p>
         </div>
      )}
      {tickets.map(t => (
        <div key={t.id} className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3">
                 <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${t.status === 'open' ? 'bg-rose-100 text-rose-700 border border-rose-200' : t.status === 'reviewing' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                   {t.status === 'open' ? 'Açık' : t.status === 'reviewing' ? 'İnceleniyor' : 'Çözüldü'}
                 </span>
                 <span className="text-xs text-slate-400 font-medium">{new Date(t.created_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h4 className="font-bold text-lg mt-3 text-slate-900">{t.subject}</h4>
              <p className="text-sm text-slate-500 font-medium">{t.user?.display_name || 'İsimsiz Kullanıcı'} <span className="text-slate-400">({maskEmail(t.user?.email)})</span></p>
            </div>
            <div className="text-sm shrink-0">
              <select value={t.status} onChange={e => handleUpdateStatus(t.id, e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all cursor-pointer">
                <option value="open">Açık</option>
                <option value="reviewing">İnceleniyor</option>
                <option value="resolved">Çözüldü</option>
              </select>
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 whitespace-pre-wrap">{t.message}</p>
        </div>
      ))}
    </div>
  );
};
