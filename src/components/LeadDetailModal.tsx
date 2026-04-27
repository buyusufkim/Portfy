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

  // Check for auto-trigger
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
      // 1. Log Activity
      await logActivityMutation.mutateAsync({
        lead_id: lead!.id,
        action_type: 'call',
        result: callResult,
        note: callNote,
        scheduled_followup_at: nextFollowup || undefined,
        happened_at: now
      });

      // 2. Update Lead
      const newNote = `${new Date().toLocaleDateString('tr-TR')}: ${callResult.toUpperCase()} - ${callNote}`;
      await updateLeadMutation.mutateAsync({ 
        last_contacted_at: now,
        last_call_result: callResult,
        last_call_result_at: now,
        next_followup_at: nextFollowup || undefined,
        notes: lead?.notes ? `${lead.notes}\n${newNote}` : newNote
      });

      // 3. Create follow-up task
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className={`relative h-32 bg-gradient-to-br ${isRegionNetwork ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} flex items-center justify-center shrink-0`}>
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"><X size={20} /></button>
            <div className={`w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center ${isRegionNetwork ? 'text-emerald-600' : 'text-orange-600'}`}><UserIcon size={40} /></div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{lead.name || 'İsimsiz Müşteri'}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {isRegionNetwork && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      Bölge Network
                    </span>
                  )}
                  {isRegionNetwork && lead.source && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Kaynak: {lead.source === 'bolgem' ? 'Bölgem Radar' : lead.source}
                    </span>
                  )}
                  {!isRegionNetwork && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.status === 'Sıcak' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{lead.status || 'Aday'}</span>
                  )}
                  {!isRegionNetwork && lead.temperature === 'hot' && <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={10} className="fill-red-500" /> Sıcak Fırsat</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="p-3 bg-slate-50 rounded-2xl text-slate-600"><Edit2 size={20} /></button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-red-50 rounded-2xl text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col gap-3">
                    <p className="text-sm font-bold text-red-900 text-center">Bu kaydı silmek istediğine emin misin?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 p-2 bg-white rounded-xl text-red-600 font-bold text-xs hover:bg-red-100 transition-colors">Vazgeç</button>
                      <button onClick={() => { onDelete(lead.id); setShowDeleteConfirm(false); onClose(); }} className="flex-1 p-2 bg-red-600 rounded-xl text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-sm">Sil</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isRegionNetwork && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                  <MapPin size={16} /> Bölge Temas Detayları
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">İlişki Seviyesi</span>
                    <span className="font-medium text-slate-700">{lead.relationship_level || 'Belirtilmedi'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">Potansiyel</span>
                    <span className="font-medium text-slate-700">{lead.potential || 'Belirtilmedi'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">Son Temas</span>
                    <span className="font-medium text-slate-700">{lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString('tr-TR') : (lead.last_contact ? new Date(lead.last_contact).toLocaleDateString('tr-TR') : 'Bilinmiyor')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">Sonraki Takip</span>
                    <span className="font-medium text-slate-700">{lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString('tr-TR') : (lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleDateString('tr-TR') : 'Belirtilmedi')}</span>
                  </div>
                  {lead.notes && (
                    <div className="col-span-2 pt-1">
                      <span className="block text-[10px] text-emerald-600 font-bold uppercase mb-1">Önizleme Notu</span>
                      <div className="bg-white/60 rounded-xl p-3 text-xs text-slate-600 border border-emerald-100/50 max-h-24 overflow-y-auto w-full">
                         {lead.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-emerald-100/50">
                  <button onClick={() => { setShowNetworkFollowupForm(!showNetworkFollowupForm); setShowNetworkNoteForm(false); }} className="flex-1 bg-white border border-emerald-200 text-emerald-700 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                    Takip Oluştur
                  </button>
                  <button onClick={() => { setShowNetworkNoteForm(!showNetworkNoteForm); setShowNetworkFollowupForm(false); }} className="flex-1 bg-white border border-emerald-200 text-emerald-700 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                    Not Ekle
                  </button>
                </div>
                
                <AnimatePresence>
                  {showNetworkFollowupForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100 mt-3 space-y-3">
                        <label className="block text-xs font-bold text-slate-700">Takip Tarihi</label>
                        <input type="date" value={networkFollowupDate} onChange={e => setNetworkFollowupDate(e.target.value)} className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" min={getTodayStr()} />
                        <label className="block text-xs font-bold text-slate-700">Not (Opsiyonel)</label>
                        <input type="text" placeholder="Takip amacı..." value={networkFollowupNote} onChange={e => setNetworkFollowupNote(e.target.value)} className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setShowNetworkFollowupForm(false)} className="flex-1 p-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">İptal</button>
                          <button onClick={handleSaveNetworkFollowup} disabled={createFollowupTaskMutation.isPending} className="flex-1 p-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Kaydet</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {showNetworkNoteForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100 mt-3 space-y-3">
                        <label className="block text-xs font-bold text-slate-700">Not</label>
                        <textarea placeholder="Görüşme veya temas notu..." value={networkNote} onChange={e => setNetworkNote(e.target.value)} className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[80px]" />
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setShowNetworkNoteForm(false)} className="flex-1 p-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">İptal</button>
                          <button onClick={handleSaveNetworkNote} disabled={updateLeadMutation.isPending} className="flex-1 p-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Not Ekle</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* CALL LOG FORM */}
            <AnimatePresence>
              {showCallForm ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-orange-50 rounded-[32px] border-2 border-orange-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-orange-900">Arama Sonucunu Seç</span>
                    <button onClick={() => setShowCallForm(false)} className="text-orange-900 hover:bg-orange-100 p-1 rounded-full"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CALL_RESULTS.map((res) => (
                      <button 
                        key={res.id} 
                        onClick={() => setCallResult(res.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${callResult === res.id ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-95' : 'bg-white text-slate-600 border-white hover:border-orange-200'}`}
                      >
                        <res.icon size={16} />
                        <span className="text-[9px] font-bold text-center leading-tight">{res.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {['reached', 'not_reached', 'call_back', 'appointment'].includes(callResult) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-orange-900 uppercase tracking-widest ml-1">Bir Sonraki Takip</label>
                      <div className="flex gap-2 mb-2">
                        <button 
                          onClick={() => {
                            const d = new Date(); d.setHours(d.getHours() + 1);
                            setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-xl text-[10px] font-bold hover:bg-orange-200 transition-colors"
                        >
                          1 Saat Sonra
                        </button>
                        <button 
                          onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10,0,0,0);
                            setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-xl text-[10px] font-bold hover:bg-orange-200 transition-colors"
                        >
                          Yarın
                        </button>
                        <button 
                          onClick={() => {
                            const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(10,0,0,0);
                            setNextFollowup(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                          }}
                          className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-xl text-[10px] font-bold hover:bg-orange-200 transition-colors"
                        >
                          Haftaya
                        </button>
                      </div>
                      <input 
                        type="datetime-local" 
                        value={nextFollowup}
                        onChange={(e) => setNextFollowup(e.target.value)}
                        className="w-full bg-white border-2 border-white rounded-2xl px-4 py-2 text-xs font-bold text-slate-900 focus:border-orange-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-orange-900 uppercase tracking-widest ml-1">Görüşme Notu</label>
                    <textarea 
                      value={callNote}
                      onChange={(e) => setCallNote(e.target.value)}
                      placeholder="Neler konuşuldu?.."
                      className="w-full bg-white border-2 border-white rounded-2xl px-4 py-3 text-xs font-medium text-slate-900 focus:border-orange-500 outline-none resize-none h-20"
                    />
                  </div>

                  <button 
                    onClick={handleSaveCall}
                    disabled={updateLeadMutation.isPending || logActivityMutation.isPending}
                    className="w-full py-3 bg-orange-600 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    KAYDET
                  </button>
                </motion.div>
              ) : (
                <button onClick={() => setShowCallForm(true)} className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center justify-between hover:bg-orange-100 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-200 text-orange-700 rounded-2xl flex items-center justify-center">
                      <Phone size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-orange-900">Aradın mı? Görüşmeyi Kaydet</div>
                      <div className="text-[10px] text-orange-700 mt-0.5">Takip disiplini için not alın</div>
                    </div>
                  </div>
                  <Plus size={20} className="text-orange-500" />
                </button>
              )}
            </AnimatePresence>

            {/* LEAD ACTIVITY HISTORY */}
            {activities.length > 0 ? (
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Geçmiş Aktiviteler</span>
                </div>
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800">
                          {activity.action_type === 'call' ? 'Arama' : activity.action_type}
                          {activity.result && ` - ${{
                            reached: 'Ulaşıldı',
                            not_reached: 'Ulaşılamadı',
                            call_back: 'Sonra Ara',
                            meeting_set: 'Randevu Çıktı',
                            appointment: 'Randevu Çıktı',
                            not_interested: 'İlgilenmiyor',
                            wrong_number: 'Yanlış Numara'
                          }[activity.result] || activity.result}`}
                        </div>
                        {activity.note && <div className="text-slate-500 text-xs italic mt-0.5">"{activity.note}"</div>}
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(activity.happened_at || new Date()).toLocaleString('tr-TR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 border-2 border-dashed border-slate-100 rounded-[32px] text-center space-y-2">
                <Clock size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-400">Henüz geçmiş aktivite yok</p>
                <p className="text-[10px] text-slate-400">Yapılan aramalar ve notlar burada kronolojik olarak listelenir.</p>
              </div>
            )}

            {/* AKILLI TAKİP SERİSİ - Sadece normal müşterilerde göster */}
            {!isRegionNetwork && (
              <div className="p-5 bg-blue-50/50 rounded-[32px] border border-blue-100/50 space-y-4">
                <div className="flex items-center gap-2 text-blue-900">
                  <Zap size={18} className="fill-blue-500 text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Akıllı Takip Serisi</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DRIP_CAMPAIGNS) as DripEventType[]).map((key) => (
                    <button key={key} onClick={() => handleStartDrip(key)} disabled={loadingDrip} className="text-[10px] font-bold bg-white hover:bg-blue-600 hover:text-white text-blue-700 py-3 px-2 rounded-2xl border border-blue-200 transition-all active:scale-95 disabled:opacity-50 shadow-sm">{DRIP_CAMPAIGNS[key].label}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {hasPhone ? (
                <a 
                  href={`tel:${lead.phone || ''}`} 
                  onClick={() => setShowCallForm(true)}
                  className="flex items-center gap-4 p-4 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-3xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Phone size={20} /></div>
                  <div><div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Telefon</div><div className="text-sm font-bold text-orange-900">{lead.phone}</div></div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-3xl cursor-not-allowed opacity-75">
                  <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><Phone size={20} /></div>
                  <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</div><div className="text-sm font-bold text-slate-500">Girilmemiş</div></div>
                </div>
              )}
              
              {hasPhone ? (
                <a href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group hover:bg-emerald-50 transition-colors">
                  <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
                  <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</div><div className="text-sm font-bold text-slate-900">Mesaj Gönder</div></div>
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl cursor-not-allowed opacity-75">
                   <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400"><MessageSquare size={20} /></div>
                   <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</div><div className="text-sm font-bold text-slate-500">Girilmemiş</div></div>
                </div>
              )}
            </div>

            {!isRegionNetwork && (
              <div className="pt-6 border-t border-slate-100">
                <button onClick={() => { setDocumentAutomationLead?.(lead); setShowDocumentAutomation?.(true); }} className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-orange-500 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600"><FileText size={24} /></div>
                    <div className="text-left"><div className="text-base font-black text-slate-900">Resmi Doküman Oluştur</div></div>
                  </div>
                  <Plus size={24} className="text-slate-300 group-hover:text-orange-500 transition-all" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
