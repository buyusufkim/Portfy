import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Users, MapPin, Calendar } from 'lucide-react';
import { Property, Lead } from '../../../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  properties: Property[];
  leads: Lead[];
  initialPropertyId?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  properties, 
  leads,
  initialPropertyId 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Arama' as 'Arama' | 'Randevu' | 'Saha' | 'Takip' | 'Güncelleme' | 'Sosyal Medya',
    property_id: initialPropertyId || '',
    lead_id: '',
    notes: '',
    due_date: new Date().toISOString().split('T')[0],
    completed: true // Varsayılan olarak geçmiş aktivite kaydediyor olabiliriz
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Aktivite Kaydı</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setFormData({...formData, type: 'Arama'})}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'Arama' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <Phone size={20} />
                  <span className="text-[10px] font-bold">Arama</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, type: 'Randevu'})}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'Randevu' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <Users size={20} />
                  <span className="text-[10px] font-bold">Randevu</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, type: 'Saha'})}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'Saha' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                  <MapPin size={20} />
                  <span className="text-[10px] font-bold">Gösterme</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Açıklama / Başlık</label>
                <input 
                  type="text" 
                  placeholder="Örn: Portföy hakkında bilgi verildi"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlgili Portföy</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                  value={formData.property_id}
                  onChange={e => setFormData({...formData, property_id: e.target.value})}
                >
                  <option value="">Seçiniz...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlgili Müşteri (Opsiyonel)</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                  value={formData.lead_id}
                  onChange={e => setFormData({...formData, lead_id: e.target.value})}
                >
                  <option value="">Seçiniz...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarih</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.due_date}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                  />
                  <Calendar className="absolute right-4 top-4 text-slate-400" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <button 
                onClick={() => {
                  onSubmit({
                    ...formData,
                    time: new Date(formData.due_date).toISOString()
                  });
                  setFormData({
                    title: '',
                    type: 'Arama',
                    property_id: initialPropertyId || '',
                    lead_id: '',
                    notes: '',
                    due_date: new Date().toISOString().split('T')[0],
                    completed: true
                  });
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                Kaydı Tamamla
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
