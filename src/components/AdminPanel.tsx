import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Settings, Package, LayoutDashboard, Edit2, Check, X, 
  Save, ClipboardList, Trash2, Phone, Search, RefreshCw, 
  AlertCircle, Clock, Crown, Briefcase, TrendingUp, DollarSign, 
  Activity, Zap, PieChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'packages' | 'settings' | 'tasks'>('dashboard');
  
  // Kullanıcı State'leri
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Kullanıcı Düzenleme (Abonelik) State'leri
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editTier, setEditTier] = useState<string>('free');
  const [editEndDate, setEditEndDate] = useState<string>('');
  
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
    const { data } = await supabase.from('system_settings').select('whatsapp_number').eq('id', 1).single();
    if (data) {
      setWhatsappNumber(data.whatsapp_number);
    }
    setSettingsLoading(false);
  };

  const saveSystemSettings = async () => {
    setSettingsLoading(true);
    const { error } = await supabase.from('system_settings').update({ whatsapp_number: whatsappNumber }).eq('id', 1);
    setSettingsLoading(false);
    if (!error) {
      alert("Sistem ayarları başarıyla kaydedildi!");
    } else {
      alert("Hata: " + error.message);
    }
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
    const { error } = await supabase.from('task_templates').insert({ 
      title: newTaskTitle, points: newTaskPoints, category: newTaskCategory, description: newTaskDescription, auto_verify: newTaskAutoVerify 
    });
    if (!error) {
      setNewTaskTitle(''); setNewTaskPoints(10); setNewTaskDescription(''); setNewTaskAutoVerify(true); fetchTasks();
    } else {
      alert("Görev eklenirken hata: " + error.message);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('task_templates').update({ is_active: !currentStatus }).eq('id', id); fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) { 
      await supabase.from('task_templates').delete().eq('id', id); fetchTasks(); 
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

  const handleResetToken = async (uid: string) => {
    if (window.confirm("Bu kullanıcının AI Token kullanımını sıfırlamak istediğinize emin misiniz?")) {
      const { error } = await supabase.from('profiles').update({ ai_tokens_used: 0 }).eq('uid', uid);
      if (!error) {
        alert("Token başarıyla sıfırlandı!");
        fetchUsers();
      } else {
        alert("Token sıfırlanırken hata oluştu: " + error.message);
      }
    }
  };

  const openEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditTier(user.tier || 'free');
    setEditEndDate(user.subscription_end_date ? user.subscription_end_date.substring(0, 10) : '');
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
    const { error } = await supabase.from('profiles').update({ 
      tier: editTier, subscription_end_date: finalEndDate
    }).eq('uid', editingUser.uid);

    if (!error) {
      alert(`${editingUser.display_name} kullanıcısının paketi güncellendi!`);
      setEditingUser(null);
      fetchUsers(); 
    } else {
      alert("Hata oluştu: " + error.message);
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

  // --- SAAS DASHBOARD HESAPLAMALARI ---
  const todayStr = new Date().toISOString().split('T')[0];
  
  const totalUsers = users.length;
  const masterUsers = users.filter(u => u.tier === 'master').length;
  const freeUsers = users.filter(u => !u.tier || u.tier === 'free').length;
  const trialUsers = users.filter(u => u.tier === 'trial').length;
  
  // Bugün giriş yapmış aktif kullanıcılar
  const onlineToday = users.filter(u => u.last_active_date && u.last_active_date.startsWith(todayStr)).length;
  
  // Toplam Token Harcaması (Sistemdeki tüm kullanıcıların toplamı)
  const totalTokensUsed = users.reduce((acc, u) => acc + (u.ai_tokens_used || 0), 0);
  
  // Maliyet Hesabı (Yaklaşık 1 Milyon Token = 50₺ maliyet varsayımıyla. 1000 Token = 0.05₺)
  const estimatedAiCost = (totalTokensUsed / 1000) * 0.05;

  // Gelir Hesabı (Master üye başına ortalama 999₺/ay hesaplanır)
  const estimatedMRR = masterUsers * 999;
  
  // Dönüşüm Oranı (Ücretsizden Master'a geçenlerin yüzdesi)
  const conversionRate = totalUsers > 0 ? ((masterUsers / totalUsers) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100]">Admin</h1>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white md:hidden"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users size={20} /> Üyeler & Abonelik
          </button>
          <button onClick={() => setActiveTab('packages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'packages' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Package size={20} /> Paketler
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'tasks' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ClipboardList size={20} /> Görev Yönetimi
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={20} /> Genel Ayarlar
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors">Uygulamaya Dön</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50 overflow-y-auto relative">
        
        {/* 🔥 KULLANICI DÜZENLEME MODALI 🔥 */}
        <AnimatePresence>
          {editingUser && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Crown className="text-orange-600" /> Abonelik Yönetimi
                  </h3>
                  <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-6">
                  {/* Kullanıcı Özeti */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editingUser.uid}`} alt="Profile" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{editingUser.display_name || 'İsimsiz Kullanıcı'}</div>
                      <div className="text-xs text-slate-500">{editingUser.email}</div>
                    </div>
                  </div>

                  {/* Paket Seçimi */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Aktif Paket</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setEditTier('free')}
                        className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${editTier === 'free' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <Briefcase size={16}/> Başlangıç
                      </button>
                      <button 
                        onClick={() => setEditTier('trial')}
                        className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${editTier === 'trial' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <Clock size={16}/> Deneme
                      </button>
                      <button 
                        onClick={() => setEditTier('master')}
                        className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${editTier === 'master' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <Crown size={16}/> Master
                      </button>
                    </div>
                  </div>

                  {/* Süre Ekleme */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bitiş Tarihi</label>
                    <div className="flex items-center gap-3 mb-3">
                      <input 
                        type="date" 
                        value={editEndDate} 
                        onChange={e => setEditEndDate(e.target.value)}
                        className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-slate-700 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => addMonthsToEndDate(1)} className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">+1 Ay</button>
                      <button onClick={() => addMonthsToEndDate(3)} className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">+3 Ay</button>
                      <button onClick={() => addMonthsToEndDate(6)} className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">+6 Ay</button>
                      <button onClick={() => setLifetime()} className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors">Sınırsız</button>
                    </div>
                  </div>

                </div>

                <div className="pt-8 flex justify-end gap-3">
                  <button onClick={() => setEditingUser(null)} className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">İptal</button>
                  <button onClick={saveUserSubscription} disabled={loading} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2">
                    <Save size={18} /> Kaydet
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-8">
          
          {/* 🔥 SAAS DASHBOARD SEKMESİ 🔥 */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">SaaS Metrikleri</h2>
                <p className="text-slate-500 mt-1">Uygulamanın anlık durumu, maliyetleri ve gelir özeti.</p>
              </div>

              {/* Temel Metrikler (Gelir & Kullanıcı) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <DollarSign size={20} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Aylık Tahmini</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">Aylık Gelir (MRR)</div>
                  <div className="text-3xl font-black text-slate-900">{estimatedMRR.toLocaleString('tr-TR')}₺</div>
                  <div className="absolute -bottom-4 -right-4 text-emerald-50 opacity-50 pointer-events-none"><TrendingUp size={100} /></div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Crown size={20} />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Ödeyen</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">Master Üyeler</div>
                  <div className="text-3xl font-black text-slate-900">{masterUsers}</div>
                  <div className="mt-2 text-xs font-bold text-slate-400">Dönüşüm Oranı: <span className="text-indigo-600">%{(conversionRate)}</span></div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Kayıtlı</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">Toplam Üye</div>
                  <div className="text-3xl font-black text-slate-900">{totalUsers}</div>
                  <div className="mt-2 text-xs font-bold text-slate-400 flex gap-2">
                     <span className="text-slate-500">{freeUsers} Free</span> • <span className="text-orange-500">{trialUsers} Deneme</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Canlı</span>
                  </div>
                  <div className="text-slate-500 text-sm font-bold mb-1">Bugün Aktif Olanlar</div>
                  <div className="text-3xl font-black text-slate-900">{onlineToday}</div>
                  <div className="mt-2 text-xs font-bold text-slate-400">Sisteme bugün giriş yapanlar</div>
                </div>
              </div>

              {/* AI Token ve Maliyet Özeti */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                        <Zap size={24} className="text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Toplam AI Token Tüketimi</h3>
                        <p className="text-xs text-slate-400">Tüm kullanıcıların uyguladıkları istekler</p>
                      </div>
                    </div>
                    <div className="text-5xl font-black tracking-tight mb-2">
                      {totalTokensUsed.toLocaleString()} <span className="text-xl text-slate-500 font-medium">Token</span>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <PieChart size={24} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Tahmini AI Maliyeti</h3>
                      <p className="text-xs text-slate-500">Kullanılan tokenlar bazında tahmini gider (0.05₺ / 1k)</p>
                    </div>
                  </div>
                  <div className="text-5xl font-black tracking-tight text-slate-900 mb-2">
                    {estimatedAiCost.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Net Kâr / Zarar Tahmini:</span>
                    <span className={`font-black ${estimatedMRR - estimatedAiCost >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(estimatedMRR - estimatedAiCost).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}₺
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🔥 ÜYELER, ABONELİK VE TOKEN YÖNETİMİ SEKMESİ 🔥 */}
          {activeTab === 'users' && (
            <div className="space-y-6"> 
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Üye ve Abonelik Yönetimi</h2>
                <div className="relative w-full md:w-72">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="İsim veya E-posta ile ara..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                {loading ? (
                  <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                     <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
                     Üyeler Yükleniyor...
                  </div>
                ) : (
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kullanıcı Bilgisi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Abonelik Durumu</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">AI Token Tüketimi</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(u => {
                        const used = u.ai_tokens_used || 0;
                        const limit = u.ai_token_limit || (u.tier === 'master' ? 100000 : 5000);
                        const ratio = Math.min((used / limit) * 100, 100);
                        const isWarning = ratio >= 80;
                        const isDanger = ratio >= 100;
                        
                        const remainingText = getRemainingDays(u.subscription_end_date);
                        const isExpired = remainingText === "Süresi Doldu";

                        return (
                          <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{u.display_name || 'İsimsiz Kullanıcı'}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                              <div className="text-[10px] text-slate-400 mt-1">Son Aktif: <span className="font-bold">{u.last_active_date || 'Bilinmiyor'}</span></div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                  u.tier === 'master' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 
                                  u.tier === 'trial' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {u.tier === 'master' ? 'Master' : u.tier === 'trial' ? 'Deneme' : 'Başlangıç'}
                                </span>
                                {(u.tier === 'master' || u.tier === 'trial') && remainingText && (
                                  <span className={`text-[10px] font-bold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {isExpired ? <AlertCircle size={12}/> : <Clock size={12}/>}
                                    {remainingText}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 w-64">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-700">{used.toLocaleString()} / {limit.toLocaleString()}</span>
                                <span className={`font-bold ${isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-emerald-500'}`}>
                                  %{Math.round(ratio)}
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${ratio}%` }}
                                />
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleResetToken(u.uid)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-sm" title="Token Sıfırla"><RefreshCw size={16} /></button>
                                <button onClick={() => openEditUser(u)} className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2" title="Aboneliği Düzenle"><Edit2 size={14} /> Düzenle</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">Aramanıza uygun kullanıcı bulunamadı.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* PAKETLER SEKMESİ */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Abonelik Paketleri Yönetimi</h2>
              
              {editingPkg ? (
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      <Package className="text-orange-600" /> Paketi Düzenle: <span className="uppercase text-orange-600">{editingPkg.tier}</span>
                    </h3>
                    <button onClick={() => setEditingPkg(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Paket Görünen Adı</label><input type="text" value={editingPkg.name} onChange={e => setEditingPkg({...editingPkg, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Periyot</label><input type="text" value={editingPkg.interval} onChange={e => setEditingPkg({...editingPkg, interval: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Görünen Fiyat Metni</label><input type="text" value={editingPkg.price_text} onChange={e => setEditingPkg({...editingPkg, price_text: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Sıralama Değeri (Sayı)</label><input type="number" value={editingPkg.price_numeric} onChange={e => setEditingPkg({...editingPkg, price_numeric: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-2">Avantaj Rozeti</label><input type="text" value={editingPkg.badge || ''} onChange={e => setEditingPkg({...editingPkg, badge: e.target.value})} placeholder="Boş bırakılabilir" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors h-full">
                        <input type="checkbox" checked={editingPkg.is_popular} onChange={e => setEditingPkg({...editingPkg, is_popular: e.target.checked})} className="w-5 h-5 accent-orange-600" />
                        <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">"En Popüler" Etiketi</span></div>
                      </label>
                    </div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-2">Kısa Açıklama</label><input type="text" value={editingPkg.description} onChange={e => setEditingPkg({...editingPkg, description: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20" /></div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-2">Özellik Listesi (Her satıra bir özellik)</label>
                      <textarea rows={8} value={Array.isArray(editingPkg.features) ? editingPkg.features.join('\n') : editingPkg.features} onChange={e => setEditingPkg({...editingPkg, features: e.target.value})} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 leading-relaxed" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button onClick={handleSavePackage} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"><Save size={18} /> Değişiklikleri Kaydet</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {packagesLoading ? (
                    <div className="col-span-full p-12 text-center text-slate-500">Paketler yükleniyor...</div>
                  ) : packages.map(pkg => (
                    <div key={pkg.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-colors">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-black text-slate-900">{pkg.name} <span className="text-sm text-slate-400 font-medium">({pkg.tier})</span></h3>
                          {pkg.badge && <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">{pkg.badge}</span>}
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-black text-slate-900">{pkg.price_text}</span>
                          <span className="text-sm text-slate-400 font-medium">{pkg.interval}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">{pkg.description}</p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Özellikler</div>
                        <ul className="text-xs space-y-2 mb-6 text-slate-600 font-medium">
                          {(pkg.features || []).slice(0,5).map((f:string, i:number) => (
                            <li key={i} className="flex items-start gap-2"><Check size={14} className="text-emerald-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{f}</span></li>
                          ))}
                          {(pkg.features || []).length > 5 && <li className="text-orange-500 italic font-bold">+{pkg.features.length - 5} özellik daha...</li>}
                        </ul>
                      </div>
                      <button onClick={() => setEditingPkg(pkg)} className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md">
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
              <h2 className="text-2xl font-bold text-slate-900">Oyunlaştırma: Görev Havuzu</h2>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-1">Görev Adı</label><input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl" /></div>
                  <div className="w-full md:w-24"><label className="block text-xs font-bold text-slate-500 mb-1">Puan</label><input type="number" value={newTaskPoints} onChange={e => setNewTaskPoints(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-xl" /></div>
                  <div className="w-full md:w-32"><label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label><select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as 'sweet' | 'main')} className="w-full p-2.5 border border-slate-200 rounded-xl"><option value="sweet">Sweet (Kolay)</option><option value="main">Main (Saha/Kritik)</option></select></div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-1">Görev Açıklaması / Talimatlar</label><input type="text" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl" /></div>
                  <div className="w-full md:w-auto flex flex-col justify-center mt-2 md:mt-0">
                     <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <input type="checkbox" checked={newTaskAutoVerify} onChange={e => setNewTaskAutoVerify(e.target.checked)} className="w-5 h-5 accent-orange-600" />
                        <div className="flex flex-col"><span className="text-xs font-bold text-slate-900">Otomatik Onayla</span></div>
                     </label>
                  </div>
                  <div className="mt-2 md:mt-0 self-stretch flex">
                    <button onClick={handleAddTask} className="w-full md:w-auto h-full px-8 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors">Ekle</button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                {tasksLoading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Görev Adı</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Açıklama</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kategori & Puan</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Aktiflik</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taskTemplates.map(task => (
                        <tr key={task.id} className={`hover:bg-slate-50 ${!task.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 font-bold text-slate-900">{task.title}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{task.description || '-'}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${task.category === 'main' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{task.category}</span><span className="ml-2 text-xs font-bold text-orange-600">+{task.points} XP</span></td>
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
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-900">Genel Sistem Ayarları</h2>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Phone size={20} /></div>
                  <div><h3 className="font-bold text-lg text-slate-900">WhatsApp Aktivasyon Hattı</h3><p className="text-xs text-slate-500">Müşterilerin paket taleplerini göndereceği telefon numarası.</p></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefon Numarası (Ülke kodu ile, artısız)</label>
                  <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="Örn: 905551234567" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-lg font-medium" />
                  <p className="text-[10px] text-slate-400 mt-2">* Satın alma butonlarına basıldığında bu numaraya hazır şablon ile mesaj gönderilir.</p>
                </div>
                <div className="pt-4 text-right">
                  <button onClick={saveSystemSettings} disabled={settingsLoading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 inline-flex"><Save size={18} /> {settingsLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;