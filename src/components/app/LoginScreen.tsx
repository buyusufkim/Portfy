import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../AuthContext';

export const LoginScreen = () => {
  const { login, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, displayName);
        alert('Kayıt başarılı! Lütfen giriş yapın.');
        setIsRegistering(false);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      let errorMsg = err.message || 'Bir hata oluştu.';
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
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/20 relative z-10 mx-auto"
      >
        <Building2 size={48} className="text-white" />
      </motion.div>
      <h1 className="text-5xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100] mb-2 tracking-tight relative z-10">Portfy</h1>
      <p className="text-slate-400 mb-8 text-sm max-w-[280px] relative z-10 mx-auto">
        Seni çalıştıran danışman sistemi.
      </p>
      
      <div className="w-full max-w-xs flex flex-col gap-4 relative z-10 mx-auto">
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Ad Soyad" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          )}
          <input 
            type="email" 
            placeholder="E-posta" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
          <input 
            type="password" 
            placeholder="Şifre" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
          {error && <p className="text-red-400 text-xs text-left">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl disabled:opacity-50"
          >
            {loading ? 'Bekleyin...' : (isRegistering ? 'Kayıt Ol' : 'E-posta ile Giriş Yap')}
          </button>
        </form>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-slate-500 text-xs font-medium">VEYA</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button 
          onClick={login}
          className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google ile Devam Et
        </button>

        <button 
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          className="text-slate-400 text-sm mt-2 hover:text-white transition-colors"
        >
          {isRegistering ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
        </button>

        {localStorage.getItem('oauth_success') && (
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform border border-slate-700 mt-4"
          >
            <RefreshCw size={16} />
            Giriş Yaptım, Sayfayı Yenile
          </button>
        )}
      </div>

      <p className="mt-12 text-slate-500 text-[10px] uppercase tracking-widest font-bold relative z-10">
        Bölge Hakimiyetini Dijitalleştir
      </p>
    </div>
  );
};
