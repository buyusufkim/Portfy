import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import { maskPhone } from '../utils/masking';
import L from 'leaflet';
import { Plus, Layers, Crosshair, X, CheckCircle2, ArrowRight, Phone, MapPin as MapPinIcon, FileText, Calendar, MessageCircle, Map as MapIcon, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin as MapPinType } from '../types';
import { UseMutationResult } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

const ResizeMap = () => {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    // Observe container size logic instead of just window resize
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      if (map.getContainer()) {
         observer.observe(map.getContainer());
      }
    }
    
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
};

interface RegionMapProps {
  isLoaded: boolean;
  mapZoom: number;
  mapCenter: { lat: number; lng: number };
  onMapLoad: (mapInstance: L.Map) => void;
  handleMapClick: (e: L.LeafletMouseEvent) => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
  setMapZoom: (val: number) => void;
  handleLocateMe: () => void;
  setShowAddPin: (val: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  filteredPins: MapPinType[];
  getPinIcon: (type: string) => string;
  setSelectedPin: (pin: MapPinType | null) => void;
  selectedPin: MapPinType | null;
  showAddPin: boolean;
  newPinData: Partial<MapPinType>;
  setNewPinData: (data: Partial<MapPinType> | ((prev: Partial<MapPinType>) => Partial<MapPinType>)) => void;
  handleAddPin: () => void;
  addPinMutation: UseMutationResult<unknown, Error, Partial<MapPinType>, unknown>;
  categories: { id: string; label: string; icon: string; color: string; kind?: string }[];
  addCategory?: (name: string, color: string, kind?: string, auto_add_to_crm?: boolean) => void;
  handleConvertToCrm?: (pin: MapPinType) => void;
  handlePinAction?: (action: 'call' | 'visit' | 'task' | 'note', pin: MapPinType) => void;
  mapStyles?: { id: string; name: string; url: string; attribution: string }[];
  search: string;
  hotspots?: {lat: number, lng: number, intensity: number, color: string}[];
}

// Component to handle map center/zoom updates and clicks
const MapController = ({ center, zoom, onClick, onMapLoad }: { center: { lat: number, lng: number }, zoom: number, onClick: (e: L.LeafletMouseEvent) => void, onMapLoad: (mapInstance: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    onMapLoad(map);
  }, [map, onMapLoad]);

  useMapEvents({
    click(e) {
      onClick(e);
    }
  });
  return null;
};

export const RegionMap: React.FC<RegionMapProps> = ({
  mapZoom,
  mapCenter,
  onMapLoad,
  handleMapClick,
  is3D,
  setIs3D,
  setMapZoom,
  handleLocateMe,
  setShowAddPin,
  userLocation,
  filteredPins,
  getPinIcon,
  setSelectedPin,
  selectedPin,
  showAddPin,
  newPinData,
  setNewPinData,
  handleAddPin,
  addPinMutation,
  categories,
  addCategory,
  handleConvertToCrm,
  handlePinAction,
  search,
  hotspots = []
}) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState<'network_contact' | 'region_point'>('network_contact');
  const [newCatAutoCrm, setNewCatAutoCrm] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Modal kapandığında wizard ve form state'lerini sıfırla
  useEffect(() => {
    if (!showAddPin) {
      setWizardStep(1);
      setShowAddCategoryForm(false);
      setNewCatName('');
    }
  }, [showAddPin]);

  const isValidCoords = (lat: number | undefined | null, lng: number | undefined | null) => {
    return typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng);
  };

  const createLeafletIcon = (url: string, size: number) => {
    return L.icon({
      iconUrl: url,
      iconSize: [size, size],
      iconAnchor: [size / 2, size]
    });
  };

  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPin) return;
    
    setIsCheckingIn(true);
    try {
      await api.addVisit({
        title: selectedPin.title,
        address: selectedPin.address || 'Bilinmeyen Adres',
        notes: `Radar modundan onaylanmış ziyaret kaydı eklendi. (Tip: ${selectedPin.type})`
      });
      toast.success("Ziyaret kaydı CRM'e eklendi!");
      setTimeout(() => setSelectedPin(null), 1000); // Başarılı olunca popup'ı kapat
    } catch (error) {
      toast.error("Ziyaret kaydedilirken bir hata oluştu.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const tileLayerUrl = is3D 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" // Satellite
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"; // Clean Map

  if (!isValidCoords(mapCenter.lat, mapCenter.lng)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <Layers className="mx-auto mb-2 opacity-20" size={48} />
          <p className="text-sm font-medium">Bölge koordinatları bekleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full min-h-[320px] z-0 flex-1 bg-slate-50">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", minHeight: "320px" }}
        zoomControl={false}
      >
        <ResizeMap />
        <MapController center={mapCenter} zoom={mapZoom} onClick={handleMapClick} onMapLoad={onMapLoad} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileLayerUrl}
        />
        
        {hotspots.filter(spot => spot && isValidCoords(spot.lat, spot.lng)).map((spot, i) => (
          <Circle
            key={`hotspot-${i}`}
            center={[spot.lat, spot.lng]}
            pathOptions={{ fillColor: spot.color, fillOpacity: spot.intensity, color: 'transparent' }}
            radius={200}
          />
        ))}

        {userLocation && isValidCoords(userLocation.lat, userLocation.lng) && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createLeafletIcon(getPinIcon('user_location'), 40)}
            zIndexOffset={1000}
          />
        )}

        {filteredPins.filter(pin => pin && isValidCoords(pin.lat, pin.lng)).map((pin: MapPinType) => {
          const isHighlighted = search.trim().length > 0 && 
            (pin.title.toLowerCase().includes(search.toLowerCase()) || (pin.address && pin.address.toLowerCase().includes(search.toLowerCase())));
          
          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createLeafletIcon(getPinIcon(pin.type), isHighlighted ? 40 : 32)}
              eventHandlers={{
                click: () => setSelectedPin(pin)
              }}
            />
          );
        })}

        {showAddPin && newPinData && isValidCoords(newPinData.lat, newPinData.lng) && (
          <Marker
            position={[newPinData.lat, newPinData.lng]}
            icon={createLeafletIcon(getPinIcon(newPinData.type), 40)}
          />
        )}

        {selectedPin && isValidCoords(selectedPin.lat, selectedPin.lng) && (
          <Popup
            position={[selectedPin.lat, selectedPin.lng]}
            eventHandlers={{ remove: () => setSelectedPin(null) }}
            className="custom-popup"
          >
            <div className="p-2 w-[240px]">
              <div className="mb-2 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-indigo-500 uppercase">{selectedPin.kind === 'region_point' ? 'Bölge Noktası' : 'Network Teması'}</span>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{selectedPin.title}</h3>
                {selectedPin.contact_name && <p className="text-xs font-medium text-slate-700 m-0">{selectedPin.contact_name}</p>}
                {selectedPin.phone && <p className="text-xs text-slate-500 m-0">{maskPhone(selectedPin.phone)}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {selectedPin.kind !== 'region_point' && (
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">İlişki Sev.</p>
                    <p className="text-[10px] text-slate-800 font-medium">{selectedPin.relationship_level || '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Potansiyel</p>
                  <p className="text-[10px] text-slate-800 font-medium">{selectedPin.potential || '-'}</p>
                </div>
                {selectedPin.kind !== 'region_point' && (
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Son Temas</p>
                    <p className="text-[10px] text-slate-800 font-medium">{selectedPin.last_contact_date ? new Date(selectedPin.last_contact_date).toLocaleDateString('tr-TR') : '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Takip</p>
                  <p className="text-[10px] text-slate-800 font-medium">{(selectedPin.next_contact_date || selectedPin.followup_date) ? new Date(selectedPin.next_contact_date || selectedPin.followup_date || '').toLocaleDateString('tr-TR') : '-'}</p>
                </div>
              </div>

              {selectedPin.notes && (
                <div className="bg-slate-50 p-2 rounded-lg mb-3">
                  <p className="text-[10px] text-slate-700 m-0 line-clamp-3">{selectedPin.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3">
                {(!selectedPin.kind || selectedPin.kind === 'network_contact') && (
                  <>
                    <button onClick={() => handlePinAction?.('call', selectedPin)} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-colors">
                      <Phone size={12} /> Arandı
                    </button>
                    <button onClick={() => handlePinAction?.('visit', selectedPin)} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-colors">
                      <MapPinIcon size={12} /> Ziyaret
                    </button>
                  </>
                )}
                
                <button onClick={() => handlePinAction?.('note', selectedPin)} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-colors">
                  <FileText size={12} /> Not Ekle
                </button>
                <button onClick={() => handlePinAction?.('task', selectedPin)} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded text-[10px] font-bold transition-colors">
                  <Calendar size={12} /> Takip
                </button>

                {(!selectedPin.kind || selectedPin.kind === 'network_contact') && selectedPin.phone && (
                  <button onClick={() => window.open(`https://wa.me/${selectedPin.phone?.replace(/[^0-9]/g, '')}`, '_blank')} className="col-span-2 flex items-center justify-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-1.5 rounded text-[10px] font-bold transition-colors">
                    <MessageCircle size={12} /> WhatsApp'tan Yaz
                  </button>
                )}

                {selectedPin.crm_lead_id ? (
                  <button disabled className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-400 py-1.5 rounded text-[10px] font-bold cursor-not-allowed">
                    CRM Kaydı Var
                  </button>
                ) : (
                  selectedPin.kind === 'region_point' && handleConvertToCrm && (
                    <button onClick={(e) => { e.stopPropagation(); handleConvertToCrm(selectedPin); }} className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 rounded text-[10px] font-bold transition-colors">
                      CRM'e Dönüştür
                    </button>
                  )
                )}
                
                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.lat},${selectedPin.lng}`, '_blank')} className="col-span-2 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded text-[10px] font-bold transition-colors">
                  <MapIcon size={12} /> Haritada Göster
                </button>
              </div>
              
              {/* SAHA MODU - DİNAMİK ONAYLI CHECK-İN */}
              {(() => {
                let distance = null;
                if (userLocation && isValidCoords(userLocation.lat, userLocation.lng)) {
                  distance = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(selectedPin.lat, selectedPin.lng));
                }
                const isNear = distance !== null && distance <= 100; // 100 Metre yarıçapı

                return (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    {userLocation ? (
                      isNear ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                            Bu konuma çok yakınsınız.<br/>Ziyaret kaydı oluşturulsun mu?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCheckIn}
                              disabled={isCheckingIn}
                              className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white px-2 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
                            >
                              {isCheckingIn ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Evet"
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPin(null);
                              }}
                              className="flex-1 flex items-center justify-center bg-slate-100 text-slate-600 px-2 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                            >
                              Hayır
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-400 text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Ziyaret kaydı oluşturmak için {Math.round(distance || 0)}m daha yaklaşmalısın.
                        </div>
                      )
                    ) : (
                      <div className="text-[10px] font-bold text-slate-400 text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Ziyaret kaydı için sağdaki ikon ile konumunu bulmalısın.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </Popup>
        )}
      </MapContainer>

      {/* Add Pin Modal Wizard */}
      <AnimatePresence>
        {showAddPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm shadow-2xl"
          >
            <motion.div 
              initial={{ y: '100%', opacity: 0, scale: 1 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            >
              {/* Header & Progress */}
              <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden" />
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-indigo-600 mb-1">Adım {wizardStep} / 4</div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {wizardStep === 1 && "Haritaya ne ekliyorsun?"}
                      {wizardStep === 2 && "Kişi veya nokta bilgisi"}
                      {wizardStep === 3 && "Takip bilgisi"}
                      {wizardStep === 4 && "Kontrol et"}
                    </h3>
                  </div>
                  <button onClick={() => setShowAddPin(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                {/* Progress Bar */}
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`flex-1 rounded-full ${s <= wizardStep ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                  ))}
                </div>
              </div>

              {/* Wizard Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto space-y-6 pb-4 md:pr-2">
                
                {/* SETP 1: Tür Seç */}
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setNewPinData({...newPinData, kind: 'network_contact'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${(!newPinData.kind || newPinData.kind === 'network_contact') ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200'}`}
                      >
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                          <UserIcon size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Network Teması</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Esnaf, Bina Görevlisi, Müşteri vb.</p>
                      </button>
                      <button 
                        onClick={() => setNewPinData({...newPinData, kind: 'region_point'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${newPinData.kind === 'region_point' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200'}`}
                      >
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-3">
                          <MapPinIcon size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Bölge Noktası</h4>
                        <p className="text-[10px] text-slate-500 mt-1">İnşaat, Proje, Satılık İlanı vb.</p>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                        Alt Kategori
                        {!showAddCategoryForm && (
                          <button className="text-indigo-600 hover:text-indigo-700 lowercase" onClick={() => setShowAddCategoryForm(true)}>+ Yeni Kategori</button>
                        )}
                      </label>
                      
                      {showAddCategoryForm && (
                        <div className="bg-white border border-indigo-100 p-3 rounded-xl mb-3 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-900">Yeni Kategori Ekle</span>
                            <button onClick={() => setShowAddCategoryForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                          </div>
                          <input 
                            type="text" 
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Örn: Eczane, Spor Salonu"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <div className="flex bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                            <button onClick={() => setNewCatKind('network_contact')} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${newCatKind === 'network_contact' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Network</button>
                            <button onClick={() => setNewCatKind('region_point')} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${newCatKind === 'region_point' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Nokta</button>
                          </div>
                          <label className="flex items-start gap-2 cursor-pointer mt-2">
                            <input type="checkbox" checked={newCatAutoCrm} onChange={(e) => setNewCatAutoCrm(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-indigo-600" />
                            <span className="text-xs text-slate-600">CRM'e otomatik olarak eklensin</span>
                          </label>
                          <button
                            onClick={() => {
                              if (newCatName.trim()) {
                                const cColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
                                if (addCategory) addCategory(newCatName, cColors[Math.floor(Math.random() * cColors.length)], newCatKind, newCatAutoCrm);
                                toast.success("Kategori eklendi.");
                                setNewCatName('');
                                setShowAddCategoryForm(false);
                              }
                            }}
                            className="w-full bg-indigo-50 text-indigo-700 font-bold py-2 rounded-lg text-xs hover:bg-indigo-100"
                          >
                            Kategoriyi Kaydet
                          </button>
                        </div>
                      )}

                      <select 
                        value={newPinData.type || ''}
                        onChange={(e) => setNewPinData({...newPinData, type: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                      >
                        <option value="" disabled>Lütfen bir kategori seçin</option>
                        {(categories || []).filter(c => c.kind === (newPinData.kind || 'network_contact') || !c.kind).map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 2: Kim/Neresi? */}
                {wizardStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                      <>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">İşletme / Kurum Adı</label>
                          <input 
                            type="text" 
                            value={newPinData.title || ''}
                            onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                            placeholder="Örn: Güven Market"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Kişi Adı Soyadı</label>
                          <input 
                            type="text" 
                            value={newPinData.contact_name || ''}
                            onChange={(e) => setNewPinData({...newPinData, contact_name: e.target.value})}
                            placeholder="Örn: Ahmet Yılmaz"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Telefon (Opsiyonel)</label>
                          <input 
                            type="tel" 
                            value={newPinData.phone || ''}
                            onChange={(e) => setNewPinData({...newPinData, phone: e.target.value})}
                            placeholder="Örn: 0555 555 55 55"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nokta Adı</label>
                        <input 
                          type="text" 
                          value={newPinData.title || ''}
                          onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                          placeholder="Örn: Yeni İnşaat Projesi Şantiyesi"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                          autoFocus
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Açık Adres / Konum Tarifi</label>
                      <input 
                        type="text" 
                        value={newPinData.address || ''}
                        onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                        placeholder="Örn: Atatürk Caddesi, 1. Sokak köşesi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: İlişki ve Takip */}
                {wizardStep === 3 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    {(!newPinData.kind || newPinData.kind === 'network_contact') && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">İlişki Seviyesi</label>
                        <select 
                          value={newPinData.relationship_level || ''}
                          onChange={(e) => setNewPinData({...newPinData, relationship_level: e.target.value as MapPinType['relationship_level']})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="" disabled>Seçiniz</option>
                          <option value="Soğuk Temas">Soğuk Temas</option>
                          <option value="Tanışıldı">Tanışıldı</option>
                          <option value="Güven Oluşuyor">Güven Oluşuyor</option>
                          <option value="Aktif Referans Kaynağı">Aktif Referans Kaynağı</option>
                          <option value="VIP Network">VIP Network</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Potansiyel</label>
                      <div className="flex gap-2">
                        {['Düşük', 'Orta', 'Yüksek', 'Sıcak'].map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => setNewPinData({...newPinData, potential: lvl as MapPinType['potential']})}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${newPinData.potential === lvl ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Son Temas</label>
                            <input type="date" value={newPinData.last_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, last_contact_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 block">Gelecek Takip</label>
                            <input type="date" value={newPinData.next_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, next_contact_date: e.target.value})} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1 block">Gelecek Takip</label>
                          <input type="date" value={newPinData.followup_date || ''} onChange={(e) => setNewPinData({...newPinData, followup_date: e.target.value})} className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notlar (Opsiyonel)</label>
                      <textarea 
                        value={newPinData.notes || ''}
                        onChange={(e) => setNewPinData({...newPinData, notes: e.target.value})}
                        placeholder="Örn: Güvenlik görevlisiyle konuştum, müteahhit yarın gelecekmiş..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                      />
                    </div>

                    {(!newPinData.kind || newPinData.kind === 'network_contact') && (
                      <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={newPinData.add_to_crm || false} 
                          onChange={(e) => setNewPinData({...newPinData, add_to_crm: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="block text-sm font-bold text-slate-900">Ayrıca CRM Rehberine Ekle</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">Bu kişiyi CRM'deki müşteri adayları listenize kopyalar.</span>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {/* STEP 4: Kontrol ve Kaydet */}
                {wizardStep === 4 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                          {newPinData.kind === 'region_point' ? <MapPinIcon size={24} /> : <UserIcon size={24} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-lg text-slate-900 truncate">{newPinData.title || "-"}</h4>
                          <p className="text-xs text-slate-500 truncate">{newPinData.contact_name || newPinData.address || "Detay yok"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200/60">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tür</div>
                          <div className="text-xs font-bold text-slate-700 truncate">
                            {(categories || []).find(c => c.id === newPinData.type)?.label || newPinData.type || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Potansiyel</div>
                          <div className="text-xs font-bold text-slate-700">{newPinData.potential || "-"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Gelecek Takip</div>
                          <div className="text-xs font-bold text-slate-700">{newPinData.next_contact_date || newPinData.followup_date || "-"}</div>
                        </div>
                        {newPinData.phone && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Telefon</div>
                            <div className="text-xs font-bold text-slate-700">{newPinData.phone}</div>
                          </div>
                        )}
                        {newPinData.relationship_level && (
                          <div className="col-span-2">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">İlişki Seviyesi</div>
                            <div className="text-xs font-bold text-slate-700">{newPinData.relationship_level}</div>
                          </div>
                        )}
                      </div>

                      {newPinData.add_to_crm && (
                        <div className="pt-2">
                          <div className="bg-amber-50 text-amber-700 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                            <CheckCircle2 size={14} /> CRM Müşteri Adaylarına Eklenecek
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation / Footer */}
              <div className="pt-4 border-t border-slate-100 flex gap-3 mt-auto shrink-0 bg-white">
                {wizardStep > 1 && (
                  <button 
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-6 py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Geri
                  </button>
                )}
                
                {wizardStep < 4 ? (
                  <button 
                    onClick={() => setWizardStep(prev => prev + 1)}
                    disabled={
                      (wizardStep === 1 && !newPinData.type) || 
                      (wizardStep === 2 && !newPinData.title?.trim())
                    }
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    Devam Et <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleAddPin();
                    }}
                    disabled={!newPinData.title || !newPinData.type || addPinMutation.isPending}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {addPinMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Haritaya Kaydet <CheckCircle2 size={18} /></>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};