import React, { useState, useMemo, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapIcon, LayoutDashboard, Store, User, Building2, Home, Star, Filter, Search, Plus, X, Layers, Crosshair, MessageSquare, MapPin } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { MapPin as MapPinType, UserProfile } from '../types';
import { locationService } from '../services/locationService';

import { RegionMap } from './RegionMap';
import { RegionStats } from './RegionStats';
import { CompetitorList } from './CompetitorList';

const defaultCenter = { lat: 41.0082, lng: 28.9784 }; // İstanbul Merkez
const libraries: ("places")[] = ["places"];

const mapStyles = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d2d9" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#dcdcdc" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#dcdcdc" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ color: "#dcdcdc" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -100 }] }
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
  const [newFilterColor, setNewFilterColor] = useState('#eab308'); // Default yellow

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

  const { data: pins = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profile?.uid],
    queryFn: api.getMapPins,
    enabled: !!profile?.uid
  });

  // Geocode region if coordinates are default
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
            if (map && pins.length === 0) {
              map.setCenter({ lat: coords.lat, lng: coords.lng });
              map.setZoom(14);
            }
            setHasGeocoded(true);
          }
        }
      }
    };

    geocodeProfileRegion();
  }, [profile?.region, isLoaded, map, hasGeocoded, pins.length]);

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const filteredPins = useMemo(() => {
    return (pins || []).filter((pin: MapPinType) => {
      const matchFilter = filter === 'all' || pin.type === filter;
      const matchSearch = (pin.title || '').toLowerCase().includes(search.toLowerCase()) || (pin.address || '').toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, search, pins]);

  const allPinTypes = useMemo(() => [{ id: 'all', label: 'Tümü', icon: Filter, color: '#1e293b' }, ...categories], [categories]);

  // Auto-focus on filtered pins
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.uid] });
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

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      };

      const successCallback = (position: GeolocationPosition) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(newCenter);
        setUserLocation(newCenter);
        setMapZoom(18);
        if (map) map.panTo(newCenter);
        if (setToast) setToast({ message: "Konumunuz başarıyla bulundu.", type: 'success' });
      };

      const errorCallback = (error: GeolocationPositionError) => {
        console.error("Konum hatası:", error);
        if (error.code === error.PERMISSION_DENIED) {
          if (setToast) setToast({ message: "Konum erişimi reddedildi.", type: 'error' });
        } else {
          if (setToast) setToast({ message: "Konum alınamadı.", type: 'error' });
        }
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    } else {
      if (setToast) setToast({ message: "Tarayıcınız konum özelliğini desteklemiyor.", type: 'error' });
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
        <div className="relative flex-1 w-full overflow-hidden">
          {/* Floating Search & Filters */}
          <div className="absolute top-4 left-4 right-4 z-20 space-y-3 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  placeholder="Sokak, bina veya kişi ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/95 backdrop-blur-md border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-xl"
                />
              </div>
              <button 
                onClick={() => setShowFieldNotes(true)}
                className="w-12 h-12 bg-white/95 backdrop-blur-md text-orange-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-white transition-all"
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-lg ${
                      isActive ? 'text-white' : 'bg-white/95 backdrop-blur-md text-slate-600 hover:bg-white'
                    }`}
                    style={isActive ? { backgroundColor: type.color } : {}}
                  >
                    <Icon size={14} style={{ color: isActive ? '#fff' : type.color }} />
                    {type.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddFilter(true)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md text-slate-500 hover:bg-white transition-all shrink-0 shadow-lg"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl flex shadow-2xl border border-white/10">
            <button 
              onClick={() => setView('map')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${view === 'map' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
            >
              <MapIcon size={14} /> Harita
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}
            >
              <LayoutDashboard size={14} /> Liste
            </button>
          </div>

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
            getPinIcon={getPinIcon}
            setSelectedPin={setSelectedPin}
            selectedPin={selectedPin}
            showAddPin={showAddPin}
            newPinData={newPinData}
            mapStyles={mapStyles}
            search={search}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bölgem</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setView('map')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
              >
                <MapIcon size={16} /> Harita
              </button>
              <button 
                onClick={() => setShowFieldNotes(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all"
              >
                <MessageSquare size={16} /> Saha Notları
              </button>
            </div>
          </div>

          <RegionStats profile={profile} />

          {/* Search & Filters for List View */}
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

      {/* Field Notes Drawer */}
      <AnimatePresence>
        {showFieldNotes && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowFieldNotes(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><MessageSquare size={20} className="text-orange-600"/> Saha Notları</h3>
                <button onClick={() => setShowFieldNotes(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {pins.filter(p => p.notes?.trim()).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Henüz bölge notu eklenmemiş.</div>
                ) : (
                  pins.filter(p => p.notes?.trim()).map((pin: MapPinType) => (
                    <div key={pin.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-900 text-sm">{pin.title}</span>
                        <span className="text-[10px] bg-white px-2 py-1 rounded-md text-slate-400 font-bold border border-slate-100">{(allPinTypes.find(t => t.id === pin.type))?.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{pin.notes}"</p>
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