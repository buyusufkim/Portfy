// Dosya: src/components/portfolios/AddPropertyModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { locationService } from '../../services/locationService';
import { Property, Lead } from '../../types';
import { api } from '../../services/api';

interface AddPropertyModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => any;
  isPending: boolean;
  initialData?: Property | null;
  leads: Lead[];
}

const mapLibraries: ("places")[] = ["places"];

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  show,
  onClose,
  onSubmit,
  isPending,
  initialData,
  leads
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: mapLibraries,
  });

  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeadResults, setShowLeadResults] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'Daire',
    category: initialData?.category || 'Satılık',
    price: initialData?.price ? new Intl.NumberFormat('tr-TR').format(initialData.price) : '',
    status: initialData?.status || 'Yeni',
    address: initialData?.address || { city: 'Kayseri', district: '', neighborhood: '', fullAddress: '', lat: undefined, lng: undefined },
    details: {
      brut_m2: initialData?.details?.brut_m2?.toString() || '',
      net_m2: initialData?.details?.net_m2?.toString() || '',
      rooms: initialData?.details?.rooms || '',
      floor: initialData?.details?.floor?.toString() || '',
      totalFloors: initialData?.details?.totalFloors?.toString() || '',
      age: initialData?.details?.age?.toString() || ''
    },
    owner: initialData?.owner || { name: '', phone: '', trust_score: 80 },
    commission_rate: initialData?.commission_rate || 2,
    images: initialData?.images || [] as string[],
    health_score: initialData?.health_score || 75,
    notes: initialData?.notes || '',
    target_customer_type: initialData?.target_customer_type || '',
    investment_suitability: initialData?.investment_suitability || ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        type: initialData.type,
        category: initialData.category,
        price: new Intl.NumberFormat('tr-TR').format(initialData.price),
        status: initialData.status,
        address: initialData.address,
        details: {
          brut_m2: initialData.details.brut_m2.toString(),
          net_m2: initialData.details.net_m2.toString(),
          rooms: initialData.details.rooms,
          floor: initialData.details.floor.toString(),
          totalFloors: initialData.details.totalFloors.toString(),
          age: initialData.details.age.toString()
        },
        owner: initialData.owner,
        commission_rate: initialData.commission_rate,
        images: initialData.images,
        health_score: initialData.health_score,
        notes: initialData.notes,
        target_customer_type: initialData.target_customer_type || '',
        investment_suitability: initialData.investment_suitability || ''
      });
    } else {
      setFormData({
        title: '',
        type: 'Daire',
        category: 'Satılık',
        price: '',
        status: 'Yeni',
        address: { city: 'Kayseri', district: '', neighborhood: '', fullAddress: '', lat: undefined, lng: undefined },
        details: { brut_m2: '', net_m2: '', rooms: '', floor: '', totalFloors: '', age: '' },
        owner: { name: '', phone: '', trust_score: 80 },
        commission_rate: 2,
        images: [] as string[],
        health_score: 75,
        notes: '',
        target_customer_type: '',
        investment_suitability: ''
      });
    }
  }, [initialData, show]);

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

  const handleAddressNext = () => {
    if (!formData.address.lat && isLoaded && window.google) {
      const addressString = `${formData.address.neighborhood}, ${formData.address.district}, ${formData.address.city}, Türkiye`;
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: addressString }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            }
          }));
        }
      });
    }
    setStep(3);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.address.district) {
      alert('Lütfen zorunlu alanları doldurunuz (Başlık, Fiyat, İlçe)');
      return;
    }
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

    try {
      // Sadece formu gönderir. Eşleştirme artık PortfoliosPage.tsx içinde yapılacak.
      await onSubmit(payload);
    } catch (error) {
      console.error("Submit işleminde hata:", error);
    }
  };

  const steps = [
    { id: 1, title: 'Temel Bilgiler' },
    { id: 2, title: 'Adres' },
    { id: 3, title: 'Harita Konumu' },
    { id: 4, title: 'Mülk Detayları' },
    { id: 5, title: 'Fotoğraflar' },
    { id: 6, title: 'Mal Sahibi & Notlar' }
  ];

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (initialData) {
      setIsUploading(true);
      try {
        const url = await api.uploadPropertyImage(initialData.id, file);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, url]
        }));
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Fotoğraf yüklenemedi.');
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Yeni portföyler için fotoğrafları kaydettikten sonra detay ekranından ekleyebilirsiniz.');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const selectLead = (lead: Lead) => {
    setFormData({
      ...formData,
      owner: {
        ...formData.owner,
        name: lead.name,
        phone: lead.phone
      }
    });
    setSearchTerm(lead.name);
    setShowLeadResults(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center"
        >
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Portföyü Düzenle' : 'Yeni Portföy'}</h2>
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
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adım {step}/6</div>
              <div className="text-sm font-bold text-slate-900">{steps.find(s => s.id === step)?.title}</div>
            </div>

            {/* ADIM 1: TEMEL BİLGİLER */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlan Başlığı</label>
                  <input 
                    type="text" placeholder="Örn: Gül Sokak'ta Manzaralı 3+1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mülk Tipi</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option>Daire</option><option>Villa</option><option>Arsa</option><option>Ticari</option><option>Fabrika</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
                    >
                      <option>Satılık</option><option>Kiralık</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fiyat</label>
                  <div className="relative">
                    <input 
                      type="text" placeholder="Örn: 5.000.000"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pr-12 text-sm focus:border-orange-500 outline-none font-medium"
                      value={formData.price} onChange={handlePriceChange}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">TL</div>
                  </div>
                </div>
                <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
              </div>
            )}

            {/* ADIM 2: ADRES SEÇİMİ */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şehir</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address.city}
                    onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value, district: '', neighborhood: '', lat: undefined, lng: undefined}})}
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlçe</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.address.district}
                    onChange={e => setFormData({...formData, address: {...formData.address, district: e.target.value, neighborhood: '', lat: undefined, lng: undefined}})}
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
                    onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value, lat: undefined, lng: undefined}})}
                  >
                    <option value="">Mahalle Seçiniz</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={handleAddressNext} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {/* ADIM 3: HARİTA ÜZERİNDEN TAM KONUM SEÇİMİ */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={14} className="text-orange-500" /> Tam Konumu İşaretleyin
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Harita üzerinde portföyün tam bulunduğu sokağa/binaya dokunarak pin ekleyin.
                  </p>
                  <div className="w-full h-[280px] rounded-2xl overflow-hidden border-2 border-slate-100 relative">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={
                          formData.address.lat && formData.address.lng 
                            ? { lat: formData.address.lat, lng: formData.address.lng } 
                            : { lat: 38.7205, lng: 35.4826 }
                        }
                        zoom={formData.address.lat ? 16 : 13}
                        onClick={handleMapClick}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                      >
                        {formData.address.lat && formData.address.lng && (
                          <Marker position={{ lat: formData.address.lat, lng: formData.address.lng }} />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-slate-50 text-slate-400 text-sm">Harita yükleniyor...</div>
                    )}
                  </div>
                  {!formData.address.lat && (
                     <p className="text-[10px] text-red-500 font-bold mt-2">Lütfen haritaya dokunarak bir konum belirleyin.</p>
                  )}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {/* ADIM 4: MÜLK DETAYLARI */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brüt M2</label>
                    <input 
                      type="number" placeholder="Örn: 120"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.brut_m2} onChange={e => setFormData({...formData, details: {...formData.details, brut_m2: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net M2</label>
                    <input 
                      type="number" placeholder="Örn: 100"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.net_m2} onChange={e => setFormData({...formData, details: {...formData.details, net_m2: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oda Sayısı</label>
                    <input 
                      type="text" placeholder="Örn: 3+1"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.rooms} onChange={e => setFormData({...formData, details: {...formData.details, rooms: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bina Yaşı</label>
                    <input 
                      type="number" placeholder="Örn: 5"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.details.age} onChange={e => setFormData({...formData, details: {...formData.details, age: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={() => setStep(5)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {/* ADIM 5: FOTOĞRAFLAR */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-2xl overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                          <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Fotoğraf Ekle</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={isUploading} />
                  </label>
                </div>
                {!initialData && formData.images.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center italic">
                    Yeni portföyler için fotoğrafları kaydettikten sonra da ekleyebilirsiniz.
                  </p>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep(4)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button onClick={() => setStep(6)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                </div>
              </div>
            )}

            {/* ADIM 6: MAL SAHİBİ & KAYDET */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi Ara / Ekle</label>
                  <div className="relative">
                    <input 
                      type="text" placeholder="İsim veya telefon ile ara..."
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowLeadResults(true);
                        setFormData({...formData, owner: {...formData.owner, name: e.target.value}});
                      }}
                      onFocus={() => setShowLeadResults(true)}
                    />
                    {showLeadResults && searchTerm && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-auto">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map(lead => (
                            <button
                              key={lead.id}
                              onClick={() => selectLead(lead)}
                              className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                                <div className="text-[10px] text-slate-400">{lead.phone}</div>
                              </div>
                              <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">CRM Kaydı</div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[10px] text-slate-400">
                            Eşleşen kayıt bulunamadı. Yeni kayıt olarak eklenecek.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi Telefon</label>
                  <input 
                    type="text" placeholder="Örn: 0532 123 45 67"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.owner.phone} onChange={e => setFormData({...formData, owner: {...formData.owner, phone: e.target.value}})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Müşteri Tipi</label>
                  <input 
                    type="text" placeholder="Örn: Genç aileler, Yatırımcılar"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.target_customer_type} onChange={e => setFormData({...formData, target_customer_type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yatırım Uygunluğu</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.investment_suitability} onChange={e => setFormData({...formData, investment_suitability: e.target.value})}
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
                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(5)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                  >
                    {isPending ? 'Kaydediliyor...' : initialData ? 'Değişiklikleri Kaydet' : 'Portföyü Kaydet'}
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