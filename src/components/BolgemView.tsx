import React, { useState, useMemo, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapIcon, LayoutDashboard, Store, User, Building2, Home, Star, Filter, Search, Plus, X, Layers, Crosshair, MessageSquare, MapPin } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { MapPin as MapPinType, UserProfile, Property } from '../types';
import { locationService } from '../services/locationService';

import { RegionMap } from './RegionMap';
import { RegionStats } from './RegionStats';
import { CompetitorList } from './CompetitorList';

const defaultCenter = { lat: 38.7205, lng: 35.4826 }; // Kayseri Default
const libraries: ("places")[] = ["places"];

// Bloomberg / Fizbot Premium Karanlık Google Maps Stili
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
];

// Helper to create SVG data URI for map pins
const createSvgPin = (color: string, Icon: any) => {
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
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

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

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // 1. Manuel Eklenen Saha Pinlerini Çek
  const { data: pins = [], isLoading: isLoadingPins } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profile?.id],
    queryFn: api.getMapPins,
    enabled: !!profile?.id
  });

  // 2. Portföyleri Çek
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', profile?.id],
    queryFn: api.getProperties,
    enabled: !!profile?.id
  });

  // 3. Portföyleri ve Saha Pinlerini Harita İçin Birleştir
  const combinedPins = useMemo(() => {
    const propPins: MapPinType[] = properties.map((p: Property) => ({
      id: `prop-${p.id}`,
      user_id: p.user_id,
      lat: p.address?.lat || (mapCenter.lat + (Math.random() - 0.5) * 0.015),
      lng: p.address?.lng || (mapCenter.lng + (Math.random() - 0.5) * 0.015),
      type: 'portfoy', // Kategori ID'si
      title: `🏠 ${p.title}`,
      address: `${p.address?.neighborhood || ''}, ${p.address?.district || ''}/${p.address?.city || ''}`,
      notes: `Fiyat: ${p.price?.toLocaleString('tr-TR')} TL | Durum: ${p.status} | Tip: ${p.type}`,
      created_at: p.created_at
    }));

    return [...pins, ...propPins];
  }, [pins, properties, mapCenter]);

  useEffect(() => {
    const geocodeProfileRegion = async () => {
      if (isLoaded && profile?.region?.city && profile?.region?.district && !hasGeocoded) {
        const addressToGeocode = locationService.getGeocodeAddressString(
          profile.region.city, 
          profile.region.district, 
          profile.region.neighborhoods?.[0]
        );
        
        if (addressToGeocode) {
          const coords = await locationService.getCoordsFromGoogle(addressToGeocode);
          
          if (coords) {
            setMapCenter({ lat: coords.lat, lng: coords.lng });
            if (map && combinedPins.length === 0) {
              map.setCenter({ lat: coords.lat, lng: coords.lng });
              map.setZoom(14);
            }
            setHasGeocoded(true);
          }
        }
      }
    };
    geocodeProfileRegion();
  }, [profile?.region, isLoaded, map, hasGeocoded, combinedPins.length]);

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Dinamik Kategoriler: Portföylerim butonunu otomatik ekle
  const allPinTypes = useMemo(() => {
    const base = [{ id: 'all', label: 'Tümü', icon: Filter, color: '#94a3b8' }];
    const hasPortfoy = categories.some(c => c.id === 'portfoy');
    
    let cats = [...categories];
    if (!hasPortfoy) {
      cats = [{ id: 'portfoy', label: 'Portföylerim', icon: Home, color: '#f97316' }, ...cats];
    }
    return [...base, ...cats];
  }, [categories]);

  // Birleştirilmiş pinler üzerinden filtreleme yap
  const filteredPins = useMemo(() => {
    return combinedPins.filter((pin: MapPinType) => {
      const matchFilter = filter === 'all' || pin.type === filter;
      const matchSearch = (pin.title || '').toLowerCase().includes(search.toLowerCase()) || (pin.address || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, search, combinedPins]);

  useEffect(() => {
    if (map && (filteredPins || []).length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPins = false;

      (filteredPins || []).forEach((pin: MapPinType) => {
        if (pin.lat && pin.lng) {
          bounds.extend({ lat: pin.lat, lng: pin.lng });
          hasValidPins = true;
        }
      });
      
      if (hasValidPins) {
        if ((filteredPins || []).length === 1 && search.trim().length > 0) {
          map.setCenter({ lat: filteredPins[0].lat, lng: filteredPins[0].lng });
          map.setZoom(17); 
        } else {
          map.fitBounds(bounds);
          const listener = google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 16) map.setZoom(16);
            google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [filteredPins, map, search]);

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

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setNewPinData(prev => ({
        ...prev,
        lat,
        lng,
        address: 'Adres aranıyor...'
      }));
      setShowAddPin(true);

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setNewPinData(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
        } else {
          setNewPinData(prev => ({
            ...prev,
            address: ''
          }));
        }
      });
    }
  };

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
          setMapZoom(18);
          if (map) map.panTo(newCenter);
          if (setToast) setToast({ message: "Konumunuz bulundu.", type: 'success' });
        },
        () => {
          if (setToast) setToast({ message: "Konum alınamadı.", type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const getPinIcon = (type: string) => {
    const typeObj = (allPinTypes || []).find(t => t.id === type);
    return createSvgPin(typeObj?.color || '#eab308', typeObj?.icon || Building2);
  };

  if (loadError) return <div className="p-6 text-center text-red-500">Harita yüklenirken bir hata oluştu.</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative flex flex-col ${view === 'map' ? 'h-[calc(100vh-80px)] md:h-screen' : 'p-6 space-y-6 pb-32'}`}
    >
      {view === 'map' ? (
        <div className="relative flex-1 w-full overflow-hidden bg-[#020617]">
          {/* Floating Search & Filters */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-20 space-y-3 pointer-events-none">
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
                return (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-lg border border-white/5 ${
                      isActive ? 'text-white' : 'bg-slate-900/80 backdrop-blur-md text-slate-400 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: type.color, borderColor: type.color } : {}}
                  >
                    <Icon size={14} style={{ color: isActive ? '#fff' : type.color }} />
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

          {/* View Toggle removed from here */}
          <RegionMap 
            isLoaded={isLoaded}
            mapZoom={mapZoom}
            mapCenter={mapCenter}
            onMapLoad={onMapLoad}
            handleMapClick={handleMapClick}
            is3D={is3D}
            setIs3D={setIs3D}
            setMapZoom={setMapZoom}
            handleLocateMe={handleLocateMe}
            setShowAddPin={setShowAddPin}
            userLocation={userLocation}
            filteredPins={filteredPins}
            getPinIcon={getPinIcon} // DOĞRU PROPS
            setSelectedPin={setSelectedPin}
            selectedPin={selectedPin}
            showAddPin={showAddPin}
            newPinData={newPinData}
            setNewPinData={setNewPinData}
            handleAddPin={handleAddPin}
            addPinMutation={addPinMutation}
            categories={categories}
            mapStyles={darkMapStyles} // KARANLIK TEMA GÖNDERİLİYOR
            search={search}
          />
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

      {/* Filter Add Modal */}
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

      {/* View Toggle - Global */}
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

      {/* Field Notes Drawer */}
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