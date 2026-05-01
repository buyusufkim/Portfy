import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Layers, Crosshair, X, CheckCircle2, ArrowRight, Phone, MapPin as MapPinIcon, FileText, Calendar, MessageCircle, Map as MapIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin as MapPinType } from '../types';
import { UseMutationResult } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

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
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
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
                {selectedPin.phone && <p className="text-xs text-slate-500 m-0">{selectedPin.phone}</p>}
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

      {/* Add Pin Modal */}
      <AnimatePresence>
        {showAddPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 pointer-events-none pb-24 sm:pb-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto max-h-[85vh] overflow-y-auto flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">Haritaya Ekle</h3>
                <button onClick={() => setShowAddPin(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              {/* KIND SELECTOR */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setNewPinData({...newPinData, kind: 'network_contact'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${(!newPinData.kind || newPinData.kind === 'network_contact') ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Network Teması
                </button>
                <button 
                  onClick={() => setNewPinData({...newPinData, kind: 'region_point'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${newPinData.kind === 'region_point' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bölge Noktası
                </button>
              </div>

              <div className="space-y-4">
                {/* DYNAMIC FORM */}
                {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kişi / İşletme Adı</label>
                        <input 
                          type="text" 
                          value={newPinData.title || ''}
                          onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                          placeholder="Örn: Ahmet Bakkal"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">İsim Soyisim</label>
                        <input 
                          type="text" 
                          value={newPinData.contact_name || ''}
                          onChange={(e) => setNewPinData({...newPinData, contact_name: e.target.value})}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Telefon</label>
                      <input 
                        type="tel" 
                        value={newPinData.phone || ''}
                        onChange={(e) => setNewPinData({...newPinData, phone: e.target.value})}
                        placeholder="Örn: 0555 555 55 55"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nokta Adı</label>
                    <input 
                      type="text" 
                      value={newPinData.title || ''}
                      onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                      placeholder="Örn: Yeni İnşaat Projesi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                    Kategori
                    {!showAddCategoryForm && (
                      <button 
                        className="text-indigo-500 hover:text-indigo-600 lowercase"
                        onClick={() => setShowAddCategoryForm(true)}
                      >
                        + Yeni Kategori
                      </button>
                    )}
                  </label>
                  
                  {showAddCategoryForm && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-900">Yeni Kategori Ekle</span>
                        <button onClick={() => setShowAddCategoryForm(false)} className="text-indigo-400 hover:text-indigo-600">
                          <X size={16} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Örn: Eczane, Spor Salonu"
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <div className="flex bg-white rounded-lg border border-indigo-200 p-0.5">
                        <button 
                          onClick={() => setNewCatKind('network_contact')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${newCatKind === 'network_contact' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Network
                        </button>
                        <button 
                          onClick={() => setNewCatKind('region_point')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${newCatKind === 'region_point' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Nokta
                        </button>
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer mt-2">
                        <input 
                          type="checkbox" 
                          checked={newCatAutoCrm} 
                          onChange={(e) => setNewCatAutoCrm(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-700 leading-tight">CRM'e otomatik olarak eklensin (Sadece bu kategori için)</span>
                      </label>
                      <button
                        onClick={() => {
                          if (newCatName.trim()) {
                            const cColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
                            const randomColor = cColors[Math.floor(Math.random() * cColors.length)];
                            if (addCategory) {
                              addCategory(newCatName, randomColor, newCatKind, newCatAutoCrm);
                            }
                            toast.success("Kategori eklendi.");
                            setNewCatName('');
                            setShowAddCategoryForm(false);
                          }
                        }}
                        className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-indigo-700"
                      >
                        Kaydet
                      </button>
                    </div>
                  )}

                  <select 
                    value={newPinData.type || ''}
                    onChange={(e) => setNewPinData({...newPinData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" disabled>Seçiniz</option>
                    {(categories || []).filter(c => c.kind === (newPinData.kind || 'network_contact') || !c.kind).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {(!newPinData.kind || newPinData.kind === 'network_contact') && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">İlişki Seviyesi</label>
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

                <div className="grid grid-cols-2 gap-3">
                  {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Son Temas</label>
                        <input type="date" value={newPinData.last_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, last_contact_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Gelecek Temas</label>
                        <input type="date" value={newPinData.next_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, next_contact_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Takip Tarihi</label>
                      <input type="date" value={newPinData.followup_date || ''} onChange={(e) => setNewPinData({...newPinData, followup_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Potansiyel</label>
                  <div className="flex gap-2">
                    {['Düşük', 'Orta', 'Yüksek', 'Sıcak'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setNewPinData({...newPinData, potential: lvl as MapPinType['potential']})}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${newPinData.potential === lvl ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 bg-white'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Açık Adres / Konum</label>
                  <input 
                    type="text" 
                    value={newPinData.address || ''}
                    onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                    placeholder="Örn: Atatürk Cad. No:12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {(!newPinData.kind || newPinData.kind === 'network_contact') && (
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newPinData.add_to_crm || false} 
                      onChange={(e) => setNewPinData({...newPinData, add_to_crm: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-slate-700">CRM'e Ekle</span>
                      <span className="block text-xs text-slate-500">Bu kişiyi aynı zamanda CRM rehberime de kaydet</span>
                    </div>
                  </label>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notlar</label>
                  <textarea 
                    value={newPinData.notes || ''}
                    onChange={(e) => setNewPinData({...newPinData, notes: e.target.value})}
                    placeholder="Detaylı notlar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                  />
                </div>

                <button 
                  onClick={handleAddPin}
                  disabled={!newPinData.title || !newPinData.type || addPinMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {addPinMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Ekle <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};