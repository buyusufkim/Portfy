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
import { GoogleGenAI, Type } from "@google/genai";

const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const BolgemView = React.lazy(() => import('./components/BolgemView'));
const PricingScreen = React.lazy(() => import('./components/PricingScreen'));

const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center p-12">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full"
    />
  </div>
);

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
    queryKey: ['leads', profile?.uid],
    queryFn: api.getLeads,
    enabled: !!profile?.uid
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', profile?.uid],
    queryFn: api.getProperties,
    enabled: !!profile?.uid
  });

  const { data: personalTasks = [] } = useQuery({
    queryKey: ['personalTasks', profile?.uid],
    queryFn: api.getPersonalTasks,
    enabled: !!profile?.uid
  });

  const { data: gamifiedTasks = [], isLoading: isGamifiedTasksLoading, isError: isGamifiedTasksError } = useQuery({
    queryKey: ['gamifiedTasks', profile?.uid],
    queryFn: () => api.getDailyGamifiedTasks(),
    enabled: !!profile?.uid
  });

  useEffect(() => {
    console.log("Current gamifiedTasks:", gamifiedTasks);
  }, [gamifiedTasks]);

  const [notification, setNotification] = useState<{ task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified' } | null>(null);

  const updatePersonalTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<PersonalTask> }) => api.updatePersonalTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalTasks', profile?.uid] })
  });

  const updateGamifiedTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<GamifiedTask> }) => api.updateGamifiedTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gamifiedTasks', profile?.uid] })
  });

  const handleNotify = (task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified') => {
    setNotification({ task, type });
    // Mark as notified
    if (type === 'personal') {
      updatePersonalTaskMutation.mutate({ id: task.id, data: { notified: true } });
    } else {
      updateGamifiedTaskMutation.mutate({ id: task.id, data: { notified: true } });
    }
  };

  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [showWhatsAppImport, setShowWhatsAppImport] = useState(false);
  const [showDailyRadar, setShowDailyRadar] = useState(false);
  const [showDayCloser, setShowDayCloser] = useState(false);
  const [leadAnalysis, setLeadAnalysis] = useState<string | null>(null);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  const { data: dailyRadarData } = useQuery({
    queryKey: ['dailyRadar', profile?.uid],
    queryFn: api.getDailyRadar,
    enabled: !!profile?.uid && showDailyRadar
  });

  const completeMorningRitualMutation = useMutation({
    mutationFn: async () => {
      await api.startDay();
      return api.completeMorningRitual();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['gamifiedStats'] });
      setShowDailyRadar(false);
      setToast({ message: "Güne harika bir başlangıç yaptın!", type: 'success' });
    }
  });

  const completeEveningRitualMutation = useMutation({
    mutationFn: async (stats: any) => {
      console.log("Mutation triggered: completeEveningRitual", stats);
      await api.endDay(stats);
      return api.completeEveningRitual(stats);
    },
    onSuccess: () => {
      console.log("Mutation SUCCESS: completeEveningRitual");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      queryClient.invalidateQueries({ queryKey: ['gamifiedStats'] });
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
      console.error("Mutation ERROR: completeEveningRitual", error);
      setToast({ message: "Günü kapatırken bir hata oluştu: " + error.message, type: 'error' });
    }
  });

  useEffect(() => {
    if (profile) {
      const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      };
      const today = getTodayStr();
      const localStarted = localStorage.getItem(`day_started_${profile.uid}_${today}`);
      const lastStarted = profile.last_day_started_at ? profile.last_day_started_at.split('T')[0] : (profile.last_active_date || null);
      
      if (lastStarted !== today && !localStarted) {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
          setShowDailyRadar(true);
        }
      }
    }
  }, [profile]);

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

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { data: rescueSession } = useQuery({
    queryKey: ['rescueSession'],
    queryFn: api.getRescueSession
  });

  const cancelRescueMutation = useMutation({
    mutationFn: api.cancelRescueSession,
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
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showExternalListings, setShowExternalListings] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showMissedOpportunities, setShowMissedOpportunities] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['externalListings'] });
    }
  });

  const connectIntegrationMutation = useMutation({
    mutationFn: api.connectSahibinden,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerAccount'] });
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
                      addTemplateMutation.mutate({ ...newTemplate, is_default: false });
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
                        {opp.days_delayed > 0 ? `${opp.days_delayed} Gün Gecikme` : 'Hemen Aksiyon'}
                      </span>
                      {opp.potential_value && (
                        <span className="text-[10px] font-bold text-emerald-600">+{opp.potential_value} Puan</span>
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

    const completedCount = rescueSession.tasks.filter(t => t.is_completed).length;
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
            
            <button 
              onClick={() => cancelRescueMutation.mutate(rescueSession.id)}
              className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-20"
            >
              <X size={20} />
            </button>

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
                  onClick={() => !task.is_completed && completeRescueTaskMutation.mutate({ sessionId: rescueSession.id, taskId: task.id })}
                  disabled={task.is_completed || completeRescueTaskMutation.isPending}
                  className={`w-full p-5 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${
                    task.is_completed 
                      ? 'bg-emerald-50 border-emerald-100 opacity-60' 
                      : 'bg-slate-50 border-slate-100 hover:border-orange-200 active:scale-95'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    task.is_completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                  }`}>
                    {task.is_completed ? <Check size={20} /> : <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold ${task.is_completed ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {task.estimated_minutes} dk
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
          name: parsedResult.extracted_data.name || 'İsimsiz Müşteri',
          phone: parsedResult.extracted_data.phone || '',
          type: 'Alıcı',
          status: 'Aday',
          district: parsedResult.extracted_data.location || '',
          notes: parsedResult.extracted_data.description || parsedResult.original_text
        } as any);
      } else if (parsedResult.intent === 'task') {
        await addTaskMutation.mutateAsync({
          title: parsedResult.extracted_data.description || 'Yeni Görev',
          time: parsedResult.extracted_data.due_date || new Date().toISOString(),
          type: 'Arama',
          completed: false
        } as any);
      } else if (parsedResult.intent === 'note') {
        await addVisitMutation.mutateAsync({
          address: parsedResult.extracted_data.location || 'Bilinmeyen Adres',
          district: parsedResult.extracted_data.location || '',
          status: 'Potansiyel',
          notes: parsedResult.extracted_data.description || parsedResult.original_text
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
                  
                  {Object.entries(parsedResult.extracted_data).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">{key}</label>
                        <input 
                          type="text" 
                          value={value as string} 
                          onChange={(e) => setParsedResult({...parsedResult, extracted_data: {...parsedResult.extracted_data, [key]: e.target.value}})}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 italic">Orijinal metin: "{parsedResult.original_text}"</p>
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

        <AICoachPanel />
      </motion.div>
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


  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans text-slate-900 selection:bg-orange-100">
      {/* Mandatory Region Setup */}
      {profile && !profile.region && (
        <RegionSetupModal profile={profile} onComplete={() => queryClient.invalidateQueries({ queryKey: ['profile'] })} />
      )}
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto min-h-screen">
        {/* Modals & Overlays */}
        <AnimatePresence>
          {showDailyRadar && dailyRadarData && (
            <DailyRadar 
              tasks={dailyRadarData.tasks}
              insight={dailyRadarData.insight}
              onComplete={() => completeMorningRitualMutation.mutate()}
            />
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
                console.log("onComplete triggered in App.tsx");
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

        <main className="flex-1 w-full mx-auto px-4 md:px-8 py-6">
          {showAdminPanel ? (
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <DashboardPage 
                  profile={profile}
                  properties={properties}
                  gamifiedTasks={gamifiedTasks}
                  personalTasks={personalTasks}
                  tasks={tasks}
                  rescueSession={rescueSession}
                  missedOpportunities={missedOpportunities}
                  setActiveTab={setActiveTab}
                  setShowAdminPanel={setShowAdminPanel}
                  setShowDailyRadar={setShowDailyRadar}
                  setShowDayCloser={setShowDayCloser}
                  setShowMissedOpportunities={setShowMissedOpportunities}
                  setToast={setToast}
                  completeMorningRitualMutation={completeMorningRitualMutation}
                />
              )}
              {activeTab === 'bolgem' && (
                <React.Suspense fallback={<LoadingFallback />}>
                  <BolgemView profile={profile} />
                </React.Suspense>
              )}
              {activeTab === 'portfoyler' && (
                <PortfoliosPage 
                  properties={properties}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  setShowImportUrlModal={setShowImportUrlModal}
                  regionScores={regionScores}
                  propertiesLoading={propertiesLoading}
                  setSelectedProperty={setSelectedProperty}
                />
              )}
              {activeTab === 'crm' && (
                <CRMPage 
                  profile={profile}
                  leads={leads}
                  leadsLoading={leadsLoading}
                  categories={categories}
                  setShowWhatsAppImport={setShowWhatsAppImport}
                  setShowAddLead={setShowAddLead}
                  setIsAnalyzingLeads={setIsAnalyzingLeads}
                  analyzeLeadsMutation={analyzeLeadsMutation}
                  isAnalyzingLeads={isAnalyzingLeads}
                />
              )}
              {activeTab === 'notes' && <NotesView />}
              {activeTab === 'profil' && (
                <ProfilView 
                  profile={profile}
                  setShowAdminPanel={setShowAdminPanel}
                  brokerAccount={brokerAccount}
                  setShowExternalListings={setShowExternalListings}
                  setShowIntegrationModal={setShowIntegrationModal}
                  logout={logout}
                />
              )}
              {activeTab === 'koc' && <CoachView />}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        personalTasks={personalTasks} 
        gamifiedTasks={gamifiedTasks} 
        onNotify={handleNotify} 
      />

      {/* Notification Toast */}
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
                onClick={() => setNotification(null)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Menu */}
      <QuickAddMenu />
      <VoiceQuickAddModal />
      
      {/* Modals */}
      <React.Suspense fallback={null}>
        {showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}
      </React.Suspense>
      <CRMModals 
        categories={categories}
        addLeadMutation={addLeadMutation}
        showAddLead={showAddLead}
        setShowAddLead={setShowAddLead}
        showWhatsAppImport={showWhatsAppImport}
        setShowWhatsAppImport={setShowWhatsAppImport}
        leadAnalysis={leadAnalysis}
        setLeadAnalysis={setLeadAnalysis}
        analyzeLeadsMutation={analyzeLeadsMutation}
      />
      <PortfolioModals 
        showAddProperty={showAddProperty}
        setShowAddProperty={setShowAddProperty}
        showImportUrlModal={showImportUrlModal}
        setShowImportUrlModal={setShowImportUrlModal}
        showIntegrationModal={showIntegrationModal}
        setShowIntegrationModal={setShowIntegrationModal}
        showExternalListings={showExternalListings}
        setShowExternalListings={setShowExternalListings}
        selectedProperty={selectedProperty}
        setSelectedProperty={setSelectedProperty}
        brokerAccount={brokerAccount}
        externalListings={externalListings}
        syncListingsMutation={syncListingsMutation}
        linkPropertyMutation={linkPropertyMutation}
        connectIntegrationMutation={connectIntegrationMutation}
        templates={templates}
        showTemplateSelector={showTemplateSelector}
        setShowTemplateSelector={setShowTemplateSelector}
        leads={leads}
        regionScores={regionScores}
      />
      <AddVisitModal />
      <DailyBriefingModal />
      <TemplateManagerModal />
      <RescueModeModal />
      <MissedOpportunitiesModal />

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
      {profile && !profile.has_seen_tour && activeTab === 'dashboard' && (
        <AppTour onComplete={() => completeTour()} />
      )}

      {/* Toast Notifications */}
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
