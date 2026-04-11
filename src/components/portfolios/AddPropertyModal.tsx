import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { locationService } from '../../services/locationService';

interface AddPropertyModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  show,
  onClose,
  onSubmit,
  isPending
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Daire',
    category: 'Satılık',
    price: '',
    status: 'Yeni',
    address: { city: 'İstanbul', district: '', neighborhood: '', fullAddress: '' },
    details: { brut_m2: '', net_m2: '', rooms: '', floor: '', totalFloors: '', age: '' },
    owner: { name: '', phone: '', trust_score: 80 },
    commission_rate: 2,
    images: [] as string[],
    health_score: 75,
    notes: '',
    target_customer_type: '',
    investment_suitability: ''
  });

  const cities = locationService.getCities();
  const districts = formData.address.city ? locationService.getDistricts(formData.address.city) : [];
  const neighborhoods = (formData.address.city && formData.address.district) ? locationService.getNeighborhoods(formData.address.city, formData.address.district) : [];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setFormData({...formData, price: ''});
      return;
    }
    const formatted = new Intl.NumberFormat('tr-TR').format(Number(rawValue));
    setFormData({...formData, price: formatted});
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      price: Number(formData.price.toString().replace(/\D/g, '')),
      details: {
        ...formData.details,
        brut_m2: Number(formData.details.brut_m2),
        net_m2: Number(formData.details.net_m2),
        floor: Number(formData.details.floor),
        totalFloors: Number(formData.details.totalFloors),
        age: Number(formData.details.age)
      }
    };
    onSubmit(payload);
  };

  const steps = [
    { id: 1, title: 'Temel Bilgiler' },
    { id: 2, title: 'Konum' },
    { id: 3, title: 'Mülk Detayları' },
    { id: 4, title: 'Mal Sahibi & Notlar' }
  ];

  return (
    <AnimatePresence>
      {show && (
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Yeni Portföy</h2>
                <div className="flex gap-1 mt-2">
                  {steps.map((s) => (
                    <div 
                      key={s.id} 
                      className={`h-1 rounded-full transition-all ${step >= s.id ? 'w-8 bg-orange-600' : 'w-4 bg-slate-100'}`} 
                    />
                  ))}
                </div>
              </div>
              <button onClick={() => { onClose(); setStep(1); }} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adım {step}/4</div>
              <div className="text-sm font-bold text-slate-900">{steps.find(s => s.id === step)?.title}</div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlan Başlığı</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Gül Sokak'ta Manzaralı 3+1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mülk Tipi</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option>Daire</option>
                      <option>Villa</option>
                      <option>Arsa</option>
                      <option>Ticari</option>
                      <option>Fabrika</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                    >
                      <option>Satılık</option>
                      <option>Kiralık</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fiyat</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Örn: 5.000.000"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pr-12 text-sm focus:border-orange-500 outline-none font-medium"
                      value={formData.price}
                      onChange={handlePriceChange}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      TL
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20"
                >
                  Sonraki Adım
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şehir</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address.city}
                    onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value, district: '', neighborhood: ''}})}
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlçe</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address.district}
                    onChange={e => setFormData({...formData, address: {...formData.address, district: e.target.value, neighborhood: ''}})}
                  >
                    <option value="">İlçe Seçiniz</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mahalle</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address.neighborhood}
                    onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})}
                  >
                    <option value="">Mahalle Seçiniz</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brüt M2</label>
                    <input 
                      type="number" 
                      placeholder="Örn: 120"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.brut_m2}
                      onChange={e => setFormData({...formData, details: {...formData.details, brut_m2: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net M2</label>
                    <input 
                      type="number" 
                      placeholder="Örn: 100"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.net_m2}
                      onChange={e => setFormData({...formData, details: {...formData.details, net_m2: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oda Sayısı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 3+1"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.rooms}
                      onChange={e => setFormData({...formData, details: {...formData.details, rooms: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bina Yaşı</label>
                    <input 
                      type="number" 
                      placeholder="Örn: 5"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.age}
                      onChange={e => setFormData({...formData, details: {...formData.details, age: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi İsim</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.owner.name}
                    onChange={e => setFormData({...formData, owner: {...formData.owner, name: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi Telefon</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 0532 123 45 67"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.owner.phone}
                    onChange={e => setFormData({...formData, owner: {...formData.owner, phone: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Müşteri Tipi</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Genç aileler, Yatırımcılar"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.target_customer_type}
                    onChange={e => setFormData({...formData, target_customer_type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yatırım Uygunluğu</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.investment_suitability}
                    onChange={e => setFormData({...formData, investment_suitability: e.target.value})}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Orta">Orta</option>
                    <option value="Düşük">Düşük</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24 resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                  >
                    {isPending ? 'Kaydediliyor...' : 'Portföyü Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
