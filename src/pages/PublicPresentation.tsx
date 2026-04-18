import React, { useEffect, useState } from 'react';
import { 
  MapPin, BedDouble, Maximize, Phone, Mail, Award, 
  CheckCircle2, Building2, Sparkles, Image as ImageIcon,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PublicPresentation = ({ propertyId }: { propertyId: string }) => {
  const [property, setProperty] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresentationData = async () => {
      try {
        setLoading(true);
        // İlanı Çek
        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();

        if (propError) throw propError;

        if (propData) {
          setProperty(propData);
          // İlan sahibini çek
          if (propData.agent_id) {
            const { data: agentData } = await supabase
              .from('profiles')
              .select('*')
              .eq('uid', propData.agent_id)
              .maybeSingle();
            if (agentData) setAgent(agentData);
          }
        }
      } catch (err: any) {
        console.error("Veri çekme hatası:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) fetchPresentationData();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Building2 size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">İlan Bulunamadı</h1>
        <p className="text-slate-500 mb-4">Bu sunum yayından kaldırılmış veya bağlantı hatalı olabilir.</p>
        {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 max-w-md">{error}</p>}
      </div>
    );
  }

  // --- GÜVENLİK KALKANI: Tüm verileri çökme ihtimaline karşı sterilize ediyoruz ---
  const price = Number(property?.price) || 0;
  const title = property?.title || 'İsimsiz İlan';
  const description = property?.description || 'Bu portföy için henüz detaylı bir açıklama girilmemiştir.';
  
  const getValidImageUrl = (url?: any) => {
    if (!url || typeof url !== 'string') return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const imageArray = Array.isArray(property?.images) ? property.images : (property?.images ? [property.images] : []);
  const images = imageArray.length > 0 ? imageArray.map(getValidImageUrl) : [getValidImageUrl(null)];
  const coverImage = images[images.length - 1] || images[0];

  const addressObj = property?.address || {};
  const locationStr = typeof addressObj === 'string' 
    ? addressObj 
    : [addressObj.neighborhood, addressObj.district, addressObj.city].filter(Boolean).join(', ') || property?.location || 'Konum Belirtilmemiş';

  const detailsObj = property?.details || {};
  const rooms = detailsObj.rooms || '-';
  const brutM2 = detailsObj.brut_m2 || '-';
  const floor = detailsObj.floor || '-';

  const agentName = agent?.display_name || 'Gayrimenkul Danışmanı';
  const agentAvatar = agent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent?.uid || 'agent'}`;
  const agentPhone = agent?.phone || '';
  const agentEmail = agent?.email || '';

  const whatsappMsg = encodeURIComponent(`Merhaba ${agentName}, size ait olan "${title}" başlıklı ilanınız için ulaşıyorum. Detaylı bilgi alabilir miyim?`);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Tam Ekran Görsel Modalı */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-sm transition-all">
            <X size={24} />
          </button>
          <img src={selectedImage} alt="Büyük Görsel" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Üst Kısım: Marka ve İletişim */}
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-lg flex items-center justify-center shadow-md">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100]">
            Portfy
          </span>
        </div>
        <a 
          href={`tel:${agentPhone}`} 
          className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
        >
          <Phone size={16} /> Danışmanı Ara
        </a>
      </header>

      {/* Hero Görseli */}
      <div className="relative w-full h-[40vh] md:h-[60vh] bg-slate-900 overflow-hidden">
        <img src={coverImage} alt={title} className="w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold mb-4 border border-white/20 shadow-sm">
              <MapPin size={14} /> {locationStr}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">{title}</h1>
            <div className="text-4xl md:text-5xl font-black text-orange-500 drop-shadow-md">
              {price.toLocaleString('tr-TR')}₺
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Sol Kolon: Detaylar ve Galeri */}
        <div className="md:col-span-2 space-y-12">
          
          {/* Hızlı Özellikler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2 hover:border-orange-200 transition-colors">
              <BedDouble size={28} className="text-orange-500" />
              <span className="text-base font-bold text-slate-900">{rooms}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oda Sayısı</span>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2 hover:border-orange-200 transition-colors">
              <Maximize size={28} className="text-orange-500" />
              <span className="text-base font-bold text-slate-900">{brutM2} m²</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brüt Alan</span>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2 hover:border-orange-200 transition-colors">
              <Building2 size={28} className="text-orange-500" />
              <span className="text-base font-bold text-slate-900">{floor}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bulunduğu Kat</span>
            </div>
          </div>

          {/* Açıklama */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <Sparkles size={120} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="text-orange-500" size={24} /> Gayrimenkul Hakkında
            </h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-sm md:text-base relative z-10">
              {description}
            </div>
          </div>

          {/* Fotoğraf Galerisi */}
          {images.length > 0 && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <ImageIcon className="text-orange-500" size={24} /> Fotoğraf Galerisi
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img: string, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(img)}
                    className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group relative"
                  >
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors z-10 flex items-center justify-center">
                      <Maximize size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                    <img 
                      src={img} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={`Galeri ${idx + 1}`} 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sağ Kolon: Danışman Kartı */}
        <div>
          <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-900/20 sticky top-28 text-center border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-28 h-28 mx-auto bg-slate-800 rounded-full border-4 border-slate-700 overflow-hidden mb-6 relative z-10 shadow-xl">
              <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 relative z-10">{agentName}</h3>
            <p className="text-sm font-bold text-orange-500 mb-8 flex items-center justify-center gap-1.5 uppercase tracking-wider relative z-10">
              <Award size={16} /> Lisanslı Danışman
            </p>

            <div className="space-y-4 relative z-10">
              <a 
                href={`https://wa.me/${agentPhone}?text=${whatsappMsg}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Phone size={20} /> WhatsApp'tan Ulaş
              </a>
              <a 
                href={`mailto:${agentEmail}`}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <Mail size={20} /> E-Posta Gönder
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs font-bold text-slate-500 flex flex-col items-center justify-center gap-2 relative z-10">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-slate-400" />
                Bu sunum <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100]">Portfy Master</span> ile oluşturulmuştur.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};