import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, BedDouble, Bath, Maximize, Phone, Mail, Award, CheckCircle2, Building2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Property, UserProfile } from '../types';

export const PublicPresentation = ({ propertyId }: { propertyId: string }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresentationData = async () => {
      // İlanı Çek
      const { data: propData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propData) {
        setProperty(propData);
        // İlanın Sahibini (Danışmanı) Çek
        const { data: agentData } = await supabase
          .from('profiles')
          .select('*')
          .eq('uid', propData.agent_id)
          .single();
        if (agentData) setAgent(agentData);
      }
      setLoading(false);
    };

    if (propertyId) fetchPresentationData();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Building2 size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">İlan Bulunamadı</h1>
        <p className="text-slate-500">Bu sunum yayından kaldırılmış veya bağlantı hatalı olabilir.</p>
      </div>
    );
  }

  // Güvenli varsayılan değerler
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'];
  const agentName = agent?.display_name || 'Gayrimenkul Danışmanı';
  const agentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent?.uid || 'agent'}`;
  const whatsappMsg = encodeURIComponent(`Merhaba ${agentName}, size ait olan "${property.title}" başlıklı ilanınız için ulaşıyorum. Detaylı bilgi alabilir miyim?`);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Üst Kısım: Marka ve İletişim */}
      <header className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-lg flex items-center justify-center shadow-md">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-lg font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100]">
            Portfy
          </span>
        </div>
        <a 
          href={`https://wa.me/905550000000?text=${whatsappMsg}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
        >
          <Phone size={14} /> İletişime Geç
        </a>
      </header>

      {/* Hero Görseli */}
      <div className="relative w-full h-[40vh] md:h-[60vh] bg-slate-900">
        <img src={images[0]} alt={property.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold mb-4">
              <MapPin size={12} /> {property.location || 'Konum Belirtilmemiş'}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">{property.title}</h1>
            <div className="text-4xl md:text-5xl font-black text-orange-500">
              {property.price.toLocaleString('tr-TR')}₺
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Sol Kolon: Detaylar */}
        <div className="md:col-span-2 space-y-12">
          
          {/* Hızlı Özellikler */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <BedDouble size={24} className="text-orange-500" />
              <span className="text-sm font-bold text-slate-900">{property.features?.rooms || 'Belirtilmemiş'}</span>
              <span className="text-xs text-slate-500">Oda Sayısı</span>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <Maximize size={24} className="text-orange-500" />
              <span className="text-sm font-bold text-slate-900">{property.features?.sqm || '-'} m²</span>
              <span className="text-xs text-slate-500">Brüt Alan</span>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
              <Building2 size={24} className="text-orange-500" />
              <span className="text-sm font-bold text-slate-900">{property.features?.floor || '-'}</span>
              <span className="text-xs text-slate-500">Bulunduğu Kat</span>
            </div>
          </div>

          {/* Açıklama (AI Etkisi) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={64} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Gayrimenkul Hakkında</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {property.description || 'Bu portföy için henüz detaylı bir açıklama girilmemiştir. Lütfen danışmanınızla iletişime geçin.'}
            </p>
          </div>

        </div>

        {/* Sağ Kolon: Danışman Kartı */}
        <div>
          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-900/20 sticky top-24 text-center">
            <div className="w-24 h-24 mx-auto bg-slate-800 rounded-full border-4 border-slate-700 overflow-hidden mb-6">
              <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{agentName}</h3>
            <p className="text-sm text-slate-400 mb-6 flex items-center justify-center gap-1">
              <Award size={14} className="text-orange-500" /> Lisanslı Danışman
            </p>

            <div className="space-y-3">
              <a 
                href={`https://wa.me/905550000000?text=${whatsappMsg}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Phone size={18} /> WhatsApp'tan Ulaş
              </a>
              <a 
                href={`mailto:${agent?.email || ''}`}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={18} /> E-Posta Gönder
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-center gap-1">
              <CheckCircle2 size={14} className="text-slate-400" />
              Bu sunum <span className="font-bold text-slate-400">Portfy Master</span> ile oluşturulmuştur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};