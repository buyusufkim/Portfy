import React, { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import { api } from '../services/api';

export const AdminUserNotes: React.FC<{ userId: string }> = ({ userId }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    try {
      const data = await api.getAdminUserNotes(userId);
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    try {
      await api.createAdminUserNote(userId, newNote);
      setNewNote('');
      fetchNotes();
    } catch (e) {
      alert("Note add failed");
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Silinsin mi?")) return;
    try {
      await api.deleteAdminUserNote(id);
      fetchNotes();
    } catch(e) {
      alert("Note delete failed");
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
      <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-sm flex justify-between items-center">
         Admin Notları
         <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{notes.length}</span>
      </h4>
      <div className="space-y-3 mb-4 max-h-[150px] overflow-y-auto pr-2">
         {notes.length === 0 && <p className="text-xs text-slate-500 text-center italic py-2">Henüz admin notu yok.</p>}
         {notes.map(note => (
           <div key={note.id} className="bg-white p-3 rounded-xl border border-slate-200 text-sm flex gap-2 relative group">
              <div className="flex-1">
                 <p className="text-slate-800">{note.note}</p>
                 <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-500">{note.admin?.display_name || 'Admin'}</span>
                    <span>{new Date(note.created_at).toLocaleString('tr-TR')}</span>
                 </div>
              </div>
              <button onClick={() => handleDelete(note.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14}/>
              </button>
           </div>
         ))}
      </div>
      <div className="flex flex-col gap-2 relative">
         <textarea 
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none resize-none focus:border-indigo-400" 
            rows={2} 
            placeholder="Kullanıcı hakkında özel notlar ekleyin..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                }
            }}
         ></textarea>
         <button onClick={handleAdd} className="absolute right-2 bottom-2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition">
            <Save size={14}/>
         </button>
      </div>
    </div>
  );
};
