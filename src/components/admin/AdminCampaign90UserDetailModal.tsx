import React, { useState, useEffect } from 'react';
import { X, Loader2, Target, Calendar, AlertTriangle, CheckCircle2, AlertOctagon, PenTool, MessageSquarePlus, Clock, CheckCircle, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { adminCampaign90Service, AdminCampaignUserDetail } from '../../services/adminCampaign90Service';
import { maskEmail, maskPhone } from '../../utils/masking';
import { formatActionType, getPriorityColor, formatStatus, formatPriority } from '../../utils/campaign90FollowupHelpers';

interface Props {
  userId: string;
  onClose: () => void;
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}

export const AdminCampaign90UserDetailModal: React.FC<Props> = ({ userId, onClose, showAdminToast }) => {
  const [detail, setDetail] = useState<AdminCampaignUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Followups State
  const [followups, setFollowups] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNotePayload, setNewNotePayload] = useState({ actionType: 'note', priority: 'normal', note: '', dueDate: '', dayNumber: '' });
  const [submittingNote, setSubmittingNote] = useState(false);

  // AI Mentor Insight State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<any | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await adminCampaign90Service.getAdminCampaignUserDetail(userId);
        setDetail(data);
      } catch (err: any) {
        showAdminToast('error', 'Hata', err.message);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    
    // Also fetch followups
    fetchFollowups();
    fetchDetail();
  }, [userId, onClose]);

  const fetchFollowups = async () => {
      try {
          const data = await adminCampaign90Service.getAdminCampaignUserFollowups(userId);
          setFollowups(data);
      } catch (err: any) {
          console.error("Failed to fetch followups", err);
      }
  };

  const handleAddNote = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          setSubmittingNote(true);
          const payload = {
              ...newNotePayload,
              dayNumber: newNotePayload.dayNumber ? parseInt(newNotePayload.dayNumber) : null
          };
          await adminCampaign90Service.createCampaign90UserFollowup(userId, payload);
          setShowAddNote(false);
          setNewNotePayload({ actionType: 'note', priority: 'normal', note: '', dueDate: '', dayNumber: '' });
          fetchFollowups(); // refresh
          showAdminToast('success', 'Takip Notu', 'Görüşme/Not başarıyla eklendi.');
      } catch (err: any) {
          showAdminToast('error', 'Hata', 'Not eklenemedi: ' + err.message);
      } finally {
          setSubmittingNote(false);
      }
  };

  const handleUpdateStatus = async (followupId: string, status: string) => {
      try {
          await adminCampaign90Service.updateCampaign90Followup(followupId, { status });
          fetchFollowups();
          showAdminToast('success', 'Güncellendi', 'Durum güncellendi.');
      } catch(err) {
          showAdminToast('error', 'Hata', 'Güncellenemedi.');
      }
  };

  const handleGenerateMentorInsight = async () => {
      try {
          setAiLoading(true);
          const data = await adminCampaign90Service.generateMentorInsight(userId);
          setAiInsight(data);
          showAdminToast('success', 'Ulaşıldı', 'AI Mentor Yorumu başarıyla oluşturuldu.');
      } catch (err: any) {
          showAdminToast('error', 'Hata', 'Yorum oluşturulamadı: ' + err.message);
      } finally {
          setAiLoading(false);
      }
  };

  const handleInsightToFollowup = () => {
      if (!aiInsight) return;
      
      let priority = 'normal';
      if (aiInsight.suggestedAdminAction === 'call' || aiInsight.suggestedAdminAction === 'whatsapp') {
          priority = aiInsight.motivationLevel === 'low' || aiInsight.riskNote ? 'high' : 'normal';
      }
      if (aiInsight.motivationLevel === 'low' && aiInsight.suggestedAdminAction !== 'none') {
          priority = 'high';
      }

      const noteText = `[AI Mentor Önerisi]
Durum: ${aiInsight.summary}
Ana Engel: ${aiInsight.mainBlocker}
Odak: ${aiInsight.nextFocus}
Önerilen Mesaj: ${aiInsight.suggestedMessage}
${aiInsight.riskNote ? '\\nRisk: ' + aiInsight.riskNote : ''}`;

      setNewNotePayload({
          actionType: aiInsight.suggestedAdminAction === 'none' ? 'note' : aiInsight.suggestedAdminAction,
          priority,
          note: noteText,
          dueDate: '',
          dayNumber: detail?.current_day ? String(detail.current_day) : ''
      });
      setShowAddNote(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' }); // in case they need to see the form
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
           <div>
              <h2 className="text-xl font-bold text-slate-800">Kampanya Detayı</h2>
              <p className="text-sm text-slate-500">Danışman kampı ilerleme raporu</p>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
           {loading ? (
             <div className="flex justify-center items-center py-20 text-indigo-500">
                <Loader2 className="w-8 h-8 animate-spin" />
             </div>
           ) : detail ? (
             <div className="space-y-6">
                
                {/* User Info */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                     {detail.display_name.charAt(0)}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900">{detail.display_name}</h3>
                     <p className="text-sm text-slate-500">{maskEmail(detail.email)} • {maskPhone(detail.phone)}</p>
                   </div>
                   <div className="ml-auto">
                     <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                        detail.campaign_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                     }`}>
                        {detail.campaign_status === 'active' ? 'Aktif' : detail.campaign_status}
                     </span>
                   </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Target size={14}/> Gün</span>
                       <div className="text-2xl font-black text-slate-900">{detail.current_day} <span className="text-sm text-slate-400 font-medium">/ 90</span></div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><CheckCircle2 size={14}/> Progress</span>
                       <div className="text-2xl font-black text-slate-900">%{detail.progress_percent}</div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><CheckCircle2 size={14}/> Görev</span>
                       <div className="text-2xl font-black text-slate-900">%{detail.overall_completion_percent}</div>
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-2xl">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Calendar size={14}/> Başlangıç</span>
                       <div className="text-sm font-bold text-slate-900 mt-2">{new Date(detail.start_date).toLocaleDateString('tr-TR')}</div>
                    </div>
                </div>

                {/* Risks */}
                {detail.risk_reasons.length > 0 && (
                   <div className={`p-4 rounded-2xl border ${
                      detail.risk_level === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                      detail.risk_level === 'risk' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                      'bg-amber-50 border-amber-200 text-amber-800'
                   }`}>
                      <h4 className="font-bold flex items-center gap-2 mb-2">
                        {detail.risk_level === 'critical' ? <AlertOctagon size={16}/> : <AlertTriangle size={16}/>}
                        Gözlemlenen Riskler
                      </h4>
                      <ul className="text-sm space-y-1 list-disc pl-5 font-medium opacity-90">
                         {detail.risk_reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                   </div>
                )}
                 {/* Admin Followups */}
                 <div>
                    <div className="flex items-center justify-between mb-3 ml-1">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <PenTool size={16} className="text-slate-400" />
                            Admin Takip Notları
                        </h4>
                        <button 
                            onClick={() => setShowAddNote(!showAddNote)}
                            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <MessageSquarePlus size={14} /> Yeni Not
                        </button>
                    </div>

                    {showAddNote && (
                        <form onSubmit={handleAddNote} className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aksiyon Tipi</label>
                                    <select value={newNotePayload.actionType} onChange={(e) => setNewNotePayload({...newNotePayload, actionType: e.target.value})} className="w-full text-sm p-2 border rounded-lg bg-white">
                                        <option value="note">Genel Not</option>
                                        <option value="call">Telefon Araması</option>
                                        <option value="whatsapp">WhatsApp Mesajı</option>
                                        <option value="mentor_support">Mentor Desteği</option>
                                        <option value="watch">Gözlem Altında</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Öncelik</label>
                                    <select value={newNotePayload.priority} onChange={(e) => setNewNotePayload({...newNotePayload, priority: e.target.value})} className="w-full text-sm p-2 border rounded-lg bg-white">
                                        <option value="low">Düşük</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hedef Tarih (Opsiyonel)</label>
                                    <input type="date" value={newNotePayload.dueDate} onChange={(e) => setNewNotePayload({...newNotePayload, dueDate: e.target.value})} className="w-full text-sm p-2 border rounded-lg bg-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gün # (Opsiyonel)</label>
                                    <input type="number" min="1" max="90" value={newNotePayload.dayNumber} onChange={(e) => setNewNotePayload({...newNotePayload, dayNumber: e.target.value})} className="w-full text-sm p-2 border rounded-lg bg-white" placeholder="Örn: 15" />
                                </div>
                            </div>
                            <div>
                                <textarea value={newNotePayload.note} onChange={(e) => setNewNotePayload({...newNotePayload, note: e.target.value})} className="w-full text-sm p-3 border rounded-lg bg-white min-h-[80px]" placeholder="Takip notu veya aksiyon detayını yazın..." required></textarea>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddNote(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">İptal</button>
                                <button type="submit" disabled={submittingNote || !newNotePayload.note} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2">
                                    {submittingNote ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Kaydet
                                </button>
                            </div>
                        </form>
                    )}

                    {!followups || followups.length === 0 ? (
                       <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-sm text-slate-400 mb-6">
                          Kullanıcıya ait takip notu bulunmuyor.
                       </div>
                    ) : (
                       <div className="space-y-3 mb-6">
                           {followups.map((f, i) => (
                               <div key={i} className={`p-4 rounded-xl border relative shadow-sm ${f.status === 'resolved' || f.status === 'dismissed' ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-white border-slate-200'}`}>
                                   <div className="flex items-start justify-between gap-4 mb-2">
                                       <div className="flex flex-wrap items-center gap-2">
                                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${f.status === 'open' ? 'bg-sky-50 text-sky-600 border border-sky-100' : f.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                              {formatStatus(f.status)}
                                           </span>
                                           <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                              {formatActionType(f.action_type)}
                                           </span>
                                           <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(f.priority)}`}>
                                              {formatPriority(f.priority)}
                                           </span>
                                       </div>
                                       <div className="text-[10px] font-medium text-slate-400 flex flex-col items-end">
                                           <span>{new Date(f.created_at).toLocaleString('tr-TR')}</span>
                                           {f.admin_id && <span className="opacity-60">Admin</span>}
                                       </div>
                                   </div>
                                   
                                   <p className={`text-sm mt-2 mb-3 whitespace-pre-wrap ${f.status === 'resolved' || f.status === 'dismissed' ? 'text-slate-500' : 'text-slate-700'}`}>
                                       {f.note}
                                   </p>

                                   <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                       <div className="flex items-center gap-3 text-xs">
                                           {f.due_date && <span className="text-slate-500 flex items-center gap-1"><Calendar size={12}/> Hedef: {new Date(f.due_date).toLocaleDateString('tr-TR')}</span>}
                                           {f.day_number && <span className="text-indigo-500 font-medium">Gün {f.day_number}</span>}
                                       </div>
                                       
                                       <div className="flex items-center gap-2">
                                           {f.status === 'open' && (
                                               <button onClick={() => handleUpdateStatus(f.id, 'in_progress')} className="text-[10px] font-bold flex items-center gap-1 text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition-colors" title="İşlemde Olarak İşaretle">
                                                   <Clock size={12}/> İşleme Al
                                               </button>
                                           )}
                                           {(f.status === 'open' || f.status === 'in_progress') && (
                                               <button onClick={() => handleUpdateStatus(f.id, 'resolved')} className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors" title="Çözüldü Olarak İşaretle">
                                                   <CheckCircle size={12}/> Çözüldü
                                               </button>
                                           )}
                                           {(f.status === 'open' || f.status === 'in_progress') && (
                                               <button onClick={() => handleUpdateStatus(f.id, 'dismissed')} className="text-[10px] font-bold flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-2 py-1 rounded transition-colors" title="İptal Et">
                                                   İptal Et
                                               </button>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                    )}
                 </div>

                 {/* Son Gün Sonu Cevapları */}
                 <div>
                   <div className="flex items-center justify-between mb-3 ml-1">
                       <h4 className="text-sm font-bold text-slate-900">Gün Sonu Cevapları (Yansımalar)</h4>
                       {detail.answers && detail.answers.length > 0 && (
                           <button 
                               onClick={handleGenerateMentorInsight}
                               disabled={aiLoading}
                               className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 border border-purple-100"
                           >
                               {aiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                               {aiLoading ? 'Oluşturuluyor...' : 'AI Mentor Yorumu'}
                           </button>
                       )}
                   </div>

                   {aiInsight && (
                       <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl">
                           <div className="flex items-start gap-3">
                               <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                   <Sparkles size={18} className="text-purple-600" />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between mb-1">
                                       <h5 className="font-bold text-purple-900 text-sm">Yansıma Analizi</h5>
                                       <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-purple-600 border border-purple-100">
                                           Motivasyon: {aiInsight.motivationLevel === 'high' ? 'Yüksek' : aiInsight.motivationLevel === 'medium' ? 'Orta' : aiInsight.motivationLevel === 'low' ? 'Düşük' : 'Belirsiz'}
                                       </span>
                                   </div>
                                   <p className="text-sm text-slate-700 mb-3">{aiInsight.summary}</p>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                       <div className="p-3 bg-white rounded-lg border border-purple-50">
                                           <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ana Engel</div>
                                           <div className="text-xs font-medium text-slate-700">{aiInsight.mainBlocker}</div>
                                       </div>
                                       <div className="p-3 bg-white rounded-lg border border-purple-50">
                                           <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sonraki Odak</div>
                                           <div className="text-xs font-medium text-slate-700">{aiInsight.nextFocus}</div>
                                       </div>
                                   </div>

                                   {(aiInsight.suggestedAdminAction !== 'none') && (
                                       <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 mb-3">
                                           <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center justify-between">
                                               Önerilen İletişim ({aiInsight.suggestedAdminAction})
                                           </div>
                                           <div className="text-sm italic text-indigo-900">"{aiInsight.suggestedMessage}"</div>
                                       </div>
                                   )}

                                   {aiInsight.riskNote && (
                                       <div className="flex items-start gap-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 mb-3">
                                           <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                           <span>{aiInsight.riskNote}</span>
                                       </div>
                                   )}

                                   <div className="flex justify-end mt-2">
                                       <button 
                                           onClick={handleInsightToFollowup}
                                           className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                       >
                                           <ChevronRight size={14} />
                                           Takip Notuna Dönüştür
                                       </button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}

                   {!detail.answers || detail.answers.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500">
                         Henüz cevap girilmemiş.
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {detail.answers.slice(0, 5).map((ansObj, i) => (
                            <div key={i} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl">
                               <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                  <div className="text-sm font-bold text-indigo-700">Gün {ansObj.day_number}</div>
                                  <div className="text-xs font-medium text-slate-400">
                                     {new Date(ansObj.answered_at).toLocaleString('tr-TR')}
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  {Object.entries(ansObj.answers).length === 0 ? (
                                      <div className="text-xs text-slate-400 italic">Boş yanıt.</div>
                                  ) : (
                                      <>
                                          {ansObj.answers.source === 'day_close' && (
                                              <div className="mb-2">
                                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Gün Kapatmadan Geldi</span>
                                              </div>
                                          )}
                                          {Object.entries(ansObj.answers).filter(([key]) => key !== 'source').map(([key, val], j) => (
                                             <div key={j} className="text-sm">
                                                <div className="text-xs font-semibold text-slate-500 mb-0.5">{key.replace(/_/g, ' ')}</div>
                                                <span className="text-slate-800 bg-slate-50 px-3 py-2 rounded-lg inline-block w-full border border-slate-100">{String(val)}</span>
                                             </div>
                                          ))}
                                      </>
                                  )}
                               </div>
                            </div>
                         ))}
                         {detail.answers.length > 5 && (
                            <div className="text-xs text-center text-slate-400 mt-2 font-medium">Sadece son 5 günün cevapları gösteriliyor...</div>
                         )}
                      </div>
                   )}
                </div>

                {/* Son Aktiviteler (Skorlar) */}
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-3 ml-1">Son Kampanya Etkileşimleri</h4>
                   {detail.scores.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-sm text-slate-500">
                         Henüz aktivite kaydedilmedi.
                      </div>
                   ) : (
                      <div className="space-y-2">
                         {detail.scores.slice(0, 10).map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                               <div className="text-sm font-bold text-slate-700">{new Date(s.score_date).toLocaleDateString('tr-TR')}</div>
                               <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                  {s.completed_tasks} / {s.total_tasks} Görev 
                                  ({s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks)*100) : 0}%)
                               </div>
                            </div>
                         ))}
                         {detail.scores.length > 10 && (
                            <div className="text-xs text-center text-slate-400 mt-2 font-medium">Son 10 gün gösteriliyor...</div>
                         )}
                      </div>
                   )}
                </div>

             </div>
           ) : (
             <div className="p-6 text-center text-slate-500">Kullanıcı bulunamadı.</div>
           )}
        </div>

      </div>
    </div>
  );
};
