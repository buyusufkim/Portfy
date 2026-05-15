import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle, Smartphone, ChevronDown, ChevronUp, Share2, Chrome } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { PortfyLogo } from '../PortfyLogo';

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const PWAInstallGuide = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as NavigatorWithStandalone).standalone === true;
    setIsStandalone(standalone);

    // Detect device
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
      setIsOpen(true);
    } else if (/android/.test(ua)) {
      setDeviceType('android');
      setIsOpen(true);
    } else {
      setDeviceType('desktop');
      setIsOpen(false);
    }
  }, []);

  if (isStandalone) return (
    <div className="mt-8 text-center opacity-50">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Uygulama Modunda Çalışıyor</p>
    </div>
  );

  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
              <Smartphone size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">Portfy’yi telefona kur</h3>
              <p className="text-[11px] text-slate-400">Ana ekrana ekle, uygulama gibi kullan.</p>
            </div>
          </div>
          {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-1 space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Portfy’yi App Store veya Play Store’a gerek kalmadan telefonunun ana ekranına ekleyebilirsin.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {/* iOS Section */}
                  {(deviceType === 'ios' || deviceType === 'desktop') && (
                    <div className={`p-4 rounded-2xl border ${deviceType === 'ios' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/40 border-slate-700/50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm">
                           <Share2 size={16} className="text-slate-700" />
                        </div>
                        <span className="text-xs font-bold text-white">iPhone / Safari</span>
                      </div>
                      <div className="space-y-2 ml-1">
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-indigo-400 font-bold shrink-0">1.</span>
                          <span>Safari üzerinden Portfy’yi aç.</span>
                        </div>
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-indigo-400 font-bold shrink-0">2.</span>
                          <span>Alttaki <b>Paylaş</b> (orta kare) butonuna dokun.</span>
                        </div>
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-indigo-400 font-bold shrink-0">3.</span>
                          <span>Listeyi kaydır ve <b>“Ana Ekrana Ekle”</b> seç.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Android Section */}
                  {(deviceType === 'android' || deviceType === 'desktop') && (
                    <div className={`p-4 rounded-2xl border ${deviceType === 'android' ? 'bg-teal-500/10 border-teal-500/30' : 'bg-slate-900/40 border-slate-700/50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center shadow-sm">
                           <Chrome size={16} className="text-slate-700" />
                        </div>
                        <span className="text-xs font-bold text-white">Android / Chrome</span>
                      </div>
                      <div className="space-y-2 ml-1">
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-teal-400 font-bold shrink-0">1.</span>
                          <span>Chrome üzerinden Portfy’yi aç.</span>
                        </div>
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-teal-400 font-bold shrink-0">2.</span>
                          <span>Sağ üstteki <b>üç noktaya</b> dokun.</span>
                        </div>
                        <div className="flex gap-2.5 text-[11px] text-slate-300">
                          <span className="text-teal-400 font-bold shrink-0">3.</span>
                          <span><b>“Uygulamayı yükle”</b> seçeneğine tıkla.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {deviceType === 'desktop' && (
                  <div className="text-center py-1">
                    <p className="text-[10px] text-slate-500 italic">Telefondan açarak bu adımları takip edebilirsin.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const LoginScreen = () => {
  const { login, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState(''); // Yeni: Telefon numarası state'i
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasOauthSuccess, setHasOauthSuccess] = useState(false);

  useEffect(() => {
    setHasOauthSuccess(localStorage.getItem('oauth_success') === 'true');
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        // Telefon numarasını fonksiyona iletiyoruz
        await registerWithEmail(email, password, displayName, phone);
        alert('Kayıt başarılı! Lütfen giriş yapın.');
        setIsRegistering(false);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: unknown) {
      console.error("Register Error:", err);
      let errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Password should be at least 6 characters')) {
        errorMsg = 'Şifre en az 6 karakter olmalıdır.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Bu e-posta adresi zaten kayıtlı.';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'Geçersiz e-posta veya şifre.';
      } else if (errorMsg.includes('Email not confirmed')) {
        errorMsg = 'Lütfen e-posta adresinizi onaylayın.';
      } else if (errorMsg.includes('rate limit')) {
        errorMsg = 'Çok fazla deneme yaptınız, lütfen daha sonra tekrar deneyin.';
      } else if (errorMsg.includes('Database error saving new user')) {
        errorMsg = 'Kayıt sırasında profil oluşturulamadı. Lütfen tekrar deneyin.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-8 text-center relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo area */}
        <div className="flex flex-col items-center mb-6">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/95 px-6 py-3 shadow-xl shadow-black/10 ring-1 ring-white/20 mb-6">
            <PortfyLogo className="h-9 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {isRegistering ? 'Portfy hesabını oluştur' : 'Portfy’ye giriş yap'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-[320px]">
             {isRegistering 
               ? 'Danışman sistemini birkaç saniyede başlat.' 
               : 'Günlük akışını, portföylerini ve CRM’ini tek yerden yönet.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6 sm:p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 text-left">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Ad Soyad</label>
                <input 
                  type="text" 
                  placeholder="örn. Can Yılmaz" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            )}
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">Telefon Numarası</label>
                <input 
                  type="tel" 
                  placeholder="örn. 05XX XXX XX XX" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">E-posta</label>
              <input 
                type="email" 
                placeholder="mavi@örnek.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1">Şifre</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 mt-1"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-rose-400 text-sm leading-snug">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? 'İşleniyor...' : (isRegistering ? 'Kayıt Ol' : 'E-posta ile Giriş Yap')}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-700/50"></div>
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">veya</span>
            <div className="flex-1 h-px bg-slate-700/50"></div>
          </div>

          <button 
            onClick={login}
            className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-md"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google ile Devam Et
          </button>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            {isRegistering ? (
              <span>Zaten hesabın var mı? <span className="text-indigo-400 font-medium">Giriş yap</span></span>
            ) : (
              <span>Hesabın yok mu? <span className="text-indigo-400 font-medium">Kayıt ol</span></span>
            )}
          </button>
        </div>

        {hasOauthSuccess && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => window.location.reload()}
            className="w-full max-w-sm mx-auto py-3.5 bg-slate-800 text-slate-300 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-95 transition-all border border-slate-700 mt-6"
          >
            <RefreshCw size={18} className="text-slate-400" />
            Giriş Yaptım, Sayfayı Yenile
          </motion.button>
        )}

        <PWAInstallGuide />
      </motion.div>

      <p className="fixed bottom-6 text-slate-500/40 text-[10px] uppercase tracking-widest font-bold z-10 hidden sm:block">
        Seni çalıştıran danışman sistemi
      </p>
    </div>
  );
};
