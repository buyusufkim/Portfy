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
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<UserProfile> }) => api.updateProfile(uid, data),
    onSuccess: () => {
      onComplete();
    }
  });

  const districts = locationService.getDistricts(city);

  const handleSave = async () => {
    if (!district) return;
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        uid: profile.uid,
        data: {
          region: { city, district, neighborhoods: [] }
        }
      });
    } catch (error) {
      console.error("Region save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-6 shadow-sm">
            <MapPin size={32} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Bölgeni Belirle
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
            Portfy sana özel analizler yapabilmek için hangi bölgede uzmanlaştığını bilmek ister.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Şehir</label>
              <select 
                value={city}
                onChange={(e) => { setCity(e.target.value); setDistrict(''); }}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Uzmanlık Bölgesi (İlçe)</label>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">İlçe Seçin</option>
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSave}
              disabled={!district || isSaving}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
            >
              {isSaving ? 'Kaydediliyor...' : (
                <>
                  Bölgeyi Onayla <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <Sparkles size={20} className="text-orange-500 shrink-0" />
            <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
              Bölge seçimi sonrası AI Koç, o bölgedeki piyasa verilerini senin için analiz etmeye başlayacak.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />
      </motion.div>
    </div>
  );
};
