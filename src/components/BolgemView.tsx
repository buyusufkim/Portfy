import React, { useState, useMemo, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';
import { MapIcon, LayoutDashboard, Store, User, Building2, Home, Star, Filter, Search, Plus, X, Layers, Crosshair, MessageSquare, MapPin, Navigation, TrendingUp } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { MapPin as MapPinType, UserProfile, Property } from '../types';
import { locationService } from '../services/locationService';
import L from 'leaflet';

import { RegionMap } from './RegionMap';
import { RegionStats } from './RegionStats';
import { CompetitorList } from './CompetitorList';

const defaultCenter = { lat: 38.7205, lng: 35.4826 };

const createSvgPin = (color: string, Icon: React.ElementType) => {
  const iconSvg = renderToStaticMarkup(<Icon size={12} color="white" strokeWidth={2.5} />);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="1.5" />
    <circle cx="20" cy="20" r="15" fill="${color}" />
    <g transform="translate(14, 14)">${iconSvg}</g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showFieldNotes, setShowFieldNotes] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterColor, setNewFilterColor] = useState('#eab308');

  const [is3D, setIs3D] = useState(false);
  const [showTerritoryPlanner, setShowTerritoryPlanner] = useState(false);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [hasGeocoded, setHasGeocoded] = useState(false);
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPinData, setNewPinData] = useState({
    title: '',
    type: categories[0]?.id || 'esnaf',
    address: '',
    notes: '',
    lat: defaultCenter.lat,
    lng: defaultCenter.lng
  });

  const [map, setMap] = useState<L.Map | null>(null);

  const hotspots = useMemo(() => {
    if (!profile?.region?.city || !mapCenter) return [];
    const offsets = [
        { lat: 0.005, lng: 0.005 },
        { lat: -0.005, lng: 0.005 },
        { lat: 0, lng: -0.008 }
    ];
    return offsets.map(offset => ({
        lat: mapCenter.lat + offset.lat,
        lng: mapCenter.lng + offset.lng,
        intensity: 0.3, 
        color: '#f97316'
    }));
  }, [mapCenter, profile?.region]);

  const { data: pins = [], isLoading: isLoadingPins } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profile?.id],
    queryFn: api.getMapPins,
    enabled: !!profile?.id
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', profile?.id],
    queryFn: api.getProperties,
    enabled: !!profile?.id
  });

  const combinedPins = useMemo(() => {
    const propPins: MapPinType[] = properties.map((p: Property) => {
      const lat = (typeof p.address?.lat === 'number' && isFinite(p.address.lat)) 
        ? p.address.lat 
        : (mapCenter.lat + (Math.random() - 0.5) * 0.015);
      const lng = (typeof p.address?.lng === 'number' && isFinite(p.address.lng)) 
        ? p.address.lng 
        : (mapCenter.lng + (Math.random() - 0.5) * 0.015);

      return {
        id: `prop-${p.id}`,
        user_id: p.user_id,
        lat,
        lng,
        type: 'portfoy',
        title: `🏠 ${p.title}`,
        address: `${p.address?.neighborhood || ''}, ${p.address?.district || ''}/${p.address?.city || ''}`,
        notes: `Fiyat: ${p.price?.toLocaleString('tr-TR')} TL | Durum: ${p.status} | Tip: ${p.type}`,
        created_at: p.created_at
      };
    });

    return [...pins, ...propPins];
  }, [pins, properties, mapCenter]);

  useEffect(() => {
    const geocodeProfileRegion = async () => {
      if (profile?.region?.city && profile?.region?.district && !hasGeocoded) {
        const addressToGeocode = locationService.getGeocodeAddressString(
          profile.region.city, 
          profile.region.district, 
          profile.region.neighborhoods?.[0]
        );
        
        if (addressToGeocode) {
          const coords = await locationService.getCoordsFromOSM(addressToGeocode);
          if (coords) {
            const newCenter = { lat: coords.lat, lng: coords.lng };
            setMapCenter(newCenter);
            if (map) {
              map.setView([newCenter.lat, newCenter.lng], 14);
            }
            setHasGeocoded(true);
          }
        }
      }
    };
    geocodeProfileRegion();
  }, [profile?.region, map, hasGeocoded, combinedPins.length]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const onMapLoad = (mapInstance: L.Map) => {
    setMap(mapInstance);
  };

  const allPinTypes = useMemo(() => {
    const base = [
      { id: 'all', label: 'Tümü', icon: Filter, color: '#94a3b8' },
      { id: 'nearby', label: 'Yakındakiler (2km)', icon: Navigation, color: '#3b82f6' }
    ];
    const hasPortfoy = categories.some(c => c.id === 'portfoy');
    
    let cats = [...categories];
    if (!hasPortfoy) {
      cats = [{ id: 'portfoy', label: 'Portföylerim', icon: Home, color: '#f97316' }, ...cats];
    }
    return [...base, ...cats];
  }, [categories]);

  const filteredPins = useMemo(() => {
    return combinedPins.filter((pin: MapPinType) => {
      let matchFilter = false;
      if (filter === 'all') {
        matchFilter = true;
      } else if (filter === 'nearby') {
        if (userLocation && typeof pin.lat === 'number' && typeof pin.lng === 'number') {
          try {
            const dist = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(pin.lat, pin.lng));
            matchFilter = dist <= 2000;
          } catch (e) {
            console.error("Distance calculation error:", e);
            matchFilter = false;
          }
        } else {
          matchFilter = false; 
        }
      } else {
        matchFilter = pin.type === filter;
      }

      const matchSearch = (pin.title || '').toLowerCase().includes(search.toLowerCase()) || (pin.address || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, search, combinedPins, userLocation]);

  // ORİJİNAL ODAKLAMA SİSTEMİ: GPS ile çatışmaz.
  useEffect(() => {
    if (map && (filteredPins || []).length > 0 && filter !== 'nearby') {
      let hasValidPins = false;
      const latlngs: L.LatLngTuple[] = [];

      (filteredPins || []).forEach((pin: MapPinType) => {
        if (pin.lat && pin.lng) {
          latlngs.push([pin.lat, pin.lng]);
          hasValidPins = true;
        }
      });
      
      if (hasValidPins) {
        if ((filteredPins || []).length === 1 && search.trim().length > 0) {
          map.setView([filteredPins[0].lat, filteredPins[0].lng], 17);
        } else {
          const bounds = L.latLngBounds(latlngs);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }
    }
  }, [filteredPins, map, search, filter]);

  const addPinMutation = useMutation({
    mutationFn: api.addMapPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.id] });
      setShowAddPin(false);
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
  };

  const handleMapClick = async (e: { latLng?: { lat: () => number, lng: () => number } | { lat: number, lng: number } }) => {
    if (e.latLng) {
      const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;

      setNewPinData(prev => ({
        ...prev,
        lat,
        lng,
        address: 'Adres aranıyor...'
      }));
      setShowAddPin(true);

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data && data.display_name) {
          setNewPinData(prev => ({
            ...prev,
            address: data.display_name
          }));
        } else {
          setNewPinData(prev => ({...prev, address: ''}));
        }
      } catch {
        setNewPinData(prev => ({...prev, address: ''}));
      }
    }
  };

  const handleAddPin = () => {
    if (!newPinData.title.trim()) return;
    addPinMutation.mutate(newPinData);
  };

  const handleToggleTracking = () => {
    if (!navigator.geolocation) {
      if (setToast) setToast({ message: "Cihazınız konum servisini desteklemiyor.", type: 'error' });
      return;
    }

    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
      if (setToast) setToast({ message: "Canlı takip durduruldu.", type: 'info' });
    } else {
      if (setToast) setToast({ message: "Canlı saha takibi başlatılıyor...", type: 'info' });
      setIsTracking(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(newCenter);
          setUserLocation(newCenter);
          setMapZoom(17);
          if (map) map.panTo(newCenter);
          if (setToast) setToast({ message: "Konum bulundu, takip ediliyorsunuz.", type: 'success' });
        },
        () => {
          if (setToast) setToast({ message: "Konum alınamadı, lütfen izinleri kontrol edin.", type: 'error' });
          setIsTracking(false);
        },
        { enableHighAccuracy: true }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(newLocation);
        },
        (error) => console.warn("GPS Tracking Hatası:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
  };

  const getPinIcon = (type: string) => {
    const typeObj = (allPinTypes || []).find(t => t.id === type);
    return createSvgPin(typeObj?.color || '#eab308', typeObj?.icon || Building2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative flex flex-col ${view === 'map' ? 'h-[calc(100vh-80px)] md:h-screen' : 'p-6 space-y-6 pb-32'}`}
    >
      {view === 'map' ? (
        <div className="relative flex-1 w-full overflow-hidden bg-[#020617]">
          
          {/* HARİTA BUTONLARI: React-Leaflet yapısını kırmadan, z-index 400 ile en üste güvenli bir şekilde sabitlendi */}
          <div className="absolute right-4 top-40 flex flex-col gap-2 z-[400] pointer-events-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowAddPin(true); }}
              className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-2xl hover:bg-orange-700 transition-all mb-2"
              title="Pin Ekle"
            >
              <Plus size={32} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIs3D(!is3D);
                if (!is3D) setMapZoom(18);
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${is3D ? 'bg-orange-500 text-white' : 'bg-slate-900/90 backdrop-blur-md text-slate-300 hover:text-white'}`}
              title="Uydu Görünümü"
            >
              <Layers size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleToggleTracking(); }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${isTracking ? 'bg-emerald-500 text-white' : 'bg-slate-900/90 backdrop-blur-md text-slate-300 hover:text-white'}`}
              title="Konumumu Bul"
            >
              <Crosshair size={24} className={isTracking ? 'animate-pulse' : ''} />
            </button>
          </div>

          {/* Floating Search & Filters */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[400] space-y-3 pointer-events-none">
            {/* TERRITORY PLANNING */}
            <div className="pointer-events-auto w-full bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <MapPin size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">Territory Planning <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">AKILLI ODAK</div></h4>
                  <p className="text-xs text-slate-400">Veriye dayalı bölge çalışma stratejisi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTerritoryPlanner(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
              >
                Fokus Alanı Seç
              </button>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder="Sokak, portföy veya kişi ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-2xl transition-all"
                />
              </div>
              <button 
                onClick={() => setShowFieldNotes(true)}
                className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-orange-700 transition-all"
                title="Saha Notları"
              >
                <MessageSquare size={20} />
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide items-center pointer-events-auto">
              {(allPinTypes || []).map(type => {
                const Icon = type.icon;
                const isActive = filter === type.id;
                
                const handleFilterClick = () => {
                  if (type.id === 'nearby' && !userLocation) {
                    if (setToast) setToast({ message: "Önce konumunuzu (hedef ikonu) bulmalısınız.", type: 'info' });
                    return;
                  }
                  setFilter(type.id);
                };

                return (
                  <button
                    key={type.id}
                    onClick={handleFilterClick}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-lg border border-white/5 ${
                      isActive ? 'text-white' : 'bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: type.color, borderColor: type.color } : {}}
                  >
                    <Icon size={14} style={{ color: isActive ? '#fff' : type.color }} className={type.id === 'nearby' && isTracking ? 'animate-pulse' : ''} />
                    {type.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddFilter(true)}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white border border-white/5 transition-all shrink-0 shadow-lg"
              >
                <Plus size={16} /> Ekle
              </button>
            </div>
          </div>

          <RegionMap 
            isLoaded={true}
            mapZoom={mapZoom}
            mapCenter={mapCenter}
            onMapLoad={onMapLoad}
            handleMapClick={handleMapClick}
            is3D={is3D}
            setIs3D={setIs3D}
            setMapZoom={setMapZoom}
            handleLocateMe={() => {}} // Artık butonları yukarı taşıdığımız için buna gerek yok
            setShowAddPin={setShowAddPin}
            userLocation={userLocation}
            filteredPins={filteredPins}
            getPinIcon={getPinIcon}
            setSelectedPin={setSelectedPin}
            selectedPin={selectedPin}
            showAddPin={showAddPin}
            newPinData={newPinData}
            setNewPinData={setNewPinData}
            handleAddPin={handleAddPin}
            addPinMutation={addPinMutation}
            categories={categories}
            search={search}
            hotspots={hotspots}
          />

          {isTracking && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 z-[400] bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              Saha Canlı Takibi Aktif
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bölge Analizi</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('map')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
              >
                <MapIcon size={16} /> Haritaya Dön
              </button>
              <button 
                onClick={() => setShowFieldNotes(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all"
              >
                <MessageSquare size={16} /> Saha Notları
              </button>
            </div>
          </div>

          <RegionStats profile={profile} pins={combinedPins} />

          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Sokak, bina veya kişi ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
              />
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide items-center">
              {(allPinTypes || []).map(type => {
                const Icon = type.icon;
                const isActive = filter === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive ? 'text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                    style={isActive ? { backgroundColor: type.color } : {}}
                  >
                    <Icon size={14} style={{ color: isActive ? '#fff' : type.color }} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <CompetitorList filteredPins={filteredPins} allPinTypes={allPinTypes} />
        </>
      )}

      <AnimatePresence>
        {showAddFilter && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddFilter(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Yeni Kategori Ekle</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Kategori Adı</label>
                  <input type="text" value={newFilterName} onChange={e => setNewFilterName(e.target.value)} placeholder="Örn: Portföylerim" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Renk Seçimi</label>
                  <div className="flex gap-2">
                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map(color => (
                      <button key={color} onClick={() => setNewFilterColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all ${newFilterColor === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <button onClick={handleAddFilter} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-2">Kategoriyi Oluştur</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerritoryPlanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowTerritoryPlanner(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col border border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 sticky top-0">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><MapPin size={20} className="text-indigo-500"/> Akıllı Bölge Planlama</h3>
                <button onClick={() => setShowTerritoryPlanner(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <TrendingUp size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Yüksek Talep Alanı</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">Son 15 günde alıcı trafiğinin en yoğun olduğu mikro bölgeleri belirle.</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <Building2 size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-white">Fırsat Alanı (Drop-off)</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">İlanı yayından kalkan ama henüz satılmamış potansiyel fırsat bölgeleri.</p>
                  </div>
                </div>
                
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Önerilen Fokus Alanı</h4>
                    <p className="text-sm font-bold text-white mt-1">{profile?.region?.district || 'Seçili Bölge'} - Yıldırım Beyazıt Mah.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowTerritoryPlanner(false);
                      if(setToast) setToast({ message: 'Focus alanı radarda işaretlendi!', type: 'success' });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    Rotayı Çiz
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl flex shadow-2xl border border-white/10 pointer-events-auto">
        <button 
          onClick={() => setView('map')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${view === 'map' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <MapIcon size={14} /> Radar
        </button>
        <button 
          onClick={() => setView('list')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <LayoutDashboard size={14} /> Analiz
        </button>
      </div>

      <AnimatePresence>
        {showFieldNotes && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFieldNotes(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-slate-900 w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col border-l border-white/10">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 sticky top-0">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20} className="text-orange-500"/> Saha Notları</h3>
                <button onClick={() => setShowFieldNotes(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {combinedPins.filter(p => p.notes?.trim()).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Henüz bölge notu eklenmemiş.</div>
                ) : (
                  combinedPins.filter(p => p.notes?.trim()).map((pin: MapPinType) => (
                    <div key={pin.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-white text-sm">{pin.title}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-1 rounded-md text-slate-400 font-bold border border-white/10">{(allPinTypes.find(t => t.id === pin.type))?.label}</span>
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