import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapIcon, LayoutDashboard, Filter, Search, Plus, X, MessageSquare, Activity, TrendingUp } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { MapPin as MapPinType, UserProfile } from '../types';

import { RegionMap } from './RegionMap';
import { RegionStats } from './RegionStats';
import { CompetitorList } from './CompetitorList';

const defaultCenter = { lat: 38.7205, lng: 35.4826 }; // Kayseri Default

export const BolgemView = ({ 
  profile, 
  setToast 
}: { 
  profile?: UserProfile,
  setToast?: (toast: { message: string, type: 'success' | 'error' | 'info' } | null) => void
}) => {
  const queryClient = useQueryClient();
  const { categories, addCategory } = useCategories();
  
  const [view, setView] = useState<'map' | 'list'>('map');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showFieldNotes, setShowFieldNotes] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterColor, setNewFilterColor] = useState('#eab308');

  const [is3D, setIs3D] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(14);
  
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPinData, setNewPinData] = useState({
    title: '',
    type: categories[0]?.id || 'esnaf',
    address: '',
    notes: '',
    lat: defaultCenter.lat,
    lng: defaultCenter.lng
  });

  const { data: pins = [] } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profile?.uid],
    queryFn: api.getMapPins,
    enabled: !!profile?.uid
  });

  const filteredPins = useMemo(() => {
    return (pins || []).filter((pin: MapPinType) => {
      const matchFilter = filter === 'all' || pin.type === filter;
      const matchSearch = (pin.title || '').toLowerCase().includes(search.toLowerCase()) || (pin.address || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, search, pins]);

  const allPinTypes = useMemo(() => [{ id: 'all', label: 'Tümü', icon: Filter, color: '#334155' }, ...categories], [categories]);

  const addPinMutation = useMutation({
    mutationFn: api.addMapPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.uid] });
      setShowAddPin(false);
      if(setToast) setToast({ message: 'Pin başarıyla eklendi.', type: 'success'});
      setNewPinData({
        title: '',
        type: categories[0]?.id || 'esnaf',
        address: '',
        notes: '',
        lat: defaultCenter.lat,
        lng: defaultCenter.lng
      });
    }
  });

  const handleAddFilter = () => {
    if (!newFilterName.trim()) return;
    addCategory(newFilterName, newFilterColor);
    setNewFilterName('');
    setShowAddFilter(false);
    if(setToast) setToast({ message: 'Kategori eklendi.', type: 'success'});
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setNewPinData(prev => ({ ...prev, lat, lng, address: 'Adres aranıyor...' }));
    setShowAddPin(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if(res.ok) {
        const data = await res.json();
        setNewPinData(prev => ({ ...prev, address: data.display_name || 'Bilinmeyen Adres' }));
      }
    } catch (err) {
      setNewPinData(prev => ({ ...prev, address: '' }));
    }
  };

  // EKSİK OLAN VE HATAYA NEDEN OLAN FONKSİYON EKLENDİ
  const handleAddPin = () => {
    if (!newPinData.title.trim()) return;
    addPinMutation.mutate(newPinData);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      if (setToast) setToast({ message: "Konumunuz alınıyor...", type: 'info' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(newCenter);
          setUserLocation(newCenter);
          setMapZoom(17);
          if (setToast) setToast({ message: "Konumunuz bulundu.", type: 'success' });
        },
        () => {
          if (setToast) setToast({ message: "Konum alınamadı.", type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const getCategoryColor = (type: string) => {
    const cat = allPinTypes.find(t => t.id === type);
    return cat ? cat.color : '#eab308';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`relative flex flex-col ${view === 'map' ? 'h-[calc(100vh-80px)] md:h-screen' : 'p-6 space-y-6 pb-32'}`}
    >
      {view === 'map' ? (
        <div className="relative flex-1 w-full overflow-hidden bg-[#020617]">
          {/* Arama ve Filtreleme Paneli */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-2xl space-y-3 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" placeholder="Radar taraması yap..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none shadow-2xl transition-all"
                />
              </div>
              <button onClick={() => setShowFieldNotes(true)} className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-orange-700 transition-all" title="Saha Notları">
                <MessageSquare size={20} />
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide pointer-events-auto">
              {allPinTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id} onClick={() => setFilter(type.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border border-white/5 ${
                      filter === type.id ? 'text-white' : 'bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white'
                    }`}
                    style={filter === type.id ? { backgroundColor: type.color, borderColor: type.color } : {}}
                  >
                    <Icon size={14} /> {type.label}
                  </button>
                );
              })}
              <button onClick={() => setShowAddFilter(true)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white border border-white/5 shadow-lg transition-all">
                <Plus size={16} /> Ekle
              </button>
            </div>
          </div>

          {/* Sol Analitik Panel */}
          <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute left-6 top-40 z-[1000] w-72 hidden lg:block pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-6 pointer-events-auto">
              <div>
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <Activity size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[2px]">Bölge Skorun</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tighter">8.4<span className="text-sm text-slate-500 ml-1">/10</span></div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Radar Aktifliği</div>
                  <div className="text-lg font-bold text-white">{pins.length} Hedef Nokta</div>
                  <div className="flex items-center gap-1 text-emerald-500 text-[10px] mt-1 font-bold">
                    <TrendingUp size={10} /> Radar taraması devrede
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Etki Alanı Çapı</div>
                  <div className="text-lg font-bold text-white">1.5 KM</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-orange-500 h-full w-[65%]" />
                  </div>
                </div>
              </div>
              <button onClick={() => setView('list')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                Detaylı Analiz
              </button>
            </div>
          </motion.div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl flex shadow-2xl border border-white/10 pointer-events-auto">
            <button onClick={() => setView('map')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'map' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <MapIcon size={14} /> Radar
            </button>
            <button onClick={() => setView('list')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'list' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <LayoutDashboard size={14} /> Analiz
            </button>
          </div>

          <RegionMap 
            mapZoom={mapZoom} mapCenter={mapCenter} handleMapClick={handleMapClick} is3D={is3D} setIs3D={setIs3D}
            setMapZoom={setMapZoom} handleLocateMe={handleLocateMe} setShowAddPin={setShowAddPin} userLocation={userLocation}
            filteredPins={filteredPins} getCategoryColor={getCategoryColor} setSelectedPin={setSelectedPin}
            selectedPin={selectedPin} showAddPin={showAddPin} newPinData={newPinData} setNewPinData={setNewPinData}
            handleAddPin={handleAddPin} addPinMutation={addPinMutation} categories={categories} search={search}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bölge Analizi</h1>
            <div className="flex gap-2">
              <button onClick={() => setView('map')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:bg-slate-800">
                <MapIcon size={16} /> Haritaya Dön
              </button>
              <button onClick={() => setShowFieldNotes(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all">
                <MessageSquare size={16} /> Saha Notları
              </button>
            </div>
          </div>
          <RegionStats profile={profile} pins={pins} />
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" placeholder="Sokak, bina veya kişi ara..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide items-center">
              {allPinTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id} onClick={() => setFilter(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      filter === type.id ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                    style={filter === type.id ? { backgroundColor: type.color, borderColor: type.color } : {}}
                  >
                    <Icon size={14} style={{ color: filter === type.id ? '#fff' : type.color }} /> {type.label}
                  </button>
                )
              })}
            </div>
          </div>
          <CompetitorList filteredPins={filteredPins} allPinTypes={allPinTypes} />
        </>
      )}

      <AnimatePresence>
        {showAddFilter && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowAddFilter(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900">Yeni Kategori</h3>
                 <button onClick={() => setShowAddFilter(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={16}/></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Kategori Adı</label>
                  <input type="text" value={newFilterName} onChange={e => setNewFilterName(e.target.value)} placeholder="Örn: VIP Müşteriler" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Renk Seçimi</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                      <button key={color} onClick={() => setNewFilterColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all ${newFilterColor === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleAddFilter} disabled={!newFilterName.trim()} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-2 disabled:opacity-50">Kategoriyi Oluştur</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFieldNotes && (
          <div className="fixed inset-0 z-[2000] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowFieldNotes(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-[#0f172a] border-l border-white/10 w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0f172a]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20} className="text-orange-500"/> Saha Notları</h3>
                <button onClick={() => setShowFieldNotes(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {pins.filter((p: MapPinType) => p.notes?.trim()).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Henüz bölge notu eklenmemiş.</div>
                ) : (
                  pins.filter((p: MapPinType) => p.notes?.trim()).map((pin: MapPinType) => (
                    <div key={pin.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white text-sm">{pin.title}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-1 rounded-md text-slate-300 font-bold border border-white/5" style={{ color: getCategoryColor(pin.type) }}>
                          {categories.find(c => c.id === pin.type)?.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">"{pin.notes}"</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BolgemView;