import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
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
  Lock,
  Moon,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, Task, Building, Property, UserProfile, MessageTemplate, BrokerAccount, ExternalListing, GamifiedTask, UserStats, RescueSession, RescueTask, MissedOpportunity, VoiceParseResult, PersonalTask, UserNote } from './types';
import { api } from './services/api';
import { locationService } from './services/locationService';
import { AuthProvider, useAuth } from './AuthContext';
import { Badge } from './components/UI';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardView } from './components/DashboardView';
import { PortfoliosPage, PortfolioModals } from './pages/PortfoliosPage';
import { ProfilView } from './components/ProfilView';
import { CRMPage, CRMModals } from './pages/CRMPage';
import { NotesView } from './components/NotesView';
import { RegionSetupModal } from './components/RegionSetupModal';
import { DailyRadar } from './components/habit/DailyRadar';
import { DayCloser } from './components/habit/DayCloser';
import { AICoachPanel } from './components/ai/AICoachPanel';
import { RevenueOverview } from './components/revenue/RevenueOverview';
import { PipelineFunnel } from './components/revenue/PipelineFunnel';
import { useRevenueStats } from './hooks/useRevenueStats';
import { formatCurrency } from './lib/revenueUtils';
import { useCategories } from './hooks/useCategories';
import { QUERY_KEYS } from './constants/queryKeys';

import { MainContentRouter, NavigationProps, LeadProps, PortfolioProps, UtilityProps } from './components/app/MainContentRouter';
import { AppModals } from './components/app/AppModals';
import { LoadingFallback } from './components/app/LoadingFallback';
import { CoachView } from './components/app/CoachView';

const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const BolgemView = React.lazy(() => import('./components/BolgemView'));
const PricingScreen = React.lazy(() => import('./components/PricingScreen'));

// --- React Query Client ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 dakika cache
    },
  },
});

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

// --- Notification Center ---
const NotificationCenter = ({ 
  personalTasks, 
  gamifiedTasks, 
  onNotify 
}: { 
  personalTasks: PersonalTask[], 
  gamifiedTasks: GamifiedTask[],
  onNotify: (task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified') => void
}) => {
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      // Check personal tasks
      personalTasks.forEach(task => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate <= now) {
            onNotify(task, 'personal');
          }
        }
      });

      // Check gamified tasks
      gamifiedTasks.forEach(task => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate <= now) {
            onNotify(task, 'gamified');
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [personalTasks, gamifiedTasks, onNotify]);

  return null;
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

const QuickAddBtn = ({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-3 group">
    <div className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center transition-transform group-active:scale-90`}>
      {icon}
    </div>
    <span className="text-xs font-bold text-slate-600">{label}</span>
  </button>
);

const QuickAddMenu = ({ 
  show, 
  onClose, 
  onVoice, 
  onVisit, 
  onLead, 
  onPortfolio 
}: { 
  show: boolean, 
  onClose: () => void, 
  onVoice: () => void, 
  onVisit: () => void, 
  onLead: () => void, 
  onPortfolio: () => void 
}) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
              onClick={onVoice}
              icon={<Mic size={24} />} 
              label="Sesli" 
              color="bg-red-50 text-red-600" 
            />
            <QuickAddBtn 
              onClick={onVisit}
              icon={<MapPin size={24} />} 
              label="Ziyaret" 
              color="bg-orange-50 text-orange-600" 
            />
            <QuickAddBtn 
              onClick={onLead}
              icon={<Users size={24} />} 
              label="Lead" 
              color="bg-emerald-50 text-emerald-600" 
            />
            <QuickAddBtn 
              onClick={onPortfolio}
              icon={<Home size={24} />} 
              label="Portföy" 
              color="bg-purple-50 text-purple-600" 
            />
          </div>
          <button 
            onClick={onClose}
            className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
          >
            Vazgeç
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const RitualOverlays = ({ 
  showDailyRadar, 
  dailyRadarData, 
  showDayCloser, 
  completeMorningRitualMutation, 
  completeEveningRitualMutation, 
  gamifiedTasks, 
  personalTasks, 
  properties, 
  tasks 
}: { 
  showDailyRadar: boolean, 
  dailyRadarData: { tasks: string[], insight: string } | null, 
  showDayCloser: boolean, 
  completeMorningRitualMutation: any, 
  completeEveningRitualMutation: any, 
  gamifiedTasks: GamifiedTask[], 
  personalTasks: PersonalTask[], 
  properties: Property[], 
  tasks: Task[] 
}) => (
  <AnimatePresence>
    {showDailyRadar && (
      dailyRadarData ? (
        <DailyRadar 
          tasks={dailyRadarData.tasks}
          insight={dailyRadarData.insight}
          onComplete={() => completeMorningRitualMutation.mutate()}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"
            />
            <p className="text-orange-500 font-bold animate-pulse">Radar Hazırlanıyor...</p>
          </div>
        </motion.div>
      )
    )}

    {showDayCloser && (
      <DayCloser 
        isPending={completeEveningRitualMutation.isPending}
        stats={{
          tasks_completed: gamifiedTasks.filter(t => t.is_completed).length + personalTasks.filter(t => t.is_completed).length,
          revenue: properties.reduce((acc, p) => acc + ((p.price * p.commission_rate) / 100) * (p.sale_probability || 0.5), 0),
          calls: tasks.filter(t => t.type === 'Arama' && t.completed).length,
          visits: tasks.filter(t => t.type === 'Saha' && t.completed).length
        }}
        onComplete={() => {
          completeEveningRitualMutation.mutate({
            tasks_completed: gamifiedTasks.filter(t => t.is_completed).length + personalTasks.filter(t => t.is_completed).length,
            revenue: properties.reduce((acc, p) => acc + ((p.price * p.commission_rate) / 100) * (p.sale_probability || 0.5), 0),
            calls: tasks.filter(t => t.type === 'Arama' && t.completed).length,
            visits: tasks.filter(t => t.type === 'Saha' && t.completed).length
          });
        }}
      />
    )}
  </AnimatePresence>
);

const DesktopSidebar = ({ 
  activeTab, 
  showAdminPanel, 
  profile, 
  onTabChange, 
  onAdminClick 
}: { 
  activeTab: string, 
  showAdminPanel: boolean, 
  profile: UserProfile | null, 
  onTabChange: (tab: string) => void, 
  onAdminClick: () => void 
}) => (
  <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen">
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
        onClick={() => onTabChange('dashboard')} 
      />
      <SidebarLink 
        icon={<MapIcon size={20} />} 
        label="Bölgem" 
        active={activeTab === 'bolgem' && !showAdminPanel} 
        onClick={() => onTabChange('bolgem')} 
      />
      <SidebarLink 
        icon={<Briefcase size={20} />} 
        label="Portföyler" 
        active={activeTab === 'portfoyler' && !showAdminPanel} 
        onClick={() => onTabChange('portfoyler')} 
      />
      <SidebarLink 
        icon={<Users size={20} />} 
        label="CRM" 
        active={activeTab === 'crm' && !showAdminPanel} 
        onClick={() => onTabChange('crm')} 
      />
      <SidebarLink 
        icon={<MessageSquare size={20} />} 
        label="Notlar" 
        active={activeTab === 'notes' && !showAdminPanel} 
        onClick={() => onTabChange('notes')} 
      />
      <SidebarLink 
        icon={<Brain size={20} />} 
        label="AI Koç" 
        active={activeTab === 'koc' && !showAdminPanel} 
        onClick={() => onTabChange('koc')} 
      />
    </div>

    <div className="pt-6 border-t border-slate-100">
      {profile?.role === 'admin' && (
        <SidebarLink 
          icon={<ShieldCheck size={20} />} 
          label="Admin Paneli" 
          active={showAdminPanel} 
          onClick={onAdminClick} 
        />
      )}
      <SidebarLink 
        icon={<UserIcon size={20} />} 
        label="Profilim" 
        active={activeTab === 'profil' && !showAdminPanel} 
        onClick={() => onTabChange('profil')} 
      />
    </div>
  </aside>
);

const MobileNav = ({ 
  activeTab, 
  showAdminPanel, 
  profile, 
  onTabChange, 
  onAdminClick 
}: { 
  activeTab: string, 
  showAdminPanel: boolean, 
  profile: UserProfile | null, 
  onTabChange: (tab: string) => void, 
  onAdminClick: () => void 
}) => (
  <nav id="bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 pb-safe">
    <NavButton 
      id="nav-dashboard"
      icon={<LayoutDashboard size={24} />} 
      active={activeTab === 'dashboard' && !showAdminPanel} 
      onClick={() => onTabChange('dashboard')} 
    />
    <NavButton 
      id="nav-map"
      icon={<MapIcon size={24} />} 
      active={activeTab === 'bolgem' && !showAdminPanel} 
      onClick={() => onTabChange('bolgem')} 
    />
    <NavButton 
      id="nav-portfolio"
      icon={<Briefcase size={24} />} 
      active={activeTab === 'portfoyler' && !showAdminPanel} 
      onClick={() => onTabChange('portfoyler')} 
    />
    <NavButton 
      id="nav-crm"
      icon={<Users size={24} />} 
      active={activeTab === 'crm' && !showAdminPanel} 
      onClick={() => onTabChange('crm')} 
    />
    <NavButton 
      id="nav-notes"
      icon={<MessageSquare size={24} />} 
      active={activeTab === 'notes' && !showAdminPanel} 
      onClick={() => onTabChange('notes')} 
    />
    {profile?.role === 'admin' && (
      <NavButton 
        id="nav-admin"
        icon={<ShieldCheck size={24} />} 
        active={showAdminPanel} 
        onClick={onAdminClick} 
      />
    )}
  </nav>
);

const Header = ({ 
  activeTab, 
  profile 
}: { 
  activeTab: string, 
  profile: UserProfile | null 
}) => (
  <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
    <div className="flex flex-col">
      <h1 className="text-xl font-bold text-slate-900">
        {activeTab === 'dashboard' && 'Hoş Geldin, ' + (profile?.display_name?.split(' ')[0] || 'Danışman')}
        {activeTab === 'bolgem' && 'Bölge Analizi'}
        {activeTab === 'portfoyler' && 'Portföylerim'}
        {activeTab === 'crm' && 'Müşteri Yönetimi'}
        {activeTab === 'notes' && 'Notlarım'}
        {activeTab === 'profil' && 'Profilim'}
        {activeTab === 'koc' && 'Yapay Zeka Koçu'}
      </h1>
      <p className="text-xs text-slate-500 font-medium">
        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
        {profile?.display_name?.[0] || 'U'}
      </div>
    </div>
  </header>
);

const NotificationToast = ({ notification, onClose }: { notification: { task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified' } | null, onClose: () => void }) => (
  <AnimatePresence>
    {notification && (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 20, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
      >
        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Bell size={24} className="animate-bounce" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Görev Hatırlatıcısı</h4>
            <p className="text-xs text-slate-400 mt-1">{notification.task.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const GlobalToast = ({ toast }: { toast: { message: string, type: 'success' | 'error' | 'info' } | null }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        style={{ zIndex: 9999 }}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${
          toast.type === 'error' 
            ? 'bg-red-500 text-white border-red-400' 
            : toast.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-900 text-white border-slate-700'
        }`}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-tight">{toast.type === 'error' ? 'Hata' : 'Başarılı'}</span>
          <span className="text-xs font-medium opacity-90">{toast.message}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const FloatingActionButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    id="quick-add-fab"
    onClick={onClick}
    className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-orange-600 z-50"
  >
    <Plus size={32} />
  </button>
);

function MainApp() {
  const queryClient = useQueryClient();
  const { profile, logout, completeTour } = useAuth();
  const { categories } = useCategories();

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [notification, setNotification] = useState<{ task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified' } | null>(null);

  // --- Modal Visibility State ---
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showVoiceQuickAdd, setShowVoiceQuickAdd] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false);
  const [showDailyRadar, setShowDailyRadar] = useState(false);
  const [showDayCloser, setShowDayCloser] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showExternalListings, setShowExternalListings] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);

  const closeAllModals = () => {
    setShowQuickAdd(false);
    setShowVoiceQuickAdd(false);
    setShowAddProperty(false);
    setShowAddLead(false);
    setShowAddVisit(false);
    setShowWhatsAppImport(false);
    setShowDailyRadar(false);
    setShowDayCloser(false);
    setShowDailyBriefing(false);
    setShowTemplateManager(false);
    setShowTemplateSelector(false);
    setShowIntegrationModal(false);
    setShowExternalListings(false);
    setShowImportUrlModal(false);
    setShowMissedOpportunities(false);
  };

  // --- Data Selection & Analysis State ---
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | 'all'>('all');
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  // --- Queries ---
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: [QUERY_KEYS.LEADS, profile?.uid],
    queryFn: api.getLeads,
    enabled: !!profile?.uid
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, profile?.uid],
    queryFn: api.getProperties,
    enabled: !!profile?.uid
  });

  const { data: personalTasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.uid],
    queryFn: api.getPersonalTasks,
    enabled: !!profile?.uid
  });

  const { data: gamifiedTasks = [], isLoading: isGamifiedTasksLoading } = useQuery({
    queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.uid
  });

  const { data: fieldVisits = [] } = useQuery({
    queryKey: [QUERY_KEYS.FIELD_VISITS, profile?.uid],
    queryFn: api.getFieldVisits,
    enabled: !!profile?.uid
  });

  const { data: tasks = [] } = useQuery({
    queryKey: [QUERY_KEYS.TASKS, profile?.uid],
    queryFn: api.getTasks,
    enabled: !!profile?.uid
  });

  const { data: regionScores = [] } = useQuery({
    queryKey: [QUERY_KEYS.REGION_SCORES, profile?.uid],
    queryFn: api.getRegionEfficiencyScores,
    enabled: !!profile?.uid
  });

  const { data: templates = [] } = useQuery({
    queryKey: [QUERY_KEYS.TEMPLATES, profile?.uid],
    queryFn: api.getMessageTemplates,
    enabled: !!profile?.uid
  });

  const { data: brokerAccount } = useQuery({
    queryKey: [QUERY_KEYS.BROKER_ACCOUNT],
    queryFn: api.getBrokerAccount
  });

  const { data: externalListings = [] } = useQuery({
    queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS],
    queryFn: api.getExternalListings
  });

  const { data: rescueSession } = useQuery({
    queryKey: [QUERY_KEYS.RESCUE_SESSION],
    queryFn: api.getRescueSession
  });

  const { data: missedOpportunities = [] } = useQuery({
    queryKey: [QUERY_KEYS.MISSED_OPPORTUNITIES],
    queryFn: api.getMissedOpportunities
  });

  const { data: dailyRadarData } = useQuery({
    queryKey: [QUERY_KEYS.DAILY_RADAR, profile?.uid],
    queryFn: api.getDailyRadar,
    enabled: !!profile?.uid && showDailyRadar
  });

  // --- Mutations ---
  const addLeadMutation = useMutation({
    mutationFn: api.addLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES] });
      setShowAddLead(false);
      setShowQuickAdd(false);
    }
  });

  const addVisitMutation = useMutation({
    mutationFn: api.addVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FIELD_VISITS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REGION_SCORES] });
      setShowAddVisit(false);
      setShowQuickAdd(false);
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: api.addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
    }
  });

  const addTemplateMutation = useMutation({
    mutationFn: api.addMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TEMPLATES] });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: api.deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TEMPLATES] });
    }
  });

  const updatePersonalTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<PersonalTask> }) => api.updatePersonalTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERSONAL_TASKS, profile?.uid] })
  });

  const updateGamifiedTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<GamifiedTask> }) => api.updateGamifiedTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_TASKS, profile?.uid] })
  });

  const completeMorningRitualMutation = useMutation({
    mutationFn: async () => {
      await api.startDay();
      return api.completeMorningRitual();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS] });
      setShowDailyRadar(false);
      setToast({ message: "Güne harika bir başlangıç yaptın!", type: 'success' });
    }
  });

  const completeEveningRitualMutation = useMutation({
    mutationFn: async (stats: any) => {
      await api.endDay(stats);
      return api.completeEveningRitual(stats);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DAILY_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS] });
      setShowDayCloser(false);
      setToast({ message: "Günü başarıyla kapattın. İyi dinlenmeler!", type: 'success' });
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF3D00', '#3b82f6', '#10b981']
      });
    },
    onError: (error: any) => {
      setToast({ message: "Günü kapatırken bir hata oluştu: " + error.message, type: 'error' });
    }
  });

  const cancelRescueMutation = useMutation({
    mutationFn: api.cancelRescueSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION] });
    }
  });

  const completeRescueTaskMutation = useMutation({
    mutationFn: ({ sessionId, taskId }: { sessionId: string, taskId: string }) => api.completeRescueTask(sessionId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RESCUE_SESSION] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GAMIFICATION_STATS] });
    }
  });

  const analyzeLeadsMutation = useMutation({
    mutationFn: api.analyzeLeads,
    onSuccess: (data) => {
      setLeadAnalysis(data);
      setIsAnalyzingLeads(false);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string, data: Partial<UserProfile> }) => api.updateProfile(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    }
  });

  const syncListingsMutation = useMutation({
    mutationFn: api.syncExternalListings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS] });
    }
  });

  const linkPropertyMutation = useMutation({
    mutationFn: ({ propertyId, externalId }: { propertyId: string, externalId: string }) => 
      api.linkPropertyToExternal(propertyId, externalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXTERNAL_LISTINGS] });
    }
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: api.connectSahibinden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BROKER_ACCOUNT] });
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

      const targetTime = profile.notification_settings?.time || "09:00";
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
  }, [profile, isGamifiedTasksLoading]);

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

  const handleNotify = (task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified') => {
    setNotification({ task, type });
    if (type === 'personal') {
      updatePersonalTaskMutation.mutate({ id: task.id, data: { notified: true } });
    } else {
      updateGamifiedTaskMutation.mutate({ id: task.id, data: { notified: true } });
    }
  };

  // --- Grouped Props ---
  const navigationProps: NavigationProps = {
    activeTab,
    setActiveTab,
    showAdminPanel,
    setShowAdminPanel,
    logout,
    profile
  };

  const leadProps: LeadProps = {
    leads,
    leadsLoading,
    categories,
    setShowWhatsAppImport,
    setShowAddLead,
    setIsAnalyzingLeads,
    analyzeLeadsMutation,
    isAnalyzingLeads,
    addLeadMutation,
    leadAnalysis,
    setLeadAnalysis,
    showAddLead,
    showWhatsAppImport
  };

  const portfolioProps: PortfolioProps = {
    properties,
    propertiesLoading,
    setSelectedProperty,
    selectedDistrict,
    setSelectedDistrict,
    viewMode,
    setViewMode,
    setShowImportUrlModal,
    regionScores,
    brokerAccount,
    setShowExternalListings,
    setShowIntegrationModal,
    syncListingsMutation,
    linkPropertyMutation,
    connectIntegrationMutation,
    templates,
    showTemplateSelector,
    setShowTemplateSelector,
    showTemplateManager,
    setShowTemplateManager,
    addTemplateMutation,
    deleteTemplateMutation,
    showAddProperty,
    setShowAddProperty,
    showImportUrlModal,
    showIntegrationModal,
    showExternalListings,
    selectedProperty,
    externalListings
  };

  const utilityProps: UtilityProps = {
    gamifiedTasks,
    personalTasks,
    tasks,
    rescueSession,
    missedOpportunities,
    setShowDailyRadar,
    setShowDayCloser,
    setShowMissedOpportunities,
    setToast,
    completeMorningRitualMutation,
    showVoiceQuickAdd,
    setShowVoiceQuickAdd,
    addTaskMutation,
    showAddVisit,
    setShowAddVisit,
    addVisitMutation,
    showDailyBriefing,
    setShowDailyBriefing,
    fieldVisits,
    cancelRescueMutation,
    completeRescueTaskMutation,
    showMissedOpportunities,
    setActiveTab
  };

  const appProps = {
    navigation: navigationProps,
    leads: leadProps,
    portfolios: portfolioProps,
    utilities: utilityProps
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-0 font-sans text-slate-900 selection:bg-orange-100 overflow-x-hidden">
      {/* Mandatory Region Setup */}
      {profile && !profile.region && (
        <RegionSetupModal profile={profile} onComplete={() => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] })} />
      )}
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row w-full min-h-screen">
        <RitualOverlays 
          showDailyRadar={showDailyRadar}
          dailyRadarData={dailyRadarData}
          showDayCloser={showDayCloser}
          completeMorningRitualMutation={completeMorningRitualMutation}
          completeEveningRitualMutation={completeEveningRitualMutation}
          gamifiedTasks={gamifiedTasks}
          personalTasks={personalTasks}
          properties={properties}
          tasks={tasks}
        />

        <DesktopSidebar 
          activeTab={activeTab}
          showAdminPanel={showAdminPanel}
          profile={profile}
          onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }}
          onAdminClick={() => setShowAdminPanel(true)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            activeTab={activeTab}
            profile={profile}
          />

          <main className="flex-1 w-full px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
            <MainContentRouter {...appProps} />
          </main>
        </div>
      </div>

      {/* Background Logic */}
      <NotificationCenter 
        personalTasks={personalTasks} 
        gamifiedTasks={gamifiedTasks} 
        onNotify={handleNotify} 
      />

      {/* Overlays & Toasts */}
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      <GlobalToast toast={toast} />

      <FloatingActionButton onClick={() => setShowQuickAdd(true)} />

      {/* Quick Add Menu */}
      <QuickAddMenu 
        show={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onVoice={() => { closeAllModals(); setShowVoiceQuickAdd(true); }}
        onVisit={() => { closeAllModals(); setShowAddVisit(true); }}
        onLead={() => { closeAllModals(); setShowAddLead(true); }}
        onPortfolio={() => { closeAllModals(); setShowAddProperty(true); }}
      />
      
      {/* Modals */}
      <AppModals {...appProps} />

      {/* Bottom Navigation (Mobile Only) */}
      <MobileNav 
        activeTab={activeTab}
        showAdminPanel={showAdminPanel}
        profile={profile}
        onTabChange={(tab) => { setActiveTab(tab); setShowAdminPanel(false); }}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      {/* Onboarding Tour */}
      {profile && !profile.has_seen_tour && activeTab === 'dashboard' && (
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
  
  if (profile && !profile.has_seen_onboarding) {
    return <IntroSequence onComplete={() => completeOnboarding()} />;
  }

  if (!isSubscribed) return (
    <React.Suspense fallback={<LoadingFallback />}>
      <PricingScreen />
    </React.Suspense>
  );

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
