import React from 'react';
import { MapPin, TrendingUp, Users, Activity } from 'lucide-react';
import { UserProfile, MapPin as MapPinType } from '../types';

interface RegionStatsProps {
  profile?: UserProfile;
  pins?: MapPinType[]; // Haritadaki gerçek verileri almak için eklendi
}

export const RegionStats: React.FC<RegionStatsProps> = ({ profile, pins = [] }) => {
  if (!profile?.region) return null;

  // Dinamik Veri Hesaplamaları
  const totalPins = pins.length;
  const esnafCount = pins.filter(pin => pin.type === 'esnaf').length;
  
  // Pazar Hareketliliği Algoritması (Pin sayısına göre)
  let marketActivity = "Düşük Seviye";
  let activityColor = "text-slate-500";
  if (totalPins > 20) {
    marketActivity = "Yüksek Seviye";
    activityColor = "text-emerald-500";
  } else if (totalPins > 5) {
    marketActivity = "Orta Seviye";
    activityColor = "text-orange-500";
  }

  // Bölge Verimlilik Skoru (Temel bir artış algoritması)
  const baseScore = 40;
  const calculatedScore = Math.min(100, baseScore + (totalPins * 2));
  const isHighEfficiency = calculatedScore >= 70;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Aktif Bölge (Gerçek Veri) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Bölge</p>
          <p className="text-sm font-bold text-slate-900">{profile.region.district}, {profile.region.city}</p>
        </div>
      </div>

      {/* 2. Bölge Verimlilik (Dinamik Hesaplama) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isHighEfficiency ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölge Verimlilik</p>
          <p className="text-sm font-bold text-slate-900">
            %{calculatedScore} 
            <span className={`text-[10px] ml-1 ${isHighEfficiency ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isHighEfficiency ? '↑ Yüksek' : '→ Normal'}
            </span>
          </p>
        </div>
      </div>

      {/* 3. Pazar Hareketliliği (Dinamik Hesaplama) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pazar Hareketliliği</p>
          <p className={`text-sm font-bold ${activityColor}`}>{marketActivity}</p>
        </div>
      </div>

      {/* 4. Esnaf Ağı (Dinamik Hesaplama) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esnaf Ağı</p>
          <p className="text-sm font-bold text-slate-900">
            {esnafCount > 0 ? `${esnafCount} Kayıtlı` : 'Kayıt Yok'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegionStats;