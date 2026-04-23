import React from 'react';
import { MapPin, TrendingUp, Users, Activity, Loader2 } from 'lucide-react';
import { UserProfile, MapPin as MapPinType, Property } from '../types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface RegionStatsProps {
  profile?: UserProfile;
  pins?: MapPinType[];
}

export const RegionStats: React.FC<RegionStatsProps> = ({ profile, pins = [] }) => {
  if (!profile?.region) return null;

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['region-market-analysis', profile.region.city, profile.region.district],
    queryFn: () => api.getLiveMarketAnalysis({
        address: { 
          city: profile.region?.city || '', 
          district: profile.region?.district || '', 
          neighborhood: profile.region?.neighborhoods?.[0] || '' 
        },
        type: 'Daire', // Fallback as a valid type
        details: { brut_m2: 100, net_m2: 80, rooms: '3+1', age: 0, floor: 1 }
    } as Partial<Property>),
    enabled: !!profile?.region?.city && !!profile?.region?.district,
    staleTime: 5 * 60 * 1000
  });

  const totalPins = pins.length;
  const esnafCount = pins.filter(pin => pin.type === 'esnaf').length;
  
  let marketActivity = "Hesaplanıyor...";
  let activityColor = "text-slate-500";
  let displayScore = "0";

  if (marketData && !isLoading) {
    const demand = marketData.demandScore || 50;
    displayScore = demand.toString();
    if (demand >= 75) {
      marketActivity = "Çok Yüksek";
      activityColor = "text-emerald-500";
    } else if (demand >= 50) {
      marketActivity = "Dengeli";
      activityColor = "text-orange-500";
    } else {
      marketActivity = "Düşük";
      activityColor = "text-red-500";
    }
  }

  const isHighEfficiency = parseInt(displayScore) >= 70;
  
  const avgPrice = marketData?.averagePrice ? (marketData.averagePrice / 1000000).toFixed(2) + "M ₺" : "Veri Yok";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Aktif Bölge */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Bölge</p>
          <p className="text-sm font-bold text-slate-900">{profile.region.district}, {profile.region.city}</p>
        </div>
      </div>

      {/* 2. Bölge Pazar Ortalaması (Yeni) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600`}>
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : <TrendingUp size={24} />}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ortalama Fiyat</p>
          <p className="text-sm font-bold text-slate-900">
            {avgPrice}
            {marketData?.priceTrend === 'up' && <span className="text-[10px] ml-1 text-emerald-500">↑ Artış</span>}
            {marketData?.priceTrend === 'down' && <span className="text-[10px] ml-1 text-red-500">↓ Düşüş</span>}
          </p>
        </div>
      </div>

      {/* 3. Talep Skoru (Gerçek API Verisi) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Activity size={24} />}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pazar Hareketliliği / Talep</p>
          <p className={`text-sm font-bold ${activityColor}`}>
             {marketActivity} <span className="text-xs text-slate-400">({displayScore}/100)</span>
          </p>
        </div>
      </div>

      {/* 4. Esnaf Ağı (Dinamik Hesaplama) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ağ Çapı (Esnaf / Pin)</p>
          <p className="text-sm font-bold text-slate-900">
            {totalPins} İşaret ({esnafCount} Esnaf)
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegionStats;