import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Layers, Crosshair, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin as MapPinType } from '../types';

// Leaflet Default Icon Fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createNeonIcon = (color: string) => {
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="background-color: ${color}; color: white;" class="neon-pin-inner shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div style="border-color: ${color};" class="neon-pin-pulse"></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

interface RegionMapProps {
  mapZoom: number;
  mapCenter: { lat: number; lng: number };
  handleMapClick: (lat: number, lng: number) => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
  setMapZoom: (val: number) => void;
  handleLocateMe: () => void;
  setShowAddPin: (val: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  filteredPins: MapPinType[];
  getCategoryColor: (type: string) => string;
  setSelectedPin: (pin: MapPinType | null) => void;
  selectedPin: MapPinType | null;
  showAddPin: boolean;
  newPinData: any;
  setNewPinData: (data: any) => void;
  handleAddPin: () => void;
  addPinMutation: any;
  categories: any[];
  search: string;
}

export const RegionMap: React.FC<RegionMapProps> = (props) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Haritanın Başlatılması (Sadece bir kez çalışır)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Saf Leaflet haritası oluştur
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      center: [props.mapCenter.lat, props.mapCenter.lng],
      zoom: props.mapZoom
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e) => {
      props.handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Harita Altlığı Değişimi (Dark Matter / 3D)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);

    const url = props.is3D 
      ? "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" 
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(url, {
      subdomains: props.is3D ? ['mt0','mt1','mt2','mt3'] : 'abcd',
      attribution: '&copy; CARTO'
    }).addTo(map);
  }, [props.is3D]);

  // 3. Isı Çemberi (Heatmap) Güncellemesi
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (circleRef.current) map.removeLayer(circleRef.current);

    circleRef.current = L.circle([props.mapCenter.lat, props.mapCenter.lng], {
      radius: 1500,
      fillColor: '#f97316',
      color: '#f97316',
      weight: 1,
      fillOpacity: 0.05,
      dashArray: '4, 8'
    }).addTo(map);
  }, [props.mapCenter.lat, props.mapCenter.lng]);

  // 4. Pinlerin ve Aramanın Yönetimi
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;

    // Mevcut pinleri temizle
    layerGroup.clearLayers();

    // Yeni pinleri ekle
    props.filteredPins.forEach(pin => {
      if (!pin.lat || !pin.lng) return;
      
      const catColor = props.getCategoryColor(pin.type);
      const catLabel = props.categories.find(c => c.id === pin.type)?.label || 'Diğer';

      const marker = L.marker([pin.lat, pin.lng], {
        icon: createNeonIcon(catColor)
      });

      marker.on('click', () => {
        props.setSelectedPin(pin);
      });

      // Saf HTML Popup Tasarımı (Index.css'den bağımsız çalışır)
      const popupHtml = `
        <div class="custom-popup" style="background: rgba(15, 23, 42, 0.95); padding: 16px; border-radius: 16px; color: white; border: 1px solid rgba(255,255,255,0.1); min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${catColor};"></div>
            <span style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">${catLabel}</span>
          </div>
          <h3 style="font-weight: bold; font-size: 15px; margin: 0 0 4px 0;">${pin.title}</h3>
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0; line-height: 1.4;">${pin.address}</p>
          ${pin.notes ? `<div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px;"><p style="font-size: 12px; color: #cbd5e1; font-style: italic; margin: 0;">"${pin.notes}"</p></div>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, className: 'custom-leaflet-popup' });
      marker.addTo(layerGroup);
    });

    // Arama odaklanması
    if (props.filteredPins.length > 0 && props.search.trim() !== '') {
      const validPins = props.filteredPins.filter(p => p.lat && p.lng);
      if (validPins.length > 0) {
        const bounds = L.latLngBounds(validPins.map(p => [p.lat, p.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        }
      }
    }
  }, [props.filteredPins, props.search, props.categories]);

  // 5. Merkez Değişimi (Konumumu Bul tıklandığında)
  useEffect(() => {
    if (mapInstanceRef.current && props.userLocation) {
      mapInstanceRef.current.flyTo([props.userLocation.lat, props.userLocation.lng], 17);
    }
  }, [props.userLocation]);

  return (
    <div className="w-full h-full relative z-0">
      <div className="absolute right-4 top-40 flex flex-col gap-2 z-[1000] pointer-events-none">
        <button 
          onClick={() => props.setShowAddPin(true)}
          className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-2xl pointer-events-auto hover:bg-orange-700 transition-all mb-2"
        >
          <Plus size={32} />
        </button>
        <button 
          onClick={() => props.setIs3D(!props.is3D)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl pointer-events-auto transition-all ${props.is3D ? 'bg-orange-500 text-white' : 'bg-slate-900/90 backdrop-blur-md text-slate-300'}`}
        >
          <Layers size={24} />
        </button>
        <button 
          onClick={props.handleLocateMe}
          className="w-12 h-12 rounded-2xl bg-slate-900/90 backdrop-blur-md text-slate-300 pointer-events-auto flex items-center justify-center shadow-xl hover:text-white transition-all"
        >
          <Crosshair size={24} />
        </button>
      </div>

      {/* SAF HARİTA KONTEYNERİ */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#020617]" />

      <AnimatePresence>
        {props.showAddPin && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 pointer-events-none pb-24 sm:pb-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Haritaya Ekle</h3>
                <button onClick={() => props.setShowAddPin(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Başlık / İsim</label>
                  <input 
                    type="text" value={props.newPinData.title}
                    onChange={(e) => props.setNewPinData({...props.newPinData, title: e.target.value})}
                    placeholder="Örn: Ahmet Bakkal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
                  <select 
                    value={props.newPinData.type}
                    onChange={(e) => props.setNewPinData({...props.newPinData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    {(props.categories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Adres</label>
                  <input 
                    type="text" value={props.newPinData.address}
                    onChange={(e) => props.setNewPinData({...props.newPinData, address: e.target.value})}
                    placeholder="Örn: Atatürk Cad. No:12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notlar</label>
                  <textarea 
                    value={props.newPinData.notes}
                    onChange={(e) => props.setNewPinData({...props.newPinData, notes: e.target.value})}
                    placeholder="Bölge hakkında notlar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none h-24"
                  />
                </div>

                <button 
                  onClick={props.handleAddPin}
                  disabled={!props.newPinData.title.trim() || props.addPinMutation.isPending}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-4 disabled:opacity-50 flex justify-center items-center"
                >
                  {props.addPinMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};