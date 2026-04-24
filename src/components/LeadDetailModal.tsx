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
import { supabase } from '../lib/supabase';

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
      toast.success("Görüşme kaydedildi!");
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
      await createFollowupTaskMutation.mutateAsync({
        title: `Lead Takibi: ${lead!.name}`,
        due_date: nextFollowup,
        time: new Date().toISOString(),
        completed: false,
        type: 'Arama',
        notes: `Görüşme sonucu: ${callResult}. Ek not: ${callNote}`,
        lead_id: lead!.id
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    }

    setShowCallForm(false);
    setCallResult('');
    setCallNote('');
    setNextFollowup('');
  };

  if (!lead) return null;

  const associatedProperties = properties.filter(p => p.owner && p.owner.phone === lead.phone);
  const canDelete = associatedProperties.length === 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"><X size={20} /></button>
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-orange-600"><UserIcon size={40} /></div>
          </div>

          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{lead.name || 'İsimsiz Müşteri'}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.status === 'Sıcak' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{lead.status || 'Aday'}</span>
                  {lead.temperature === 'hot' && <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Zap size={10} className="fill-red-500" /> Sıcak Fırsat</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="p-3 bg-slate-50 rounded-2xl text-slate-600"><Edit2 size={20} /></button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-red-50 rounded-2xl text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>

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

            {/* AKILLI TAKİP SERİSİ */}
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

            <div className="grid grid-cols-2 gap-4">
              <a 
                href={`tel:${lead.phone || ''}`} 
                onClick={() => setShowCallForm(true)}
                className="flex items-center gap-4 p-4 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded-3xl transition-colors group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Phone size={20} /></div>
                <div><div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Telefon</div><div className="text-sm font-bold text-orange-900">{lead.phone || 'Girilmemiş'}</div></div>
              </a>
              <a href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</div><div className="text-sm font-bold text-slate-900">Mesaj Gönder</div></div>
              </a>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button onClick={() => { setDocumentAutomationLead?.(lead); setShowDocumentAutomation?.(true); }} className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-orange-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600"><FileText size={24} /></div>
                  <div className="text-left"><div className="text-base font-black text-slate-900">Resmi Doküman Oluştur</div></div>
                </div>
                <Plus size={24} className="text-slate-300 group-hover:text-orange-500 transition-all" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
