import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Layers, Crosshair, X, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin as MapPinType } from '../types';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface RegionMapProps {
  isLoaded: boolean;
  mapZoom: number;
  mapCenter: { lat: number; lng: number };
  onMapLoad: (mapInstance: any) => void;
  handleMapClick: (e: any) => void;
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
  newPinData: any;
  setNewPinData: (data: any) => void;
  handleAddPin: () => void;
  addPinMutation: any;
  categories: any[];
  mapStyles?: any[];
  search: string;
  hotspots?: {lat: number, lng: number, intensity: number, color: string}[];
}

// Component to handle map center/zoom updates and clicks
const MapController = ({ center, zoom, onClick, onMapLoad }: any) => {
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
      onClick({ latLng: { lat: () => e.latlng.lat, lng: () => e.latlng.lng } });
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
  search,
  hotspots = []
}) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const isValidCoords = (lat: any, lng: any) => {
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
            <div className="p-1 max-w-[200px]">
              <h3 className="font-bold text-slate-900 text-sm mb-1 m-0">{selectedPin.title}</h3>
              <p className="text-xs text-slate-500 mb-2 m-0">{selectedPin.address}</p>
              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg m-0">{selectedPin.notes}</p>
              
              {/* SAHA MODU - DİNAMİK ONAYLI CHECK-İN */}
              {(() => {
                let distance = null;
                if (userLocation && isValidCoords(userLocation.lat, userLocation.lng)) {
                  distance = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(selectedPin.lat, selectedPin.lng));
                }
                const isNear = distance !== null && distance <= 100; // 100 Metre yarıçapı

                return (
                  <div className="mt-3 pt-3 border-t border-slate-100">
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
    </div>
  );
};