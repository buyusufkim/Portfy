import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

import { Building } from '../../../types';

interface AddVisitModalProps {
  showAddVisit: boolean;
  setShowAddVisit: (val: boolean) => void;
  addVisitMutation: any;
}

export const AddVisitModal: React.FC<AddVisitModalProps> = ({ 
  showAddVisit, 
  setShowAddVisit, 
  addVisitMutation 
}) => {
  const [formData, setFormData] = useState({
    address: '',
    district: 'Beşiktaş',
    status: 'Görüşüldü' as Building['status'],
    notes: ''
  });

  return (
    <AnimatePresence>
      {showAddVisit && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Saha Ziyareti Kaydı</h2>
              <button onClick={() => setShowAddVisit(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adres / Bina Bilgisi</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
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
                  <option>Görüşüldü</option>
                  <option>Potansiyel</option>
                  <option>Ret</option>
                  <option>Boş</option>
                </select>
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
                onClick={() => addVisitMutation.mutate(formData)}
                disabled={addVisitMutation.isPending}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
              >
                {addVisitMutation.isPending ? 'Kaydediliyor...' : 'Ziyareti Kaydet'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
