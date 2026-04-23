import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, MessageSquare, Trash2, Edit2, User as UserIcon,
  Calendar, MapPin, Tag, AlertCircle, FileText, Plus, Zap 
} from 'lucide-react';
import { Lead, Property } from '../types';
import { api } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { dripService, DRIP_CAMPAIGNS, DripEventType } from '../services/dripService';
import { toast } from 'react-hot-toast';

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

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead, onClose, onEdit, onDelete, properties,
  setShowDocumentAutomation, setDocumentAutomationLead, setDocumentAutomationProperty
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingDrip, setLoadingDrip] = useState(false);
  const queryClient = useQueryClient();

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
      toast.success("Görüşme kaydedildi!");
    }
  });

  const handleLogCall = () => {
    const note = window.prompt("Aradın mı? Takip Disiplini:\nNe konuştunuz? Kısaca not alın:");
    if (note) {
      updateLeadMutation.mutate({ 
        last_contacted_at: new Date().toISOString(),
        notes: lead!.notes ? `${lead!.notes}\n${new Date().toLocaleDateString('tr-TR')}: ${note}` : `${new Date().toLocaleDateString('tr-TR')}: ${note}`
      });
    }
  };

  if (!lead) return null;

  const associatedProperties = properties.filter(p => p.owner.phone === lead.phone);
  const canDelete = associatedProperties.length === 0;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
          <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"><X size={20} /></button>
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-orange-600"><UserIcon size={40} /></div>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${lead.status === 'Sıcak' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>{lead.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="p-3 bg-slate-50 rounded-2xl text-slate-600"><Edit2 size={20} /></button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-red-50 rounded-2xl text-red-600"><Trash2 size={20} /></button>
              </div>
            </div>

            {/* AKILLI TAKİP SERİSİ - YENİ MODÜL */}
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
              <a href={`tel:${lead.phone}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-colors group">
                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Phone size={20} /></div>
                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</div><div className="text-sm font-bold text-slate-900">{lead.phone}</div></div>
              </a>
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl group">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</div><div className="text-sm font-bold text-slate-900">Mesaj Gönder</div></div>
              </a>
            </div>

            <button onClick={handleLogCall} className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center justify-between hover:bg-orange-100 transition-colors group">
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