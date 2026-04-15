import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { Lead, Category, Property, MutationResult } from '../../types';
import { LeadDetailModal } from '../LeadDetailModal';
import WhatsAppImportModal from '../WhatsAppImportModal';

interface CRMModalsProps {
  categories: Category[];
  addLeadMutation: MutationResult<any, any>;
  updateLeadMutation: MutationResult<any, any>;
  deleteLeadMutation: MutationResult<any, any>;
  showAddLead: boolean;
  setShowAddLead: (show: boolean) => void;
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (show: boolean) => void;
  leadAnalysis: string | null;
  setLeadAnalysis: (analysis: string | null) => void;
  analyzeLeadsMutation: MutationResult<string, any>;
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  properties: Property[];
}

export const CRMModals: React.FC<CRMModalsProps> = ({
  categories,
  addLeadMutation,
  updateLeadMutation,
  deleteLeadMutation,
  showAddLead,
  setShowAddLead,
  showWhatsAppImport,
  setShowWhatsAppImport,
  leadAnalysis,
  setLeadAnalysis,
  analyzeLeadsMutation,
  selectedLead,
  setSelectedLead,
  isEditing,
  setIsEditing,
  properties
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'Alıcı',
    status: 'Aday' as Lead['status'],
    district: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditing && selectedLead) {
      setFormData({
        name: selectedLead.name,
        phone: selectedLead.phone,
        type: selectedLead.type,
        status: selectedLead.status,
        district: selectedLead.district || '',
        notes: selectedLead.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        type: 'Alıcı',
        status: 'Aday',
        district: '',
        notes: ''
      });
    }
  }, [isEditing, selectedLead, showAddLead]);

  const handleSubmit = () => {
    if (isEditing && selectedLead) {
      updateLeadMutation.mutate({ id: selectedLead.id, data: formData });
    } else {
      addLeadMutation.mutate(formData);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showAddLead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditing ? 'Lead Güncelle' : 'Yeni Lead Kaydı'}
                </h2>
                <button onClick={() => { setShowAddLead(false); setIsEditing(false); }} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Müşteri Adı Soyadı</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tip / Kategori</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="Alıcı">Alıcı</option>
                      <option value="Satıcı">Satıcı</option>
                      <option value="Mal Sahibi">Mal Sahibi</option>
                      <option value="Esnaf">Esnaf</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölge (İlçe)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durum</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option>Aday</option>
                    <option>Sıcak</option>
                    <option>Yetki Alındı</option>
                    <option>Pasif</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none min-h-[100px]"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={addLeadMutation.isPending || updateLeadMutation.isPending}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                >
                  {addLeadMutation.isPending || updateLeadMutation.isPending ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Lead Kaydet')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WhatsAppImportModal 
        showWhatsAppImport={showWhatsAppImport} 
        setShowWhatsAppImport={setShowWhatsAppImport} 
      />

      <AnimatePresence>
        {leadAnalysis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={24} className="text-orange-600" />
                  Rehber Analizi
                </h2>
                <button onClick={() => setLeadAnalysis(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-auto pr-2 custom-scrollbar">
                {leadAnalysis}
              </div>
              <button 
                onClick={() => setLeadAnalysis(null)}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
              >
                Anladım
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LeadDetailModal 
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onEdit={() => {
          setIsEditing(true);
          setShowAddLead(true);
        }}
        onDelete={(id) => deleteLeadMutation.mutate(id)}
        properties={properties}
      />
    </>
  );
};
