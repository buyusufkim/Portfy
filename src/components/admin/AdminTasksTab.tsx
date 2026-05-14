import React, { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';
import { AdminToastType, AdminConfirmIntent } from './AdminFeedback';

export interface AdminTaskTemplate {
  id: string;
  title: string;
  description?: string | null;
  points: number;
  category?: 'sweet' | 'main' | string | null;
  auto_verify?: boolean | null;
  is_active?: boolean | null;
  recurrence_type?: 'once' | 'daily' | 'interval' | 'weekly' | 'monthly' | string | null;
  interval_days?: number | null;
  recurrence_days?: number[] | null;
  day_of_month?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  target_scope?: 'all' | 'free' | 'trial' | 'master' | string | null;
  auto_generate?: boolean | null;
  action_type?: string | null;
  created_at?: string | null;
}

const getErrorMessage = (error: unknown, fallback = 'Bilinmeyen bir hata oluştu') => {
  return error instanceof Error ? error.message : String(error);
};

type AdminTasksTabProps = {
  showAdminToast: (type: AdminToastType, title: string, message?: string) => void;
  openAdminConfirm: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    intent: AdminConfirmIntent;
    onConfirm: () => void | Promise<void>;
  }) => void;
  closeAdminConfirm: () => void;
};

export const AdminTasksTab: React.FC<AdminTasksTabProps> = ({ showAdminToast, openAdminConfirm, closeAdminConfirm }) => {
  const [taskTemplates, setTaskTemplates] = useState<AdminTaskTemplate[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all'|'active'|'inactive'|'auto'|'manual'>('all');
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all'|'free'|'trial'|'master'>('all');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(10);
  const [newTaskCategory, setNewTaskCategory] = useState<'sweet' | 'main'>('sweet');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAutoVerify, setNewTaskAutoVerify] = useState(true);
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState<'once'|'daily'|'interval'|'weekly'|'monthly'>('once');
  const [newTaskIntervalDays, setNewTaskIntervalDays] = useState<number>(2);
  const [newTaskRecurrenceDays, setNewTaskRecurrenceDays] = useState<number[]>([]);
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState<number>(1);
  const [newTaskStartDate, setNewTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskTargetScope, setNewTaskTargetScope] = useState<'all'|'free'|'trial'|'master'>('all');
  const [newTaskAutoGenerate, setNewTaskAutoGenerate] = useState(false);
  const [newTaskActionType, setNewTaskActionType] = useState('general');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setTasksLoading(true);
    const { data } = await supabase.from('task_templates').select('*').order('created_at', { ascending: false });
    if (data) setTaskTemplates(data as AdminTaskTemplate[]);
    setTasksLoading(false);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle) {
      showAdminToast("warning", "Uyarı", "Görev adı boş olamaz!");
      return;
    }
    try {
      await api.adminCreateTaskTemplate({
        title: newTaskTitle, points: newTaskPoints, category: newTaskCategory, description: newTaskDescription, auto_verify: newTaskAutoVerify,
        recurrence_type: newTaskRecurrenceType, interval_days: newTaskIntervalDays, recurrence_days: newTaskRecurrenceDays, day_of_month: newTaskDayOfMonth,
        start_date: newTaskStartDate, end_date: newTaskEndDate || null, target_scope: newTaskTargetScope, auto_generate: newTaskAutoGenerate, action_type: newTaskActionType
      });
      setNewTaskTitle(''); setNewTaskPoints(10); setNewTaskDescription(''); setNewTaskAutoVerify(true);
      setNewTaskRecurrenceType('once'); setNewTaskIntervalDays(2); setNewTaskRecurrenceDays([]); setNewTaskDayOfMonth(1);
      setNewTaskStartDate(new Date().toISOString().split('T')[0]); setNewTaskEndDate(''); setNewTaskTargetScope('all'); setNewTaskAutoGenerate(false); setNewTaskActionType('general');
      fetchTasks();
    } catch (error) {
      showAdminToast("error", "Hata", "Görev eklenirken hata: " + getErrorMessage(error));
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.adminUpdateTaskTemplate(id, { is_active: !currentStatus }); fetchTasks();
    } catch (error) {
      showAdminToast("error", "Hata", "Durum güncellenirken hata: " + getErrorMessage(error));
    }
  };

  const deleteTask = async (id: string) => {
    openAdminConfirm({
      title: "Görev şablonunu sil",
      message: "Bu görev şablonunu silmek istediğinize emin misiniz? Bu işlem yeni görev üretimini etkileyebilir.",
      intent: 'danger',
      confirmLabel: 'Sil',
      onConfirm: async () => {
        try {
          await api.adminDeleteTaskTemplate(id); fetchTasks(); 
          closeAdminConfirm();
        } catch (error) {
          showAdminToast("error", "Hata", "Görev silinirken hata: " + getErrorMessage(error));
          closeAdminConfirm();
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Oyunlaştırma: Görev Havuzu</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Kullanıcıların XP kazanıp seviye atlayabileceği görev şablonları.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-2xl font-black text-slate-900">{taskTemplates.length}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Toplam</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col">
          <span className="text-2xl font-black text-emerald-700">{taskTemplates.filter(t => t.is_active).length}</span>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Aktif</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <span className="text-2xl font-black text-slate-700">{taskTemplates.filter(t => !t.is_active).length}</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Pasif</span>
        </div>
        <div className="bg-teal-50 p-4 rounded-2xl shadow-sm border border-teal-100 flex flex-col">
          <span className="text-2xl font-black text-teal-700">{taskTemplates.filter(t => t.auto_generate).length}</span>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-1">Oto Üretim</span>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">Görev Adı</label><input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
          <div className="w-full md:w-32"><label className="block text-xs font-bold text-slate-500 mb-2">Puan (XP)</label><input type="number" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
          <div className="w-full md:w-48"><label className="block text-xs font-bold text-slate-500 mb-2">Görev Kategorisi</label><select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as 'sweet' | 'main')} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"><option value="sweet">Tatlı Görev (Kolay XP)</option><option value="main">Ana Görev (Saha Görevi)</option></select></div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">Görev Açıklaması / Talimatlar</label><input type="text" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder-slate-400" placeholder="Örn: Müşteri ile en az 10 dakikalık bir görüşme yap ve notlarını CRM'e gir." /></div>
        </div>

        {/* YENİ ALANLAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Tekrar Tipi</label>
            <select value={newTaskRecurrenceType} onChange={e => setNewTaskRecurrenceType(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
              <option value="once">Tek Seferlik</option>
              <option value="daily">Günlük</option>
              <option value="interval">Belirli Aralık</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>
          {newTaskRecurrenceType === 'interval' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Kaç günde bir? (Örn: 2)</label>
              <input type="number" min={1} value={newTaskIntervalDays} onChange={e => setNewTaskIntervalDays(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
            </div>
          )}
          {newTaskRecurrenceType === 'monthly' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Ayın Hangi Günü? (1-31)</label>
              <input type="number" min={1} max={31} value={newTaskDayOfMonth} onChange={e => setNewTaskDayOfMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
            </div>
          )}
          {newTaskRecurrenceType === 'weekly' && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-2">Haftanın Günleri (0=Pazar, 1=Pzt...)</label>
              <div className="flex gap-2 flex-wrap">
                {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((d, i) => (
                  <button key={i} type="button" onClick={() => setNewTaskRecurrenceDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${newTaskRecurrenceDays.includes(i) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'}`}>{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Aksiyon Tipi</label>
            <select value={newTaskActionType} onChange={e => setNewTaskActionType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
              <option value="general">Genel</option>
              <option value="content_story">Günlük Story</option>
              <option value="content_reels">Reels / İçerik</option>
              <option value="crm_visit">CRM Ziyareti</option>
              <option value="crm_call">CRM Araması</option>
              <option value="property_check">Portföy Kontrolü</option>
              <option value="bolgem_visit">Bölgem Ziyareti</option>
              <option value="daily_start">Gün Başlatma</option>
              <option value="daily_close">Gün Kapatma</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Hedef Kitle</label>
            <select value={newTaskTargetScope} onChange={e => setNewTaskTargetScope(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
              <option value="all">Tüm Kullanıcılar</option>
              <option value="free">Girişimci</option>
              <option value="trial">Master Deneme</option>
              <option value="master">Master</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Başlangıç Tarihi</label>
            <input type="date" value={newTaskStartDate} onChange={e => setNewTaskStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Bitiş Tarihi (Opsiyonel)</label>
            <input type="date" value={newTaskEndDate} onChange={e => setNewTaskEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 border-t border-slate-100 pt-6">
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" checked={newTaskAutoVerify} onChange={e => setNewTaskAutoVerify(e.target.checked)} className="peer sr-only" />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
              <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Otomatik Doğrula</span></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input type="checkbox" checked={newTaskAutoGenerate} onChange={e => setNewTaskAutoGenerate(e.target.checked)} className="peer sr-only" />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
              </div>
              <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Otomatik Üret</span><span className="text-[10px] text-slate-500">Hedef kitleye her gün uygunsa üretilir</span></div>
            </label>
          </div>
          <button onClick={handleAddTask} className="w-full md:w-auto h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20">Görev Oluştur</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center">
          <div className="relative flex-1 w-full xl:w-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Görev ara (isim, açıklama, aksiyon)..." value={taskSearchQuery} onChange={e => setTaskSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium" />
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl">
               <button onClick={() => setTaskStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskStatusFilter === 'all' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Tümü</button>
               <button onClick={() => setTaskStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskStatusFilter === 'active' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Aktif</button>
               <button onClick={() => setTaskStatusFilter('inactive')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskStatusFilter === 'inactive' ? 'bg-white shadow-sm text-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>Pasif</button>
               <button onClick={() => setTaskStatusFilter('auto')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskStatusFilter === 'auto' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>Oto Üretim</button>
               <button onClick={() => setTaskStatusFilter('manual')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskStatusFilter === 'manual' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>Manuel</button>
            </div>
            <div className="flex gap-2 bg-slate-50 p-1 rounded-xl items-center">
               <select value={taskScopeFilter} onChange={e => setTaskScopeFilter(e.target.value as any)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none px-2 py-1 border-none cursor-pointer">
                 <option value="all">Tüm Kitleler</option>
                 <option value="free">Girişimci</option>
                 <option value="trial">Master Deneme</option>
                 <option value="master">Master</option>
               </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {tasksLoading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Görev Adı</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Açıklama</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kategori & Puan</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ayarlar</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Aktiflik</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taskTemplates.filter(t => {
                  if (taskStatusFilter === 'active' && !t.is_active) return false;
                  if (taskStatusFilter === 'inactive' && t.is_active) return false;
                  if (taskStatusFilter === 'auto' && !t.auto_generate) return false;
                  if (taskStatusFilter === 'manual' && t.auto_generate) return false;
                
                  if (taskScopeFilter !== 'all' && t.target_scope !== taskScopeFilter) return false;
                
                  if (taskSearchQuery) {
                    const q = taskSearchQuery.toLowerCase();
                    return (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.action_type?.toLowerCase().includes(q));
                  }
                  return true;
                }).map(task => (
                  <tr key={task.id} className={`hover:bg-slate-50 ${!task.is_active ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-900">{task.title}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{task.description || '-'}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${task.category === 'main' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{task.category === 'main' ? 'ANA GÖREV' : 'TATLI GÖREV'}</span><span className="ml-2 text-xs font-bold text-amber-500">+{task.points} XP</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{task.recurrence_type === 'once' ? 'Tek Sefer' : task.recurrence_type === 'daily' ? 'Günlük' : task.recurrence_type === 'interval' ? `${task.interval_days} Günde Bir` : task.recurrence_type === 'weekly' ? 'Haftalık' : 'Aylık'}</span>
                        {task.auto_generate && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Oto Üretim</span>}
                        {task.auto_verify && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">Oto Onay</span>}
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">{task.target_scope === 'all' ? 'Tümü' : task.target_scope === 'free' ? 'Girişimci' : task.target_scope === 'trial' ? 'Deneme' : 'Master'}</span>
                        {task.action_type !== 'general' && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded max-w-[100px] truncate" title={task.action_type}>{task.action_type}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center"><button onClick={() => toggleTaskStatus(task.id, task.is_active || false)} className={`w-10 h-5 rounded-full relative transition-colors ${task.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${task.is_active ? 'translate-x-5' : 'translate-x-1'}`} /></button></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Sil"><Trash2 size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
