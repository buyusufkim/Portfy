import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Package, LayoutDashboard, X, 
  ClipboardList, Activity, Briefcase, Mail
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminSettings } from './AdminSettings';
import { AdminSupport } from './AdminSupport';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminAudit } from './AdminAudit';
import { api } from '../services/api';

import { useAdminFeedback, AdminToastViewport, AdminConfirmModal, AdminConfirmIntent } from './admin/AdminFeedback';
import { getRemainingDays, getEffectiveAiTokenLimitSafe, isPaidMasterUser, isActiveTrialUser, isExpiredSubscriber, isFreeUser, buildAdminDashboardMetrics } from './admin/adminPanelHelpers';
import { AdminPackagesTab } from './admin/AdminPackagesTab';
import { AdminTasksTab } from './admin/AdminTasksTab';
import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminUserDetailModal } from './admin/AdminUserDetailModal';
import { AdminUserSubscriptionModal } from './admin/AdminUserSubscriptionModal';

const getErrorMessage = (error: unknown, fallback = 'Bilinmeyen bir hata oluştu') => {
  return error instanceof Error ? error.message : String(error);
};

export type AdminUserSubscriptionUpdate = {
  tier: 'free' | 'master';
  subscription_type: 'none' | 'trial' | '1-month' | '3-month' | '6-month' | '12-month';
  subscription_end_date: string | null;
};

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
  const [userFilter, setUserFilter] = useState<'all'|'free'|'trial'|'master'|'expired'|'near_limit'|'inactive_14d'>('all');
  
  // Kullanıcı Düzenleme (Abonelik) State'leri
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editTier, setEditTier] = useState<string>('free');
  const [editSubDuration, setEditSubDuration] = useState<string>('1-month');
  const [editEndDate, setEditEndDate] = useState<string>('');

  // Kullanıcı Detay (İnceleme) State'leri
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);
  const [userDetailStats, setUserDetailStats] = useState({ properties: 0, leads: 0, loading: false });
  
  // Sistem Ayarları State'i (WhatsApp)
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // -- TOAST & CONFIRM STATE --
  const {
    adminToasts,
    adminConfirm,
    showAdminToast,
    removeAdminToast,
    openAdminConfirm,
    closeAdminConfirm
  } = useAdminFeedback();

  useEffect(() => {
    fetchUsers();
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
      showAdminToast("success", "Sistem Ayarları", "Sistem ayarları başarıyla kaydedildi!");
    } catch (error) {
      showAdminToast("error", "Hata", getErrorMessage(error));
    }
    setSettingsLoading(false);
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
        // Support both old array structure and new paginated structure { data, count, page, pageSize }
        const usersArray = Array.isArray(data) ? data : (data.data || []);
        setUsers(usersArray as UserProfile[]);
      }
    } catch (e) {
      console.error("Kullanıcılar çekilirken hata:", e);
    } finally { 
      setLoading(false); 
    }
  };

  const handleResetToken = async (id: string) => {
    openAdminConfirm({
      title: "Token kullanımını sıfırla",
      message: "Bu kullanıcının AI token kullanımını sıfırlamak istediğinize emin misiniz?",
      intent: 'warning',
      confirmLabel: 'Sıfırla',
      onConfirm: async () => {
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
            showAdminToast("success", "Başarılı", "Token başarıyla sıfırlandı!");
            fetchUsers();
          } else {
            const data = await response.json();
            showAdminToast("error", "Hata", 'Token sıfırlanırken hata oluştu: ' + data.error);
          }
        } catch (error) {
          showAdminToast("error", "Hata", 'Bağlantı hatası: ' + getErrorMessage(error));
        } finally {
          closeAdminConfirm();
        }
      }
    });
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === id) {
      showAdminToast("error", "Hata", "Kendi admin hesabınızı silemezsiniz.");
      return;
    }

    openAdminConfirm({
      title: "Kullanıcıyı sil",
      message: "Bu işlem geri alınamaz. Kullanıcıyı tamamen silmek istediğinize emin misiniz?",
      intent: 'danger',
      confirmLabel: 'Sil',
      onConfirm: async () => {
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
            showAdminToast("success", "Başarılı", 'Kullanıcı başarıyla silindi.');
            fetchUsers();
          } else {
            const data = await response.json();
            showAdminToast("error", "Hata", 'Hata oluştu: ' + data.error);
          }
        } catch (error) {
          showAdminToast("error", "Hata", 'Bağlantı hatası: ' + getErrorMessage(error));
        } finally {
          setLoading(false);
          closeAdminConfirm();
        }
      }
    });
  };

  const openEditUser = (user: UserProfile) => {
    setEditingUser(user);
    if (user.subscription_type === 'trial') {
      setEditTier('trial');
    } else if (user.tier === 'master') {
      setEditTier('master');
      const validTypes = ['1-month', '3-month', '6-month', '12-month'];
      if (validTypes.includes(user.subscription_type || '')) {
         setEditSubDuration(user.subscription_type!);
      } else {
         setEditSubDuration('1-month');
      }
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
    setEditTier('trial');
  };

  const addMonthsToEndDate = (months: number, subtype: string) => {
    const currentDate = editEndDate ? new Date(editEndDate) : new Date();
    if (!editEndDate || currentDate.getTime() < new Date().getTime()) {
       currentDate.setTime(new Date().getTime());
    }
    currentDate.setMonth(currentDate.getMonth() + months);
    setEditEndDate(currentDate.toISOString().substring(0, 10));
    setEditSubDuration(subtype);
    setEditTier('master');
  };

  const saveUserSubscription = async () => {
    if (!editingUser) return;
    setLoading(true);
    const finalEndDate = editEndDate ? new Date(editEndDate).toISOString() : null;
    
    let updateData: AdminUserSubscriptionUpdate;
    if (editTier === "free") {
      updateData = { tier: "free", subscription_type: "none", subscription_end_date: null };
    } else if (editTier === "trial") {
      updateData = { tier: "master", subscription_type: "trial", subscription_end_date: finalEndDate };
    } else {
      updateData = { tier: "master", subscription_type: editSubDuration as AdminUserSubscriptionUpdate['subscription_type'], subscription_end_date: finalEndDate };
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
        showAdminToast("success", "Başarılı", `${editingUser.display_name} kullanıcısının paketi güncellendi!`);
        setEditingUser(null);
        fetchUsers(); 
      } else {
        const data = await response.json();
        showAdminToast("error", "Hata", "Hata oluştu: " + data.error);
      }
    } catch(err) {
      showAdminToast("error", "Hata", "Hata oluştu: " + getErrorMessage(err));
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => {
    const searchMatch = (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!searchMatch) return false;
    
    switch (userFilter) {
      case 'free': return isFreeUser(u);
      case 'trial': return isActiveTrialUser(u);
      case 'master': return isPaidMasterUser(u);
      case 'expired': return isExpiredSubscriber(u);
      case 'near_limit':
        const lim = getEffectiveAiTokenLimitSafe(u);
        return lim > 0 && ((u.ai_tokens_used || 0) / lim) >= 0.8;
      case 'inactive_14d':
        if (!u.last_active_date) return true;
        const diff = new Date().getTime() - new Date(u.last_active_date).getTime();
        return diff > 14 * 24 * 60 * 60 * 1000;
      default: return true;
    }
  });

  // --- SAAS DASHBOARD HESAPLAMALARI ---
  const dashboardMetrics = buildAdminDashboardMetrics(users);

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
        <AdminUserDetailModal
          user={selectedUserDetail}
          userDetailStats={userDetailStats}
          onClose={() => setSelectedUserDetail(null)}
        />

        {/* 🔥 KULLANICI DÜZENLEME MODALI 🔥 */}
        <AdminUserSubscriptionModal
          user={editingUser}
          loading={loading}
          editTier={editTier}
          editSubDuration={editSubDuration}
          editEndDate={editEndDate}
          setEditTier={setEditTier}
          setEditSubDuration={setEditSubDuration}
          setEditEndDate={setEditEndDate}
          onClose={() => setEditingUser(null)}
          onSave={saveUserSubscription}
          setEditEndDateToTrial={setEditEndDateToTrial}
          addMonthsToEndDate={addMonthsToEndDate}
        />

        {/* 🔥 SAAS DASHBOARD SEKMESİ 🔥 */}
        {activeTab === 'dashboard' && (
          <AdminDashboardTab 
            metrics={dashboardMetrics}
            handleOpenUserDetail={handleOpenUserDetail}
          />
        )}

        {/* 🔥 ÜYELER, ABONELİK VE TOKEN YÖNETİMİ SEKMESİ 🔥 */}
          {activeTab === 'users' && (
            <AdminUsersTab
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              userFilter={userFilter}
              setUserFilter={setUserFilter}
              filteredUsers={filteredUsers}
              handleOpenUserDetail={handleOpenUserDetail}
              openEditUser={openEditUser}
              handleResetToken={handleResetToken}
              handleDeleteUser={handleDeleteUser}
              getRemainingDays={getRemainingDays}
              getEffectiveAiTokenLimitSafe={getEffectiveAiTokenLimitSafe}
            />
          )}

          {/* PAKETLER SEKMESİ */}
          {activeTab === 'packages' && (
            <AdminPackagesTab 
              showAdminToast={showAdminToast}
              openAdminConfirm={openAdminConfirm}
              closeAdminConfirm={closeAdminConfirm}
            />
          )}

          {/* GÖREV YÖNETİMİ SEKMESİ */}
          {activeTab === 'tasks' && (
            <AdminTasksTab 
              showAdminToast={showAdminToast}
              openAdminConfirm={openAdminConfirm}
              closeAdminConfirm={closeAdminConfirm}
            />
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

      {/* Admin Toasts */}
      <AdminToastViewport toasts={adminToasts} onRemove={removeAdminToast} />

      {/* Admin Confirm Modal */}
      <AdminConfirmModal confirm={adminConfirm} onClose={closeAdminConfirm} />
    </div>
  );
};

export default AdminPanel;