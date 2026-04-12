import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  StickyNote, 
  CheckCircle2, 
  Trash2, 
  Calendar, 
  Clock, 
  X,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { UserNote, PersonalTask } from '../types';
import { Card, Badge } from './UI';

export const NotesView = () => {
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_NOTES],
    queryFn: api.getNotes
  });

  const { data: personalTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_TASKS],
    queryFn: api.getPersonalTasks
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.addNote({ title: 'Hızlı Not', content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_NOTES] });
      setShowAddNote(false);
    }
  });

  const addPersonalTaskMutation = useMutation({
    mutationFn: api.addPersonalTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS] });
      setShowAddTask(false);
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (task: PersonalTask) => api.updatePersonalTask(task.id, { is_completed: !task.is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS] })
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_NOTES] })
  });

  const deletePersonalTaskMutation = useMutation({
    mutationFn: api.deletePersonalTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS] })
  });

  return (
    <div className="p-6 space-y-8 pb-32 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notlarım & Görevlerim</h1>
          <p className="text-slate-500 text-sm mt-1">Kişisel ajandan ve hızlı notların.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddNote(true)}
            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <StickyNote size={20} />
          </button>
          <button 
            onClick={() => setShowAddTask(true)}
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 transition-all active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-orange-600" />
              Kişisel Görevler
            </h2>
            <Badge variant="default">{personalTasks.filter(t => !t.is_completed).length} Bekleyen</Badge>
          </div>

          <div className="space-y-3">
            {tasksLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse" />)
            ) : personalTasks.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 text-xs font-medium">Henüz görev eklenmemiş.</p>
              </div>
            ) : personalTasks.map(task => (
              <Card key={task.id} className={`p-5 transition-all ${task.is_completed ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleTaskMutation.mutate(task)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-orange-500'
                    }`}
                  >
                    {task.is_completed && <CheckCircle2 size={14} />}
                  </button>
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </div>
                    {task.reminder_time && (
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold mt-1">
                        <Clock size={10} />
                        <span>{new Date(task.reminder_time).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deletePersonalTaskMutation.mutate(task.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <StickyNote size={18} className="text-purple-600" />
              Hızlı Notlar
            </h2>
            <Badge variant="default">{notes.length} Not</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notesLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse" />)
            ) : notes.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 text-xs font-medium">Henüz not eklenmemiş.</p>
              </div>
            ) : notes.map(note => (
              <Card key={note.id} className="p-6 bg-slate-50 border-none hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </div>
                  <button 
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-4">
                  {note.content}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Yeni Görev</h2>
                <button onClick={() => setShowAddTask(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addPersonalTaskMutation.mutate({
                  title: formData.get('title') as string,
                  is_completed: false,
                  priority: 'medium',
                  reminder_time: formData.get('reminderTime') as string || undefined
                });
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Görev Başlığı</label>
                  <input 
                    name="title"
                    required
                    autoFocus
                    placeholder="Ne yapılması gerekiyor?"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hatırlatıcı (Opsiyonel)</label>
                  <input 
                    name="reminderTime"
                    type="datetime-local"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={addPersonalTaskMutation.isPending}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                >
                  {addPersonalTaskMutation.isPending ? 'Ekleniyor...' : 'Görev Ekle'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Hızlı Not</h2>
                <button onClick={() => setShowAddNote(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addNoteMutation.mutate(formData.get('content') as string);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not İçeriği</label>
                  <textarea 
                    name="content"
                    required
                    autoFocus
                    placeholder="Aklındakileri buraya yaz..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-40 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={addNoteMutation.isPending}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20"
                >
                  {addNoteMutation.isPending ? 'Kaydediliyor...' : 'Notu Kaydet'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
