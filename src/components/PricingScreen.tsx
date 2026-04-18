import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LogOut, ShieldCheck, Zap, CheckCircle2, Building2, Crown, Sparkles, ArrowRight, Briefcase } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';

export const PricingScreen = () => {
  const { subscribe, logout, isSubscribing } = useAuth();
  
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_numeric', { ascending: true });
      
      if (data) {
        setPackages(data);
        const masterOptions = data.filter(p => p.tier !== 'free');
        if (masterOptions.length > 1) {
          setSelectedDuration(masterOptions[1]);
        } else if (masterOptions.length > 0) {
          setSelectedDuration(masterOptions[0]);
        }
      }
      setLoading(false);
    };
    fetchPackages();
  }, []);

  const handleFreeChoice = async () => {
    // subscribe fonksiyonu artık boolean dönecek şekilde AuthContext'te güncellendi
    const success = await subscribe('free');
    if (success) {
      console.log('Free plan activated, redirecting...');
      // AuthContext içindeki invalidateQueries otomatik olarak App.tsx'i tetikleyecektir.
    }
  };

  const freePkg = packages.find(p => p.tier === 'free');
  const masterOptions = packages.filter(p => p.tier !== 'free');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-100">
      <header className="px-6 py-6 flex justify-between items-center bg-white border-b border-slate-100 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Building2 size={20} className="text-white" />
          </div>
          <span className="text-2xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100] tracking-wide">Portfy</span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
          <LogOut size={16} /> <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="bg-slate-900 px-6 py-16 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20 mb-2">
              <Sparkles size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Geleceğin Emlak Asistanı</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Karmaşık paketler yok. Sadece ihtiyacın olan süreyi seç.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto">
              Ücretsiz paketle hemen başla veya Master paketle yapay zekanın tam gücünü eline alıp bölgeni domine et.
            </motion.p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* ÜCRETSİZ PLAN */}
              {freePkg && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col relative">
                  <div className="space-y-4 mb-8">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                      <Briefcase size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{freePkg.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900">{freePkg.price_text}</span>
                      <span className="text-slate-400 font-medium">{freePkg.interval}</span>
                    </div>
                    <p className="text-slate-500 font-medium">{freePkg.description}</p>
                  </div>
                  
                  <ul className="space-y-4 flex-1 mb-8">
                    {(freePkg.features || []).map((f: string, i: number) => (
                      <FeatureItem key={i} text={f} />
                    ))}
                  </ul>
                  
                  <button onClick={handleFreeChoice} disabled={isSubscribing} className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto">
                    {isSubscribing ? 'Hazırlanıyor...' : 'Ücretsiz Devam Et'} <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {/* MASTER PLAN */}
              {selectedDuration && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-slate-900/40 flex flex-col relative border border-slate-800">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg z-20 whitespace-nowrap">
                    <Crown size={14} /> Sınırları Kaldır
                  </div>

                  <div className="space-y-4 mb-6 mt-2">
                    <h3 className="text-2xl font-bold text-white">Master</h3>
                    <p className="text-slate-400 font-medium">İhtiyacın olan tüm özellikler tek pakette. Sadece süreyi seç.</p>
                  </div>

                  <div className={`grid grid-cols-2 ${masterOptions.length > 2 ? 'lg:grid-cols-4' : ''} gap-2 bg-slate-800 p-1.5 rounded-2xl mb-8`}>
                    {masterOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedDuration(opt)}
                        className={`relative py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${selectedDuration.id === opt.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                      >
                        {opt.badge && selectedDuration.id !== opt.id && (
                          <span className="absolute -top-2.5 right-0 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full z-10">{opt.badge}</span>
                        )}
                        <span>{opt.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-baseline gap-1 mb-8 transition-all">
                    <span className="text-5xl font-black text-white">{selectedDuration.price_text}</span>
                    <span className="text-slate-400 font-medium">{selectedDuration.interval}</span>
                  </div>
                  
                  <ul className="space-y-4 flex-1 mb-8">
                    <li className="flex items-center gap-3 text-sm font-bold text-white border-b border-slate-800 pb-3 mb-1">
                      <Sparkles size={18} className="text-indigo-400" /> Başlangıçtaki her şey, artı:
                    </li>
                    {(selectedDuration.features || []).map((f: string, i: number) => (
                      <FeatureItem key={i} text={f} dark />
                    ))}
                  </ul>
                  
                  <button onClick={() => subscribe('trial')} disabled={isSubscribing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto">
                    7 Gün Ücretsiz Dene <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const FeatureItem = ({ text, dark = false }: { text: string, dark?: boolean }) => (
  <li className={`flex items-start gap-3 text-sm font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
    <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${dark ? 'text-indigo-400' : 'text-emerald-500'}`} />
    <span>{text}</span>
  </li>
);

export default PricingScreen;