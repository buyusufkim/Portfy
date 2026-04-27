import React, { useState, useEffect } from 'react';
import { Briefcase, Trash2, Plus } from 'lucide-react';
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

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200">
        <h3 className="font-bold mb-4">Yeni Duyuru</h3>
        <div className="space-y-3">
          <input className="w-full border rounded-xl px-4 py-2" placeholder="Başlık" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <textarea className="w-full border rounded-xl px-4 py-2" placeholder="İçerik" value={newBody} onChange={e => setNewBody(e.target.value)} rows={3}></textarea>
          <div className="flex justify-between items-center">
            <select className="border rounded-xl px-4 py-2" value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
            <button onClick={handleCreate} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> Oluştur</button>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className={`p-4 bg-white border ${a.is_active ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-slate-300 opacity-60'} rounded-xl shadow-sm flex justify-between items-center`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-500">{a.type}</span>
                <h4 className="font-bold">{a.title}</h4>
              </div>
              <p className="text-sm text-slate-600 mt-1">{a.body}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleStatus(a.id, a.is_active)} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{a.is_active ? 'Kapat' : 'Aç'}</button>
              <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
