import React, { useState, useEffect } from 'react';
import { adminCampaign90Service, AdminCampaignDayContentOverview, AdminCampaignDayContent } from '../../services/adminCampaign90Service';
import { BookOpen, Search, Filter, Edit, Loader2, Save, X, Video, FileText, CheckCircle2, LayoutTemplate, Clock } from 'lucide-react';
import { parseQuestionsFromTextarea, serializeQuestionsToTextarea, normalizeCampaignDayStatus, getCampaignDayContentCompleteness, parseLinesFromTextarea, serializeLinesToTextarea, safeParseJsonField, safeStringifyJsonField } from '../../utils/campaign90ContentHelpers';

export const AdminCampaign90DayContentsSection: React.FC<{ showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void }> = ({ showAdminToast }) => {
  const [contents, setContents] = useState<AdminCampaignDayContentOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'published' | 'draft' | 'inactive' | 'with_video' | 'no_questions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<AdminCampaignDayContent> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const data = await adminCampaign90Service.getAdminCampaignDayContents();
      
      // If table is empty, we fake an overview list for 1-90 so admin can create them
      if (data.length === 0) {
        const placeholders: AdminCampaignDayContentOverview[] = Array.from({ length: 90 }, (_, i) => ({
          day_number: i + 1,
          title: `Gün ${i + 1}`,
          short_summary: null,
          learning_content: null,
          mentor_message: null,
          vocabulary_title: null,
          vocabulary_content: null,
          task_brief: null,
          daily_questions: null,
          video_title: null,
          video_url: null,
          video_duration_minutes: null,
          status: 'draft' as const
        }));
        setContents(placeholders);
      } else {
        // Merge missing days just in case
        const mapped: AdminCampaignDayContentOverview[] = Array.from({ length: 90 }, (_, i) => {
          const day = i + 1;
          const found = data.find(d => d.day_number === day);
          return found || {
            day_number: day,
            title: `Gün ${day}`,
            short_summary: null,
            learning_content: null,
            mentor_message: null,
            vocabulary_title: null,
            vocabulary_content: null,
            task_brief: null,
            daily_questions: null,
            video_title: null,
            video_url: null,
            video_duration_minutes: null,
            status: 'draft' as const
          };
        });
        setContents(mapped);
      }
    } catch (err: any) {
      showAdminToast("error", "Hata", "İçerikler yüklenemedi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const openEditor = async (dayNumber: number) => {
    try {
      setEditingDay(dayNumber);
      setEditLoading(true);
      const data = await adminCampaign90Service.getAdminCampaignDayContentByNumber(dayNumber);
      
      if (data) {
        setEditData({
           ...data,
           // @ts-ignore
           daily_questions: serializeQuestionsToTextarea(data.daily_questions),
           // @ts-ignore
           learning_goals: serializeLinesToTextarea(data.learning_goals),
           // @ts-ignore
           mini_quiz: safeStringifyJsonField(data.mini_quiz),
           // @ts-ignore
           glossary_terms: safeStringifyJsonField(data.glossary_terms),
           // @ts-ignore
           homework: safeStringifyJsonField(data.homework),
           // @ts-ignore
           task_items: safeStringifyJsonField(data.task_items),
        });
      } else {
        setEditData({
          day_number: dayNumber,
          title: `Gün ${dayNumber}`,
          short_summary: '',
          learning_content: '',
          mentor_message: '',
          vocabulary_title: '',
          vocabulary_content: '',
          task_brief: '',
          // @ts-ignore
          daily_questions: '',
          video_title: '',
          video_url: '',
          status: 'draft'
        });
      }
    } catch (err: any) {
      showAdminToast("error", "Hata", "İçerik detayı yüklenemedi");
      setEditingDay(null);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData || !editingDay) return;
    try {
      setSaving(true);
      const payloadToSave = {
        ...editData,
        // @ts-ignore
        daily_questions: parseQuestionsFromTextarea(editData.daily_questions),
        // @ts-ignore
        learning_goals: parseLinesFromTextarea(editData.learning_goals),
        // @ts-ignore
        mini_quiz: safeParseJsonField(editData.mini_quiz, []),
        // @ts-ignore
        glossary_terms: safeParseJsonField(editData.glossary_terms, []),
        // @ts-ignore
        homework: safeParseJsonField(editData.homework, {}),
        // @ts-ignore
        task_items: safeParseJsonField(editData.task_items, []),
        status: normalizeCampaignDayStatus(editData.status),
      };
      await adminCampaign90Service.updateAdminCampaignDayContent(editingDay, payloadToSave);
      showAdminToast("success", "Başarılı", `${editingDay}. Gün içeriği kaydedildi.`);
      await fetchContents(); // refresh list
      setEditingDay(null);
    } catch (err: any) {
      showAdminToast("error", "Kayıt Hatası", err.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async (mode: 'missing_only' | 'fill_empty') => {
    const isConfirm = window.confirm(mode === 'missing_only' 
      ? 'Eksik günleri template datası ile DB ye eklemek istediğinize emin misiniz? (Mevcut dolu günler ezilmez)'
      : 'Boş olan alanları template verisi ile doldurmak istediğinize emin misiniz? (Mevcut dolu alanlar GÜVENDE, ezilmez)');
    
    if (!isConfirm) return;

    try {
      setLoading(true);
      const res = await adminCampaign90Service.seedCampaign90DefaultDayContents(mode);
      showAdminToast("success", "Aktarım Başarılı", `Eklenen: ${res.insertedCount}, Güncellenen: ${res.updatedCount}, Atlanan: ${res.skippedCount}`);
      await fetchContents();
    } catch (err: any) {
      showAdminToast("error", "Aktarım Hatası", err.message || "Aktarılamadı");
    } finally {
      setLoading(false);
    }
  };

  const filteredContents = contents.filter(c => {
    if (filterType === 'published' && c.status !== 'published') return false;
    if (filterType === 'draft' && c.status !== 'draft') return false;
    if (filterType === 'inactive' && c.status !== 'inactive') return false;
    if (filterType === 'with_video' && !c.video_url) return false;
    if (filterType === 'no_questions' && (c.daily_questions && c.daily_questions.length > 0)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchDay = c.day_number.toString().includes(q);
      const matchContent = c.learning_content?.toLowerCase().includes(q);
      const matchMentor = c.mentor_message?.toLowerCase().includes(q);
      const matchSummary = c.short_summary?.toLowerCase().includes(q);
      return matchTitle || matchDay || matchContent || matchMentor || matchSummary;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Editor Modal overlay implicitly here */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                 <h2 className="text-xl font-bold text-slate-900">
                    {editingDay}. Gün İçeriği
                 </h2>
                 <p className="text-sm text-slate-500">Bu günün eğitim ve operasyon içerikleri</p>
              </div>
              <button 
                onClick={() => setEditingDay(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
              {editLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <span>İçerik Yükleniyor...</span>
                 </div>
              ) : editData ? (
                 <div className="max-w-xl mx-auto space-y-8 pb-10">
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                         <BookOpen className="w-4 h-4 text-indigo-500" /> 
                         Temel Bilgiler
                       </h3>
                       
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hafta Numarası</label>
                              <input 
                                type="number"
                                value={editData.week_number || ''}
                                onChange={e => setEditData({...editData, week_number: e.target.value ? parseInt(e.target.value) : null})}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Faz (Bölüm) Başlığı</label>
                              <input 
                                type="text"
                                value={editData.phase_title || ''}
                                onChange={e => setEditData({...editData, phase_title: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gün Başlığı</label>
                            <input 
                              type="text"
                              value={editData.title || ''}
                              onChange={e => setEditData({...editData, title: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-slate-900 font-medium"
                              placeholder="Örn: Portföy Kurulumu"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Kısa Özet (Liste/Kartlar için)</label>
                            <input 
                              type="text"
                              value={editData.short_summary || ''}
                              onChange={e => setEditData({...editData, short_summary: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                              placeholder="Kısa bir özet yazın"
                            />
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                         <FileText className="w-4 h-4 text-emerald-500" /> 
                         Eğitim ve Mesaj
                       </h3>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Eğitim İçeriği (Markdown)</label>
                            <textarea 
                              rows={6}
                              value={editData.learning_content || ''}
                              onChange={e => setEditData({...editData, learning_content: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="Markdown kullanarak eğitim metni oluşturabilirsiniz..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mentor Mesajı</label>
                            <textarea 
                              rows={3}
                              value={editData.mentor_message || ''}
                              onChange={e => setEditData({...editData, mentor_message: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm italic border-l-4 border-l-amber-400"
                              placeholder="Motivasyon veya gün özeti mesajı"
                            />
                          </div>
                       </div>
                    </div>


                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                         <CheckCircle2 className="w-4 h-4 text-blue-500" /> 
                         Görev & Gün Sonu
                       </h3>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Görev / Aksiyon Özeti</label>
                            <textarea 
                              rows={3}
                              value={editData.task_brief || ''}
                              onChange={e => setEditData({...editData, task_brief: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                              placeholder="Danışmanın yapması gereken görevler..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Gün Sonu / Check-in Soruları (Satır satır)</label>
                            <textarea 
                              rows={4}
                              // @ts-ignore
                              value={editData.daily_questions || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, daily_questions: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="Günlük değerlendirme sorusu 1&#10;Soru 2..."
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Her satıra bir soru yazın, liste halinde kaydedilecektir.</p>
                          </div>
                       </div>
                    </div>


                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                         <Video className="w-4 h-4 text-purple-500" /> 
                         Medya & Diğer
                       </h3>
                       
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Video Başlığı</label>
                               <input 
                                 type="text"
                                 value={editData.video_title || ''}
                                 onChange={e => setEditData({...editData, video_title: e.target.value})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Süre (Dk)</label>
                               <input 
                                 type="number"
                                 value={editData.video_duration_minutes || ''}
                                 onChange={e => setEditData({...editData, video_duration_minutes: e.target.value ? parseInt(e.target.value) : null})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Video/Embed URL (YouTube vb)</label>
                            <input 
                               type="url"
                               value={editData.video_url || ''}
                               onChange={e => setEditData({...editData, video_url: e.target.value})}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Video Görüntüsü Yer Tutucu URL (Placeholder)</label>
                            <input 
                               type="url"
                               value={editData.video_placeholder || ''}
                               onChange={e => setEditData({...editData, video_placeholder: e.target.value})}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               placeholder="https://..."
                            />
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                         <LayoutTemplate className="w-4 h-4 text-orange-500" /> 
                         Genişletilmiş Eğitim Kaynakları (JSON & Metin)
                       </h3>
                       
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Modül Başlığı</label>
                               <input 
                                 type="text"
                                 value={editData.module_title || ''}
                                 onChange={e => setEditData({...editData, module_title: e.target.value})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ana Hedef</label>
                               <input 
                                 type="text"
                                 value={editData.main_objective || ''}
                                 onChange={e => setEditData({...editData, main_objective: e.target.value})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Learning Goals (Satır satır)</label>
                            <textarea 
                              rows={3}
                              // @ts-ignore
                              value={editData.learning_goals || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, learning_goals: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                              placeholder="Hedef 1..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Saha Örneği</label>
                               <textarea 
                                 rows={2}
                                 value={editData.field_example || ''}
                                 onChange={e => setEditData({...editData, field_example: e.target.value})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pratik Görev (Practice Assignment)</label>
                               <textarea 
                                 rows={2}
                                 value={editData.practice_assignment || ''}
                                 onChange={e => setEditData({...editData, practice_assignment: e.target.value})}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                               />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mini Quiz (JSON formatında)</label>
                            <textarea 
                              rows={4}
                              // @ts-ignore
                              value={editData.mini_quiz || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, mini_quiz: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              placeholder="[{&quot;question&quot;:...}]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sözlük / Terimler (Glossary) (JSON formatında)</label>
                            <textarea 
                              rows={4}
                              // @ts-ignore
                              value={editData.glossary_terms || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, glossary_terms: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              placeholder="[{&quot;term&quot;:...}]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Saha / Satış Görevleri (Task Items) (JSON formatında)</label>
                            <textarea 
                              rows={4}
                              // @ts-ignore
                              value={editData.task_items || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, task_items: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              placeholder="[{&quot;title&quot;:...}]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Günlük Ödev (Homework) (JSON Nesnesi)</label>
                            <textarea 
                              rows={4}
                              // @ts-ignore
                              value={editData.homework || ''}
                              // @ts-ignore
                              onChange={e => setEditData({...editData, homework: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              placeholder="{&quot;type&quot;:...}"
                            />
                          </div>
                          
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">Yayına Alma</h3>
                       <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Durum</label>
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                          >
                            <option value="draft">Taslak (Uygulamada Görünmez)</option>
                            <option value="published">Yayında (Aktif)</option>
                            <option value="inactive">Pasif (Arşiv)</option>
                          </select>
                       </div>
                    </div>


                 </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
               <button
                 type="button"
                 onClick={() => setEditingDay(null)}
                 disabled={saving}
                 className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
               >
                 İptal Et
               </button>
               <button
                 type="button"
                 onClick={handleSave}
                 disabled={saving || editLoading}
                 className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Kaydet
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 relative z-10 w-full p-4 md:p-0">
          <div className="flex flex-col sm:flex-row gap-3">
             <button
                onClick={() => handleSeed('missing_only')}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                title="Sadece DB'de olmayan günleri ekler"
             >
                Eksik Günleri DB'ye Aktar
             </button>
             <button
                onClick={() => handleSeed('fill_empty')}
                disabled={loading}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                title="Sadece boş olan alanları template verisi ile doldurur, dolu alanları ezmez"
             >
                Boş Alanları Varsayılanla Tamamla
             </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="relative w-full sm:w-64">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Gün veya başlık ara..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
               />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto whitespace-nowrap">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">Tüm Günler</option>
                <option value="published">Yayında Olanlar</option>
                <option value="draft">Taslaklar</option>
                <option value="inactive">Pasifler</option>
                <option value="with_video">Video Ekli Olanlar</option>
                <option value="no_questions">Sorusu Olmayanlar</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center items-center py-20 text-indigo-500">
             <Loader2 className="w-8 h-8 animate-spin" />
           </div>
        ) : filteredContents.length === 0 ? (
           <div className="text-center py-16 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Yok veya bulunamadı.
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContents.map(c => {
                 const completeness = getCampaignDayContentCompleteness(c);
                 return (
                 <div key={c.day_number} className="bg-white border text-left border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all rounded-xl p-4 flex flex-col group relative">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Gün {c.day_number}
                       </span>
                       
                       <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          c.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                          c.status === 'draft' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                       }`}>
                          {c.status === 'published' ? 'Yayında' : 
                           c.status === 'draft' ? 'Taslak' : 'Pasif'}
                       </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mt-1 mb-0.5">{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">{c.short_summary || <span className="italic opacity-50">&mdash; özetsiz &mdash;</span>}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                       <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <LayoutTemplate className="w-3.5 h-3.5" />
                          <span className={completeness === 100 ? 'text-emerald-500' : ''}>%{completeness} Dolu</span>
                       </div>
                       {c.video_url && (
                       <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Var</span>
                       </div>
                       )}
                    </div>
                    
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400">
                      {(c.daily_questions?.length ?? 0) > 0 && (
                        <div className="bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Gün sonu soruları var">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {c.daily_questions?.length} Soru
                        </div>
                      )}
                      {(c.mini_quiz?.length ?? 0) > 0 && (
                        <div className="bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Mini quiz var">
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          Quiz
                        </div>
                      )}
                      {(c.task_items?.length ?? 0) > 0 && (
                        <div className="bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1" title="Saha görevleri var">
                          <FileText className="w-3 h-3 text-orange-500" />
                          Görev
                        </div>
                      )}
                      {c.updated_at && (
                        <div className="bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1 ml-auto" title="Son güncellenme">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(c.updated_at).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                       <button
                         onClick={() => openEditor(c.day_number)}
                         className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                       >
                         <Edit className="w-3.5 h-3.5" /> Düzenle
                       </button>
                    </div>
                 </div>
              )})}
           </div>
        )}
      </div>
    </div>
  );
};
