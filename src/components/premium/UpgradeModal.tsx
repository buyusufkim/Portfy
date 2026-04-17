import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (tier: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [masterOptions, setMasterOptions] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waNumber, setWaNumber] = useState('905000000000');

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: pkgData } = await supabase.from('subscription_packages').select('*').eq('is_active', true).neq('tier', 'free').order('price_numeric', { ascending: true });
      if (pkgData && pkgData.length > 0) {
        setMasterOptions(pkgData);
        setSelectedDuration(pkgData.length > 1 ? pkgData[1] : pkgData[0]);
      }
      const { data: setData } = await supabase.from('system_settings').select('whatsapp_number').eq('id', 1).single();
      if (setData) setWaNumber(setData.whatsapp_number);
      
      setLoading(false);
    };
    fetchData();
  }, [isOpen]);

  const handleActivationRequest = () => {
    if (!selectedDuration) return;
    const userName = profile?.display_name || 'Bilinmeyen Kullanıcı';
    const currentPlan = profile?.tier === 'free' ? 'Başlangıç (Ücretsiz)' : 'Deneme Sürümü / Diğer';
    
    const text = `Merhaba Portfy! Aktivasyon talebinde bulunmak istiyorum. 🚀\n\n👤 *İsim Soyisim:* ${userName}\n📊 *Mevcut Paket:* ${currentPlan}\n✨ *Geçilmek İstenen Paket:* ${selectedDuration.name} Master\n💰 *Paket Ücreti:* ${selectedDuration.price_text} ${selectedDuration.interval}`;
    
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-slate-50 rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh]">
        <div className="bg-slate-900 p-8 md:p-12 md:w-5/12 flex flex-col justify-center relative overflow-hidden shrink-0">
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400"><Crown size={32} /></div>
            <h2 className="text-3xl font-black text-white leading-tight">Sınırları Kaldırma Zamanı</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Ücretsiz limitlere takıldın. Portfy'ın tüm yapay zeka gücünü açmak için Master'a geç.</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-screen filter blur-[80px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px]" />
          </div>
        </div>

        <div className="bg-white p-8 md:p-12 md:w-7/12 flex flex-col relative overflow-y-auto">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900">Süreyi Seç</h3>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3 mb-10">
              {masterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDuration(opt)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedDuration?.id === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className={`font-bold ${selectedDuration?.id === opt.id ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.name} Master</span>
                    {opt.badge && <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{opt.badge}</span>}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-xl font-black ${selectedDuration?.id === opt.id ? 'text-indigo-600' : 'text-slate-900'}`}>{opt.price_text}</span>
                    <span className="text-xs text-slate-400 font-medium">{opt.interval}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="mt-auto pt-4">
            <button 
              onClick={handleActivationRequest}
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 disabled:opacity-50"
            >
              Aktivasyon Talebi Gönder <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradeModal;