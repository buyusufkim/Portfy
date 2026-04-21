import React from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Plus, Layers, Crosshair, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin as MapPinType } from '../types';

interface RegionMapProps {
  isLoaded: boolean;
  mapZoom: number;
  mapCenter: { lat: number; lng: number };
  onMapLoad: (mapInstance: google.maps.Map) => void;
  handleMapClick: (e: google.maps.MapMouseEvent) => void;
  is3D: boolean;
  setIs3D: (val: boolean) => void;
  setMapZoom: (val: number) => void;
  handleLocateMe: () => void;
  setShowAddPin: (val: boolean) => void;
  userLocation: { lat: number; lng: number } | null;
  filteredPins: MapPinType[];
  getPinIcon: (type: string) => string; // DOĞRU PROPS İSMİ BURAYA EKLENDİ
  setSelectedPin: (pin: MapPinType | null) => void;
  selectedPin: MapPinType | null;
  showAddPin: boolean;
  newPinData: any;
  setNewPinData: (data: any) => void;
  handleAddPin: () => void;
  addPinMutation: any;
  categories: any[];
  mapStyles: any[];
  search: string;
}

export const RegionMap: React.FC<RegionMapProps> = ({
  isLoaded,
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
  getPinIcon, // DOĞRU PROPS
  setSelectedPin,
  selectedPin,
  showAddPin,
  newPinData,
  setNewPinData,
  handleAddPin,
  addPinMutation,
  categories,
  mapStyles,
  search
}) => {
  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#020617]">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Map Controls - Floating right */}
      <div className="absolute right-4 top-40 flex flex-col gap-2 z-10">
        <button 
          onClick={() => setShowAddPin(true)}
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
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${is3D ? 'bg-orange-500 text-white' : 'bg-slate-900/90 backdrop-blur-md text-slate-300 hover:text-white'}`}
          title="3D Görünüm"
        >
          <Layers size={24} />
        </button>
        <button 
          onClick={handleLocateMe}
          className="w-12 h-12 rounded-2xl bg-slate-900/90 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-xl hover:text-white transition-all"
          title="Konumumu Bul"
        >
          <Crosshair size={24} />
        </button>
      </div>

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
              url: getPinIcon('user_location') || '', 
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 40)
            }}
            zIndex={100}
          />
        )}

        {filteredPins.map((pin: MapPinType) => {
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
              animation={isHighlighted ? window.google.maps.Animation.DROP : undefined}
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
            animation={window.google.maps.Animation.BOUNCE}
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
    </div>
  );
};