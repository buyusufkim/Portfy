import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Tag, X, Calendar, Edit2, Trash2, 
  Check, Save, Clock, FolderPlus, MoreVertical, Notebook,
  Archive, AlertCircle, FileText, Lock, Sparkles
} from 'lucide-react';
import { Card, Badge, Skeleton } from './UI';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { useAuth } from '../AuthContext';
import { UserNote, ContentCalendar } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// 🔥 LİMİT VE SATIŞ EKRANI İÇİN EKLENTİLER 🔥
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeModal } from './premium/UpgradeModal';

export const NotesView = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Note Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [noteColor, setNoteColor] = useState('bg-slate-50');

  // 🔥 LİMİT KONTROLLERİ 🔥
  const { isFree, subscribe } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Content Calendar State
  const { data: properties = [] } = useQuery({
    queryKey: ['properties', profile?.id],
    queryFn: api.getProperties,
    enabled: !!profile?.id
  });

  const [showContentPlanner, setShowContentPlanner] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [contentPlatform, setContentPlatform] = useState('Instagram Reels');

  const { data: contentCalendars = [] } = useQuery({
    queryKey: ['contentCalendars', profile?.id],
    queryFn: api.momentumOs.getContentCalendar,
    enabled: !!profile?.id
  });

  const addContentCalendarMutation = useMutation({
    mutationFn: (data: Partial<ContentCalendar>) => api.momentumOs.addContentCalendar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendars', profile?.id] });
      setShowContentPlanner(false);
      setContentTitle('');
    }
  });

  const updateContentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api.momentumOs.updateContentCalendar(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCalendars', profile?.id] });
    }
  });

  const colors = [
    { name: 'Varsayılan', class: 'bg-slate-50', border: 'border-slate-200' },
    { name: 'Kırmızı', class: 'bg-red-50', border: 'border-red-200' },
    { name: 'Turuncu', class: 'bg-orange-50', border: 'border-orange-200' },
    { name: 'Sarı', class: 'bg-amber-50', border: 'border-amber-200' },
    { name: 'Yeşil', class: 'bg-emerald-50', border: 'border-emerald-200' },
    { name: 'Mavi', class: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Mor', class: 'bg-indigo-50', border: 'border-indigo-200' },
  ];

  const { data: notes = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_NOTES, profile?.id],
    queryFn: api.getNotes,
    enabled: !!profile?.id
  });

  const addNoteMutation = useMutation({
    mutationFn: api.addNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_NOTES, profile?.id] });
      resetForm();
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<UserNote> }) => api.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_NOTES, profile?.id] });
      resetForm();
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_NOTES, profile?.id] });
    }
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const title = (note.title || '').toLowerCase();
      const content = (note.content || '').toLowerCase();
      const matchesSearch = (title.includes(searchQuery.toLowerCase()) || 
                           content.includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag === 'all' || (note.tags && note.tags.includes(selectedTag));
      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [notes, searchQuery, selectedTag]);

  const resetForm = () => {
    setIsAdding(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags([]);
    setNewTagInput('');
    setNoteColor('bg-slate-50');
  };

  const handleEdit = (note: UserNote) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteTags(note.tags || []);
    setNoteColor(note.color || 'bg-slate-50');
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const noteData = {
      title: noteTitle.trim() || 'İsimsiz Not',
      content: noteContent.trim(),
      tags: noteTags,
      color: noteColor
    };

    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data: noteData });
    } else {
      addNoteMutation.mutate(noteData as Omit<UserNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
    }
  };

  const togglePin = (note: UserNote) => {
    updateNoteMutation.mutate({ id: note.id, data: { is_pinned: !note.is_pinned } });
  };

  // 🔥 LİMİT KONTROLÜ İLE EKLEME FONKSİYONU 🔥
  const handleAddNewNoteClick = () => {
    if (isFree && notes.length >= 10) {
      setShowUpgradeModal(true);
      return;
    }
    resetForm();
    setIsAdding(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar size={24} className="text-orange-600" />
            İçerik & Notlar
          </h2>
          <p className="text-sm text-slate-500 mt-1">Akıllı içerik takvimi ve kişisel notların.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Notlarda ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={handleAddNewNoteClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 shrink-0"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Yeni Not</span>
          </button>
        </div>
      </div>

      {/* AKILLI İÇERİK TAKVİMİ */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-orange-500" />
            Akıllı İçerik Takvimi
            <Badge variant="warning" className="ml-2">BETA</Badge>
          </h3>
          <button onClick={() => setShowContentPlanner(true)} className="text-sm font-bold text-orange-600 hover:text-orange-700">
            Yeni İçerik Planla
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {contentCalendars.length > 0 ? contentCalendars.map(cal => {
            const prop = properties.find(p => p.id === cal.property_id);
            return (
            <Card key={cal.id} className="p-4 bg-slate-50 border-slate-100 flex flex-col items-center text-center justify-center min-h-[120px] relative">
              <p className="text-xs font-bold text-slate-400 mb-1">{new Date(cal.scheduled_for).toLocaleDateString('tr-TR')} - {cal.status}</p>
              <p className="text-sm font-medium text-slate-600">{cal.title} ({cal.platform})</p>
              {prop && (
                <p className="text-[10px] text-orange-600 font-bold mt-1 max-w-full truncate px-2">📍 {prop.title}</p>
              )}
              {cal.status !== 'Yayınlandı' && (
                <button 
                  onClick={() => updateContentStatusMutation.mutate({ id: cal.id, status: 'Yayınlandı' })}
                  disabled={updateContentStatusMutation.isPending}
                  className="mt-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded disabled:opacity-50"
                >
                  Yayınlandı İşaretle
                </button>
              )}
            </Card>
          )}) : (
            <div className="col-span-1 sm:col-span-3 text-center text-slate-400 py-4 text-sm">Takvimde içerik bulunmuyor.</div>
          )}
        </div>
      </section>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mask-edges">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedTag === 'all' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Tümü
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedTag === tag 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Tag size={12} /> {tag}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <Card className="p-6 md:p-8 bg-white border border-slate-200 shadow-xl relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Edit2 size={20} className="text-orange-600" />
                    {editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
                  </h3>
                  <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Not Başlığı (Opsiyonel)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full text-xl font-bold border-none bg-transparent placeholder:text-slate-300 focus:ring-0 px-0"
                  />
                  
                  <textarea
                    placeholder="Notunuzu buraya yazın..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={6}
                    className="w-full resize-none border-none bg-transparent placeholder:text-slate-400 focus:ring-0 px-0 text-slate-600 leading-relaxed"
                  />

                  {/* Options (Color, Tags) */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {colors.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setNoteColor(color.class)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${color.class} ${color.border} ${noteColor === color.class ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 md:justify-end">
                      <div className="flex items-center gap-2 flex-wrap">
                        {noteTags.map(tag => (
                          <Badge key={tag} variant="default" className="flex items-center gap-1 pl-2 pr-1 py-1">
                            {tag}
                            <button onClick={() => setNoteTags(noteTags.filter(t => t !== tag))} className="hover:bg-slate-200 rounded-full p-0.5"><X size={12} /></button>
                          </Badge>
                        ))}
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (newTagInput.trim() && !noteTags.includes(newTagInput.trim())) {
                          setNoteTags([...noteTags, newTagInput.trim()]);
                          setNewTagInput('');
                        }
                      }}>
                        <input
                          type="text"
                          placeholder="Etiket ekle..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          className="w-32 text-xs py-1.5 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20"
                        />
                      </form>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex justify-end gap-3">
                    <button onClick={resetForm} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">İptal</button>
                    <button 
                      onClick={handleSave}
                      disabled={!noteContent.trim() || addNoteMutation.isPending || updateNoteMutation.isPending}
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} /> 
                      {addNoteMutation.isPending || updateNoteMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 space-y-4 border-none shadow-sm">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="pt-4 flex gap-2"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-16" /></div>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FileText size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Burada hiç not yok</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              {searchQuery ? 'Aramanıza uygun not bulunamadı.' : 'Aklınıza gelen fikirleri, görüşme notlarını veya hatırlatmaları eklemeye başlayın.'}
            </p>
            {!searchQuery && (
              <button 
                onClick={handleAddNewNoteClick}
                className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} /> İlk Notunu Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map(note => {
                const colorObj = colors.find(c => c.class === note.color) || colors[0];
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={note.id}
                  >
                    <Card className={`h-full flex flex-col p-5 border shadow-sm transition-all hover:shadow-md group ${colorObj.class} ${colorObj.border}`}>
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{note.title}</h4>
                        <button 
                          onClick={() => togglePin(note)}
                          className={`shrink-0 transition-colors ${note.is_pinned ? 'text-orange-500' : 'text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100'}`}
                          title={note.is_pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={note.is_pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 17 5 5-5-5-5 5 5-5Zm-8-5h16L4 12Zm11-4V3H9v5l2 4 2-4Z"/></svg>
                        </button>
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-4 flex-1 whitespace-pre-wrap line-clamp-6 opacity-90">
                        {note.content}
                      </div>

                      <div className="mt-auto space-y-3">
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {note.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-slate-600">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1" title={note.updated_at ? new Date(note.updated_at).toLocaleString() : ''}>
                            <Clock size={12} />
                            {note.updated_at 
                              ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: tr })
                              : 'Tarih belirsiz'}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(note)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors" title="Düzenle">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => {
                              if(window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
                                deleteNoteMutation.mutate(note.id);
                              }
                            }} className="p-1.5 hover:bg-white rounded-lg text-red-500 transition-colors" title="Sil">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 🔥 LİMİT DOLDUĞUNDA ÇIKACAK SATIŞ EKRANI 🔥 */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(tier) => console.log('Plan seçildi:', tier)}
        onActivateTrial={async () => {
          try {
            await subscribe('trial');
            setShowUpgradeModal(false);
          } catch (e) {
            console.error("Deneme sürümü başlatılırken hata:", e);
          }
        }}
      />

      {/* CONTENT PLANNER MODAL */}
      <AnimatePresence>
        {showContentPlanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowContentPlanner(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Sparkles size={20} className="text-orange-500"/> Akıllı İçerik Planla</h3>
                <button onClick={() => setShowContentPlanner(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">İçerik Konusu</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Hafta Sonu Portföy Sunumu"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform</label>
                  <select 
                    value={contentPlatform}
                    onChange={(e) => setContentPlatform(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none transition-all"
                  >
                    <option>Instagram Reels</option>
                    <option>Instagram Story</option>
                    <option>YouTube Shorts</option>
                    <option>LinkedIn Post</option>
                    <option>WhatsApp Durum</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Tavsiyesi</label>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 leading-relaxed italic">
                    "Bölgenizdeki son 30 günlük satış verilerini kullanarak 'Neden Şimdi Satmalısınız?' temalı bir video çekmek şu an %85 daha fazla etkileşim getirebilir."
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (contentTitle.trim()) {
                      addContentCalendarMutation.mutate({
                        title: contentTitle,
                        platform: contentPlatform,
                        status: 'Taslak',
                        scheduled_for: new Date(Date.now() + 86400000).toISOString(), // yarın
                        content_text: ''
                      });
                    }
                  }} 
                  disabled={addContentCalendarMutation.isPending || !contentTitle.trim()}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Takvime Ekle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};