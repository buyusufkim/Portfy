import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, MessageSquare, Trash2, Edit2, User as UserIcon,
  Calendar, MapPin, Tag, AlertCircle, FileText, Plus, Zap, Check, Clock
} from 'lucide-react';
import { Lead, Property, LeadActivityLog, Task } from '../types';
import { api } from '../services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { dripService, DRIP_CAMPAIGNS, DripEventType } from '../services/dripService';
import { toast } from 'react-hot-toast';
import { getTodayStr } from '../services/core/utils';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  properties: Property[];
  setShowDocumentAutomation?: (val: boolean) => void;
  setDocumentAutomationLead?: (val: Lead | null) => void;
  setDocumentAutomationProperty?: (val: Property | null) => void;
}

const CALL_RESULTS = [
  { id: 'reached', label: 'Ulaştım', icon: Check },
  { id: 'not_reached', label: 'Ulaşamadım', icon: X },
  { id: 'call_back', label: 'Sonra Ara', icon: Clock },
  { id: 'appointment', label: 'Randevu Çıktı', icon: Calendar },
  { id: 'not_interested', label: 'İlgilenmiyor', icon: AlertCircle },
  { id: 'wrong_number', label: 'Yanlış Numara', icon: Tag }
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead, onClose, onEdit, onDelete, properties,
  setShowDocumentAutomation, setDocumentAutomationLead, setDocumentAutomationProperty
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingDrip, setLoadingDrip] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [callResult, setCallResult] = useState('');
  const [callNote, setCallNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  
  const [showNetworkFollowupForm, setShowNetworkFollowupForm] = useState(false);
  const [networkFollowupDate, setNetworkFollowupDate] = useState('');
  const [networkFollowupNote, setNetworkFollowupNote] = useState('');

  const [showNetworkNoteForm, setShowNetworkNoteForm] = useState(false);
  const [networkNote, setNetworkNote] = useState('');
  
  const queryClient = useQueryClient();

  const { data: activities = [] } = useQuery({
    queryKey: [QUERY_KEYS.MOMENTUM_LEAD_ACTIVITY, lead?.id],
    queryFn: () => api.momentumOs.getLeadActivity(lead!.id),
    enabled: !!lead?.id
  });

  React.useEffect(() => {
    if (lead) {
      if (sessionStorage.getItem('trigger_call_form') === 'true') {
        setShowCallForm(true);
        sessionStorage.removeItem('trigger_call_form');
      } else {
        setShowCallForm(false);
      }
      setCallResult('');
      setCallNote('');
      setNextFollowup('');
    }
  }, [lead]);

  const handleStartDrip = async (type: DripEventType) => {
    setLoadingDrip(true);
    try {
      await dripService.createDripCampaign(lead!.id, lead!.property_id, type);
      toast.success(`${DRIP_CAMPAIGNS[type].label} başlatıldı.`);
    } catch (error) {
      toast.error("Hata oluştu.");
    } finally {
      setLoadingDrip(false);
    }
  };

  const updateLeadMutation = useMutation({
    mutationFn: (updates: Partial<Lead>) => api.updateLead(lead!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_LEAD_ALERTS] });
    },
    onError: () => {
      toast.error("İşlem başarısız oldu.");
    }
  });

  const createFollowupTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'user_id'>) => api.createFollowupTaskIfMissing(data)
  });

  const logActivityMutation = useMutation({
    mutationFn: (payload: Partial<LeadActivityLog>) => api.momentumOs.logLeadActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MOMENTUM_LEAD_ACTIVITY, lead?.id] });
    }
  });

  const handleSaveNetworkFollowup = async () => {
    if (!networkFollowupDate) {
      toast.error('Lütfen bir tarih seçin.');
      return;
    }
    
    const taskData: Omit<Task, 'id' | 'user_id'> = {
      title: `Bölge Network Takibi: ${lead!.name}`,
      type: 'Saha/Bölge',
      completed: false,
      due_date: networkFollowupDate,
      time: networkFollowupDate ? new Date(`${networkFollowupDate}T09:00:00`).toISOString() : new Date().toISOString(),
      notes: networkFollowupNote || 'Bölge teması takibi',
      lead_id: lead!.id,
      source: 'crm',
      metadata: {
        lead_id: lead!.id,
        lead_type: 'Bölge Network',
        origin: 'bolgem_network',
        region_pin_id: lead!.region_pin_id || undefined
      }
    };

    try {
      await createFollowupTaskMutation.mutateAsync(taskData);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      toast.success('Takip oluşturuldu');
      
      setShowNetworkFollowupForm(false);
      setNetworkFollowupDate('');
      setNetworkFollowupNote('');
    } catch (err) {
      toast.error('Takip oluşturulamadı');
    }
  };

  const handleSaveNetworkNote = async () => {
    if (!networkNote) {
      toast.error('Lütfen bir not girin.');
      return;
    }

    const newNote = `${new Date().toLocaleDateString('tr-TR')}: ${networkNote}`;
    try {
      await updateLeadMutation.mutateAsync({
        notes: lead?.notes ? `${lead.notes}\n${newNote}` : newNote
      });
      
      toast.success("Not eklendi");
      setShowNetworkNoteForm(false);
      setNetworkNote('');
    } catch (err) {
      toast.error("Not eklenemedi");
    }
  };

  const handleSaveCall = async () => {
    if (!callResult) {
      toast.error("Lütfen bir sonuç seçin.");
      return;
    }

    const needsFollowup = ['reached', 'not_reached', 'call_back', 'appointment'].includes(callResult);
    if (needsFollowup && !nextFollowup) {
      toast.error("Takip tarihi zorunludur.");
      return;
    }

    const now = new Date().toISOString();
    
    try {
      await logActivityMutation.mutateAsync({
        lead_id: lead!.id,
        action_type: 'call',
        result: callResult,
        note: callNote,
        scheduled_followup_at: nextFollowup || undefined,
        happened_at: now
      });

      const newNote = `${new Date().toLocaleDateString('tr-TR')}: ${callResult.toUpperCase()} - ${callNote}`;
      await updateLeadMutation.mutateAsync({ 
        last_contacted_at: now,
        last_call_result: callResult,
        last_call_result_at: now,
        next_followup_at: nextFollowup || undefined,
        notes: lead?.notes ? `${lead.notes}\n${newNote}` : newNote
      });

      if (nextFollowup) {
        const taskData: Omit<Task, 'id' | 'user_id'> = {
          title: `Lead Takibi: ${lead!.name}`,
          due_date: nextFollowup,
          time: nextFollowup ? new Date(`${nextFollowup}T09:00:00`).toISOString() : new Date().toISOString(),
          completed: false,
          type: 'Arama',
          notes: `Görüşme sonucu: ${callResult}. Ek not: ${callNote}`,
          lead_id: lead!.id,
        };

        if (isRegionNetwork) {
          taskData.source = 'crm';
          taskData.metadata = {
            lead_id: lead!.id,
            lead_type: 'Bölge Network',
            origin: 'bolgem_network'
          };
        }

        await createFollowupTaskMutation.mutateAsync(taskData);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      }

      toast.success("Görüşme kaydedildi!");
      setShowCallForm(false);
      setCallResult('');
      setCallNote('');
      setNextFollowup('');
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    }
  };

  if (!lead) return null;
  
  const isRegionNetwork = lead.type === 'Bölge Network';
  const hasPhone = typeof lead.phone === 'string' && lead.phone.trim().length > 3;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center p-0 md:p-6">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-[#F8FAFC] w-full md:max-w-6xl md:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col h-[95vh] md:h-[88vh]">
          
          {/* Header */}
          <div className="bg-white px-4 md:px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                  <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} className="text-slate-600" /></button>
                  <h2 className="text-lg font-black text-slate-800 hidden md:block tracking-tight">Kişi Kartı</h2>
              </div>
              <div className="md:hidden text-base font-black text-slate-800 tracking-tight">Detay</div>
              <div className="w-10"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-none">
             <div className="mx-auto flex flex-col lg:flex-row gap-6">
                
                {/* Sol/Ana Kolon */}
                <div className="flex-1 flex flex-col gap-4 md:gap-6">
                   
                   {/* 1. Profil ve Özet Kartı */}
                   <div className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-sm relative">
                      {/* Desktop Aksiyonlar */}
                      <div className="absolute top-6 right-6 hidden md:flex gap-2">
                         <button onClick={onEdit} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold shadow-sm">
                            <Edit2 size={16} /> <span className="text-xs">Düzenle</span>
                         </button>
                         <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors text-red-600 font-bold shadow-sm">
                            <Trash2 size={16} /> <span className="text-xs">Sil</span>
                         </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start md:items-center">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0 border-4 border-white shadow-md ring-1 ring-slate-100">
                              <UserIcon size={36} />
                          </div>
                          <div className="flex-1 flex justify-between items-start w-full md:w-auto">
                              <div className="space-y-2">
                                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">{lead.name || 'İsimsiz Müşteri'}</h2>
                                  <div className="flex flex-wrap items-center gap-2">
                                     {isRegionNetwork ? (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-emerald-200">Bölge Network</span>
                                     ) : (
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200">{lead.status || 'Aday'}</span>
                                     )}
                                     {!isRegionNetwork && (
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                                           lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                           lead.temperature === 'cold' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                        }`}>
                                           {lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'Sıcak' : lead.temperature === 'cold' ? 'Soğuk' : 'Ilık'}
                                        </span>
                                     )}
                                  </div>
                              </div>
                              {/* Mobil Edit/Delete */}
                              <div className="flex md:hidden gap-2">
                                  <button onClick={onEdit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm"><Edit2 size={16} /></button>
                                  <button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 shadow-sm"><Trash2 size={16} /></button>
                              </div>
                          </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <Phone size={12} /> Telefon
                              </div>
                              <div className="text-base font-black text-slate-900">{lead.phone || '-'}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <MapPin size={12} /> Bölge
                              </div>
                              <div className="text-base font-bold text-slate-800">{lead.district || '-'}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <Clock size={12} /> Son Görüşme
                              </div>
                              <div className="text-sm font-bold text-slate-800">{lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('tr-TR', {day:'numeric', month:'short', year:'numeric'}) : '-'}</div>
                              <div className="text-[10px] text-slate-400 font-bold">{lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-orange-500">
                                <Calendar size={12} /> Sonraki Takip
                              </div>
                              <div className={`text-sm font-black ${lead.next_followup_at ? 'text-orange-600' : 'text-slate-800'}`}>{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString('tr-TR', {day:'numeric', month:'short', year:'numeric'}) : '-'}</div>
                              <div className="text-[10px] text-orange-500 font-bold">{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                          </div>
                      </div>
                   </div>

                   {/* Silme Onayı inline */}
                   <AnimatePresence>
                     {showDeleteConfirm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 bg-red-50/80 rounded-[24px] border border-red-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm font-bold text-red-900">Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?</p>
                            <div className="flex gap-2 w-full md:w-auto">
                              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 md:flex-none px-6 py-3 bg-white rounded-xl text-slate-600 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-colors">Vazgeç</button>
                              <button onClick={() => { onDelete(lead.id); setShowDeleteConfirm(false); onClose(); }} className="flex-1 md:flex-none px-6 py-3 bg-red-600 rounded-xl text-white font-bold text-sm shadow-md hover:bg-red-700 transition-colors">Sil</button>
                            </div>
                          </div>
                        </motion.div>
                     )}
                   </AnimatePresence>

                   {/* 2. Aradın Mı CTA */}
                   <div className="bg-orange-50 rounded-[24px] md:rounded-[32px] border-2 border-orange-100 transition-colors overflow-hidden">
                      {showCallForm ? (
                          <div className="p-5 md:p-6 space-y-5">
                             <div className="flex justify-between items-center">
                               <span className="text-xs font-black uppercase tracking-widest text-orange-900">Arama Sonucu</span>
                               <button onClick={() => setShowCallForm(false)} className="text-orange-900 hover:bg-orange-200 p-2 rounded-xl transition-colors"><X size={18} /></button>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                               {CALL_RESULTS.map((res) => (
                                 <button 
                                   key={res.id} 
                                   onClick={() => setCallResult(res.id)}
                                   className={`flex items-center justify-center gap-2 p-3 md:flex-col md:gap-1.5 md:p-3 rounded-2xl border-2 transition-all ${callResult === res.id ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-95' : 'bg-white/80 text-orange-800 border-orange-200/50 hover:border-orange-300 hover:bg-white shadow-sm'}`}
                                 >
                                   <res.icon size={16} className={callResult === res.id ? 'text-white' : 'text-orange-500'} />
                                   <span className="text-[11px] font-bold tracking-tight">{res.label}</span>
                                 </button>
                               ))}
                             </div>
                             
                             {['reached', 'not_reached', 'call_back', 'appointment'].includes(callResult) && (
                               <div className="space-y-3 bg-white/60 p-5 rounded-2xl border border-orange-200/50">
                                 <label className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Sonraki Takip Planı</label>
                                 <div className="flex flex-wrap gap-2 mb-1">
                                    <button onClick={() => { const d = new Date(); d.setHours(d.getHours() + 1); setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }} className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-xs font-bold transition-colors">1 Saat Sonra</button>
                                    <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10,0,0,0); setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }} className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-xs font-bold transition-colors">Yarın Sabah</button>
                                    <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(10,0,0,0); setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }} className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-xl text-xs font-bold transition-colors">Haftaya</button>
                                 </div>
                                 <input 
                                   type="datetime-local" 
                                   value={nextFollowup}
                                   onChange={(e) => setNextFollowup(e.target.value)}
                                   className="w-full bg-white border-2 border-orange-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:border-orange-400 outline-none transition-colors"
                                 />
                               </div>
                             )}

                             <div className="space-y-2 bg-white/60 p-5 rounded-2xl border border-orange-200/50">
                               <label className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Görüşme Notu</label>
                               <textarea 
                                 value={callNote}
                                 onChange={(e) => setCallNote(e.target.value)}
                                 placeholder="Görüşme detaylarını yazın..."
                                 className="w-full bg-white border-2 border-orange-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-orange-400 outline-none resize-none h-24 transition-colors"
                               />
                             </div>

                             <div className="flex justify-end pt-2">
                                 <button 
                                   onClick={handleSaveCall}
                                   disabled={updateLeadMutation.isPending || logActivityMutation.isPending}
                                   className="w-full md:w-auto px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                 >
                                   <Check size={18} /> GÖRÜŞMEYİ KAYDET
                                 </button>
                             </div>
                          </div>
                      ) : (
                          <button onClick={() => setShowCallForm(true)} className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-orange-100/50 transition-colors text-left group">
                             <div className="flex items-center gap-4">
                               <div className="w-14 h-14 bg-orange-200 text-orange-600 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
                                 <Phone size={24} />
                               </div>
                               <div>
                                 <div className="text-base md:text-lg font-black text-slate-900 group-hover:text-orange-900 transition-colors">Aradın mı? Görüşmeyi Kaydet</div>
                                 <div className="text-xs md:text-sm text-orange-700/80 font-bold mt-0.5">Takip disiplinini güçlendir, hiçbir görüşmeyi kaçırma.</div>
                               </div>
                             </div>
                             <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold text-sm rounded-xl shadow-sm border-2 border-orange-100 group-hover:bg-orange-50 group-hover:border-orange-200 transition-all">
                                <Plus size={18} /> Görüşme Kaydet
                             </div>
                             <div className="md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500 border border-orange-100">
                               <Plus size={20} />
                             </div>
                          </button>
                      )}
                   </div>

                   {/* 4. Akıllı Takip Serisi */}
                   {!isRegionNetwork && (
                       <div className="bg-white rounded-[24px] md:rounded-[32px] border border-blue-100 shadow-sm relative overflow-hidden">
                           <div className="p-5 md:p-6">
                              <div className="flex items-center justify-between mb-5">
                                  <div className="flex items-center gap-3 text-slate-900">
                                    <Zap size={22} className="fill-blue-500 text-blue-500" />
                                    <span className="text-base font-black">Akıllı Takip Serisi</span>
                                  </div>
                                  <span className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 text-xs font-black rounded-full">4 Öneri</span>
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {(Object.keys(DRIP_CAMPAIGNS) as DripEventType[]).map((key) => {
                                   const Icon = key === 'OFFER_MADE' ? FileText : key === 'SHOWING_DONE' ? MapPin : key === 'PORTFOLIO_LISTED' ? UserIcon : Tag;
                                   return (
                                     <button key={key} onClick={() => handleStartDrip(key)} disabled={loadingDrip} className="flex flex-col items-start gap-3 p-4 bg-white border-2 border-blue-50 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm rounded-[20px] transition-all text-blue-800 text-left disabled:opacity-50 group">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:scale-110 shadow-sm transition-all"><Icon size={18} className="text-blue-600"/></div>
                                        <span className="font-bold text-xs leading-tight">{DRIP_CAMPAIGNS[key].label}</span>
                                     </button>
                                   )
                                })}
                              </div>
                           </div>
                       </div>
                   )}

                   {/* 5. İletişim Kartları */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hasPhone ? (
                        <button 
                          onClick={() => setShowCallForm(true)}
                          className="flex items-center bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md rounded-[24px] p-5 transition-all group text-left"
                        >
                          <div className="flex-1">
                             <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Telefon</div>
                             <div className="text-xl font-black text-slate-900">{lead.phone}</div>
                             <div className="text-[11px] font-bold text-slate-400 mt-1.5 group-hover:text-orange-600 transition-colors">Hızlıca ara ve not al</div>
                          </div>
                          <div className="w-12 h-12 bg-slate-50 text-orange-500 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all shadow-sm">
                             <Phone size={20} />
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[24px] p-5 opacity-70">
                          <div className="flex-1">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Telefon</div>
                             <div className="text-xl font-black text-slate-500">Girilmemiş</div>
                          </div>
                          <div className="w-12 h-12 bg-white text-slate-300 rounded-2xl flex items-center justify-center border border-slate-200">
                             <Phone size={20} />
                          </div>
                        </div>
                      )}

                      {hasPhone ? (
                        <a href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md rounded-[24px] p-5 transition-all group text-left">
                          <div className="flex-1">
                             <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MessageSquare size={12}/> WhatsApp</div>
                             <div className="text-xl font-black text-slate-900">Mesaj Gönder</div>
                             <div className="text-[11px] font-bold text-slate-400 mt-1.5 group-hover:text-emerald-600 transition-colors">WhatsApp ile iletişime geç</div>
                          </div>
                          <div className="w-12 h-12 bg-slate-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                             <MessageSquare size={20} />
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[24px] p-5 opacity-70">
                          <div className="flex-1">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MessageSquare size={12}/> WhatsApp</div>
                             <div className="text-xl font-black text-slate-500">Girilmemiş</div>
                          </div>
                          <div className="w-12 h-12 bg-white text-slate-300 rounded-2xl flex items-center justify-center border border-slate-200">
                             <MessageSquare size={20} />
                          </div>
                        </div>
                      )}
                   </div>

                   {/* 6. Araçlar ve Dokümanlar */}
                   {!isRegionNetwork && (
                       <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-4 space-y-2">
                          <div className="flex items-center gap-2 text-slate-800 font-black text-sm px-2 py-1">
                             <FileText size={16} className="text-slate-400" /> Araçlar & Dokümanlar
                          </div>
                          
                          <button onClick={() => { setDocumentAutomationLead?.(lead); setShowDocumentAutomation?.(true); onClose(); }} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-100 rounded-[20px] transition-all group text-left">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white text-orange-500 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><FileText size={18} /></div>
                                <div>
                                   <div className="text-sm font-bold text-slate-900 group-hover:text-orange-900">Resmi Doküman Oluştur</div>
                                   <div className="text-[11px] text-slate-500 mt-0.5 group-hover:text-orange-700/70">Sözleşme, teklif, portföy sunumu vb. hazırlayın</div>
                                </div>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-100 transition-colors">
                               <Plus size={16} />
                             </div>
                          </button>
                       </div>
                   )}

                </div>

                {/* Sağ Kolon (Secondary / Logs) */}
                <div className="w-full lg:w-[320px] xl:w-[380px] flex flex-col gap-4 md:gap-6 shrink-0 lg:sticky lg:top-0 lg:self-start lg:max-h-full">
                   
                   {/* Geçmiş Aktiviteler */}
                   <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
                            <Clock size={20} className="text-slate-400" /> Aktivite Geçmişi
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                          {activities.length > 0 ? (
                             <div className="relative pl-4 space-y-6 border-l-2 border-slate-100 my-2">
                                {activities.map((activity) => (
                                   <div key={activity.id} className="relative">
                                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full ring-4 ring-white bg-blue-500 border border-blue-600"></div>
                                      <div className="flex justify-between items-center mb-1.5">
                                         <div className="flex items-center gap-2">
                                           <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                                             {activity.action_type === 'call' ? 'Arama' : activity.action_type}
                                           </span>
                                           <span className="text-xs font-bold text-slate-900">
                                             {activity.result && `${{
                                               reached: 'Ulaşıldı',
                                               not_reached: 'Ulaşılamadı',
                                               call_back: 'Sonra Ara',
                                               meeting_set: 'Randevu Çıktı',
                                               appointment: 'Randevu Çıktı',
                                               not_interested: 'İlgilenmiyor',
                                               wrong_number: 'Yanlış Numara'
                                             }[activity.result] || activity.result}`}
                                           </span>
                                         </div>
                                      </div>
                                      {activity.note && <div className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{activity.note}</div>}
                                      <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                         <Clock size={10} />
                                         {new Date(activity.happened_at || new Date()).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})} • {new Date(activity.happened_at || new Date()).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="text-center py-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                  <Clock size={24} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-black text-slate-800">Henüz geçmiş aktivite yok</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[200px] mx-auto">Yapılan aramalar ve alınan notlar burada kronolojik olarak listelenir.</p>
                             </div>
                          )}
                      </div>
                   </div>

                   {/* Notlar & Özet */}
                   <div className="bg-amber-50/50 rounded-[24px] md:rounded-[32px] border border-amber-100 shadow-sm p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2.5 text-amber-900 font-black text-base">
                            <FileText size={20} className="text-amber-500" /> Notlar
                         </div>
                      </div>
                      <div className="text-sm font-medium text-amber-900/80 bg-white border border-amber-100 p-5 rounded-2xl min-h-[140px] whitespace-pre-wrap shadow-sm">
                         {lead.notes || <span className="italic text-amber-900/40 font-normal">Kişiye ait özel not veya özet bilgisi bulunmuyor. Düzenle butonunu kullanarak ekleyebilirsiniz.</span>}
                      </div>
                   </div>

                </div>

             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
