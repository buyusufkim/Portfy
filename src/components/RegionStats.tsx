import React from 'react';
import { MapPin, TrendingUp, Users, Home, Activity } from 'lucide-react';
import { UserProfile } from '../types';

interface RegionStatsProps {
  profile?: UserProfile;
}

export const RegionStats: React.FC<RegionStatsProps> = ({ profile }) => {
  if (!profile?.region) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Current Region Info */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Bölge</p>
          <p className="text-sm font-bold text-slate-900">{profile.region.district}, {profile.region.city}</p>
        </div>
      </div>

      {/* Region Score - Example Metric */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölge Verimlilik</p>
          <p className="text-sm font-bold text-slate-900">%84 <span className="text-[10px] text-emerald-500 ml-1">↑ Yüksek</span></p>
        </div>
      </div>

      {/* Market Activity - Example Metric */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pazar Hareketliliği</p>
          <p className="text-sm font-bold text-slate-900">Orta Seviye</p>
        </div>
      </div>

      {/* Local Network - Example Metric */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esnaf Ağı</p>
          <p className="text-sm font-bold text-slate-900">12 Kayıtlı</p>
        </div>
      </div>
    </div>
  );
};
