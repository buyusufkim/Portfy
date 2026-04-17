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

const defaultCenter = { lat: 41.0082, lng: 28.9784 }; // İstanbul Merkez
const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 41.0082,
  lng: 28.9784
};

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
  
  // Set initial center based on user region
  const initialCenter = useMemo(() => {
    if (profile?.region?.city && profile?.region?.district) {
      const coords = locationService.getDistrictCoords(profile.region.city, profile.region.district);
      if (coords) return coords;
    }
    return center;
  }, [profile]);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13); // İlk açılışta çok yakından girmesin
  const [hasGeocoded, setHasGeocoded] = useState(false); // Geocoding'in sürekli çalışmasını engellemek için
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPinData, setNewPinData] = useState({
    title: '',
    type: categories[0]?.id || 'esnaf',
    address: '',
    notes: '',
    lat: initialCenter.lat,
    lng: initialCenter.lng
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { data: pins = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.MAP_PINS, profile?.uid],
    queryFn: api.getMapPins,
    enabled: !!profile?.uid
  });

  // Geocode region if coordinates are default
  useEffect(() => {
    if (isLoaded && profile?.region?.city && profile?.region?.district && !hasGeocoded) {
      const addressToGeocode = locationService.getGeocodeAddressString(
        profile.region.city, 
        profile.region.district, 
        profile.region.neighborhoods?.[0]
      );
      
      if (addressToGeocode) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: addressToGeocode }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location.toJSON();
            setMapCenter(loc);
            // Sadece ilk yüklemede ve pin yoksa merkezi manuel ayarla
            // Pin varsa aşağıdaki useEffect zaten fitBounds ile odaklanacak
            if (map && pins.length === 0) {
              map.setCenter(loc);
              map.setZoom(14);
            }
            setHasGeocoded(true); // Bir daha gereksiz istek atma
          }
        });
      }
    }
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

  const fieldNotes = useMemo(() => {
    return (pins || []).filter((pin: MapPinType) => pin.notes && pin.notes.trim().length > 0);
  }, [pins]);

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
          map.setZoom(17); // Tek pinde yakına gir
        } else {
          map.fitBounds(bounds); // Tüm pinleri ekrana sığdır
          // Aşırı zoom yapılmasını engelle
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
        lat: center.lat,
        lng: center.lng
      });
    }
  });

  const allPinTypes = [{ id: 'all', label: 'Tümü', icon: Filter, color: '#1e293b' }, ...categories];

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
        
        // If high accuracy failed, try one more time with low accuracy
        if (options.enableHighAccuracy) {
          console.log("Yüksek doğruluk başarısız, düşük doğruluk deneniyor...");
          navigator.geolocation.getCurrentPosition(
            successCallback,
            finalErrorCallback,
            { ...options, enableHighAccuracy: false, timeout: 10000 }
          );
          return;
        }
        
        finalErrorCallback(error);
      };

      const finalErrorCallback = (error: GeolocationPositionError) => {
        let message = "Konum alınamadı.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından (veya kilit simgesinden) izin verdiğinizden emin olun.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Konum bilgisi şu an kullanılamıyor. GPS veya internet bağlantınızı kontrol edin.";
        } else if (error.code === error.TIMEOUT) {
          message = "Konum alma isteği zaman aşımına uğradı. Lütfen tekrar deneyin.";
        }
        if (setToast) setToast({ message, type: 'error' });
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

  if (loadError) return <div className="p-6 text-center text-red-500">Harita yüklenirken bir hata oluştu. Lütfen API anahtarınızı kontrol edin.</div>;

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

          {/* View Toggle - Floating at bottom center */}
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

          {/* Map Controls - Floating right */}
          <div className="absolute right-4 top-40 flex flex-col gap-2 z-10">
            <button 
              onClick={() => {
                setMapCenter(map?.getCenter()?.toJSON() || mapCenter);
                setShowAddPin(true);
              }}
              className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-2xl hover:bg-orange-700 transition-all mb-2"
              title="Pin Ekle"
            >
              <Plus size={32} />
            </button>
            <button 
              onClick={() => {
                setIs3D(!is3D);
                if (!is3D) setMapZoom(18);
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${is3D ? 'bg-orange-500 text-white' : 'bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white'}`}
              title="3D Görünüm"
            >
              <Layers size={24} />
            </button>
            <button 
              onClick={handleLocateMe}
              className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 flex items-center justify-center shadow-xl hover:bg-white transition-all"
              title="Konumumu Bul"
            >
              <Crosshair size={24} />
            </button>
          </div>

          {/* Region Info Hub */}
          {profile?.region && (
            <div className="absolute left-4 bottom-24 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Bölge</p>
                <p className="text-xs font-bold text-slate-900">{profile.region.district}, {profile.region.city}</p>
              </div>
            </div>
          )}

          <div className="w-full h-full bg-slate-200">
            {!isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                zoom={mapZoom}
                center={mapCenter}
                onLoad={onMapLoad}
                onClick={handleMapClick}
                mapTypeId={is3D ? 'hybrid' : 'roadmap'}
                tilt={is3D ? 45 : 0}
                heading={is3D ? 45 : 0}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  styles: mapStyles
                }}
              >
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={{
                      url: createSvgPin('#3b82f6', MapPin),
                      scaledSize: new window.google.maps.Size(40, 40),
                      anchor: new window.google.maps.Point(20, 40)
                    }}
                    zIndex={100}
                  />
                )}

                {(filteredPins || []).map((pin: MapPinType) => {
                  const isHighlighted = search.trim().length > 0;
                  return (
                    <Marker
                      key={pin.id}
                      position={{ lat: pin.lat, lng: pin.lng }}
                      icon={{
                        url: getPinIcon(pin.type),
                        scaledSize: isHighlighted ? new window.google.maps.Size(40, 40) : new window.google.maps.Size(32, 32),
                        anchor: isHighlighted ? new window.google.maps.Point(20, 40) : new window.google.maps.Point(16, 32)
                      }}
                      animation={isHighlighted ? google.maps.Animation.DROP : undefined}
                      onClick={() => setSelectedPin(pin)}
                    />
                  );
                })}

                {showAddPin && (
                  <Marker
                    position={{ lat: newPinData.lat, lng: newPinData.lng }}
                    icon={{
                      url: getPinIcon(newPinData.type),
                      scaledSize: new window.google.maps.Size(40, 40),
                      anchor: new window.google.maps.Point(20, 40)
                    }}
                    animation={google.maps.Animation.BOUNCE}
                  />
                )}

                {selectedPin && (
                  <InfoWindow
                    position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
                    onCloseClick={() => setSelectedPin(null)}
                  >
                    <div className="p-2 max-w-[200px]">
                      <h3 className="font-bold text-slate-900 text-sm mb-1">{selectedPin.title}</h3>
                      <p className="text-xs text-slate-500 mb-2">{selectedPin.address}</p>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">{selectedPin.notes}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bölgem</h1>
            <button 
              onClick={() => setShowFieldNotes(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all"
            >
              <MessageSquare size={16} />
              Saha Notları
            </button>
          </div>

          {/* Search & Filters for List View */}
          <div className="space-y-4">
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
              <button
                onClick={() => setShowAddFilter(true)}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* View Toggle for List View */}
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <button 
              onClick={() => setView('map')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${view === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <MapIcon size={14} /> Harita
            </button>
            <button 
              onClick={() => setView('list')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              <LayoutDashboard size={14} /> Liste
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filteredPins || []).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm col-span-full">Sonuç bulunamadı.</div>
            ) : (
              (filteredPins || []).map((pin: MapPinType) => {
                const typeObj = (allPinTypes || []).find(t => t.id === pin.type);
                const Icon = typeObj?.icon || Building2;
                return (
                  <div key={pin.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: typeObj?.color || '#eab308' }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900">{pin.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{typeObj?.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{pin.address}</p>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">{pin.notes}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add Pin Modal */}
      <AnimatePresence>
        {showAddPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none pb-24 sm:pb-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Haritaya Ekle</h3>
                <button onClick={() => setShowAddPin(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Başlık / İsim</label>
                  <input 
                    type="text" 
                    value={newPinData.title}
                    onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                    placeholder="Örn: Ahmet Bakkal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
                  <select 
                    value={newPinData.type}
                    onChange={(e) => setNewPinData({...newPinData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {(categories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Adres</label>
                  <input 
                    type="text" 
                    value={newPinData.address}
                    onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                    placeholder="Örn: Atatürk Cad. No:12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notlar</label>
                  <textarea 
                    value={newPinData.notes}
                    onChange={(e) => setNewPinData({...newPinData, notes: e.target.value})}
                    placeholder="Bölge hakkında notlar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none h-24"
                  />
                </div>

                <button 
                  onClick={handleAddPin}
                  disabled={!newPinData.title.trim() || addPinMutation.isPending}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-4 disabled:opacity-50 flex justify-center items-center"
                >
                  {addPinMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BolgemView;