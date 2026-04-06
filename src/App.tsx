import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  BarChart3, 
  Plus, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Clock,
  X,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Map as MapIcon,
  LogOut,
  User as UserIcon,
  CreditCard,
  ShieldCheck,
  Briefcase,
  Home,
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity,
  Heart,
  Share2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Bell,
  Trash2,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
  Globe,
  Trophy,
  Zap,
  Circle,
  Check,
  Mic,
  Brain,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, Task, Building, Property, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult } from './types';
import { api } from './services/api';
import { locationService } from './services/locationService';
import { AuthProvider, useAuth } from './AuthContext';
import { BolgemView } from './components/BolgemView';
import { AdminPanel } from './components/AdminPanel';
import { useCategories } from './hooks/useCategories';
import { GoogleGenAI, Type } from "@google/genai";
import confetti from 'canvas-confetti';

// --- React Query Client ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 dakika cache
    },
  },
});

// --- Tasarım Sistemi Bileşenleri ---
const Badge = ({ children, variant = 'default', className = "" }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'info' | 'error', className?: string }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-orange-100 text-orange-900 border border-orange-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 p-4 ${className} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
  >
    {children}
  </div>
);

const StatCard: React.FC<{ id?: string, label: string, value: string | number, icon: React.ReactNode, trend?: string, color: 'orange' | 'purple' | 'emerald' | 'blue' }> = ({ id, label, value, icon, trend, color }) => {
  const colors = {
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <Card id={id} className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
    </Card>
  );
};

// --- Login Screen ---
const LoginScreen = () => {
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

// --- Intro Sequence Screen ---
const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Hoş Geldiniz!",
      desc: "Portfy AI ile emlak dünyasında yeni bir döneme başlıyorsunuz.",
      icon: <Sparkles size={48} className="text-orange-500" />
    },
    {
      title: "Bölgenize Hakim Olun",
      desc: "Harita üzerinden saha ziyaretlerinizi yönetin ve bölge verimliliğinizi artırın.",
      icon: <MapPin size={48} className="text-emerald-500" />
    },
    {
      title: "AI Koç Yanınızda",
      desc: "Davranışsal analizler ve günlük görevlerle performansınızı zirveye taşıyın.",
      icon: <Brain size={48} className="text-orange-600" />
    },
    {
      title: "Hadi Başlayalım!",
      desc: "Bugün hedeflerinize ulaşmak için ilk adımı atın.",
      icon: <Zap size={48} className="text-amber-500" />
    }
  ];

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden" 
      onClick={() => {
        if (step < steps.length - 1) setStep(step + 1);
        else onComplete();
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="space-y-8 z-10"
        >
          <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[32px] flex items-center justify-center mx-auto shadow-2xl border border-white/10">
            {steps[step].icon}
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
              {steps[step].title}
            </h2>
            <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
              {steps[step].desc}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-16 flex gap-2">
        {steps.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-orange-500' : 'w-2 bg-slate-700'}`} 
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-slate-500 text-xs flex items-center gap-2"
      >
        <span>Devam etmek için dokunun</span>
        <ChevronRight size={14} />
      </motion.div>
    </div>
  );
};

// --- App Tour Component ---
const AppTour = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const tourSteps = [
    {
      id: 'momentum-card',
      title: 'Momentum ve AI Koç',
      desc: 'Buradan günlük performansınızı ve yapay zeka destekli koç önerilerinizi takip edebilirsiniz.',
      position: 'bottom'
    },
    {
      id: 'points-card',
      title: 'Puan ve Seviye',
      desc: 'Tamamladığınız her görev size puan kazandırır ve seviyenizi yükseltir.',
      position: 'bottom'
    },
    {
      id: 'streak-card',
      title: 'Peş Peşe Seri',
      desc: 'Her gün giriş yaparak serinizi bozmayın ve ekstra çarpanlar kazanın!',
      position: 'bottom'
    },
    {
      id: 'daily-tasks',
      title: 'Günlük Görevler',
      desc: 'Sizin için özel hazırlanan ana ve akıllı görevleri buradan yönetin.',
      position: 'top'
    },
    {
      id: 'quick-add-fab',
      title: 'Hızlı Ekleme',
      desc: 'Yeni mülk, müşteri veya ziyaret kaydını buradan saniyeler içinde yapın.',
      position: 'left'
    },
    {
      id: window.innerWidth >= 768 ? 'desktop-sidebar' : 'bottom-nav',
      title: 'Navigasyon',
      desc: 'Dashboard, CRM, Harita ve Portföy arasında buradan geçiş yapın.',
      position: window.innerWidth >= 768 ? 'right' : 'top'
    }
  ];

  useEffect(() => {
    const updatePosition = () => {
      const el = document.getElementById(tourSteps[step].id);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetPos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    const el = document.getElementById(tourSteps[step].id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // true for capturing phase to catch all scrolls
    
    // Also update position periodically in case layout shifts (e.g. images loading)
    const interval = setInterval(updatePosition, 500);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(interval);
    };
  }, [step]);

  const nextStep = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay with hole */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-500" style={{
        clipPath: `polygon(0% 0%, 0% 100%, ${targetPos.left}px 100%, ${targetPos.left}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top}px, ${targetPos.left + targetPos.width}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px ${targetPos.top + targetPos.height}px, ${targetPos.left}px 100%, 100% 100%, 100% 0%)`
      }} />

      {/* Tooltip Bubble */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-w-[280px] pointer-events-auto"
        style={{
          top: tourSteps[step].position === 'bottom' ? targetPos.top + targetPos.height + 20 : 
               tourSteps[step].position === 'top' ? targetPos.top - 180 : 
               targetPos.top + targetPos.height / 2 - 90,
          left: window.innerWidth < 640 ? 20 : (
                tourSteps[step].position === 'left' ? targetPos.left - 300 : 
                tourSteps[step].position === 'right' ? targetPos.left + targetPos.width + 20 :
                Math.max(20, Math.min(window.innerWidth - 300, targetPos.left + targetPos.width / 2 - 140))
          ),
          width: window.innerWidth < 640 ? window.innerWidth - 40 : 280
        }}
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold text-sm">
            {step + 1}
          </div>
          <h3 className="font-bold text-slate-900 pr-4">{tourSteps[step].title}</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {tourSteps[step].desc}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {tourSteps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-4 bg-orange-500' : 'w-1 bg-slate-200'}`} />
            ))}
          </div>
          <button 
            onClick={nextStep}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-slate-200"
          >
            {step === tourSteps.length - 1 ? 'Anladım!' : 'Sıradaki'}
          </button>
        </div>
      </motion.div>

      {/* Highlight Border */}
      <motion.div 
        animate={{ 
          top: targetPos.top - 4, 
          left: targetPos.left - 4, 
          width: targetPos.width + 8, 
          height: targetPos.height + 8 
        }}
        className="absolute border-2 border-orange-500 rounded-[32px] shadow-[0_0_20px_rgba(249,115,22,0.4)] pointer-events-none"
      />
    </div>
  );
};

// --- Pricing Screen ---
const PricingScreen = () => {
  const { subscribe, logout, profile } = useAuth();
  
  // Safety check: if we are in a popup, try to signal success and close
  useEffect(() => {
    const isPopup = window.location.search.includes('popup=true') || 
                   window.location.hash.includes('access_token=') ||
                   window.name === 'oauth_popup';
    
    if (isPopup) {
      localStorage.setItem('oauth_success', Date.now().toString());
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
      }
      setTimeout(() => window.close(), 1000);
    }
  }, []);

  const plans = [
    { id: '1-month', name: '1 Aylık', price: '₺299', months: 1 },
    { id: '3-month', name: '3 Aylık', price: '₺799', months: 3, popular: true },
    { id: '6-month', name: '6 Aylık', price: '₺1.499', months: 6 },
    { id: '12-month', name: '12 Aylık', price: '₺2.499', months: 12 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Üyelik Planları</h1>
        <button onClick={logout} className="p-2 text-slate-400"><LogOut size={20} /></button>
      </div>
      
      <div className="bg-orange-600 rounded-[32px] p-6 text-white mb-8 shadow-xl shadow-orange-200">
        <ShieldCheck size={32} className="mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Profesyonel Araçlara Erişin</h2>
        <p className="text-orange-100 text-sm leading-relaxed">
          Saha takibi, CRM ve performans analizlerini kullanmak için bir üyelik planı seçin.
        </p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <button 
            key={plan.id}
            onClick={() => subscribe(plan.id as any)}
            className={`w-full p-5 rounded-[28px] border-2 text-left transition-all relative overflow-hidden ${
              plan.popular ? 'border-orange-600 bg-white shadow-lg' : 'border-slate-100 bg-white'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                En Popüler
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Tüm özelliklere sınırsız erişim</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">{plan.price}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tek Ödeme</div>
              </div>
            </div>
          </button>
        ))}

        <button 
          onClick={() => subscribe('trial')}
          className="w-full mt-4 p-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
        >
          15 Gün Ücretsiz Dene
        </button>
      </div>

      <p className="text-center text-slate-400 text-[10px] mt-8 px-8">
        Ödeme işlemleri güvenli altyapı üzerinden gerçekleştirilir. Üyeliğiniz anında aktif olur.
      </p>
    </div>
  );
};

// --- Portfolio Components ---
const PropertyCard: React.FC<{ property: Property, onClick: () => void }> = ({ property, onClick }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card className="overflow-hidden p-0 group transition-all" onClick={onClick}>
      <div className="relative h-40 bg-slate-100">
        <img 
          src={property.images[0] || `https://picsum.photos/seed/${property.id}/400/300`} 
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge variant={property.status === 'Yayında' ? 'success' : 'info'}>{property.status}</Badge>
          {property.marketAnalysis?.status === 'Fırsat' && (
            <div className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest">Fırsat</div>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Activity size={12} className={getHealthColor(property.healthScore)} />
            <span className={`text-[10px] font-bold ${getHealthColor(property.healthScore)}`}>%{property.healthScore}</span>
          </div>
          <div className="bg-orange-600/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-white">
            <TrendingUp size={10} />
            <span className="text-[10px] font-bold">%{Math.round((property.saleProbability || 0.5) * 100)} Satış</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 flex-1">{property.title}</h3>
          <span className="text-orange-600 font-bold text-sm ml-2">₺{property.price.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-medium">
          <MapPin size={12} />
          <span>{property.address.district}, {property.address.city}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Home size={12} />
              <span>{property.details.rooms}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Briefcase size={12} />
              <span>{property.details.brutM2}m²</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-slate-400">
              Gelir: ₺{(property.price * property.commissionRate / 100).toLocaleString()}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${property.title}\nFiyat: ₺${property.price.toLocaleString()}\nKonum: ${property.address.district}, ${property.address.city}\nDetaylar: ${property.details.rooms}, ${property.details.brutM2}m²`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors ml-2"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const PipelineColumn: React.FC<{ title: string, properties: Property[], status: string, onPropertyClick: (p: Property) => void }> = ({ title, properties, status, onPropertyClick }) => {
  const totalRevenue = properties.reduce((acc, p) => acc + (p.price * p.commissionRate / 100), 0);
  
  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{properties.length}</span>
        </div>
        <span className="text-[10px] font-bold text-orange-600">₺{totalRevenue.toLocaleString()}</span>
      </div>
      <div className="flex flex-col gap-3 h-full pb-4">
        {properties.map(p => (
          <PropertyCard key={p.id} property={p} onClick={() => onPropertyClick(p)} />
        ))}
        {properties.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl h-32 flex items-center justify-center text-slate-300 text-xs font-medium">
            Portföy Yok
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Content ---
  const NotesView = () => {
    const [showAddNote, setShowAddNote] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const queryClient = useQueryClient();

    const { data: notes = [], isLoading: notesLoading } = useQuery({
      queryKey: ['notes'],
      queryFn: api.getNotes
    });

    const { data: personalTasks = [], isLoading: tasksLoading } = useQuery({
      queryKey: ['personalTasks'],
      queryFn: api.getPersonalTasks
    });

    const addNoteMutation = useMutation({
      mutationFn: api.addNote,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        setShowAddNote(false);
      }
    });

    const addPersonalTaskMutation = useMutation({
      mutationFn: api.addPersonalTask,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['personalTasks'] });
        setShowAddTask(false);
      }
    });

    const toggleTaskMutation = useMutation({
      mutationFn: ({ id, isCompleted }: { id: string, isCompleted: boolean }) => api.togglePersonalTask(id, isCompleted),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['personalTasks'] });
        if (variables.isCompleted) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ea580c', '#f97316', '#fb923c']
          });
        }
      }
    });

    const deleteNoteMutation = useMutation({
      mutationFn: api.deleteNote,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
    });

    const deletePersonalTaskMutation = useMutation({
      mutationFn: api.deletePersonalTask,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalTasks'] })
    });

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-8 pb-32"
      >
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notlar & Görevler</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddTask(true)}
              className="p-3 bg-slate-100 rounded-2xl text-slate-600"
            >
              <CheckCircle2 size={20} />
            </button>
            <button 
              onClick={() => setShowAddNote(true)}
              className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        {/* Personal Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Yapılacaklar</h2>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
              {personalTasks.filter((t: any) => !t.isCompleted).length} Bekliyor
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {personalTasks.length === 0 ? (
                <motion.p 
                  key="empty-tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-400 text-sm italic"
                >
                  Henüz bir görev eklenmedi.
                </motion.p>
              ) : personalTasks.map((task: any) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Card className={`flex items-center justify-between p-4 transition-all duration-300 ${task.isCompleted ? 'bg-slate-50/50 border-slate-100' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleTaskMutation.mutate({ id: task.id, isCompleted: !task.isCompleted })}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}
                      >
                        {task.isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check size={14} />
                          </motion.div>
                        )}
                      </motion.button>
                      <div className="relative">
                        <span className={`text-sm font-medium transition-all duration-300 ${task.isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                        {task.isCompleted && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className="absolute left-0 top-1/2 h-[1px] bg-slate-300 -translate-y-1/2"
                          />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deletePersonalTaskMutation.mutate(task.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Notes Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Notlarım</h2>
          <div className="grid grid-cols-1 gap-4">
            {notes.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm italic">Henüz bir not eklenmedi.</p>
            ) : notes.map((note: any) => (
              <Card key={note.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-900">{note.title}</h3>
                  <button 
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="text-[10px] text-slate-400 font-medium">
                  {new Date(note.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Add Note Modal */}
        <AnimatePresence>
          {showAddNote && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                onClick={() => setShowAddNote(false)}
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-h-[90vh] overflow-y-auto"
              >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
                <h3 className="text-xl font-bold text-slate-900 mb-6">Yeni Not Ekle</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addNoteMutation.mutate({
                    title: formData.get('title') as string,
                    content: formData.get('content') as string
                  });
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Başlık</label>
                    <input name="title" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="Not başlığı..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">İçerik</label>
                    <textarea name="content" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm min-h-[150px] outline-none focus:ring-2 focus:ring-orange-500" placeholder="Notunuzu buraya yazın..." />
                  </div>
                  <button type="submit" disabled={addNoteMutation.isPending} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all">
                    {addNoteMutation.isPending ? 'Kaydediliyor...' : 'Notu Kaydet'}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Add Task Modal */}
        <AnimatePresence>
          {showAddTask && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                onClick={() => setShowAddTask(false)}
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70]"
              >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
                <h3 className="text-xl font-bold text-slate-900 mb-6">Yeni Görev Ekle</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addPersonalTaskMutation.mutate({
                    title: formData.get('title') as string,
                    isCompleted: false,
                    priority: 'medium'
                  });
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Görev Tanımı</label>
                    <input name="title" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ne yapılması gerekiyor?" />
                  </div>
                  <button type="submit" disabled={addPersonalTaskMutation.isPending} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all">
                    {addPersonalTaskMutation.isPending ? 'Ekleniyor...' : 'Görevi Ekle'}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };



  const RegionSetupModal = ({ profile, onComplete }: { profile: UserProfile, onComplete: () => void }) => {
  const { updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const [region, setRegion] = useState({
    city: 'İstanbul',
    district: '',
    neighborhoods: [] as string[]
  });

  const cities = locationService.getCities();
  const districts = region.city ? locationService.getDistricts(region.city) : [];
  const neighborhoods = (region.city && region.district) ? locationService.getNeighborhoods(region.city, region.district) : [];

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!region.city || !region.district || region.neighborhoods.length === 0) return;
    setIsSaving(true);
    try {
      await updateProfileData({ region });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900 z-[200] flex items-center justify-center p-6"
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[40px] p-8 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-4">
            <MapPin size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Bölgeni Belirle</h2>
          <p className="text-sm text-slate-500 mt-2">Uzman olduğun bölgeyi seçerek Portfy'ı kişiselleştir.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şehir</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
              value={region.city}
              onChange={e => setRegion({...region, city: e.target.value, district: '', neighborhoods: []})}
            >
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlçe (Maks. 1)</label>
            <select 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
              value={region.district}
              onChange={e => setRegion({...region, district: e.target.value, neighborhoods: []})}
            >
              <option value="">İlçe Seçiniz</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {region.district && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mahalleler (Maks. 3)</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {neighborhoods.map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      if (region.neighborhoods.includes(n)) {
                        setRegion({...region, neighborhoods: region.neighborhoods.filter(item => item !== n)});
                      } else if (region.neighborhoods.length < 3) {
                        setRegion({...region, neighborhoods: [...region.neighborhoods, n]});
                      }
                    }}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border-2 ${
                      region.neighborhoods.includes(n) 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-orange-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {region.neighborhoods.length}/3 mahalle seçildi
              </div>
            </div>
          )}

          <button 
            onClick={handleSave}
            disabled={!region.city || !region.district || region.neighborhoods.length === 0 || isSaving}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor...' : 'Bölgemi Kaydet ve Başla'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

function MainApp() {
  const { categories } = useCategories();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showVoiceQuickAdd, setShowVoiceQuickAdd] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const { profile, logout, completeTour } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: api.getLeads
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties
  });

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false);

  // WhatsApp Import Mutation
  const whatsappImportMutation = useMutation({
    mutationFn: async (text: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Aşağıdaki WhatsApp mesajından emlak müşterisi bilgilerini çıkar. 
        JSON formatında şu alanları döndür: name (isim), phone (telefon), type (Alıcı/Satıcı/Kiracı/Kiralayan), status (Aday/Sıcak/Pasif), notes (notlar).
        
        Mesaj: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Alıcı', 'Satıcı', 'Kiracı', 'Kiralayan'] },
              status: { type: Type.STRING, enum: ['Aday', 'Sıcak', 'Pasif'] },
              notes: { type: Type.STRING }
            },
            required: ["name", "phone", "type", "status", "notes"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      return api.addLead(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowWhatsAppImport(false);
    }
  });

  // Add Property Mutation
  const addPropertyMutation = useMutation({
    mutationFn: api.addProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['regionScores'] });
      setShowAddProperty(false);
      setShowQuickAdd(false);
    }
  });

  // Add Lead Mutation
  const addLeadMutation = useMutation({
    mutationFn: api.addLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['regionScores'] });
      setShowAddLead(false);
      setShowQuickAdd(false);
    }
  });

  // Add Visit Mutation
  const addVisitMutation = useMutation({
    mutationFn: api.addVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldVisits'] });
      queryClient.invalidateQueries({ queryKey: ['regionScores'] });
      setShowAddVisit(false);
      setShowQuickAdd(false);
    }
  });

  // Add Task Mutation
  const addTaskMutation = useMutation({
    mutationFn: api.addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const { data: fieldVisits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ['fieldVisits', profile?.uid],
    queryFn: api.getFieldVisits,
    enabled: !!profile?.uid
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', profile?.uid],
    queryFn: api.getTasks,
    enabled: !!profile?.uid
  });

  const { data: regionScores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['regionScores', profile?.uid],
    queryFn: api.getRegionEfficiencyScores,
    enabled: !!profile?.uid
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', profile?.uid],
    queryFn: api.getMessageTemplates,
    enabled: !!profile?.uid
  });

  const addTemplateMutation = useMutation({
    mutationFn: api.addMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: api.deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const { data: brokerAccount } = useQuery({
    queryKey: ['brokerAccount'],
    queryFn: api.getBrokerAccount
  });

  const { data: externalListings = [] } = useQuery({
    queryKey: ['externalListings'],
    queryFn: api.getExternalListings
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: api.connectSahibinden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerAccount'] });
      setShowIntegrationModal(false);
    }
  });

  const syncListingsMutation = useMutation({
    mutationFn: api.syncExternalListings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalListings'] });
    }
  });

  const linkPropertyMutation = useMutation({
    mutationFn: ({ propertyId, externalId }: { propertyId: string, externalId: string }) => 
      api.linkPropertyToExternal(propertyId, externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncLink'] });
    }
  });

  const { data: gamifiedTasks = [], isLoading: isGamifiedTasksLoading } = useQuery({
    queryKey: ['gamifiedTasks', profile?.uid],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.uid
  });

  const refreshTasksMutation = useMutation({
    mutationFn: () => api.getDailyGamifiedTasks(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamifiedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['gamifiedStats'] });
    }
  });

  const { data: gamifiedStats } = useQuery({
    queryKey: ['gamifiedStats', profile?.uid],
    queryFn: api.getGamifiedStats,
    enabled: !!profile?.uid
  });

  const { data: coachInsights, isLoading: coachLoading } = useQuery({
    queryKey: ['coachInsights', profile?.uid],
    queryFn: api.getCoachInsights,
    enabled: !!profile?.uid
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, points }: { taskId: string, points: number }) => api.completeGamifiedTask(taskId, points),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamifiedTasks'] });
      queryClient.invalidateQueries({ queryKey: ['gamifiedStats'] });
      queryClient.invalidateQueries({ queryKey: ['coachInsights'] });
    }
  });

  const { data: rescueSession } = useQuery({
    queryKey: ['rescueSession'],
    queryFn: api.getRescueSession
  });

  const startRescueMutation = useMutation({
    mutationFn: api.startRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescueSession'] });
    }
  });

  const completeRescueTaskMutation = useMutation({
    mutationFn: ({ sessionId, taskId }: { sessionId: string, taskId: string }) => api.completeRescueTask(sessionId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rescueSession'] });
      queryClient.invalidateQueries({ queryKey: ['gamifiedStats'] });
    }
  });

  const { data: missedOpportunities = [] } = useQuery({
    queryKey: ['missedOpportunities'],
    queryFn: api.getMissedOpportunities
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | 'all'>('all');
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [instagramCaptions, setInstagramCaptions] = useState<{ corporate: string, sales: string, warm: string } | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState<{ single: string, status: string, investor: string } | null>(null);
  const [marketingHubData, setMarketingHubData] = useState<any | null>(null);
  const [aiMarketingType, setAiMarketingType] = useState<'listing' | 'instagram' | 'whatsapp' | 'share' | 'hub' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showMarketingHub, setShowMarketingHub] = useState(false);
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showExternalListings, setShowExternalListings] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  // AI Content Generation Mutation
  const generateContentMutation = useMutation({
    mutationFn: api.generatePropertyContent,
    onSuccess: (data) => {
      setAiContent(data);
      setIsGenerating(false);
    }
  });

  const generateInstagramMutation = useMutation({
    mutationFn: api.generateInstagramCaptions,
    onSuccess: (data) => {
      setInstagramCaptions(data);
      setIsGenerating(false);
    }
  });

  const generateWhatsAppMutation = useMutation({
    mutationFn: api.generateWhatsAppMessages,
    onSuccess: (data) => {
      setWhatsappMessages(data);
      setIsGenerating(false);
    }
  });

  const generateMarketingMutation = useMutation({
    mutationFn: api.generateMarketingModule,
    onSuccess: (data) => {
      setMarketingHubData(data);
      setIsGenerating(false);
      setShowMarketingHub(true);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<UserProfile> }) => api.updateProfile(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const analyzeLeadsMutation = useMutation({
    mutationFn: api.analyzeLeads,
    onSuccess: (data) => {
      setLeadAnalysis(data);
      setIsAnalyzingLeads(false);
    }
  });

  // Daily Briefing Logic
  useEffect(() => {
    if (!profile) return;

    const checkBriefing = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastShown = localStorage.getItem(`briefing_shown_${profile.uid}`);
      
      if (lastShown === today) return;

      const targetTime = profile.notificationTime || "09:00";
      const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
      
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      if (currentHours > targetHours || (currentHours === targetHours && currentMinutes >= targetMinutes)) {
        if (!isGamifiedTasksLoading) {
          setShowDailyBriefing(true);
          localStorage.setItem(`briefing_shown_${profile.uid}`, today);
        }
      }
    };

    const interval = setInterval(checkBriefing, 60000); // Check every minute
    checkBriefing(); // Initial check

    return () => clearInterval(interval);
  }, [profile]);

  const completingTasks = useRef<Set<string>>(new Set());

  // Auto-complete specific gamified tasks
  useEffect(() => {
    if (gamifiedTasks && gamifiedTasks.length > 0 && profile?.uid) {
      // 1. Peş peşe girişini sürdür
      const loginTask = gamifiedTasks.find(t => t.title === "Peş peşe girişini sürdür" && !t.isCompleted);
      if (loginTask && !completingTasks.current.has(loginTask.id)) {
        completingTasks.current.add(loginTask.id);
        completeTaskMutation.mutate({ taskId: loginTask.id, points: loginTask.points });
      }

      // 2. Bugün 100 puan kazan
      const pointsTask = gamifiedTasks.find(t => t.title === "Bugün 100 puan kazan" && !t.isCompleted);
      if (pointsTask && (gamifiedStats?.pointsToday || 0) >= 100 && !completingTasks.current.has(pointsTask.id)) {
        completingTasks.current.add(pointsTask.id);
        completeTaskMutation.mutate({ taskId: pointsTask.id, points: pointsTask.points });
      }
    }
  }, [gamifiedTasks, profile?.uid, gamifiedStats?.pointsToday]);

  const handleWhatsAppShare = (property: Property, content?: string) => {
    if (content) {
      const url = `https://wa.me/?text=${encodeURIComponent(content)}`;
      window.open(url, '_blank');
      return;
    }

    if (templates && templates.length > 0) {
      setShowTemplateSelector(true);
    } else {
      const text = `Merhaba, sizin için harika bir portföyüm var: ${property.title}. Fiyat: ₺${property.price.toLocaleString()}. Detaylar için iletişime geçebilirsiniz.`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const TemplateManagerModal = () => {
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

    if (!showTemplateManager) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mesaj Şablonları</h2>
                  <p className="text-xs text-slate-500">Hızlı paylaşım için şablon oluştur</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateManager(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yeni Şablon Ekle</h3>
                <input 
                  type="text" 
                  placeholder="Şablon Adı (Örn: İlk Tanıtım)" 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <textarea 
                  placeholder="Mesaj içeriği... {title}, {price}, {district} gibi değişkenler kullanabilirsiniz." 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  value={newTemplate.content}
                  onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                />
                <button 
                  onClick={() => {
                    if (newTemplate.name && newTemplate.content) {
                      addTemplateMutation.mutate({ ...newTemplate, isDefault: false });
                      setNewTemplate({ name: '', content: '' });
                    }
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-100"
                >
                  Şablonu Kaydet
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıtlı Şablonlar ({templates.length})</h3>
                {templates.map(template => (
                  <div key={template.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex justify-between items-start group">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{template.name}</div>
                      <p className="text-xs text-slate-500 line-clamp-2">{template.content}</p>
                    </div>
                    <button 
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const TemplateSelectorModal = () => {
    if (!showTemplateSelector || !selectedProperty) return null;

    const formatMessage = (content: string, property: Property) => {
      return content
        .replace(/{title}/g, property.title)
        .replace(/{price}/g, property.price.toLocaleString())
        .replace(/{district}/g, property.address.district)
        .replace(/{type}/g, property.type);
    };

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                  <Share2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Şablon Seç</h2>
                  <p className="text-xs text-slate-500">Paylaşmak istediğiniz mesajı seçin</p>
                </div>
              </div>
              <button onClick={() => setShowTemplateSelector(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
              {templates.map(template => (
                <button 
                  key={template.id}
                  onClick={() => {
                    const text = formatMessage(template.content, selectedProperty);
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                    setShowTemplateSelector(false);
                  }}
                  className="w-full p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-3xl text-left transition-all group"
                >
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">{template.name}</div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{template.content}</p>
                </button>
              ))}
              <button 
                onClick={() => {
                  const text = `Merhaba, sizin için harika bir portföyüm var: ${selectedProperty.title}. Fiyat: ₺${selectedProperty.price.toLocaleString()}. Detaylar için iletişime geçebilirsiniz.`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                  setShowTemplateSelector(false);
                }}
                className="w-full p-4 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-3xl text-left transition-all group"
              >
                <div className="text-sm font-bold text-slate-900 group-hover:text-orange-700">Varsayılan Mesaj</div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">Standart portföy paylaşım mesajı.</p>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const IntegrationModal = () => {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    if (!showIntegrationModal) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">sahibinden.com Bağla</h2>
                  <p className="text-xs text-slate-500">Resmi API entegrasyonu</p>
                </div>
              </div>
              <button onClick={() => setShowIntegrationModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-[10px] text-orange-700 leading-relaxed">
                  Bu entegrasyon sadece <strong>Kurumsal Mağaza</strong> sahipleri içindir. sahibinden.com panelinizden aldığınız API anahtarlarını kullanın.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Secret</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                />
              </div>
              <button 
                onClick={() => connectIntegrationMutation.mutate(apiKey)}
                disabled={connectIntegrationMutation.isPending}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
              >
                {connectIntegrationMutation.isPending ? 'Bağlanıyor...' : 'Entegrasyonu Tamamla'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const ExternalListingsModal = () => {
    if (!showExternalListings) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mağaza İlanları</h2>
                  <p className="text-xs text-slate-500">{brokerAccount?.storeName}</p>
                </div>
              </div>
              <button onClick={() => setShowExternalListings(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
              {externalListings.map(listing => (
                <div key={listing.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{listing.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID: {listing.extId} • {listing.district}</p>
                    </div>
                    <Badge variant={listing.status === 'Yayında' ? 'success' : 'error'}>{listing.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-orange-600">₺{listing.price.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.open(listing.url, '_blank')}
                        className="p-2 bg-white rounded-xl text-slate-400 hover:text-orange-600 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const ImportUrlModal = () => {
    const [url, setUrl] = useState('');
    const [importing, setImporting] = useState(false);

    if (!showImportUrlModal) return null;

    const handleImport = async () => {
      setImporting(true);
      try {
        await api.importListingFromUrl(url);
        setShowImportUrlModal(false);
        setShowAddProperty(true);
      } catch (e: any) {
        console.error('Import error:', e.message);
      } finally {
        setImporting(false);
      }
    };

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">URL'den İçe Aktar</h2>
                  <p className="text-xs text-slate-500">İlan linkini yapıştırarak veri çek</p>
                </div>
              </div>
              <button onClick={() => setShowImportUrlModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlan Linki</label>
                <input 
                  type="text" 
                  placeholder="https://www.sahibinden.com/ilan/..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <button 
                onClick={handleImport}
                disabled={importing || !url}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
              >
                {importing ? 'Veriler Çekiliyor...' : 'Verileri Getir'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const PropertyDetailModal = () => {
    if (!selectedProperty) return null;

    const matchedLeads = leads.filter(l => 
      l.status !== 'Pasif' && 
      (l.district === selectedProperty.address.district || l.type === selectedProperty.type)
    );
    const regionScore = regionScores.find((r: any) => r.district === selectedProperty.address.district);

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header Image */}
            <div className="relative h-64 shrink-0">
              <img 
                src={selectedProperty.images[0] || `https://picsum.photos/seed/${selectedProperty.id}/800/600`} 
                className="w-full h-full object-cover"
                alt={selectedProperty.title}
              />
              <button 
                onClick={() => { setSelectedProperty(null); setAiContent(null); }}
                className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all"
              >
                <X size={24} />
              </button>
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="success">{selectedProperty.status}</Badge>
                    {selectedProperty.marketAnalysis?.status === 'Fırsat' && (
                      <Badge variant="info" className="bg-emerald-500 border-none">FIRSAT</Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedProperty.title}</h2>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl shadow-xl flex flex-col items-end">
                  <span className="text-orange-600 font-bold text-lg">₺{selectedProperty.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <TrendingUp size={10} />
                    <span>%{Math.round((selectedProperty.saleProbability || 0.5) * 100)} Satış Olasılığı</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8 space-y-8 no-scrollbar">
              {/* Sales Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-emerald-50 border-emerald-100 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Satış İhtimali</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">%{Math.round((selectedProperty.saleProbability || 0.5) * 100)}</div>
                  <p className="text-[10px] text-emerald-600/80 font-medium">Bu fiyat bandında talep yüksek. Bugün paylaşım için çok uygun.</p>
                  <button 
                    onClick={() => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); }}
                    className="mt-2 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                  >
                    Hemen Paylaş
                  </button>
                </Card>
                <Card className="bg-blue-50 border-blue-100 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Zap size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">Yatırımcı Uygunluğu</span>
                  </div>
                  <div className="text-2xl font-black text-blue-700">Yüksek</div>
                  <p className="text-[10px] text-blue-600/80 font-medium">Bölge verimliliği ve kira çarpanı yatırımcılar için ideal görünüyor.</p>
                  <button 
                    onClick={() => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); }}
                    className="mt-2 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                  >
                    Yatırımcıya Gönder
                  </button>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Oda</div>
                  <div className="font-bold text-slate-900">{selectedProperty.details.rooms}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">M2</div>
                  <div className="font-bold text-slate-900">{selectedProperty.details.brutM2}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kat</div>
                  <div className="font-bold text-slate-900">{selectedProperty.details.floor}</div>
                </div>
              </div>

              {/* Region Efficiency */}
              {regionScore && (
                <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedProperty.address.district} Bölge Verimliliği</h4>
                      <p className="text-xs text-slate-500">Bu bölge şu an %{regionScore.score} verimlilikle çalışıyor.</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-orange-600">%{regionScore.score}</div>
                </div>
              )}

              {/* External Sync */}
              {brokerAccount && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Globe size={18} className="text-orange-600" />
                    Pazar Entegrasyonu
                  </h3>
                  <Card className="bg-slate-50 border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                          <LinkIcon size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">sahibinden.com Eşleşmesi</h4>
                          <p className="text-[10px] text-slate-500">İlan durumunu otomatik takip et</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowExternalListings(true)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-orange-600"
                      >
                        İlan Bağla
                      </button>
                    </div>
                  </Card>
                </div>
              )}

              {/* AI Marketing */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-600" />
                  AI Pazarlama Asistanı
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { setAiMarketingType('hub'); setIsGenerating(true); generateMarketingMutation.mutate(selectedProperty); }}
                    className="col-span-2 p-6 bg-slate-900 text-white rounded-[32px] flex items-center justify-between shadow-xl shadow-slate-900/20 active:scale-95 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500">
                        <Sparkles size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold">AI Pazarlama Hub</div>
                        <div className="text-[10px] text-slate-400">Tüm sosyal medya ve mesaj alternatiflerini üret</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => { setAiMarketingType('listing'); setIsGenerating(true); generateContentMutation.mutate(selectedProperty); }}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">İlan Metni</span>
                  </button>
                  <button 
                    onClick={() => { setAiMarketingType('instagram'); setIsGenerating(true); generateInstagramMutation.mutate(selectedProperty); }}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Instagram Post</span>
                  </button>
                  <button 
                    onClick={() => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); }}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                      <MessageSquare size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">WhatsApp Mesajı</span>
                  </button>
                  <button 
                    onClick={() => setShowSharePanel(true)}
                    className="p-4 bg-orange-600 rounded-3xl flex flex-col items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                      <Share2 size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Paylaş & Topla</span>
                  </button>
                </div>

                {/* AI Content Display */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex flex-col items-center gap-4"
                    >
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="text-orange-600"
                      >
                        <Sparkles size={32} />
                      </motion.div>
                      <div className="text-center">
                        <h4 className="font-bold text-slate-900">AI İçerik Hazırlıyor</h4>
                        <p className="text-xs text-slate-500">Mülk verileri analiz ediliyor ve en etkili metinler oluşturuluyor...</p>
                      </div>
                    </motion.div>
                  )}

                  {aiMarketingType === 'listing' && aiContent && !isGenerating && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oluşturulan İlan Metni</span>
                        <button onClick={() => { setIsGenerating(true); generateContentMutation.mutate(selectedProperty); }} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{aiContent}</div>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(aiContent); }}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2"
                      >
                        <LinkIcon size={14} /> Metni Kopyala
                      </button>
                    </motion.div>
                  )}

                  {aiMarketingType === 'instagram' && instagramCaptions && !isGenerating && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instagram Varyasyonları</span>
                        <button onClick={() => { setIsGenerating(true); generateInstagramMutation.mutate(selectedProperty); }} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[
                          { id: 'corporate', label: 'Kurumsal', content: instagramCaptions.corporate },
                          { id: 'sales', label: 'Satış Odaklı', content: instagramCaptions.sales },
                          { id: 'warm', label: 'Samimi', content: instagramCaptions.warm }
                        ].map(variant => (
                          <Card key={variant.id} className="min-w-[280px] p-5 space-y-3 bg-white border-slate-100">
                            <Badge variant="info">{variant.label}</Badge>
                            <div className="text-xs text-slate-600 leading-relaxed line-clamp-6">{variant.content}</div>
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={() => { navigator.clipboard.writeText(variant.content); }}
                                className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <LinkIcon size={12} /> Kopyala
                              </button>
                              <button 
                                onClick={() => window.open('instagram://library', '_blank')}
                                className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <ExternalLink size={12} /> Instagram'da Aç
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {aiMarketingType === 'whatsapp' && whatsappMessages && !isGenerating && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Mesajları</span>
                        <button onClick={() => { setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); }} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                      </div>
                      <div className="space-y-3">
                        {[
                          { id: 'single', label: 'Müşteriye Özel', content: whatsappMessages.single },
                          { id: 'status', label: 'Durum Paylaşımı', content: whatsappMessages.status },
                          { id: 'investor', label: 'Yatırımcıya Özel', content: whatsappMessages.investor }
                        ].map(variant => (
                          <Card key={variant.id} className="p-4 bg-white border-slate-100 space-y-3">
                            <div className="flex justify-between items-center">
                              <Badge variant="success">{variant.label}</Badge>
                              <button onClick={() => { navigator.clipboard.writeText(variant.content); }} className="text-slate-400"><LinkIcon size={14} /></button>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">{variant.content}</div>
                            <button 
                              onClick={() => {
                                const text = encodeURIComponent(variant.content.replace('[ilan_linki]', `https://portfy.app/ilan/${selectedProperty.id}`));
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                              }}
                              className="w-full py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"
                            >
                              <MessageSquare size={12} /> WhatsApp'ta Paylaş
                            </button>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Matching Leads */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-orange-600" />
                  Eşleşen Müşteriler
                </h3>
                <div className="space-y-3">
                  {matchedLeads.length === 0 ? (
                    <Card className="bg-slate-50 border-dashed border-slate-200 p-10 flex flex-col items-center text-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                        <Users size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-bold text-slate-900">Henüz otomatik eşleşme yok</h4>
                        <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                          Bu mülk için şu an aktif bir adayımız bulunmuyor. Paylaşarak yeni talep toplayabilirsin.
                        </p>
                      </div>
                      <div className="flex flex-col w-full gap-3">
                        <button 
                          onClick={() => setShowSharePanel(true)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Share2 size={16} /> Paylaşarak Talep Topla
                        </button>
                        <button 
                          onClick={() => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); }}
                          className="w-full py-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={16} /> WhatsApp Mesajı Oluştur
                        </button>
                      </div>
                    </Card>
                  ) : matchedLeads.slice(0, 3).map(lead => (
                    <Card key={lead.id} className="p-5 space-y-4 bg-white border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                            <UserIcon size={24} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="success">Uyumluluk: %92</Badge>
                              <Badge variant="info">Bütçe: Uygun</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                            <Phone size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              const text = encodeURIComponent(`Merhaba ${lead.name}, bu mülk ilginizi çekebilir: ${selectedProperty.title}\nFiyat: ₺${selectedProperty.price.toLocaleString()}\nDetaylar için: https://portfy.app/ilan/${selectedProperty.id}`);
                              window.open(`https://wa.me/${lead.phone}?text=${text}`, '_blank');
                            }}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                          >
                            <MessageSquare size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-500 italic">
                        "Müşteri Beşiktaş bölgesinde 3+1 daire arıyor, bütçesi bu ilan için ideal."
                      </div>
                      <button className="w-full py-2 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                        <Plus size={12} /> Not Ekle
                      </button>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Konum Bilgisi</h3>
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                  <MapPin size={18} />
                  <span>{selectedProperty.address.neighborhood}, {selectedProperty.address.district}, {selectedProperty.address.city}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const SharePanel = () => {
    if (!showSharePanel || !selectedProperty) return null;

    const shareOptions = [
      { 
        id: 'hub', 
        label: 'AI Pazarlama Hub (Tüm İçerikler)', 
        icon: <Sparkles size={20} />, 
        color: 'bg-slate-900 text-orange-500',
        action: () => { setAiMarketingType('hub'); setIsGenerating(true); generateMarketingMutation.mutate(selectedProperty); setShowSharePanel(false); }
      },
      { 
        id: 'insta', 
        label: 'Instagram İçeriği Hazırla', 
        icon: <ImageIcon size={20} />, 
        color: 'bg-pink-50 text-pink-600',
        action: () => { setAiMarketingType('instagram'); setIsGenerating(true); generateInstagramMutation.mutate(selectedProperty); setShowSharePanel(false); }
      },
      { 
        id: 'wa', 
        label: 'WhatsApp Mesajı Hazırla', 
        icon: <MessageSquare size={20} />, 
        color: 'bg-emerald-50 text-emerald-600',
        action: () => { setAiMarketingType('whatsapp'); setIsGenerating(true); generateWhatsAppMutation.mutate(selectedProperty); setShowSharePanel(false); }
      },
      { 
        id: 'copy', 
        label: 'İlan Metnini Kopyala', 
        icon: <LinkIcon size={20} />, 
        color: 'bg-blue-50 text-blue-600',
        action: () => { setAiMarketingType('listing'); setIsGenerating(true); generateContentMutation.mutate(selectedProperty); setShowSharePanel(false); }
      },
      { 
        id: 'link', 
        label: 'Paylaşım Linki Oluştur', 
        icon: <Globe size={20} />, 
        color: 'bg-orange-50 text-orange-600',
        action: () => { navigator.clipboard.writeText(`https://portfy.app/ilan/${selectedProperty.id}`); setShowSharePanel(false); }
      },
      { 
        id: 'leads', 
        label: 'Uygun Müşterilere Gönder', 
        icon: <Users size={20} />, 
        color: 'bg-purple-50 text-purple-600',
        action: () => { setShowSharePanel(false); }
      }
    ];

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-end justify-center"
          onClick={() => setShowSharePanel(false)}
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md rounded-t-[40px] p-8 space-y-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Paylaş & Talep Topla</h2>
                <p className="text-xs text-slate-500">Bu ilanı hızla yayarak yeni müşteriler kazan.</p>
              </div>
              <button onClick={() => setShowSharePanel(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {shareOptions.map(option => (
                <button 
                  key={option.id}
                  onClick={option.action}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center gap-4 hover:bg-white hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 transition-all group"
                >
                  <div className={`w-12 h-12 ${option.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{option.label}</span>
                  <ChevronRight size={18} className="ml-auto text-slate-300" />
                </button>
              ))}
            </div>

            <div className="p-4 bg-orange-50 rounded-3xl border border-orange-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                <Zap size={20} />
              </div>
              <p className="text-[10px] text-orange-700 font-medium leading-tight">
                <strong>İpucu:</strong> İlanı WhatsApp durumunda paylaşmak, ortalama 4 kat daha fazla talep getirir.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const MarketingHubModal = () => {
    if (!showMarketingHub || !marketingHubData || !selectedProperty) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[210] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-2xl rounded-[40px] p-8 space-y-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Pazarlama Hub</h2>
                  <p className="text-xs text-slate-500">Mülkünüz için üretilen 18+ farklı içerik alternatifi</p>
                </div>
              </div>
              <button onClick={() => setShowMarketingHub(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Instagram Posts */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-pink-600" />
                Instagram Post Alternatifleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketingHubData.instagram_posts.map((post: any, idx: number) => (
                  <Card key={idx} className="p-4 bg-slate-50 border-slate-100 space-y-3 flex flex-col">
                    <Badge variant={post.tone === 'kurumsal' ? 'info' : post.tone === 'satis_odakli' ? 'warning' : 'success'}>
                      {post.tone.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="text-xs font-bold text-slate-900">{post.headline}</div>
                    <div className="text-[10px] text-slate-600 leading-relaxed flex-1">{post.caption}</div>
                    <div className="text-[9px] text-slate-400 italic">{post.hashtags.join(' ')}</div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(`${post.headline}\n\n${post.caption}\n\n${post.hashtags.join(' ')}`); }}
                      className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 flex items-center justify-center gap-2"
                    >
                      <LinkIcon size={12} /> Kopyala
                    </button>
                  </Card>
                ))}
              </div>
            </div>

            {/* WhatsApp Messages */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                WhatsApp Mesaj Alternatifleri
              </h3>
              <div className="space-y-6">
                {marketingHubData.whatsapp_messages.map((msg: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {msg.type.replace(/_/g, ' ')}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[msg.text, ...msg.alternative_texts].map((text: string, tIdx: number) => (
                        <Card key={tIdx} className="p-4 bg-emerald-50/30 border-emerald-100 space-y-3">
                          <div className="text-[10px] text-slate-700 leading-relaxed">{text.replace('[ilan_linki]', `https://portfy.app/ilan/${selectedProperty.id}`)}</div>
                          <button 
                            onClick={() => { 
                              const finalMsg = text.replace('[ilan_linki]', `https://portfy.app/ilan/${selectedProperty.id}`);
                              navigator.clipboard.writeText(finalMsg);
                              window.open(`https://wa.me/?text=${encodeURIComponent(finalMsg)}`, '_blank');
                            }}
                            className="w-full py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={12} /> Paylaş
                          </button>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summaries & CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <LinkIcon size={18} className="text-blue-600" />
                  Kısa Özetler
                </h3>
                <div className="space-y-3">
                  {marketingHubData.summaries.map((summary: string, idx: number) => (
                    <Card key={idx} className="p-3 bg-blue-50/30 border-blue-100 flex justify-between items-center gap-3">
                      <div className="text-[10px] text-slate-700">{summary}</div>
                      <button onClick={() => navigator.clipboard.writeText(summary)} className="text-slate-400"><LinkIcon size={14} /></button>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Zap size={18} className="text-orange-600" />
                  Aksiyon Çağrıları (CTA)
                </h3>
                <div className="space-y-3">
                  {marketingHubData.cta_options.map((cta: string, idx: number) => (
                    <Card key={idx} className="p-3 bg-orange-50/30 border-orange-100 flex justify-between items-center gap-3">
                      <div className="text-[10px] text-slate-700 font-bold">{cta}</div>
                      <button onClick={() => navigator.clipboard.writeText(cta)} className="text-slate-400"><LinkIcon size={14} /></button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-bold">Tüm İçerikleri Paketle</div>
                <div className="text-[10px] text-slate-400">Tüm alternatifleri tek tıkla kopyala</div>
              </div>
              <button 
                onClick={() => {
                  const allContent = `PORTFY AI PAZARLAMA PAKETİ\n\n` + 
                    `INSTAGRAM POSTLARI:\n${marketingHubData.instagram_posts.map((p: any) => `${p.headline}\n${p.caption}`).join('\n---\n')}\n\n` +
                    `WHATSAPP MESAJLARI:\n${marketingHubData.whatsapp_messages.map((m: any) => m.text).join('\n---\n')}`;
                  navigator.clipboard.writeText(allContent);
                }}
                className="px-6 py-3 bg-orange-600 rounded-2xl text-xs font-bold shadow-lg shadow-orange-600/20"
              >
                Hepsini Kopyala
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const AddLeadModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      phone: '',
      type: 'Alıcı',
      status: 'Aday' as any,
      district: 'Beşiktaş',
      notes: ''
    });

    return (
      <AnimatePresence>
        {showAddLead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Yeni Lead Kaydı</h2>
                <button onClick={() => setShowAddLead(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Müşteri Adı Soyadı</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tip / Kategori</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="Alıcı">Alıcı</option>
                      <option value="Satıcı">Satıcı</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölge (İlçe)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durum</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option>Aday</option>
                    <option>Sıcak</option>
                  </select>
                </div>
                <button 
                  onClick={() => addLeadMutation.mutate(formData)}
                  disabled={addLeadMutation.isPending}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                >
                  {addLeadMutation.isPending ? 'Kaydediliyor...' : 'Lead Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const AddVisitModal = () => {
    const [formData, setFormData] = useState({
      address: '',
      district: 'Beşiktaş',
      status: 'Görüşüldü' as any,
      notes: ''
    });

    return (
      <AnimatePresence>
        {showAddVisit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Saha Ziyareti Kaydı</h2>
                <button onClick={() => setShowAddVisit(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adres / Bina Bilgisi</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bölge (İlçe)</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durum</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option>Görüşüldü</option>
                    <option>Potansiyel</option>
                    <option>Ret</option>
                    <option>Boş</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <button 
                  onClick={() => addVisitMutation.mutate(formData)}
                  disabled={addVisitMutation.isPending}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                >
                  {addVisitMutation.isPending ? 'Kaydediliyor...' : 'Ziyareti Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };
  const DailyBriefingModal = () => {
    if (!showDailyBriefing) return null;
    
    const todayTasks = tasks.filter(t => !t.completed);
    const todayVisits = fieldVisits.filter(v => v.status === 'Potansiyel');

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <Bell size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Günlük Özet</h2>
                  <p className="text-xs text-slate-500">Bugün seni neler bekliyor?</p>
                </div>
              </div>
              <button onClick={() => setShowDailyBriefing(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yapılacak Görevler ({todayTasks.length})</h3>
                {todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                          {task.type === 'Arama' ? <Phone size={14} /> : <Calendar size={14} />}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{task.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Bugün için bekleyen görev yok.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saha Ziyaretleri ({todayVisits.length})</h3>
                {todayVisits.length > 0 ? (
                  <div className="space-y-2">
                    {todayVisits.slice(0, 2).map(visit => (
                      <div key={visit.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                          <MapPin size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{visit.address}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Planlanmış saha ziyareti yok.</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowDailyBriefing(false)}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
            >
              Hadi Başlayalım!
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const MissedOpportunitiesModal = () => {
    if (!showMissedOpportunities) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[180] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Kaçırılan Fırsatlar</h2>
                  <p className="text-xs text-slate-500">Gözden kaçan {missedOpportunities.length} kritik aksiyon</p>
                </div>
              </div>
              <button onClick={() => setShowMissedOpportunities(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {missedOpportunities.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <ShieldCheck size={40} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Harika! Şu an kaçan bir fırsat görünmüyor.</p>
                </div>
              ) : missedOpportunities.map(opp => (
                <div key={opp.id} className={`p-5 rounded-3xl border-2 transition-all space-y-3 ${
                  opp.priority === 'high' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{opp.title}</h4>
                        {opp.priority === 'high' && <Badge variant="error">Kritik</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{opp.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {opp.daysDelayed > 0 ? `${opp.daysDelayed} Gün Gecikme` : 'Hemen Aksiyon'}
                      </span>
                      {opp.potentialValue && (
                        <span className="text-[10px] font-bold text-emerald-600">+{opp.potentialValue} Puan</span>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        setShowMissedOpportunities(false);
                        if (opp.type === 'lead_followup') setActiveTab('crm');
                        if (opp.type === 'property_stale' || opp.type === 'price_drop_potential') setActiveTab('portfoyler');
                        if (opp.type === 'visit_stale') setActiveTab('bolgem');
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm active:scale-95 transition-all"
                    >
                      Hemen Düzelt
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowMissedOpportunities(false)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200"
            >
              Anladım, Aksiyona Geçiyorum
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const RescueModeModal = () => {
    if (!rescueSession || rescueSession.status !== 'active') return null;

    const completedCount = rescueSession.tasks.filter(t => t.isCompleted).length;
    const totalCount = rescueSession.tasks.length;
    const progress = (completedCount / totalCount) * 100;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="text-center space-y-2 relative z-10">
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mx-auto mb-4 shadow-lg shadow-orange-100">
                <Zap size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Günü Kurtar Modu</h2>
              <p className="text-sm text-slate-500">Henüz her şey bitmedi! Bu 3 kritik görevi tamamla, günü %100 verimle kapat.</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>İlerleme</span>
                <span>%{Math.round(progress)}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-orange-500 h-full shadow-sm"
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {rescueSession.tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => !task.isCompleted && completeRescueTaskMutation.mutate({ sessionId: rescueSession.id, taskId: task.id })}
                  disabled={task.isCompleted || completeRescueTaskMutation.isPending}
                  className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${
                    task.isCompleted 
                      ? 'bg-emerald-50 border-emerald-100 opacity-60' 
                      : 'bg-slate-50 border-slate-100 hover:border-orange-200 active:scale-95'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    task.isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                  }`}>
                    {task.isCompleted ? <Check size={20} /> : <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${task.isCompleted ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {task.estimatedMinutes} dk
                      </span>
                      <span className="text-[10px] font-bold text-orange-600">+{task.points} Puan</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4">
              <p className="text-[10px] text-center text-slate-400 italic">
                "Disiplin, vazgeçmediğin her an yeniden başlar."
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const LeadAnalysisModal = () => {
    if (!leadAnalysis) return null;
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={24} className="text-orange-600" />
                Rehber Analizi
              </h2>
              <button onClick={() => setLeadAnalysis(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-auto pr-2 custom-scrollbar">
              {leadAnalysis}
            </div>
            <button 
              onClick={() => setLeadAnalysis(null)}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
            >
              Anladım
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const WhatsAppImportModal = () => {
    const [text, setText] = useState('');
    
    return (
      <AnimatePresence>
        {showWhatsAppImport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowWhatsAppImport(false)}
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">WhatsApp'tan Aktar</h3>
                  <p className="text-sm text-slate-500">Gelen mesajı yapıştırın, AI bilgileri çıkarsın.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mesaj Metni</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Örn: Merhaba, ben Ahmet. Kadıköy'de 3+1 kiralık daire bakıyorum. 0532..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button 
                  onClick={() => whatsappImportMutation.mutate(text)}
                  disabled={!text || whatsappImportMutation.isPending}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {whatsappImportMutation.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={20} /></motion.div>
                  ) : <Sparkles size={20} />}
                  Analiz Et ve Kaydet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  };

  const AddPropertyModal = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      title: '',
      type: 'Daire',
      category: 'Satılık',
      price: '',
      status: 'Yeni',
      address: { city: 'İstanbul', district: '', neighborhood: '', fullAddress: '' },
      details: { brutM2: '', netM2: '', rooms: '', floor: '', totalFloors: '', age: '' },
      owner: { name: '', phone: '', trustScore: 80 },
      commissionRate: 2,
      images: [] as string[],
      healthScore: 75,
      notes: '',
      targetCustomerType: '',
      investmentSuitability: ''
    });

    const cities = locationService.getCities();
    const districts = formData.address.city ? locationService.getDistricts(formData.address.city) : [];
    const neighborhoods = (formData.address.city && formData.address.district) ? locationService.getNeighborhoods(formData.address.city, formData.address.district) : [];

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      if (!rawValue) {
        setFormData({...formData, price: ''});
        return;
      }
      const formatted = new Intl.NumberFormat('tr-TR').format(Number(rawValue));
      setFormData({...formData, price: formatted});
    };

    const handleSubmit = () => {
      const payload = {
        ...formData,
        price: Number(formData.price.toString().replace(/\D/g, '')),
        details: {
          ...formData.details,
          brutM2: Number(formData.details.brutM2),
          netM2: Number(formData.details.netM2),
          floor: Number(formData.details.floor),
          totalFloors: Number(formData.details.totalFloors),
          age: Number(formData.details.age)
        }
      };
      addPropertyMutation.mutate(payload as any);
    };

    const steps = [
      { id: 1, title: 'Temel Bilgiler' },
      { id: 2, title: 'Konum' },
      { id: 3, title: 'Mülk Detayları' },
      { id: 4, title: 'Mal Sahibi & Notlar' }
    ];

    return (
      <AnimatePresence>
        {showAddProperty && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 max-h-[90vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Yeni Portföy</h2>
                  <div className="flex gap-1 mt-2">
                    {steps.map((s) => (
                      <div 
                        key={s.id} 
                        className={`h-1 rounded-full transition-all ${step >= s.id ? 'w-8 bg-orange-600' : 'w-4 bg-slate-100'}`} 
                      />
                    ))}
                  </div>
                </div>
                <button onClick={() => { setShowAddProperty(false); setStep(1); }} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-8">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adım {step}/4</div>
                <div className="text-sm font-bold text-slate-900">{steps.find(s => s.id === step)?.title}</div>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlan Başlığı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Gül Sokak'ta Manzaralı 3+1"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mülk Tipi</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                      >
                        <option>Daire</option>
                        <option>Villa</option>
                        <option>Arsa</option>
                        <option>Ticari</option>
                        <option>Fabrika</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as any})}
                      >
                        <option>Satılık</option>
                        <option>Kiralık</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fiyat</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Örn: 5.000.000"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pr-12 text-sm focus:border-orange-500 outline-none font-medium"
                        value={formData.price}
                        onChange={handlePriceChange}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        TL
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20"
                  >
                    Sonraki Adım
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Şehir</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.address.city}
                      onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value, district: '', neighborhood: ''}})}
                    >
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İlçe</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.address.district}
                      onChange={e => setFormData({...formData, address: {...formData.address, district: e.target.value, neighborhood: ''}})}
                    >
                      <option value="">İlçe Seçiniz</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mahalle</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.address.neighborhood}
                      onChange={e => setFormData({...formData, address: {...formData.address, neighborhood: e.target.value}})}
                    >
                      <option value="">Mahalle Seçiniz</option>
                      {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                    <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brüt M2</label>
                      <input 
                        type="number" 
                        placeholder="Örn: 120"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.details.brutM2}
                        onChange={e => setFormData({...formData, details: {...formData.details, brutM2: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net M2</label>
                      <input 
                        type="number" 
                        placeholder="Örn: 100"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.details.netM2}
                        onChange={e => setFormData({...formData, details: {...formData.details, netM2: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oda Sayısı</label>
                      <input 
                        type="text" 
                        placeholder="Örn: 3+1"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.details.rooms}
                        onChange={e => setFormData({...formData, details: {...formData.details, rooms: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bina Yaşı</label>
                      <input 
                        type="number" 
                        placeholder="Örn: 5"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                        value={formData.details.age}
                        onChange={e => setFormData({...formData, details: {...formData.details, age: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                    <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20">Sonraki Adım</button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi İsim</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.owner.name}
                      onChange={e => setFormData({...formData, owner: {...formData.owner, name: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mal Sahibi Telefon</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 0532 123 45 67"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.owner.phone}
                      onChange={e => setFormData({...formData, owner: {...formData.owner, phone: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Müşteri Tipi</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Genç aileler, Yatırımcılar"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.targetCustomerType}
                      onChange={e => setFormData({...formData, targetCustomerType: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yatırım Uygunluğu</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                      value={formData.investmentSuitability}
                      onChange={e => setFormData({...formData, investmentSuitability: e.target.value})}
                    >
                      <option value="">Seçiniz</option>
                      <option value="Yüksek">Yüksek</option>
                      <option value="Orta">Orta</option>
                      <option value="Düşük">Düşük</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24 resize-none"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Geri</button>
                    <button 
                      onClick={handleSubmit}
                      disabled={addPropertyMutation.isPending}
                      className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                    >
                      {addPropertyMutation.isPending ? 'Kaydediliyor...' : 'Portföyü Kaydet'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };



  const VoiceQuickAddModal = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedResult, setParsedResult] = useState<VoiceParseResult | null>(null);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'tr-TR';
        rec.continuous = true;
        rec.interimResults = true;
        
        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(prev => prev + ' ' + currentTranscript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }, []);

    const toggleListening = () => {
      if (isListening) {
        recognition?.stop();
        setIsListening(false);
      } else {
        setTranscript('');
        setParsedResult(null);
        recognition?.start();
        setIsListening(true);
      }
    };

    const handleParse = async () => {
      if (!transcript.trim()) return;
      setIsParsing(true);
      const result = await api.parseVoiceCommand(transcript);
      setParsedResult(result);
      setIsParsing(false);
    };

    const handleSave = async () => {
      if (!parsedResult) return;
      
      if (parsedResult.intent === 'lead') {
        await addLeadMutation.mutateAsync({
          name: parsedResult.extractedData.name || 'İsimsiz Müşteri',
          phone: parsedResult.extractedData.phone || '',
          type: 'Alıcı',
          status: 'Aday',
          district: parsedResult.extractedData.location || '',
          notes: parsedResult.extractedData.description || parsedResult.originalText
        } as any);
      } else if (parsedResult.intent === 'task') {
        await addTaskMutation.mutateAsync({
          title: parsedResult.extractedData.description || 'Yeni Görev',
          time: parsedResult.extractedData.dueDate || new Date().toISOString(),
          type: 'Arama',
          completed: false
        } as any);
      } else if (parsedResult.intent === 'note') {
        await addVisitMutation.mutateAsync({
          address: parsedResult.extractedData.location || 'Bilinmeyen Adres',
          district: parsedResult.extractedData.location || '',
          status: 'Potansiyel',
          notes: parsedResult.extractedData.description || parsedResult.originalText
        } as any);
      }

      setShowVoiceQuickAdd(false);
      setTranscript('');
      setParsedResult(null);
    };

    if (!showVoiceQuickAdd) return null;

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[180] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                  <Mic size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sesli Hızlı Kayıt</h2>
                  <p className="text-xs text-slate-500">Konuşarak CRM'e veri ekleyin</p>
                </div>
              </div>
              <button onClick={() => setShowVoiceQuickAdd(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {!parsedResult ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-8">
                <button 
                  onClick={toggleListening}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Mic size={48} />
                </button>
                
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-slate-900">
                    {isListening ? 'Dinleniyor...' : 'Konuşmak için dokunun'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Örn: "Yarın saat 3'te Mehmet Bey'i ara" veya "Yeni müşteri Zeynep Hanım, bütçesi 3 milyon"
                  </p>
                </div>

                {transcript && (
                  <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-700 italic">"{transcript}"</p>
                  </div>
                )}

                {isParsing && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm font-bold">Yapay zeka notunuzu düzenliyor...</span>
                  </div>
                )}

                {transcript && !isListening && !isParsing && (
                  <button 
                    onClick={handleParse}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200"
                  >
                    Metni İşle
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info" className="bg-orange-50 text-orange-700 border-orange-200">
                      {parsedResult.intent === 'lead' ? '👤 Müşteri' : 
                       parsedResult.intent === 'task' ? '📅 Görev' : 
                       parsedResult.intent === 'note' ? '📝 Saha Notu' : '❓ Bilinmeyen'}
                    </Badge>
                  </div>
                  
                  {Object.entries(parsedResult.extractedData).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">{key}</label>
                        <input 
                          type="text" 
                          value={value as string} 
                          onChange={(e) => setParsedResult({...parsedResult, extractedData: {...parsedResult.extractedData, [key]: e.target.value}})}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 italic">Orijinal metin: "{parsedResult.originalText}"</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setParsedResult(null); setTranscript(''); }}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const CoachView = () => {
    if (coachLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Brain size={48} className="text-orange-500 animate-pulse" />
          <p className="text-slate-500 font-medium">Koç verilerinizi analiz ediyor...</p>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 space-y-6 pb-32"
      >
        <header className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portfy AI Koç</h1>
            <p className="text-slate-500 text-sm">Davranışsal gelişim asistanı</p>
          </div>
        </header>

        {/* Daily Focus */}
        <Card className="!bg-slate-900 !text-white border-none p-6 relative overflow-hidden shadow-xl shadow-slate-200">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Günün Odak Noktası</span>
            </div>
            <p className="text-lg font-bold leading-relaxed text-white">
              "{coachInsights?.dailyTip || 'Bugün eski müşterilerinizi arayarak bağlarınızı güçlendirin.'}"
            </p>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {/* Strength */}
          <Card className="bg-emerald-50 border-emerald-100 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 mb-1">
                  Güçlü Yön: {coachInsights?.strength?.title || 'Saha Kaplanı'}
                </h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  {coachInsights?.strength?.description || 'Saha ziyaretlerini aksatmıyorsunuz ve bölge hakimiyetiniz yüksek.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Weakness */}
          <Card className="bg-amber-50 border-amber-100 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 mb-1">
                  Gelişim Alanı: {coachInsights?.weakness?.title || 'Takip Eksikliği'}
                </h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {coachInsights?.weakness?.description || 'Müşterileri sisteme ekledikten sonra arama süreleriniz ortalamanın altında.'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Premium Teaser */}
        <Card className="bg-slate-50 border-slate-200 p-6 opacity-75 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Pro Plan'a Geç</span>
            </div>
          </div>
          <div className="space-y-4 filter blur-[1px]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Haftalık Detaylı Analiz</h3>
              <Badge variant="warning">Kilitli</Badge>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-slate-200 rounded-full w-full" />
              <div className="h-2 bg-slate-200 rounded-full w-3/4" />
              <div className="h-2 bg-slate-200 rounded-full w-5/6" />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Quick Add Menüsü
  const QuickAddMenu = () => (
    <AnimatePresence>
      {showQuickAdd && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuickAdd(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Hızlı Kayıt</h2>
            <div className="grid grid-cols-4 gap-4">
              <QuickAddBtn 
                onClick={() => { setShowQuickAdd(false); setShowVoiceQuickAdd(true); }}
                icon={<Mic size={24} />} 
                label="Sesli" 
                color="bg-red-50 text-red-600" 
              />
              <QuickAddBtn 
                onClick={() => { setShowQuickAdd(false); setShowAddVisit(true); }}
                icon={<MapPin size={24} />} 
                label="Ziyaret" 
                color="bg-orange-50 text-orange-600" 
              />
              <QuickAddBtn 
                onClick={() => { setShowQuickAdd(false); setShowAddLead(true); }}
                icon={<Users size={24} />} 
                label="Lead" 
                color="bg-emerald-50 text-emerald-600" 
              />
              <QuickAddBtn 
                onClick={() => { setShowQuickAdd(false); setShowAddProperty(true); }}
                icon={<Home size={24} />} 
                label="Portföy" 
                color="bg-purple-50 text-purple-600" 
              />
            </div>
            <button 
              onClick={() => setShowQuickAdd(false)}
              className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
            >
              Vazgeç
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const QuickAddBtn = ({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group">
      <div className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center transition-transform group-active:scale-90`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </button>
  );

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-lg flex items-center justify-center shadow-sm">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100] tracking-wide">Portfy</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İyi Çalışmalar, {profile?.displayName.split(' ')[0]}</h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">Bugün bölge hakimiyetini artırma zamanı.</p>
        </div>
        <div className="relative" onClick={() => setActiveTab('profil')}>
          <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} alt="Profile" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
        </div>
      </header>

      {/* Gamification Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Missed Opportunities Trigger Card */}
        {missedOpportunities.length > 0 && (
          <Card 
            onClick={() => setShowMissedOpportunities(true)}
            className="sm:col-span-2 bg-red-50 border-red-100 p-6 relative overflow-hidden cursor-pointer active:scale-95 transition-all"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-900">Kaçırılan Fırsatlar Var!</h4>
                  <p className="text-xs text-red-700 mt-1">{missedOpportunities.length} kritik aksiyon bekliyor.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-red-400" />
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          </Card>
        )}

        {/* Rescue Mode Trigger Card */}
        {(() => {
          const currentHour = new Date().getHours();
          const isLowProgress = (gamifiedStats?.dailyProgress || 0) < 40;
          const canRescue = currentHour >= 15 && isLowProgress && !rescueSession;
          
          if (!canRescue) return null;

          return (
            <Card className="sm:col-span-2 bg-orange-50 border-orange-100 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-orange-900">Günü Kurtarma Zamanı!</h4>
                    <p className="text-xs text-orange-700 mt-1">Günü %100 verimle kapatmak için hala vaktin var.</p>
                  </div>
                </div>
                <button 
                  onClick={() => startRescueMutation.mutate()}
                  disabled={startRescueMutation.isPending}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  {startRescueMutation.isPending ? 'Hazırlanıyor...' : 'Başlat'}
                </button>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            </Card>
          );
        })()}

        <Card id="momentum-card" className="!bg-slate-900 !text-white border-none overflow-hidden relative sm:col-span-2">
          <div className="relative z-10 flex items-center gap-6">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800 stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${gamifiedStats?.momentum && gamifiedStats.momentum < 40 ? 'text-red-500' : gamifiedStats?.momentum && gamifiedStats.momentum < 70 ? 'text-amber-500' : 'text-emerald-500'} stroke-current`}
                  strokeWidth="3"
                  strokeDasharray={`${gamifiedStats?.momentum || 0}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold text-white">{gamifiedStats?.momentum || 0}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400">Momentum</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-500">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Koç Önerisi</span>
              </div>
              <p className="text-sm font-bold leading-relaxed text-white italic">
                "{coachInsights?.dailyTip || 'Yükleniyor...'}"
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        </Card>

        <Card id="points-card" className="!bg-orange-600 !text-white border-none shadow-lg shadow-orange-200">
          <div className="flex justify-between items-start">
            <Trophy size={20} className="text-white opacity-80" />
            <Badge variant="info" className="!bg-white !text-orange-600 border-none">{gamifiedStats?.levelName || '...'}</Badge>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{gamifiedStats?.points.toLocaleString() || '0'}</div>
            <div className="text-white font-bold text-[10px] uppercase tracking-wider mt-1">Toplam Puan</div>
            {gamifiedStats && gamifiedStats.pointsToday > 0 && (
              <div className="text-white/80 text-[8px] font-bold mt-1">Bugün: +{gamifiedStats.pointsToday}</div>
            )}
          </div>
        </Card>

        <Card id="streak-card">
          <div className="flex justify-between items-start">
            <Zap size={20} className="text-amber-500" />
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seri</div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{gamifiedStats?.streak || 0} Gün</div>
            <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider mt-1">Peş Peşe Seri</div>
          </div>
        </Card>
      </section>

      {/* Daily Tasks */}
      <section id="daily-tasks" className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Bugünkü Görevler</h2>
            <button 
              onClick={() => refreshTasksMutation.mutate()}
              disabled={refreshTasksMutation.isPending}
              className={`p-1.5 text-slate-400 hover:text-orange-600 transition-colors ${refreshTasksMutation.isPending ? 'animate-spin' : ''}`}
              title="Görevleri Yenile"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="text-xs font-bold text-orange-900 bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
            {gamifiedStats?.tasksCompletedToday}/{gamifiedStats?.totalTasksToday} Tamamlandı
          </div>
        </div>
        <div className="space-y-3">
          {isGamifiedTasksLoading ? (
            <div className="p-10 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Görevler yükleniyor...</p>
            </div>
          ) : gamifiedTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <RefreshCw size={32} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Bugün için henüz görev oluşturulmadı.</p>
              <button 
                onClick={() => refreshTasksMutation.mutate()}
                className="mt-4 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-100 flex items-center gap-2 mx-auto active:scale-95 transition-all"
              >
                <RefreshCw size={14} className={refreshTasksMutation.isPending ? 'animate-spin' : ''} />
                Görevleri Oluştur
              </button>
            </div>
          ) : [...gamifiedTasks].sort((a, b) => {
            const coreTitles = ["Peş peşe girişini sürdür", "Bugün 100 puan kazan"];
            const aIsCore = coreTitles.includes(a.title);
            const bIsCore = coreTitles.includes(b.title);
            if (aIsCore && !bIsCore) return -1;
            if (!aIsCore && bIsCore) return 1;
            return 0;
          }).map(task => (
            <Card 
              key={task.id} 
              className={`transition-all ${task.isCompleted ? 'opacity-60 bg-slate-50' : 'hover:border-orange-200'}`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => !task.isCompleted && completeTaskMutation.mutate({ taskId: task.id, points: task.points })}
                  disabled={task.isCompleted || completeTaskMutation.isPending}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    task.isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-700'
                  }`}
                >
                  {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <Badge variant={task.category === 'main' ? 'warning' : task.category === 'smart' ? 'info' : 'default'}>
                      {task.category === 'main' ? 'Ana' : task.category === 'smart' ? 'Akıllı' : 'Tatlı'}
                    </Badge>
                  </div>
                  {task.aiReason && !task.isCompleted && (
                    <p className="text-[10px] text-slate-700 mt-1 flex items-center gap-1 font-bold">
                      <Sparkles size={10} className="text-orange-600" /> {task.aiReason}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${task.isCompleted ? 'text-slate-400' : 'text-orange-600'}`}>
                    +{task.points}
                  </div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Puan</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Active Leads */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Sıcak Müşteriler</h2>
          <button onClick={() => setActiveTab('crm')} className="text-orange-600 text-xs font-bold">Tümünü Gör</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.filter(l => l.behaviorMetrics?.isHot).length === 0 ? (
            <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-2xl w-full text-center border border-dashed border-slate-200 col-span-full">
              Şu an sıcak müşteri tespiti yok.
            </div>
          ) : (
            leads.filter(l => l.behaviorMetrics?.isHot).map(lead => (
              <Card key={lead.id} className="border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-orange-600 uppercase">Sıcak</span>
                    <span className="text-[10px] text-slate-400">{lead.behaviorMetrics?.totalViews} Görüntüleme</span>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                <p className="text-xs text-slate-500 mt-1">Son aktif: {lead.behaviorMetrics?.lastActive}</p>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                    <Phone size={12} /> Ara
                  </button>
                  <button className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                    <MessageSquare size={12} /> WhatsApp
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Smart Actions / Alerts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Akıllı Öneriler</h2>
        {properties.some(p => p.marketAnalysis?.status === 'Pahalı' && p.status === 'Yayında') ? (
          properties.filter(p => p.marketAnalysis?.status === 'Pahalı' && p.status === 'Yayında').slice(0, 1).map(p => (
            <Card key={`alert-${p.id}`} className="bg-amber-50 border-amber-100">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Fiyat Revizesi Önerisi</h4>
                  <p className="text-xs text-amber-700 mt-1">"{p.title}" portföyü piyasa ortalamasının üzerinde. %5 indirim satışı hızlandırabilir.</p>
                  <button onClick={() => { setSelectedProperty(p); }} className="mt-3 text-xs font-bold text-amber-900 flex items-center gap-1">
                    Aksiyon Al <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-emerald-50 border-emerald-100">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">Her Şey Yolunda</h4>
                <p className="text-xs text-emerald-700 mt-1">Şu an acil aksiyon gerektiren bir portföyün bulunmuyor.</p>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Focus Task */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Sıradaki Odak</h2>
          <button onClick={() => setActiveTab('crm')} className="text-orange-600 text-xs font-bold">Ajandaya Git</button>
        </div>
        {tasks.filter(t => !t.completed).length > 0 ? (
          tasks.filter(t => !t.completed).slice(0, 1).map(task => (
            <Card key={`focus-${task.id}`} className="border-l-4 border-l-orange-600">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  {task.type === 'Arama' ? <Phone size={24} /> : task.type === 'Randevu' ? <Calendar size={24} /> : <MapPin size={24} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{task.time}</p>
                </div>
                <button 
                  onClick={() => api.updateTaskStatus(task.id, true).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                  className="p-2 bg-slate-50 rounded-xl text-slate-400"
                >
                  <CheckCircle2 size={20} />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-50 border-dashed border-slate-200">
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 italic">Şu an bekleyen bir görev yok.</p>
            </div>
          </Card>
        )}
      </section>
    </motion.div>
  );

  const renderPortfolios = () => {
    const statuses = ['Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı'];
    
    const filteredProperties = properties.filter(p => {
      const matchesDistrict = selectedDistrict === 'all' || p.address.district === selectedDistrict;
      return matchesDistrict;
    });

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-screen"
      >
        {/* Sub Header */}
        <div className="p-6 pb-2 space-y-4 bg-white border-b border-slate-100">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portföylerim</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImportUrlModal(true)}
                className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all flex items-center gap-2 text-xs font-bold"
              >
                <Globe size={18} /> URL İçe Aktar
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                <LayoutDashboard size={20} />
              </button>
              <button 
                onClick={() => setViewMode('pipeline')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'pipeline' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                <BarChart3 size={20} />
              </button>
            </div>
          </div>
          
          {/* Search & Filter */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Portföy ara..." 
                  className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                <Filter size={20} />
              </button>
            </div>

            {/* District Filter (Sorted by Efficiency) */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
              <button 
                onClick={() => setSelectedDistrict('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${selectedDistrict === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                Tümü
              </button>
              {regionScores.map((region: any) => (
                <button 
                  key={region.district}
                  onClick={() => setSelectedDistrict(region.district)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap flex items-center gap-2 transition-all ${selectedDistrict === region.district ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {region.district}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${selectedDistrict === region.district ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    %{region.score}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {viewMode === 'list' ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propertiesLoading ? (
                <div className="text-center p-12 text-slate-400 col-span-full">Yükleniyor...</div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center p-20 space-y-4 col-span-full">
                  <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
                    <Home size={40} />
                  </div>
                  <p className="text-slate-500 text-sm">Bu bölgede henüz portföy yok.</p>
                </div>
              ) : filteredProperties.map(p => (
                <PropertyCard key={p.id} property={p} onClick={() => setSelectedProperty(p)} />
              ))}
            </div>
          ) : (
            <div className="p-6 flex gap-6 overflow-x-auto h-full items-start">
              {statuses.map(status => (
                <PipelineColumn 
                  key={status} 
                  title={status} 
                  status={status}
                  properties={filteredProperties.filter(p => p.status === status)} 
                  onPropertyClick={(p) => setSelectedProperty(p)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderProfil = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-slate-200 rounded-[32px] mx-auto overflow-hidden border-4 border-white shadow-xl">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} alt="Profile" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{profile?.displayName}</h2>
          <p className="text-slate-500 text-sm">{profile?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {profile?.role === 'admin' && (
          <Card className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-purple-100" onClick={() => setShowAdminPanel(true)}>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">Admin Paneli</h4>
              <p className="text-xs text-slate-500">
                Kullanıcıları ve sistem ayarlarını yönet
              </p>
            </div>
            <ArrowRight size={20} className="text-slate-400" />
          </Card>
        )}

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <CreditCard size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">Üyelik Durumu</h4>
            <p className="text-xs text-slate-500">
              {profile?.subscriptionType === 'none' ? 'Aktif Üyelik Yok' : `${profile?.subscriptionType.split('-')[0]} Aylık Plan`}
            </p>
          </div>
          <Badge variant="success">Aktif</Badge>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Globe size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">sahibinden.com Entegrasyonu</h4>
              <p className="text-xs text-slate-500">
                {brokerAccount ? `${brokerAccount.storeName} Bağlı` : 'Resmi API ile bağla'}
              </p>
            </div>
            <button 
              onClick={() => brokerAccount ? setShowExternalListings(true) : setShowIntegrationModal(true)}
              className="p-2 bg-slate-100 rounded-xl text-slate-600"
            >
              {brokerAccount ? <ExternalLink size={18} /> : <Plus size={18} />}
            </button>
          </div>
          {brokerAccount && (
            <div className="flex gap-2">
              <button 
                onClick={() => syncListingsMutation.mutate()}
                disabled={syncListingsMutation.isPending}
                className="flex-1 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} className={syncListingsMutation.isPending ? 'animate-spin' : ''} />
                Şimdi Senkronize Et
              </button>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Bell size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">Günlük Bildirim</h4>
              <p className="text-xs text-slate-500">Hatırlatma saati ayarla</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="time" 
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={profile?.notificationTime || "09:00"}
              onChange={(e) => {
                if (profile) {
                  updateProfileMutation.mutate({ uid: profile.uid, data: { notificationTime: e.target.value } });
                }
              }}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <MessageSquare size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">Mesaj Şablonları</h4>
              <p className="text-xs text-slate-500">Hızlı paylaşım mesajlarını yönet</p>
            </div>
            <button 
              onClick={() => setShowTemplateManager(true)}
              className="p-2 bg-slate-100 rounded-xl text-slate-600"
            >
              <Plus size={18} />
            </button>
          </div>
        </Card>

        <button 
          onClick={logout}
          className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Çıkış Yap
        </button>
      </div>
    </motion.div>
  );


  const renderCRM = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteri Rehberi</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWhatsAppImport(true)} 
            className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-2 text-xs font-bold"
          >
            <MessageSquare size={18} />
            WhatsApp'tan Aktar
          </button>
          <button onClick={() => setShowAddLead(true)} className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Müşteri ara..." 
            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm shadow-sm"
          />
        </div>
        <button 
          onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
          disabled={isAnalyzingLeads || leads.length === 0}
          className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center gap-2 text-xs font-bold disabled:opacity-50"
        >
          {isAnalyzingLeads ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={16} /></motion.div>
          ) : <Sparkles size={16} />}
          Rehber Analizi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leadsLoading ? (
          <div className="text-center p-12 text-slate-400 col-span-full">Yükleniyor...</div>
        ) : leads.length === 0 ? (
          <div className="text-center p-20 space-y-4 col-span-full">
            <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
              <Users size={40} />
            </div>
            <p className="text-slate-500 text-sm">Henüz müşteri kaydetmedin.</p>
          </div>
        ) : leads.map(lead => {
          const category = categories.find(c => c.label === lead.type);
          const iconColor = category ? category.color : (lead.type === 'Alıcı' ? '#ea580c' : '#9333ea');
          const iconBg = category ? `${category.color}20` : (lead.type === 'Alıcı' ? '#fff7ed' : '#faf5ff');
          
          return (
          <Card key={lead.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: iconBg, color: iconColor }}
              >
                <UserIcon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={lead.status === 'Sıcak' ? 'warning' : 'default'}>{lead.status}</Badge>
                  <span className="text-[10px] text-slate-400">{lead.type}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a 
                href={`tel:${lead.phone}`}
                className="p-2 bg-slate-50 rounded-xl text-orange-600"
              >
                <Phone size={18} />
              </a>
              <a 
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-50 rounded-xl text-emerald-500"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </Card>
        )})}
      </div>
    </motion.div>
  );


  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-900 selection:bg-orange-100">
      {/* Mandatory Region Setup */}
      {profile && !profile.region && (
        <RegionSetupModal profile={profile} onComplete={() => queryClient.invalidateQueries({ queryKey: ['profile'] })} />
      )}
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto min-h-screen">
        {/* Desktop Sidebar */}
        <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Building2 size={24} />
            </div>
            <span className="text-2xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100] tracking-wide">Portfy</span>
          </div>
          
          <div className="space-y-2 flex-1">
            <SidebarLink 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard' && !showAdminPanel} 
              onClick={() => { setActiveTab('dashboard'); setShowAdminPanel(false); }} 
            />
            <SidebarLink 
              icon={<MapIcon size={20} />} 
              label="Bölgem" 
              active={activeTab === 'bolgem' && !showAdminPanel} 
              onClick={() => { setActiveTab('bolgem'); setShowAdminPanel(false); }} 
            />
            <SidebarLink 
              icon={<Briefcase size={20} />} 
              label="Portföyler" 
              active={activeTab === 'portfoyler' && !showAdminPanel} 
              onClick={() => { setActiveTab('portfoyler'); setShowAdminPanel(false); }} 
            />
            <SidebarLink 
              icon={<Users size={20} />} 
              label="CRM" 
              active={activeTab === 'crm' && !showAdminPanel} 
              onClick={() => { setActiveTab('crm'); setShowAdminPanel(false); }} 
            />
            <SidebarLink 
              icon={<MessageSquare size={20} />} 
              label="Notlar" 
              active={activeTab === 'notes' && !showAdminPanel} 
              onClick={() => { setActiveTab('notes'); setShowAdminPanel(false); }} 
            />
            <SidebarLink 
              icon={<Brain size={20} />} 
              label="AI Koç" 
              active={activeTab === 'koc' && !showAdminPanel} 
              onClick={() => { setActiveTab('koc'); setShowAdminPanel(false); }} 
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            {profile?.role === 'admin' && (
              <SidebarLink 
                icon={<ShieldCheck size={20} />} 
                label="Admin Paneli" 
                active={showAdminPanel} 
                onClick={() => setShowAdminPanel(true)} 
              />
            )}
            <SidebarLink 
              icon={<UserIcon size={20} />} 
              label="Profilim" 
              active={activeTab === 'profil' && !showAdminPanel} 
              onClick={() => { setActiveTab('profil'); setShowAdminPanel(false); }} 
            />
          </div>
        </aside>

        <main className="flex-1 w-full max-w-md md:max-w-none mx-auto px-4 md:px-8 py-6">
          {showAdminPanel ? (
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'bolgem' && <BolgemView profile={profile} />}
              {activeTab === 'portfoyler' && renderPortfolios()}
              {activeTab === 'crm' && renderCRM()}
              {activeTab === 'notes' && <NotesView />}
              {activeTab === 'profil' && renderProfil()}
              {activeTab === 'koc' && <CoachView />}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Quick Add Menu */}
      <QuickAddMenu />
      <VoiceQuickAddModal />
      
      {/* Modals */}
      <AddPropertyModal />
      <AddLeadModal />
      <AddVisitModal />
      <WhatsAppImportModal />
      <LeadAnalysisModal />
      <DailyBriefingModal />
      <TemplateManagerModal />
      <TemplateSelectorModal />
      <IntegrationModal />
      <ExternalListingsModal />
      <ImportUrlModal />
      <PropertyDetailModal />
      <RescueModeModal />
      <MissedOpportunitiesModal />
      <SharePanel />
      <MarketingHubModal />

      {/* Floating Action Button */}
      <button 
        id="quick-add-fab"
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-orange-600 z-50"
      >
        <Plus size={32} />
      </button>

      {/* Bottom Navigation (Mobile Only) */}
      <nav id="bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 pb-safe">
        <NavButton 
          id="nav-dashboard"
          icon={<LayoutDashboard size={24} />} 
          active={activeTab === 'dashboard' && !showAdminPanel} 
          onClick={() => { setActiveTab('dashboard'); setShowAdminPanel(false); }} 
        />
        <NavButton 
          id="nav-map"
          icon={<MapIcon size={24} />} 
          active={activeTab === 'bolgem' && !showAdminPanel} 
          onClick={() => { setActiveTab('bolgem'); setShowAdminPanel(false); }} 
        />
        <NavButton 
          id="nav-portfolio"
          icon={<Briefcase size={24} />} 
          active={activeTab === 'portfoyler' && !showAdminPanel} 
          onClick={() => { setActiveTab('portfoyler'); setShowAdminPanel(false); }} 
        />
        <NavButton 
          id="nav-crm"
          icon={<Users size={24} />} 
          active={activeTab === 'crm' && !showAdminPanel} 
          onClick={() => { setActiveTab('crm'); setShowAdminPanel(false); }} 
        />
        <NavButton 
          id="nav-notes"
          icon={<MessageSquare size={24} />} 
          active={activeTab === 'notes' && !showAdminPanel} 
          onClick={() => { setActiveTab('notes'); setShowAdminPanel(false); }} 
        />
        {profile?.role === 'admin' && (
          <NavButton 
            id="nav-admin"
            icon={<ShieldCheck size={24} />} 
            active={showAdminPanel} 
            onClick={() => setShowAdminPanel(true)} 
          />
        )}
      </nav>

      {/* Onboarding Tour */}
      {profile && !profile.hasSeenTour && activeTab === 'dashboard' && (
        <AppTour onComplete={() => completeTour()} />
      )}
    </div>
  );
}

function NavButton({ icon, active, onClick, id }: { icon: React.ReactNode, active: boolean, onClick: () => void, id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={`relative p-2 transition-all ${active ? 'text-orange-600' : 'text-slate-400'}`}
    >
      {icon}
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full"
        />
      )}
    </button>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        active 
          ? 'bg-orange-50 text-orange-600 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

const AppContent = () => {
  const { user, profile, loading, isSubscribed, completeOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  
  if (profile && !profile.hasSeenOnboarding) {
    return <IntroSequence onComplete={() => completeOnboarding()} />;
  }

  if (!isSubscribed) return <PricingScreen />;

  return <MainApp />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
