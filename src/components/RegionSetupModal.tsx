import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Sparkles, Building2, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { locationService } from '../services/locationService';
import { UserProfile } from '../types';

interface RegionSetupModalProps {
  profile: UserProfile;
  onComplete: () => void;
}

export const RegionSetupModal: React.FC<RegionSetupModalProps> = ({ profile, onComplete }) => {
  const [city, setCity] = useState(profile?.region?.city || 'İstanbul');
  const [district, setDistrict] = useState(profile?.region?.district || '');
  const [neighborhoods, setNeighborhoods] = useState<string[]>(profile?.region?.neighborhoods || []);
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<UserProfile> }) => api.updateProfile(uid, data),
    onSuccess: () => {
      onComplete();
    }
  });

  const cities = locationService.getCities();
  const districts = locationService.getDistricts(city);
  const allNeighborhoods = district ? locationService.getNeighborhoods(city, district) : [];

  const handleSave = async () => {
    if (!district) return;
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        uid: profile.uid,
        data: {
          region: { city, district, neighborhoods: neighborhoods.slice(0, 3) }
        }
      });
    } catch (error) {
      console.error("Region save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNeighborhood = (n: string) => {
    if (neighborhoods.includes(n)) {
      setNeighborhoods(neighborhoods.filter(item => item !== n));
    } else if (neighborhoods.length < 3) {
      setNeighborhoods([...neighborhoods, n]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-6 sm:p-8 w-full max-w-lg shadow-2xl relative my-auto sm:my-8"
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shadow-sm shrink-0">
              <MapPin size={32} />
            </div>
            {profile?.region?.city && (
              <button 
                onClick={onComplete}
                className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
            )}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Bölgeni Belirle
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
            Portfy sana özel analizler yapabilmek için tüm Türkiye'den uzmanlık bölgelerini seçmeni sağlar.
          </p>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Şehir</label>
                <select 
                  value={city}
                  onChange={(e) => { 
                    setCity(e.target.value); 
                    setDistrict(''); 
                    setNeighborhoods([]);
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">İlçe</label>
                <select 
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setNeighborhoods([]);
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">İlçe Seçin</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {district && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Mahalleler (En Fazla 3)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {neighborhoods.map(n => (
                    <span key={n} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-[10px] font-bold rounded-full animate-in fade-in scale-in">
                      {n}
                      <button onClick={() => toggleNeighborhood(n)} className="hover:opacity-70 transition-opacity">
                        <ArrowRight size={10} className="rotate-45" />
                      </button>
                    </span>
                  ))}
                </div>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleNeighborhood(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Mahalle Ekle...</option>
                  {allNeighborhoods
                    .filter(n => !neighborhoods.includes(n))
                    .map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))
                  }
                </select>
              </motion.div>
            )}

            <button 
              onClick={handleSave}
              disabled={!district || isSaving}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3 group mt-4 hover:bg-slate-800 transition-all"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Bölgeyi Kaydet <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <Sparkles size={20} className="text-orange-500 shrink-0" />
            <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
              Bölge seçimi sonrası AI Koç, o bölgedeki piyasa verilerini senin için özel olarak analiz edecek.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/5 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
};
