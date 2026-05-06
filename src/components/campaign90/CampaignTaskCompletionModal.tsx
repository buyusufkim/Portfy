import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { CampaignTask } from '../../types';

export type CampaignTaskCompletionMode = 
  | 'instant'
  | 'note_required'
  | 'office_info_required'
  | 'document_info_required'
  | 'crm_action_required'
  | 'property_action_required';

export const getCampaignTaskCompletionMode = (task: CampaignTask): CampaignTaskCompletionMode => {
    const title = task.title.toLowerCase();
    const desc = task.description.toLowerCase();
    const key = task.task_key.toLowerCase();
    const fullText = `${title} ${desc} ${key}`;

    if (fullText.includes('ofis') || fullText.includes('broker') || fullText.includes('franchise') || fullText.includes('bağlı ofis')) {
        return 'office_info_required';
    }
    if (fullText.includes('myk') || fullText.includes('yetki') || fullText.includes('kvkk') || fullText.includes('sözleşme') || fullText.includes('mesleki durum')) {
        return 'document_info_required';
    }
    if (fullText.includes('alıcı') || fullText.includes('satıcı') || fullText.includes('müşteri') || fullText.includes('mülk sahibi') || fullText.includes('görüşme') || fullText.includes('takip') || fullText.includes('lead')) {
        return 'crm_action_required';
    }
    if (fullText.includes('portföy') || fullText.includes('cma') || fullText.includes('değer analizi') || fullText.includes('mülk') || fullText.includes('ekspertiz')) {
        return 'property_action_required';
    }
    if (fullText.includes('niyet mektubu') || fullText.includes('rapor') || fullText.includes('özet') || fullText.includes('değerlendirme')) {
        return 'note_required';
    }
    return 'instant';
};

interface Props {
  task: CampaignTask;
  mode: CampaignTaskCompletionMode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, any>) => void;
  isPending: boolean;
}

export const CampaignTaskCompletionModal: React.FC<Props> = ({ task, mode, isOpen, onClose, onSubmit, isPending }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isFormValid = () => {
        if (mode === 'office_info_required') return !!formData.officeName && !!formData.notes;
        if (mode === 'document_info_required') return !!formData.documentType && !!formData.status && !!formData.notes;
        if (mode === 'crm_action_required') return !!formData.personName && !!formData.type && !!formData.notes;
        if (mode === 'property_action_required') return !!formData.propertyName && !!formData.type && !!formData.status && !!formData.notes;
        if (mode === 'note_required') return !!formData.notes && formData.notes.length >= 10;
        return true;
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">{task.title}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Görevi tamamlamak için bilgileri gir</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {mode === 'office_info_required' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ofis Adı*</label>
                                    <input type="text" required value={formData.officeName || ''} onChange={e => setFormData({...formData, officeName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Marka/Franchise</label>
                                    <input type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Özet Notlar*</label>
                                    <textarea required rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" placeholder="Görüşme nasıl geçti?" />
                                </div>
                            </>
                        )}

                        {mode === 'document_info_required' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Belge/Süreç Tipi*</label>
                                    <select required value={formData.documentType || ''} onChange={e => setFormData({...formData, documentType: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors">
                                        <option value="">Seçiniz</option>
                                        <option value="MYK">MYK 5 Seviye Sertifikası</option>
                                        <option value="Yetki">Yetki Belgesi</option>
                                        <option value="KVKK">KVKK Metinleri</option>
                                        <option value="Sozlesme">Yer Gösterme / Yetki Sözleşmesi</option>
                                        <option value="Diger">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Durum*</label>
                                    <select required value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors">
                                        <option value="">Seçiniz</option>
                                        <option value="Arastirildi">Araştırıldı</option>
                                        <option value="BasvuruYapilacak">Başvuru Yapılacak</option>
                                        <option value="BasvuruYapildi">Başvuru Yapıldı</option>
                                        <option value="Tamamlandi">Tamamlandı/Alındı</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama*</label>
                                    <textarea required rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                            </>
                        )}

                        {mode === 'crm_action_required' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Kişi / Kurum Adı*</label>
                                    <input type="text" required value={formData.personName || ''} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri Tipi*</label>
                                    <select required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors">
                                        <option value="">Seçiniz</option>
                                        <option value="Alici">Alıcı</option>
                                        <option value="Satici">Satıcı</option>
                                        <option value="Kiraci">Kiracı</option>
                                        <option value="MulkSahibi">Mülk Sahibi</option>
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="temp" value="Sicak" onChange={e => setFormData({...formData, temperature: e.target.value})} />
                                        <span className="text-sm font-bold text-red-600">Sıcak</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="temp" value="Ilik" onChange={e => setFormData({...formData, temperature: e.target.value})} />
                                        <span className="text-sm font-bold text-orange-500">Ilık</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="temp" value="Soguk" onChange={e => setFormData({...formData, temperature: e.target.value})} />
                                        <span className="text-sm font-bold text-blue-500">Soğuk</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Notlar*</label>
                                    <textarea required rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" placeholder="Görüşme detayları..." />
                                </div>
                            </>
                        )}

                        {mode === 'property_action_required' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Portföy / Adres Bilgisi*</label>
                                    <input type="text" required value={formData.propertyName || ''} onChange={e => setFormData({...formData, propertyName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mülk Tipi*</label>
                                        <select required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors">
                                            <option value="">Seçiniz</option>
                                            <option value="Daire">Daire</option>
                                            <option value="Arsa">Arsa</option>
                                            <option value="Ticari">Ticari</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Durum*</label>
                                        <select required value={formData.status || ''} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors">
                                            <option value="">Seçiniz</option>
                                            <option value="Aday">Portföy Adayı</option>
                                            <option value="CMA">CMA / Değer Analizi</option>
                                            <option value="Gorusme">Yetki Görüşmesi</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Detaylar / Notlar*</label>
                                    <textarea required rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" />
                                </div>
                            </>
                        )}

                        {mode === 'note_required' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Görev Çıktısı / Notlar (En az 10 karakter)*</label>
                                <textarea required rows={4} minLength={10} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 focus:bg-white transition-colors" placeholder="Bugün neler öğrendin? Neler yaptın?" />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button type="button" onClick={onClose} disabled={isPending} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                            İptal
                        </button>
                        <button type="submit" disabled={isPending || !isFormValid()} className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                            {isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Kaydet ve Tamamla"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
