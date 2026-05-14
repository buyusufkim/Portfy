import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState('info');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await api.getAdminAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await api.createAdminAnnouncement({ title: newTitle, body: newBody, type: newType });
      setNewTitle('');
      setNewBody('');
      fetchAnnouncements();
    } catch (e) {
      alert("Hata");
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Silinsin mi?")) return;
    try {
      await api.deleteAdminAnnouncement(id);
      fetchAnnouncements();
    } catch (e) {
      alert("Hata");
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await api.updateAdminAnnouncement(id, { is_active: !current });
      fetchAnnouncements();
    } catch (e) {
      alert("Hata");
    }
  };

  if (loading) return (
    <div className="flex flex-col flex-1 items-center justify-center p-12 text-slate-500">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-medium">Duyurular Yükleniyor...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
          <Megaphone className="text-indigo-600" size={20} /> Yeni Duyuru
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
               <label className="block text-xs font-bold text-slate-500 mb-2">Başlık</label>
               <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 outline-none placeholder-slate-400" placeholder="Örn: Yeni Özellik Eklendi!" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-2">Duyuru Tipi</label>
               <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 outline-none" value={newType} onChange={e => setNewType(e.target.value)}>
                 <option value="info">Bilgilendirme (Mavi)</option>
                 <option value="success">Başarılı (Yeşil)</option>
                 <option value="warning">Uyarı (Turuncu)</option>
                 <option value="danger">Gecikme/Sorun (Kırmızı)</option>
               </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">İçerik (Markup desteklenir)</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm text-slate-700 outline-none placeholder-slate-400" placeholder="Tüm kullanıcılara gösterilecek mesaj içeriği..." value={newBody} onChange={e => setNewBody(e.target.value)} rows={3}></textarea>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleCreate} className="w-full md:w-auto h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
              <Plus size={18}/> Oluştur ve Yayınla
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className={`p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all relative overflow-hidden group ${!a.is_active ? 'opacity-60 grayscale' : ''}`}>
             <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${a.type === 'success' ? 'bg-emerald-500' : a.type === 'danger' ? 'bg-rose-500' : a.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
            <div className="pl-4">
              <div className="flex items-center gap-3 mb-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${a.type === 'success' ? 'bg-emerald-100 text-emerald-700' : a.type === 'danger' ? 'bg-rose-100 text-rose-700' : a.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{a.type}</span>
                <h4 className="font-bold text-slate-900">{a.title}</h4>
              </div>
              <p className="text-sm text-slate-500 font-medium">{a.body}</p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center pl-4 md:pl-0">
              <button onClick={() => toggleStatus(a.id, a.is_active)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors border ${a.is_active ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'}`}>
                {a.is_active ? 'Yayından Kaldır' : 'Yayına Al'}
              </button>
              <button title="Sil" onClick={() => handleDelete(a.id)} className="p-2.5 text-slate-400 border border-slate-200 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                <Trash2 size={16}/>
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 font-medium flex flex-col items-center gap-3 bg-white border border-slate-100 rounded-3xl">
             <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
               <AlertCircle size={24} />
             </div>
             Henüz içerik eklenmemiş.
          </div>
        )}
      </div>
    </div>
  );
};
