import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Settings, Package, LayoutDashboard, Edit2, Check, X, 
  Save, ClipboardList, Trash2, Phone, Search, RefreshCw, 
  AlertCircle, Clock, Crown, Briefcase, TrendingUp, DollarSign, 
  Activity, Zap, PieChart, Eye, MapPin, Home, Target, Award, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { AdminUserTable } from './AdminUserTable';
import { AdminSettings } from './AdminSettings';
import { AdminSupport } from './AdminSupport';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminAudit } from './AdminAudit';
import { AdminUserNotes } from './AdminUserNotes';
import { api } from '../services/api';
import { getEffectiveAiTokenLimit } from '../config/subscriptionLimits';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'packages' | 'settings' | 'tasks' | 'support' | 'announcements' | 'audit'>('dashboard');

  // Support & Announcements & Audit Log states can be placed here if needed.
  // Actually, I will create inner components for them to keep it clean.
  
  // Kullanıcı State'leri
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Kullanıcı Düzenleme (Abonelik) State'leri
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editTier, setEditTier] = useState<string>('free');
  const [editEndDate, setEditEndDate] = useState<string>('');

  // Kullanıcı Detay (İnceleme) State'leri
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);
  const [userDetailStats, setUserDetailStats] = useState({ properties: 0, leads: 0, loading: false });
  
  // Paket State'leri
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  
  // Görev Yönetimi State'leri
  const [taskTemplates, setTaskTemplates] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(10);
  const [newTaskCategory, setNewTaskCategory] = useState<'sweet' | 'main'>('sweet');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAutoVerify, setNewTaskAutoVerify] = useState(true);
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState<'once'|'daily'|'interval'|'weekly'|'monthly'>('once');
  const [newTaskIntervalDays, setNewTaskIntervalDays] = useState<number>(2);
  const [newTaskRecurrenceDays, setNewTaskRecurrenceDays] = useState<number[]>([]);
  const [newTaskDayOfMonth, setNewTaskDayOfMonth] = useState<number>(1);
  const [newTaskStartDate, setNewTaskStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskEndDate, setNewTaskEndDate] = useState('');
  const [newTaskTargetScope, setNewTaskTargetScope] = useState<'all'|'free'|'trial'|'master'>('all');
  const [newTaskAutoGenerate, setNewTaskAutoGenerate] = useState(false);
  const [newTaskActionType, setNewTaskActionType] = useState('general');

  // Sistem Ayarları State'i (WhatsApp)
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPackages();
    fetchTasks();
    fetchSystemSettings();
  }, []);

  // -- SİSTEM AYARLARI FONKSİYONLARI --
  const fetchSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await api.getAdminSettings();
      if (data && data.whatsapp_number) {
        setWhatsappNumber(data.whatsapp_number);
      }
    } catch (e) {
      console.error("fetchSystemSettings error", e);
    }
    setSettingsLoading(false);
  };

  const saveSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      await api.updateAdminSettings({ whatsapp_number: whatsappNumber });
      alert("Sistem ayarları başarıyla kaydedildi!");
    } catch (error: any) {
      alert("Hata: " + (error?.message || "Bilinmeyen bir hata oluştu"));
    }
    setSettingsLoading(false);
  };

  // -- PAKET FONKSİYONLARI --
  const fetchPackages = async () => {
    setPackagesLoading(true);
    const { data } = await supabase.from('subscription_packages').select('*').order('price_numeric', { ascending: true });
    if (data) setPackages(data);
    setPackagesLoading(false);
  };

  const handleSavePackage = async () => {
    if(!editingPkg) return;
    let featuresArr = editingPkg.features;
    if (typeof editingPkg.features === 'string') {
        featuresArr = editingPkg.features.split('\n').filter((f:string) => f.trim() !== '');
    }
    const { error } = await supabase.from('subscription_packages').update({
        name: editingPkg.name, 
        price_text: editingPkg.price_text, 
        price_numeric: editingPkg.price_numeric,
        interval: editingPkg.interval, 
        description: editingPkg.description, 
        badge: editingPkg.badge,
        is_popular: editingPkg.is_popular, 
        features: featuresArr
    }).eq('id', editingPkg.id);

    if(!error) {
        alert("Paket başarıyla güncellendi! Sitede anında değişti.");
        setEditingPkg(null);
        fetchPackages();
    } else {
        alert("Paket güncellenirken hata: " + error.message);
    }
  };

  // -- GÖREV YÖNETİMİ FONKSİYONLARI --
  const fetchTasks = async () => {
    setTasksLoading(true);
    const { data } = await supabase.from('task_templates').select('*').order('created_at', { ascending: false });
    if (data) setTaskTemplates(data);
    setTasksLoading(false);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle) return alert("Görev adı boş olamaz!");
    try {
      await api.adminCreateTaskTemplate({
        title: newTaskTitle, points: newTaskPoints, category: newTaskCategory, description: newTaskDescription, auto_verify: newTaskAutoVerify,
        recurrence_type: newTaskRecurrenceType, interval_days: newTaskIntervalDays, recurrence_days: newTaskRecurrenceDays, day_of_month: newTaskDayOfMonth,
        start_date: newTaskStartDate, end_date: newTaskEndDate || null, target_scope: newTaskTargetScope, auto_generate: newTaskAutoGenerate, action_type: newTaskActionType
      });
      setNewTaskTitle(''); setNewTaskPoints(10); setNewTaskDescription(''); setNewTaskAutoVerify(true);
      setNewTaskRecurrenceType('once'); setNewTaskIntervalDays(2); setNewTaskRecurrenceDays([]); setNewTaskDayOfMonth(1);
      setNewTaskStartDate(new Date().toISOString().split('T')[0]); setNewTaskEndDate(''); setNewTaskTargetScope('all'); setNewTaskAutoGenerate(false); setNewTaskActionType('general');
      fetchTasks();
    } catch (error: any) {
      alert("Görev eklenirken hata: " + error.message);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.adminUpdateTaskTemplate(id, { is_active: !currentStatus }); fetchTasks();
    } catch (error: any) {
      alert("Durum güncellenirken hata: " + error.message);
    }
  };

  const deleteTask = async (id: string) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) { 
      try {
        await api.adminDeleteTaskTemplate(id); fetchTasks(); 
      } catch (error: any) {
        alert("Görev silinirken hata: " + error.message);
      }
    }
  };

  // -- KULLANICI & TOKEN YÖNETİMİ FONKSİYONLARI --
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/admin/users', { 
        headers: { 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data as UserProfile[]);
      }
    } catch (e) {
      console.error("Kullanıcılar çekilirken hata:", e);
    } finally { 
      setLoading(false); 
    }
  };

  const handleResetToken = async (id: string) => {
    if (window.confirm("Bu kullanıcının AI Token kullanımını sıfırlamak istediğinize emin misiniz?")) {
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const response = await fetch('/api/ai/admin/reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ id })
        });
        
        if (response.ok) {
          alert("Token başarıyla sıfırlandı!");
          fetchUsers();
        } else {
          const data = await response.json();
          alert('Token sıfırlanırken hata oluştu: ' + data.error);
        }
      } catch (error: any) {
        alert('Bağlantı hatası: ' + error.message);
      }
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === id) {
      alert("Kendi admin hesabınızı silemezsiniz.");
      return;
    }

    if (window.confirm(`DİKKAT: ${name} adlı kullanıcıyı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/admin/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ id })
        });
        
        if (response.ok) {
          alert('Kullanıcı başarıyla silindi.');
          fetchUsers();
        } else {
          const data = await response.json();
          alert('Hata oluştu: ' + data.error);
        }
      } catch (error: any) {
        alert('Bağlantı hatası: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditUser = (user: UserProfile) => {
    setEditingUser(user);
    if (user.subscription_type === 'trial') {
      setEditTier('trial');
    } else if (user.tier === 'master') {
      setEditTier('master');
    } else {
      setEditTier('free');
    }
    setEditEndDate(user.subscription_end_date ? user.subscription_end_date.substring(0, 10) : '');
  };

  const handleOpenUserDetail = async (user: UserProfile) => {
    setSelectedUserDetail(user);
    setUserDetailStats({ properties: 0, leads: 0, loading: true });
    
    try {
      const [propertiesRes, leadsRes] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);
      
      setUserDetailStats({
        properties: propertiesRes.count || 0,
        leads: leadsRes.count || 0,
        loading: false
      });
    } catch (error) {
      console.error("Detaylar çekilirken hata:", error);
      setUserDetailStats({ properties: 0, leads: 0, loading: false });
    }
  };

  const setEditEndDateToTrial = () => {
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 7);
    setEditEndDate(trialDate.toISOString().substring(0, 10));
  };

  const addMonthsToEndDate = (months: number) => {
    const currentDate = editEndDate ? new Date(editEndDate) : new Date();
    if (!editEndDate || currentDate.getTime() < new Date().getTime()) {
       currentDate.setTime(new Date().getTime());
    }
    currentDate.setMonth(currentDate.getMonth() + months);
    setEditEndDate(currentDate.toISOString().substring(0, 10));
  };

  const setLifetime = () => {
    const lifetimeDate = new Date();
    lifetimeDate.setFullYear(lifetimeDate.getFullYear() + 100);
    setEditEndDate(lifetimeDate.toISOString().substring(0, 10));
  };

  const saveUserSubscription = async () => {
    if (!editingUser) return;
    setLoading(true);
    const finalEndDate = editEndDate ? new Date(editEndDate).toISOString() : null;
    
    let updateData = {};
    if (editTier === "free") {
      updateData = { tier: "free", subscription_type: "none", subscription_end_date: null };
    } else if (editTier === "trial") {
      updateData = { tier: "pro", subscription_type: "trial", subscription_end_date: finalEndDate };
    } else if (editTier === "master") {
      updateData = { tier: "master", subscription_type: "12-month", subscription_end_date: finalEndDate };
    }

    try {
      const response = await fetch('/api/ai/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ id: editingUser.id, data: updateData })
      });

      if (response.ok) {
        alert(`${editingUser.display_name} kullanıcısının paketi güncellendi!`);
        setEditingUser(null);
        fetchUsers(); 
      } else {
        const data = await response.json();
        alert("Hata oluştu: " + data.error);
      }
    } catch(err: any) {
      alert("Hata oluştu: " + err.message);
    }
    setLoading(false);
  };

  const getRemainingDays = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 3650) return "Sınırsız (Ömür Boyu)";
    if (diffDays < 0) return "Süresi Doldu";
    return `${diffDays} Gün Kaldı`;
  };

  const filteredUsers = users.filter(u => 
    (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActiveUserFilter = (u: UserProfile) => {
    return u.subscription_end_date && new Date(u.subscription_end_date) >= new Date();
  };

  // --- SAAS DASHBOARD HESAPLAMALARI ---
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const totalUsers = users.length;
  const masterUsers = users.filter(u => u.tier === 'master' && getActiveUserFilter(u)).length;
  const trialUsers = users.filter(u => u.subscription_type === 'trial' && getActiveUserFilter(u)).length;
  const freeUsers = users.filter(u => !u.subscription_type || u.subscription_type === 'none' || (u.subscription_end_date && new Date(u.subscription_end_date) < new Date())).length;
  
  const onlineToday = users.filter(u => u.last_active_date && u.last_active_date.startsWith(todayStr)).length;
  const newUsers7d = users.filter(u => new Date(u.created_at) >= sevenDaysAgo).length;
  const active7d = users.filter(u => u.last_active_date && new Date(u.last_active_date) >= sevenDaysAgo).length;
  
  const getLimit = (u: UserProfile) => {
    return getEffectiveAiTokenLimit(u);
  };

  const topTokenUsers = [...users].sort((a,b) => (b.ai_tokens_used || 0) - (a.ai_tokens_used || 0)).slice(0, 5);
  
  const trialExpiring3dUsers = users.filter(u => {
      if(u.subscription_type !== 'trial' || !u.subscription_end_date) return false;
      const diff = new Date(u.subscription_end_date).getTime() - new Date().getTime();
      return diff > 0 && diff <= (3 * 24 * 60 * 60 * 1000);
  });
  
  const expiredUsersList = users.filter(u => u.subscription_end_date && new Date(u.subscription_end_date) < new Date() && u.subscription_type !== 'none');
  
  const inactiveFor14dList = users.filter(u => {
      if (!u.last_active_date) return false;
      const diff = new Date().getTime() - new Date(u.last_active_date).getTime();
      return diff > 14 * 24 * 60 * 60 * 1000;
  });

  const approachingLimitUsers = users.filter(u => {
    const lim = getLimit(u);
    return lim > 0 && ((u.ai_tokens_used || 0) / lim) >= 0.8;
  });

  const totalTokensUsed = users.reduce((acc, u) => acc + (u.ai_tokens_used || 0), 0);
  const estimatedAiCost = (totalTokensUsed / 1000) * 0.05;
  const estimatedMRR = masterUsers * 3000;
  const conversionRate = totalUsers > 0 ? ((masterUsers / totalUsers) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-lg font-black">P</span>
            </span>
            Admin
          </h1>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors md:hidden"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-6">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? "text-teal-400" : ""} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Users size={20} className={activeTab === 'users' ? "text-teal-400" : ""} /> Üyeler & Abonelik
          </button>
          <button onClick={() => setActiveTab('support')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'support' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Mail size={20} className={activeTab === 'support' ? "text-teal-400" : ""} /> Destek Talepleri
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Briefcase size={20} className={activeTab === 'announcements' ? "text-teal-400" : ""} /> Duyurular
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'packages' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Package size={20} className={activeTab === 'packages' ? "text-teal-400" : ""} /> Paketler
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <ClipboardList size={20} className={activeTab === 'tasks' ? "text-teal-400" : ""} /> Görev Yönetimi
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'audit' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Activity size={20} className={activeTab === 'audit' ? "text-teal-400" : ""} /> Audit Log
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}`}>
            <Settings size={20} className={activeTab === 'settings' ? "text-teal-400" : ""} /> Genel Ayarlar
          </button>
        </nav>
        <div className="p-6 border-t border-slate-800 hidden md:block">
          <button onClick={onClose} className="w-full py-3 bg-slate-800/50 text-slate-300 rounded-xl font-bold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700">Uygulamaya Dön</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50 flex flex-col h-screen overflow-hidden">
        {/* Modern Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Yönetim Merkezi
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase tracking-widest font-bold rounded-full border border-indigo-100">
                  {activeTab === 'dashboard' && 'Metrikler'}
                  {activeTab === 'users' && 'Üyeler'}
                  {activeTab === 'support' && 'Destek'}
                  {activeTab === 'announcements' && 'Duyurular'}
                  {activeTab === 'packages' && 'Satış'}
                  {activeTab === 'tasks' && 'Oyunlaştırma'}
                  {activeTab === 'audit' && 'Kayıtlar'}
                  {activeTab === 'settings' && 'Sistem'}
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1.5 line-clamp-1">
                {activeTab === 'dashboard' && 'SaaS gelir, kullanıcı büyümesi ve yapay zeka maliyet özeti.'}
                {activeTab === 'users' && 'Kullanıcı yönetimi, abonelik düzenlemeleri ve token limit kontrolü.'}
                {activeTab === 'support' && 'Kullanıcı destek talepleri ve iletişim.'}
                {activeTab === 'announcements' && 'Tüm üyelere gösterilecek sistem içi duyurular ve haberler.'}
                {activeTab === 'packages' && 'Kullanıcılara sunulacak abonelik paketleri ve özellikleri.'}
                {activeTab === 'tasks' && 'Kullanıcıların XP kazanabileceği görev şablonları havuzu.'}
                {activeTab === 'audit' && 'Yönetici işlemlerinin kayıt geçmişi (Audit Trail).'}
                {activeTab === 'settings' && 'Uygulama genel yapılandırmaları ve entegrasyon ayarları.'}
              </p>
            </div>
            <div className="md:hidden">
              <button onClick={onClose} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">Uygulamaya Dön</button>
            </div>
          </div>
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-slate-50 rounded-full mix-blend-multiply opacity-50 pointer-events-none" />
        </div>

        <div className="flex-1 overflow-y-auto relative p-4 md:p-8">
        
        {/* 🔥 KULLANICI DETAY MODALI 🔥 */}
        <AnimatePresence>
          {selectedUserDetail && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedUserDetail(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-8 max-w-2xl w-full relative z-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-amber-500" /> Kullanıcı Detayları
                  </h3>
                  <button onClick={() => setSelectedUserDetail(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                  {/* Profil Başlığı */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserDetail.id}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-black text-slate-900">{selectedUserDetail.display_name || 'İsimsiz Kullanıcı'}</h2>
                      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-medium items-center md:items-start">
                        <span className="flex items-center gap-1.5"><Mail size={16} className="text-slate-400"/> {selectedUserDetail.email}</span>
                        {/* Not: Phone bilgisi UserProfile'da standart olmadığı için opsiyonel gösterilir */}
                        <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400"/> {selectedUserDetail.phone || 'Belirtilmemiş'}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                         {selectedUserDetail.region ? (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold">
                             <MapPin size={14} />
                             {selectedUserDetail.region.city} / {selectedUserDetail.region.district}
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">
                             <MapPin size={14} /> Bölge Seçilmemiş
                           </span>
                         )}
                         {(() => {
                            const isExpired = selectedUserDetail.subscription_end_date ? new Date(selectedUserDetail.subscription_end_date) < new Date() : false;
                            const isActiveMaster = selectedUserDetail.tier === 'master' && !isExpired;
                            const isTrial = selectedUserDetail.subscription_type === 'trial' && !isExpired;
                            const isPassive = !isActiveMaster && !isTrial;
                            
                            return (
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                                isActiveMaster ? 'bg-indigo-100 text-indigo-700' : 
                                isTrial ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {isActiveMaster ? 'Master' : isTrial ? 'Deneme' : isPassive ? (isExpired ? 'Süresi Doldu / Pasif' : 'Başlangıç') : 'Başlangıç'} Paket
                              </span>
                            );
                         })()}
                      </div>
                    </div>
                  </div>

                  {/* İstatistik Kartları */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2"><Home size={20} /></div>
                      <div className="text-2xl font-black text-slate-900">{userDetailStats.loading ? '...' : userDetailStats.properties}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">Aktif Portföy</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2"><Target size={20} /></div>
                      <div className="text-2xl font-black text-slate-900">{userDetailStats.loading ? '...' : userDetailStats.leads}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">Takipte Lead</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2"><Award size={20} /></div>
                      <div className="text-2xl font-black text-slate-900">{selectedUserDetail.total_xp || 0}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">Toplam XP</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-2"><Zap size={20} /></div>
                      <div className="text-2xl font-black text-slate-900">{selectedUserDetail.current_streak || 0}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">Mevcut Seri (Gün)</div>
                    </div>
                  </div>

                  {/* Diğer Bilgiler */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={16} className="text-amber-500"/> Sistem & Aktivite Bilgileri</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">Kayıt Tarihi:</span>
                        <span className="font-bold text-slate-900">{new Date(selectedUserDetail.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">Son Aktiflik:</span>
                        <span className="font-bold text-slate-900">{selectedUserDetail.last_active_date || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">Abonelik Bitişi:</span>
                        <span className="font-bold text-slate-900">{selectedUserDetail.subscription_end_date ? new Date(selectedUserDetail.subscription_end_date).toLocaleDateString('tr-TR') : 'Süresiz / Yok'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">Broker Seviyesi:</span>
                        <span className="font-bold text-slate-900">Seviye {selectedUserDetail.broker_level || 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Token & Risk Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                       <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-sm">AI Token Özeti</h4>
                       <div className="flex flex-col gap-2 text-sm">
                         <div className="flex justify-between text-slate-500">
                           <span>Kullanılan:</span>
                           <span className="font-bold text-slate-900">{(selectedUserDetail.ai_tokens_used || 0).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-slate-500">
                           <span>Limit:</span>
                           <span className="font-bold text-slate-900">{getLimit(selectedUserDetail) === 0 ? 'Kapalı' : getLimit(selectedUserDetail).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-slate-500">
                           <span>Doluluk Oranı:</span>
                           <span className={`font-bold ${getLimit(selectedUserDetail) > 0 && ((selectedUserDetail.ai_tokens_used||0)/getLimit(selectedUserDetail)) > 0.8 ? 'text-red-500' : 'text-emerald-500'}`}>
                             {getLimit(selectedUserDetail) > 0 ? Math.round(((selectedUserDetail.ai_tokens_used||0)/getLimit(selectedUserDetail))*100) : 0}%
                           </span>
                         </div>
                       </div>
                    </div>
                    
                    <AdminUserNotes userId={selectedUserDetail.id} />
                  </div>
                  
                  {/* Risk Situation Banner */}
                  {(() => {
                      const isRisk = approachingLimitUsers.find(u => u.id === selectedUserDetail.id) ||
                         trialExpiring3dUsers.find(u => u.id === selectedUserDetail.id) ||
                         expiredUsersList.find(u => u.id === selectedUserDetail.id);
                      return isRisk ? (
                        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-medium flex gap-3 items-start mt-6">
                           <AlertCircle className="shrink-0 mt-0.5" size={18} />
                           <div>
                             <strong className="block mb-1">Dikkat: Bu kullanıcı risk listesinde!</strong>
                             Bu hesap limit aşımına yakın, aboneliği bitmiş veya deneme süresi dolmak üzere.
                           </div>
                        </div>
                      ) : null;
                  })()}

                </div>

                <div className="pt-6 flex justify-end">
                  <button onClick={() => setSelectedUserDetail(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                    Kapat
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 🔥 KULLANICI DÜZENLEME MODALI 🔥 */}
        <AnimatePresence>
          {editingUser && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Crown className="text-amber-500" /> Abonelik Yönetimi
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                  {/* Kullanıcı Özeti */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser.id}`} alt="Profile" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{editingUser.display_name || 'İsimsiz Kullanıcı'}</div>
                      <div className="text-xs text-slate-500">{editingUser.email}</div>
                    </div>
                  </div>

                  {/* Paket Seçimi */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Paket Seçimi</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setEditTier('free')}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'free' ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <Briefcase size={20} className={editTier === 'free' ? 'text-slate-300' : 'text-slate-400'}/> 
                        Başlangıç
                      </button>
                      <button 
                        onClick={() => setEditTier('trial')}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'trial' ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <Clock size={20} className={editTier === 'trial' ? 'text-amber-200' : 'text-slate-400'}/> 
                        Deneme
                      </button>
                      <button 
                        onClick={() => setEditTier('master')}
                        className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 ${editTier === 'master' ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <Crown size={20} className={editTier === 'master' ? 'text-indigo-200' : 'text-slate-400'}/> 
                        Master
                      </button>
                    </div>
                  </div>

                  {/* Süre Ekleme */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Abonelik Bitiş Tarihi</label>
                    <div className="flex items-center mb-4">
                      <input 
                        type="date" 
                        value={editEndDate} 
                        onChange={e => setEditEndDate(e.target.value)}
                        className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-bold bg-slate-50 focus:bg-white outline-none transition-all cursor-pointer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => addMonthsToEndDate(1)} className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all hover:border-slate-300">+1 Ay</button>
                        <button onClick={() => addMonthsToEndDate(3)} className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all hover:border-slate-300">+3 Ay</button>
                        <button onClick={() => addMonthsToEndDate(6)} className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all hover:border-slate-300">+6 Ay</button>
                        <button onClick={() => setLifetime()} className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all">Sınırsız</button>
                    </div>
                  </div>

                </div>

                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setEditingUser(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
                  <button onClick={saveUserSubscription} disabled={loading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2">
                    <Save size={18} className={loading ? "animate-pulse" : ""} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 🔥 SAAS DASHBOARD SEKMESİ 🔥 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Temel Metrikler (Gelir & Kullanıcı) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                      <DollarSign size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Aylık Tahmini</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 text-sm font-bold">Aylık Gelir (MRR)</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{estimatedMRR.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 transition-colors">
                      <Crown size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">Ödeyen</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 text-sm font-bold">Master Üyeler</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{masterUsers || 0}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Dönüşüm Oranı</span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">%{(conversionRate)}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                      <Users size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Kayıtlı</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 text-sm font-bold">Toplam Üye</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{totalUsers || 0}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span><span className="text-xs font-bold text-slate-500">{freeUsers || 0} Free</span></div>
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span className="text-xs font-bold text-amber-600">{trialUsers || 0} Deneme</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100">
                      <Activity size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Canlı</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-500 text-sm font-bold">Bugün Aktif Olanlar</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">{onlineToday || 0}</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 hover:text-slate-700"><Check size={12}/> Aktif/Toplam Oranı: {totalUsers > 0 ? ((onlineToday/totalUsers)*100).toFixed(0) : 0}%</span>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">7G: +{active7d} Aktif</span>
                  </div>
                </div>
              </div>

              {/* SAAS HEALTH AND RISKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-2 space-y-6">
                  {/* Etkileşim Skoru ve Büyüme (Sağlık) */}
                  <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm overflow-hidden relative">
                    <h3 className="font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2 text-lg">
                       <TrendingUp className="text-indigo-500" size={20} /> SaaS Büyüme Özeti
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Son 7G Yeni</span>
                          <span className="text-2xl font-black text-slate-900">+{newUsers7d}</span>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">7G Aktif</span>
                          <span className="text-2xl font-black text-slate-900">{active7d}</span>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 flex-col border border-slate-100">
                          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Deneme Süresi</span>
                          <span className="text-2xl font-black text-amber-600">{trialUsers}</span>
                       </div>
                       <div className="bg-red-50 rounded-2xl p-4 flex gap-3 flex-col border border-red-100">
                          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">3G İçi Biten (Deneme)</span>
                          <span className="text-2xl font-black text-red-600">{trialExpiring3dUsers.length}</span>
                       </div>
                    </div>
                  </div>

                  {/* Riskli Kullanıcılar Listesi */}
                  <div className="bg-white border border-rose-100 rounded-[24px] p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-amber-300"></div>
                    <h3 className="font-bold tracking-tight text-slate-900 mb-6 flex justify-between items-center text-lg">
                       <span className="flex items-center gap-2"><AlertCircle className="text-rose-500" size={20} /> Dikkat Gerekenler</span>
                       <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{expiredUsersList.length + approachingLimitUsers.length + inactiveFor14dList.length} Kullanıcı</span>
                    </h3>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                       {trialExpiring3dUsers.map(u => (
                          <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                             <div>
                                <div className="font-bold text-sm text-slate-900">{u.display_name || u.email}</div>
                                <div className="text-xs text-amber-700 mt-0.5">Deneme sürümü yakında bitiyor</div>
                             </div>
                             <span className="text-[10px] font-bold bg-amber-200/50 text-amber-800 px-2 py-1 rounded-lg uppercase tracking-wider">Önlem Al</span>
                          </div>
                       ))}
                       {expiredUsersList.map(u => (
                          <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-100 cursor-pointer hover:border-rose-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                             <div>
                                <div className="font-bold text-sm text-slate-900">{u.display_name || u.email}</div>
                                <div className="text-xs text-rose-700 mt-0.5">Abonelik süresi doldu</div>
                             </div>
                             <span className="text-[10px] font-bold bg-rose-200/50 text-rose-800 px-2 py-1 rounded-lg uppercase tracking-wider">Süresi Bitti</span>
                          </div>
                       ))}
                       {approachingLimitUsers.filter(u => !trialExpiring3dUsers.find(t=>t.id===u.id) && !expiredUsersList.find(e=>e.id===u.id)).map(u => (
                          <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-indigo-50 border border-indigo-100 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                             <div>
                                <div className="font-bold text-sm text-slate-900">{u.display_name || u.email}</div>
                                <div className="text-xs text-indigo-700 mt-0.5">Token limiti dolmak üzere</div>
                             </div>
                             <span className="text-[10px] font-bold bg-indigo-200/50 text-indigo-800 px-2 py-1 rounded-lg uppercase tracking-wider">Satış Fırsatı</span>
                          </div>
                       ))}
                        {inactiveFor14dList.slice(0,5).filter(u => !trialExpiring3dUsers.find(t=>t.id===u.id) && !expiredUsersList.find(e=>e.id===u.id) && !approachingLimitUsers.find(a=>a.id===u.id)).map(u => (
                          <div key={u.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors" onClick={() => handleOpenUserDetail(u)}>
                             <div>
                                <div className="font-bold text-sm text-slate-900">{u.display_name || u.email}</div>
                                <div className="text-xs text-slate-500 mt-0.5">14 günden uzun süredir pasif</div>
                             </div>
                             <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wider">Uyandır</span>
                          </div>
                       ))}
                       {(trialExpiring3dUsers.length + expiredUsersList.length + approachingLimitUsers.length + inactiveFor14dList.length) === 0 && (
                          <div className="text-center py-10 text-slate-500 text-sm font-medium flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                              <Check size={24} />
                            </div>
                            Riskli kategoride kullanıcı bulunmuyor.
                          </div>
                       )}
                    </div>
                  </div>

                </div>

                <div className="col-span-1 space-y-6">
                   <div className="bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800 text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                          <Zap size={24} className="text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-bold tracking-tight text-white/90">Toplam Token</h3>
                          <p className="text-xs text-slate-400 font-medium">Tüm zamanlar</p>
                        </div>
                      </div>
                      <div>
                        <div className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                          {totalTokensUsed ? totalTokensUsed.toLocaleString() : "0"}
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                         <span className="text-sm font-medium text-slate-400">Tahmini Maliyet:</span>
                         <span className="text-lg font-bold text-red-400">{estimatedAiCost.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none transform group-hover:scale-110 transition-transform duration-1000" />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                     <h3 className="font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                        <Award className="text-indigo-500" size={20} /> AI Liderleri (Top 5)
                     </h3>
                     <div className="space-y-4">
                        {topTokenUsers.map((u, idx) => (
                           <div key={u.id} className="flex justify-between items-center group cursor-pointer" onClick={() => handleOpenUserDetail(u)}>
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 font-black text-slate-500 flex items-center justify-center text-xs group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">#{idx + 1}</div>
                                 <div>
                                   <div className="font-bold text-sm text-slate-900">{u.display_name?.split(' ')[0] || 'Kullanıcı'}</div>
                                   <div className="text-[10px] text-slate-500 uppercase tracking-widest">{u.tier === 'master' ? 'Master' : (u.subscription_type === 'trial' ? 'Deneme' : 'Free')}</div>
                                 </div>
                              </div>
                              <div className="font-black text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded font-mono group-hover:text-indigo-600">
                                 {(u.ai_tokens_used || 0).toLocaleString()}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 🔥 ÜYELER, ABONELİK VE TOKEN YÖNETİMİ SEKMESİ 🔥 */}
          {activeTab === 'users' && (
            <AdminUserTable 
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredUsers={filteredUsers}
              handleOpenUserDetail={handleOpenUserDetail}
              handleResetToken={handleResetToken}
              openEditUser={openEditUser}
              handleDeleteUser={handleDeleteUser}
              getRemainingDays={getRemainingDays}
            />
          )}

          {/* PAKETLER SEKMESİ */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Abonelik Paketleri Yönetimi</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Uygulama içi satın almalarda gösterilen paketleri yapılandırın.</p>
              </div>
              
              {editingPkg ? (
                <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-slate-900">
                      <Package className="text-indigo-600" /> Paketi Düzenle: <span className="uppercase text-indigo-600">{editingPkg.tier}</span>
                    </h3>
                    <button onClick={() => setEditingPkg(null)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Paket Görünen Adı</label><input type="text" value={editingPkg.name} onChange={e => setEditingPkg({...editingPkg, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Periyot</label><input type="text" value={editingPkg.interval} onChange={e => setEditingPkg({...editingPkg, interval: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Görünen Fiyat Metni</label><input type="text" value={editingPkg.price_text} onChange={e => setEditingPkg({...editingPkg, price_text: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Sıralama Değeri (Sayı)</label><input type="number" value={editingPkg.price_numeric} onChange={e => setEditingPkg({...editingPkg, price_numeric: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Avantaj Rozeti</label><input type="text" value={editingPkg.badge || ''} onChange={e => setEditingPkg({...editingPkg, badge: e.target.value})} placeholder="Boş bırakılabilir" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 transition-colors h-[48px] group">
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={editingPkg.is_popular} onChange={e => setEditingPkg({...editingPkg, is_popular: e.target.checked})} className="peer sr-only" />
                          <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                        </div>
                        <div className="flex flex-col"><span className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">"En Popüler" Etiketi Göster</span></div>
                      </label>
                    </div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-2">Kısa Açıklama</label><input type="text" value={editingPkg.description} onChange={e => setEditingPkg({...editingPkg, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-2">Özellik Listesi (Her satıra bir özellik)</label>
                      <textarea rows={8} value={Array.isArray(editingPkg.features) ? editingPkg.features.join('\n') : editingPkg.features} onChange={e => setEditingPkg({...editingPkg, features: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed text-sm font-medium" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button onClick={() => setEditingPkg(null)} className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Vazgeç</button>
                    <button onClick={handleSavePackage} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-slate-900/20"><Save size={18} /> Kaydet</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {packagesLoading ? (
                    <div className="col-span-full p-12 text-center text-slate-500">Paketler yükleniyor...</div>
                  ) : packages.map(pkg => (
                    <div key={pkg.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md hover:border-slate-200 transition-all relative overflow-hidden">
                      {pkg.is_popular && (
                         <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">Popüler</div>
                      )}
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-black text-slate-900">{pkg.name} <span className="text-sm text-slate-400 font-medium">({pkg.tier})</span></h3>
                          {pkg.badge && <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{pkg.badge}</span>}
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-black text-slate-900 tracking-tight">{pkg.price_text}</span>
                          <span className="text-sm text-slate-400 font-medium">{pkg.interval}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">{pkg.description}</p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Özellikler</div>
                        <ul className="text-xs space-y-2.5 mb-6 text-slate-600 font-medium">
                          {(pkg.features || []).slice(0,5).map((f:string, i:number) => (
                            <li key={i} className="flex items-start gap-2"><Check size={14} className="text-teal-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{f}</span></li>
                          ))}
                          {(pkg.features || []).length > 5 && <li className="text-indigo-500 italic font-bold">+{pkg.features.length - 5} özellik daha...</li>}
                        </ul>
                      </div>
                      <button onClick={() => setEditingPkg(pkg)} className="w-full py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                        <Edit2 size={16} /> Düzenle
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GÖREV YÖNETİMİ SEKMESİ */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Oyunlaştırma: Görev Havuzu</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Kullanıcıların XP kazanıp seviye atlayabileceği görev şablonları.</p>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">Görev Adı</label><input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                  <div className="w-full md:w-32"><label className="block text-xs font-bold text-slate-500 mb-2">Puan (XP)</label><input type="number" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
                  <div className="w-full md:w-48"><label className="block text-xs font-bold text-slate-500 mb-2">Zorluk Seviyesi</label><select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as 'sweet' | 'main')} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"><option value="sweet">Sweet (Kolay XP)</option><option value="main">Main (Saha Görevi)</option></select></div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">Görev Açıklaması / Talimatlar</label><input type="text" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder-slate-400" placeholder="Örn: Müşteri ile en az 10 dakikalık bir görüşme yap ve notlarını CRM'e gir." /></div>
                </div>

                {/* YENİ ALANLAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Tekrar Tipi</label>
                    <select value={newTaskRecurrenceType} onChange={e => setNewTaskRecurrenceType(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
                      <option value="once">Tek Seferlik</option>
                      <option value="daily">Her Gün</option>
                      <option value="interval">Her X Günde Bir</option>
                      <option value="weekly">Haftanın Günleri</option>
                      <option value="monthly">Ayın Günü</option>
                    </select>
                  </div>
                  {newTaskRecurrenceType === 'interval' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Kaç günde bir? (Örn: 2)</label>
                      <input type="number" min={1} value={newTaskIntervalDays} onChange={e => setNewTaskIntervalDays(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
                    </div>
                  )}
                  {newTaskRecurrenceType === 'monthly' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Ayın Hangi Günü? (1-31)</label>
                      <input type="number" min={1} max={31} value={newTaskDayOfMonth} onChange={e => setNewTaskDayOfMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
                    </div>
                  )}
                  {newTaskRecurrenceType === 'weekly' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-2">Haftanın Günleri (0=Pazar, 1=Pzt...)</label>
                      <div className="flex gap-2 flex-wrap">
                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((d, i) => (
                          <button key={i} type="button" onClick={() => setNewTaskRecurrenceDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${newTaskRecurrenceDays.includes(i) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'}`}>{d}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Aksiyon Tipi</label>
                    <select value={newTaskActionType} onChange={e => setNewTaskActionType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
                      <option value="general">Genel</option>
                      <option value="content_story">Günlük Story</option>
                      <option value="content_reels">Reels / İçerik</option>
                      <option value="crm_visit">CRM Ziyareti</option>
                      <option value="crm_call">CRM Araması</option>
                      <option value="property_check">Portföy Kontrolü</option>
                      <option value="bolgem_visit">Bölgem Ziyareti</option>
                      <option value="daily_start">Gün Başlatma</option>
                      <option value="daily_close">Gün Kapatma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Hedef Kitle</label>
                    <select value={newTaskTargetScope} onChange={e => setNewTaskTargetScope(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
                      <option value="all">Tüm Kullanıcılar</option>
                      <option value="free">Ücretsiz Paket</option>
                      <option value="trial">Deneme Sürecindekiler</option>
                      <option value="master">Master (Ücretli) Kullanıcılar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Başlangıç Tarihi</label>
                    <input type="date" value={newTaskStartDate} onChange={e => setNewTaskStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Bitiş Tarihi (Opsiyonel)</label>
                    <input type="date" value={newTaskEndDate} onChange={e => setNewTaskEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 border-t border-slate-100 pt-6">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={newTaskAutoVerify} onChange={e => setNewTaskAutoVerify(e.target.checked)} className="peer sr-only" />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                      <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Otomatik Doğrula</span></div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={newTaskAutoGenerate} onChange={e => setNewTaskAutoGenerate(e.target.checked)} className="peer sr-only" />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                      </div>
                      <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Otomatik Üret</span><span className="text-[10px] text-slate-500">Hedef kitleye her gün uygunsa üretilir</span></div>
                    </label>
                  </div>
                  <button onClick={handleAddTask} className="w-full md:w-auto h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20">Görev Oluştur</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                {tasksLoading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Görev Adı</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Açıklama</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kategori & Puan</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ayarlar</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Aktiflik</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskTemplates.map(task => (
                        <tr key={task.id} className={`hover:bg-slate-50 ${!task.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-900">{task.title}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{task.description || '-'}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${task.category === 'main' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{task.category}</span><span className="ml-2 text-xs font-bold text-amber-500">+{task.points} XP</span></td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{task.recurrence_type === 'once' ? 'Tek Sefer' : task.recurrence_type === 'daily' ? 'Her Gün' : task.recurrence_type === 'interval' ? `${task.interval_days} Günde Bir` : task.recurrence_type === 'weekly' ? 'Haftalık' : 'Aylık'}</span>
                              {task.auto_generate && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Oto Üretim</span>}
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded capitalize">{task.target_scope}</span>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded truncate max-w-[80px]" title={task.action_type}>{task.action_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center"><button onClick={() => toggleTaskStatus(task.id, task.is_active)} className={`w-10 h-5 rounded-full relative transition-colors ${task.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${task.is_active ? 'translate-x-5' : 'translate-x-1'}`} /></button></td>
                          <td className="px-6 py-4 text-right"><button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={18} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* AYARLAR SEKMESİ */}
          {activeTab === 'settings' && (
            <AdminSettings 
              whatsappNumber={whatsappNumber}
              setWhatsappNumber={setWhatsappNumber}
              saveSystemSettings={saveSystemSettings}
              settingsLoading={settingsLoading}
            />
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Destek Talepleri</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Kullanıcıların gönderdiği yardım, öneri ve hata bildirimleri.</p>
               </div>
               <AdminSupport />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Duyurular</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Tüm kullanıcılara gösterilecek sistem duyurularını yönetin.</p>
               </div>
               <AdminAnnouncements />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Log</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Yönetici paneli işlemlerinin denetim günlükleri.</p>
               </div>
               <AdminAudit />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;