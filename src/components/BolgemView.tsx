import React, { useState, useMemo, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';
import { MapIcon, LayoutDashboard, Store, User, Building2, Home, Star, Filter, Search, Plus, X, Layers, Crosshair, MessageSquare, MapPin, Navigation, TrendingUp, CheckCircle2, Phone, Calendar, FileText } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { getTodayStr } from '../services/core/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from '../constants/queryKeys';
import { MapPin as MapPinType, UserProfile, Property, TerritoryPlan } from '../types';
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
  const { regionCategories, addCategory } = useCategories();
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
  const [newFilterKind, setNewFilterKind] = useState<'network_contact' | 'region_point'>('network_contact');

  const [is3D, setIs3D] = useState(false);
  const [showTerritoryPlanner, setShowTerritoryPlanner] = useState(false);
  
  const [todayFocusPlanId, setTodayFocusPlanId] = useState<string | null>(null);
  const [checkInModalData, setCheckInModalData] = useState<{ name: string } | null>(null);
  const [crmNote, setCrmNote] = useState('');
  
  const [pinActionModal, setPinActionModal] = useState<{ type: 'call' | 'visit' | 'task' | 'note', pin: MapPinType } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionContactStatus, setActionContactStatus] = useState<string>('Takipte');

  const updatePinMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<MapPinType> }) => api.updateMapPin(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.id] });
      setPinActionModal(null);
      setActionNote('');
      setActionDate('');
      if (setToast) setToast({ message: 'Aksiyon başarıyla kaydedildi!', type: 'success' });
      setSelectedPin(null);
    },
    onError: (error) => {
      if (setToast) setToast({ message: `Hata oluştu: ${(error as Error).message}`, type: 'error' });
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ pin, title, dueDate }: { pin: MapPinType, title: string, dueDate: string }) => api.addRegionTask(pin, title, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.id] });
      setPinActionModal(null);
      setActionNote('');
      setActionDate('');
      if (setToast) setToast({ message: 'Takip görevi oluşturuldu!', type: 'success' });
      setSelectedPin(null);
    },
    onError: (error) => {
      if (setToast) setToast({ message: `Hata oluştu: ${(error as Error).message}`, type: 'error' });
    }
  });

  const handlePinActionModalSubmit = () => {
    if (!pinActionModal) return;
    const { type, pin } = pinActionModal;
    
    if (type === 'task') {
      if (!actionDate) {
        if (setToast) setToast({ message: 'Lütfen görev tarihini seçiniz.', type: 'error' });
        return;
      }
      addTaskMutation.mutate({ pin, title: `${pin.title} - ${actionNote || 'Bölge Takibi'}`, dueDate: actionDate });
    } else {
      let actionLabel = 'Not';
      if (type === 'call') actionLabel = 'Arandı';
      if (type === 'visit') actionLabel = 'Ziyaret';
      
      const noteAppend = `[${new Date().toLocaleDateString('tr-TR')} - ${actionLabel}] ${actionNote}`;
      const newNotes = pin.notes ? `${pin.notes}\n\n${noteAppend}` : noteAppend;
      
      const updates: Partial<MapPinType> = { notes: newNotes };
      if (type === 'call' || type === 'visit') {
        updates.last_contact_date = new Date().toISOString();
        if (actionContactStatus) updates.relationship_level = actionContactStatus as MapPinType['relationship_level'];
      }
      
      updatePinMutation.mutate({ id: pin.id, updates });
    }
  };

  // Territory Plan Data
  const { data: territoryPlans = [] } = useQuery({
    queryKey: ['territoryPlans', profile?.id],
    queryFn: () => api.momentumOs.getTerritoryPlans(),
    enabled: !!profile?.id
  });

  const activePlan = territoryPlans.find(plan => plan.status === 'Aktif');

  const addTerritoryPlanMutation = useMutation({
    mutationFn: (plan: Partial<TerritoryPlan>) => api.momentumOs.addTerritoryPlan(plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territoryPlans', profile?.id] });
      setToast?.({ message: 'Focus alanı radarda işaretlendi!', type: 'success' });
      setShowTerritoryPlanner(false);
    }
  });

  const updateTerritoryPlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<TerritoryPlan> }) => api.momentumOs.updateTerritoryPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territoryPlans', profile?.id] });
      setToast?.({ message: 'Plan güncellendi!', type: 'success' });
    }
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [hasGeocoded, setHasGeocoded] = useState(false);
  const [showAddPin, setShowAddPin] = useState(false);
  const [newPinData, setNewPinData] = useState<Partial<MapPinType>>({
    title: '',
    type: regionCategories[0]?.id || 'esnaf',
    address: '',
    notes: '',
    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
    kind: 'network_contact',
    add_to_crm: true
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
    const propPins: MapPinType[] = properties
      .filter((p: Property) => typeof p.address?.lat === 'number' && isFinite(p.address.lat) && typeof p.address?.lng === 'number' && isFinite(p.address.lng))
      .map((p: Property) => {
      /* Koordinatı olmayan portföyler ileride ayrı listede gösterilecek. */
      const lat = p.address!.lat!;
      const lng = p.address!.lng!;

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
    const hasPortfoy = regionCategories.some(c => c.id === 'portfoy');
    
    let cats = [...regionCategories];
    if (!hasPortfoy) {
      cats = [{ id: 'portfoy', label: 'Portföylerim', name: 'Portföylerim', kind: 'region_point', icon: Home, color: '#f97316' }, ...cats];
    }
    return [...base, ...cats];
  }, [regionCategories]);

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
    onSuccess: (result: { id: string; crmSuccess?: boolean; crmError?: string }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profile?.id] });
      setShowAddPin(false);

      if (result && result.crmSuccess) {
        if (setToast) setToast({ message: 'Haritaya eklendi ve CRM’e kaydedildi!', type: 'success' });
      } else if (result && result.crmError) {
        if (setToast) setToast({ message: `Haritaya eklendi ancak CRM'e eklenirken bir hata oluştu: ${result.crmError}`, type: 'error' });
      } else {
        if (setToast) setToast({ message: 'Haritaya eklendi.', type: 'success' });
      }

      setNewPinData({
        title: '',
        type: regionCategories[0]?.id || 'esnaf',
        address: '',
        notes: '',
        lat: defaultCenter.lat,
        lng: defaultCenter.lng,
        kind: 'network_contact',
        add_to_crm: true
      });
      setSelectedPin(null);
    }
  });

  const handleAddFilter = () => {
    if (!newFilterName.trim()) return;
    addCategory(newFilterName, newFilterColor, newFilterKind);
    setNewFilterName('');
    setNewFilterKind('network_contact');
    setShowAddFilter(false);
  };

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (e.latlng) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

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

  const convertToCrmMutation = useMutation({
    mutationFn: api.convertPinToLead,
    onSuccess: () => {
      if (setToast) setToast({ message: 'Nokta CRM kaydına dönüştürüldü!', type: 'success' });
      setSelectedPin(null);
    },
    onError: (error) => {
      if (setToast) setToast({ message: `CRM'e dönüştürülürken hata oluştu: ${(error as Error).message}`, type: 'error' });
    }
  });

  const handleAddPin = () => {
    if (!newPinData.title?.trim() || !newPinData.type) return;
    addPinMutation.mutate(newPinData as typeof addPinMutation.variables);
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
    const IconComponent = (typeObj?.icon as React.ElementType) || Building2;
    return createSvgPin(typeObj?.color || '#eab308', IconComponent);
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
            categories={regionCategories.map(c => ({ id: c.id, label: c.label || c.name, icon: 'MapIcon', color: c.color, kind: c.kind }))}
            addCategory={addCategory}
            handleConvertToCrm={(pin) => convertToCrmMutation.mutate(pin)}
            handlePinAction={(action, pin) => setPinActionModal({ type: action, pin })}
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

          {(() => {
            const networkPins = combinedPins.filter(p => !p.kind || p.kind === 'network_contact');
            const pointPins = combinedPins.filter(p => p.kind === 'region_point');

            const activeReferrals = networkPins.filter(p => p.relationship_level === 'Aktif Referans Kaynağı');
            const hotPotentials = networkPins.filter(p => p.potential === 'Sıcak' || p.potential === 'Yüksek');
            
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recentContacts = networkPins.filter(p => p.last_contact_date && new Date(p.last_contact_date) >= sevenDaysAgo);

            const overdueFollowups = networkPins.filter(p => {
              if (!p.next_contact_date && !p.followup_date) return false;
              const d = new Date(p.next_contact_date || p.followup_date || '');
              return d < new Date(now.getTime() - 24 * 60 * 60 * 1000); // Past due by more than a day
            });

            const pendingVisitsToday = networkPins.filter(p => {
              if (!p.next_contact_date && !p.followup_date) return false;
              const date = new Date(p.next_contact_date || p.followup_date || '');
              const isTodayOrPast = date <= now;
              const isHot = p.potential === 'Sıcak' || p.potential === 'Yüksek';
              const isStrongRel = p.relationship_level === 'Güven Oluşuyor' || p.relationship_level === 'Aktif Referans Kaynağı' || p.relationship_level === 'VIP Network';
              return isTodayOrPast && isHot && isStrongRel;
            });

            const weakNetwork = networkPins.filter(p => {
              if (!p.relationship_level || p.relationship_level === 'Soğuk Temas' || p.relationship_level === 'Tanışıldı') return true;
              if (!p.last_contact_date) return true;
              if (new Date(p.last_contact_date) < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return true;
              return false;
            }).slice(0, 5);

            const rawScore = (networkPins.length * 2) 
              + (activeReferrals.length * 8) 
              + (hotPotentials.length * 6) 
              + (recentContacts.length * 4) 
              - (overdueFollowups.length * 3);
            const masteryScore = Math.max(0, Math.min(100, Math.round(rawScore)));

            const categoryDistribution = allPinTypes.map(c => ({
              ...c,
              count: combinedPins.filter(p => p.type === c.id).length
            })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

            const ActionButtons = ({ pin }: { pin: MapPinType }) => (
              <div className="flex items-center gap-1 mt-3">
                <button 
                  onClick={() => {
                    setView('map');
                    setMapZoom(18);
                    setMapCenter({ lat: pin.lat, lng: pin.lng });
                    setSelectedPin(pin);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                >
                  Detaya Git
                </button>
                <button 
                  onClick={() => setPinActionModal({ type: 'task', pin })}
                  className="px-2 py-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold"
                >
                  Takip Oluştur
                </button>
                {(pin.kind === 'region_point') && (
                  <button 
                    onClick={() => convertToCrmMutation.mutate(pin)}
                    className="px-2 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
                  >
                    CRM'e Dönüştür
                  </button>
                )}
              </div>
            );

            return (
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score Card */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Bölge Hakimiyeti</h3>
                      <p className="text-indigo-200 text-xs">Network gücü ve saha aktivitenize göre hesaplanan güncel skorunuz.</p>
                    </div>
                    
                    <div className="flex items-end items-center gap-4 mt-6">
                      <div className="text-6xl font-black">{masteryScore}</div>
                      <div className="text-sm font-medium text-emerald-400">
                        / 100
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-indigo-200 text-[10px] uppercase font-bold">Network Teması</div>
                        <div className="text-xl font-bold">{networkPins.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-indigo-200 text-[10px] uppercase font-bold">Bölge Noktası</div>
                        <div className="text-xl font-bold">{pointPins.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-indigo-200 text-[10px] uppercase font-bold">Sıcak / Referans</div>
                        <div className="text-xl font-bold">{hotPotentials.length + activeReferrals.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <div className="text-indigo-200 text-[10px] uppercase font-bold">Son 7 Gün Temas</div>
                        <div className="text-xl font-bold">{recentContacts.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Today's Follow-ups */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          Bugün Uğranacaklar
                        </h3>
                        <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{pendingVisitsToday.length} Temas</span>
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3">
                        {pendingVisitsToday.length > 0 ? pendingVisitsToday.map(pin => (
                          <div key={pin.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{pin.title}</h4>
                                <p className="text-[10px] text-slate-500">{pin.contact_name || pin.type}</p>
                              </div>
                              <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">{pin.potential}</span>
                            </div>
                            <ActionButtons pin={pin} />
                          </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                            <CheckCircle2 size={24} className="mb-2 text-slate-300" />
                            Bugün için kritik ziyaret bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Weak Network */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <TrendingUp size={16} className="text-red-500" />
                          Zayıf Kalan Ağ
                        </h3>
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{weakNetwork.length} Riskli</span>
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3">
                        {weakNetwork.length > 0 ? weakNetwork.map(pin => (
                          <div key={pin.id} className="p-3 border border-red-50 rounded-xl bg-red-50/30">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{pin.title}</h4>
                                <p className="text-[10px] text-slate-500">Son Tema: {pin.last_contact_date ? new Date(pin.last_contact_date).toLocaleDateString('tr-TR') : 'Hiç'}</p>
                              </div>
                            </div>
                            <ActionButtons pin={pin} />
                          </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                            Zayıf bağınız bulunmuyor.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-900 mb-4">Kategori Dağılımı</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                     {categoryDistribution.map(cat => {
                       const Icon = cat.icon || Building2;
                       return (
                         <div key={cat.id} className="p-3 border rounded-xl flex flex-col" style={{ borderColor: cat.color + '30', backgroundColor: cat.color + '10' }}>
                           <div className="flex items-center gap-2 mb-2">
                             <Icon size={14} style={{ color: cat.color }} />
                             <span className="text-[10px] font-bold text-slate-700 line-clamp-1">{cat.label}</span>
                           </div>
                           <div className="text-lg font-black text-slate-900">{cat.count}</div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            );
          })()}

          {/* TERRITORY PLANNING / 3 ODAK BÖLGE */}
          <div className="w-full bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 shadow-sm mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">Haftalık Odak Planı <div className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">AKILLI ODAK</div></h4>
                  <p className="text-xs text-slate-500">Bu hafta 3 odak bölge belirle</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTerritoryPlanner(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap"
              >
                Bölge Seç
              </button>
            </div>

            {territoryPlans.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {territoryPlans.slice(0, 3).map(plan => {
                  const isTodayFocus = todayFocusPlanId === plan.id;
                  return (
                    <div key={plan.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors gap-3 sm:gap-0 ${isTodayFocus ? 'bg-indigo-100/50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex flex-col flex-1 cursor-pointer w-full" onClick={() => setTodayFocusPlanId(plan.id)}>
                        <div className="flex items-center justify-between w-full sm:justify-start sm:gap-3">
                           <h5 className="text-sm font-bold text-slate-800">{plan.name}</h5>
                           {!isTodayFocus && (
                              <button className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 sm:hidden">Seç</button>
                           )}
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{plan.strategy_notes || 'Odak bölgesi'}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                         {!isTodayFocus && (
                            <button onClick={() => setTodayFocusPlanId(plan.id)} className="hidden sm:inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200">Bugün Odaklan</button>
                         )}
                         {isTodayFocus && (
                            <button 
                              onClick={() => {
                                setToast?.({ message: `${plan.name} bölgesi ziyaret ediliyor...`, type: 'info' });
                                setCheckInModalData(plan);
                              }} 
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all w-full sm:w-auto whitespace-nowrap"
                            >
                              <CheckCircle2 size={14} /> Bugün Ziyaret Et
                            </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">Kategori Türü</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setNewFilterKind('network_contact')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${newFilterKind === 'network_contact' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Network
                    </button>
                    <button 
                      onClick={() => setNewFilterKind('region_point')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${newFilterKind === 'region_point' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Bölge Noktası
                    </button>
                  </div>
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
                
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Önerilen Fokus Alanı</h4>
                      <p className="text-sm font-bold text-white mt-1">{profile?.region?.district || 'Seçili Bölge'} - Yıldırım Beyazıt Mah.</p>
                    </div>
                    {activePlan ? (
                      <button 
                        onClick={() => {
                          updateTerritoryPlanMutation.mutate({
                            id: activePlan.id,
                            data: {
                              visit_target: (activePlan.visit_target || 10) + 5,
                              priority_score: Math.min(100, (activePlan.priority_score || 90) + 5),
                            }
                          });
                        }}
                        disabled={updateTerritoryPlanMutation.isPending}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors bg-indigo-900 border border-indigo-700 text-indigo-100 hover:bg-indigo-800"
                      >
                        Hedefi Artır
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          addTerritoryPlanMutation.mutate({
                            name: 'Akıllı Tavsiye: Drop-off',
                            district: profile?.region?.district || 'Seçili Bölge',
                            priority_score: 95,
                            visit_target: 10,
                            week_start_date: new Date().toISOString(),
                            boundaries: { method: 'ai_suggested' },
                            strategy_notes: 'Son 15 günde alıcı trafiğinin en yoğun olduğu alan',
                            status: 'Aktif'
                          });
                        }}
                        disabled={addTerritoryPlanMutation.isPending}
                        className="text-xs font-bold px-4 py-2 rounded-xl transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Rotayı Çiz
                      </button>
                    )}
                  </div>
                  
                  {activePlan && (
                    <div className="flex gap-4 pt-3 border-t border-indigo-500/20">
                      <div>
                        <div className="text-[10px] text-indigo-300">Ziyaret Hedefi</div>
                        <div className="text-sm font-bold text-white">{activePlan.visit_target || 0}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-300">Öncelik Skoru</div>
                        <div className="text-sm font-bold text-white">{activePlan.priority_score || 0}/100</div>
                      </div>
                    </div>
                  )}
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
        {pinActionModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPinActionModal(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[24px] relative z-10 shadow-2xl p-6 overflow-hidden">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   {pinActionModal.type === 'call' && <Phone size={32} />}
                   {pinActionModal.type === 'visit' && <MapPin size={32} />}
                   {pinActionModal.type === 'task' && <Calendar size={32} />}
                   {pinActionModal.type === 'note' && <FileText size={32} />}
                 </div>
                 <h3 className="text-[18px] font-black text-slate-900 leading-tight">
                   {pinActionModal.type === 'call' ? 'Arama Kaydı' : pinActionModal.type === 'visit' ? 'Ziyaret Kaydı' : pinActionModal.type === 'task' ? 'Takip Oluştur' : 'Not Ekle'}
                 </h3>
                 <p className="text-xs text-slate-500 mt-2 font-medium">{pinActionModal.pin.title} için işlem yapıyorsunuz</p>
               </div>
               
               <div className="space-y-4">
                 {(pinActionModal.type === 'call' || pinActionModal.type === 'visit') && (
                   <div>
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">İlişki Seviyesi (Güncelle)</label>
                     <select 
                       value={actionContactStatus}
                       onChange={(e) => setActionContactStatus(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     >
                       <option value="Düşük">Düşük</option>
                       <option value="Orta">Orta</option>
                       <option value="İyi">İyi</option>
                       <option value="Güçlü">Güçlü</option>
                     </select>
                   </div>
                 )}

                 {pinActionModal.type === 'task' && (
                   <div>
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Takip Tarihi</label>
                     <input 
                       type="date"
                       value={actionDate}
                       min={getTodayStr()}
                       onChange={(e) => setActionDate(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                   </div>
                 )}

                 <div>
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                     {pinActionModal.type === 'task' ? 'Takip Notu / Hedef' : 'Detay Notu'}
                   </label>
                   <textarea
                     value={actionNote}
                     onChange={(e) => setActionNote(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                     placeholder={pinActionModal.type === 'call' ? "Görüşme nasıl geçti? Ne konuşuldu?" : "Ekstra notlar..."}
                   />
                 </div>
                 
                 <div className="flex gap-2 pt-2">
                   <button 
                     onClick={() => setPinActionModal(null)}
                     className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all text-sm"
                   >
                     İptal
                   </button>
                   <button 
                     onClick={handlePinActionModalSubmit}
                     disabled={updatePinMutation.isPending || addTaskMutation.isPending}
                     className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
                   >
                     {(updatePinMutation.isPending || addTaskMutation.isPending) ? 'Kaydediliyor...' : 'Kaydet'}
                   </button>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkInModalData && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCheckInModalData(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[24px] relative z-10 shadow-2xl p-6 overflow-hidden">
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 size={32} />
                 </div>
                 <h3 className="text-[18px] font-black text-slate-900 leading-tight">{checkInModalData.name} Bölgesindesiniz</h3>
                 <p className="text-xs text-slate-500 mt-2 font-medium">Bu ziyaretin ardından CRM'de bir takip görevi oluşturun</p>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 block tracking-widest pl-1">Görev Notu / Özet</label>
                   <textarea
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
                     rows={3}
                     placeholder="Ziyaret nasıl geçti? Kiminle görüşüldü?"
                     value={crmNote}
                     onChange={e => setCrmNote(e.target.value)}
                   />
                 </div>
                 <button 
                   onClick={() => {
                     api.addTask({
                       title: `${checkInModalData.name} Bölge Ziyareti Takibi`,
                       time: new Date().toISOString(),
                       notes: crmNote,
                       type: 'Saha',
                       completed: false,
                       due_date: getTodayStr(),
                       source: 'bolgem',
                       metadata: { origin: 'bolgem_checkin', region_name: checkInModalData.name }
                     }).then(() => {
                        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] });
                        setToast?.({ message: 'Ziyaret takibi CRM görevlerine eklendi!', type: 'success' });
                        setCheckInModalData(null);
                        setCrmNote('');
                     });
                   }}
                   className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                 >Görev Oluştur ve Çık</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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