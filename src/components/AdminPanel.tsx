import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Settings, Package, LayoutDashboard, Search, Edit2, Shield, Check, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'packages' | 'settings'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState({
    app_name: 'Portfy',
    theme_color: '#FF3D00',
    maintenance_mode: false,
    global_modules: {
      crm: true,
      tasks: true,
      map: true,
      ai: true,
      gamification: true,
    }
  });

  useEffect(() => {
    fetchUsers();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch('/api/ai/admin/settings', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      
      if (data) {
        // Merge with default state to prevent empty fields
        setGlobalSettings(prev => ({
          ...prev,
          ...data,
          global_modules: {
            ...prev.global_modules,
            ...(data.global_modules || {})
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const saveGlobalSettings = async () => {
    try {
      const response = await fetch('/api/ai/admin/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ settings: globalSettings })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Update failed');
      }

      alert('Ayarlar başarıyla kaydedildi.');
    } catch (error: any) {
      console.error('Error saving global settings:', error);
      alert('Ayarlar kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/admin/users', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch('/api/ai/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          uid: editingUser.uid,
          data: {
            subscription_type: editingUser.subscription_type,
            subscription_end_date: editingUser.subscription_end_date,
            role: editingUser.role,
            active_modules: editingUser.active_modules,
            tier: editingUser.tier
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Update failed');
      }

      setUsers(users.map(u => u.uid === editingUser.uid ? editingUser : u));
      setEditingUser(null);
      alert('Kullanıcı başarıyla güncellendi.');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Kullanıcı güncellenirken hata oluştu: ' + error.message);
    }
  };

  const toggleUserModule = (module: string) => {
    if (!editingUser) return;
    const currentModules = editingUser.active_modules || [];
    const newModules = currentModules.includes(module)
      ? currentModules.filter(m => m !== module)
      : [...currentModules, module];
    setEditingUser({ ...editingUser, active_modules: newModules });
  };

  const filteredUsers = users.filter(u => 
    (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100]">Admin</h1>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white md:hidden"><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'users' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={20} /> Üyeler
          </button>
          <button 
            onClick={() => setActiveTab('packages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'packages' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Package size={20} /> Üyelik Paketleri
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Settings size={20} /> Genel Ayarlar
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors">
            Uygulamaya Dön
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Genel Bakış</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-2">Toplam Üye</div>
                  <div className="text-3xl font-bold text-slate-900">{users.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-2">Aktif Aboneler</div>
                  <div className="text-3xl font-bold text-slate-900">{users.filter(u => u.subscription_type !== 'none' && u.subscription_type !== 'trial').length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-slate-500 text-sm font-medium mb-2">Deneme Sürümündekiler</div>
                  <div className="text-3xl font-bold text-slate-900">{users.filter(u => u.subscription_type === 'trial').length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Üye Yönetimi</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Üye ara..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kullanıcı</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Abonelik</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map(user => (
                        <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{user.display_name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.subscription_type !== 'none' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {user.subscription_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors">
                              <Edit2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Üyelik Paketleri</h2>
              <p className="text-slate-500">Bu bölümden uygulamadaki üyelik paketlerinin fiyatlarını ve özelliklerini yönetebilirsiniz.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['1-month', '3-month', '6-month', '12-month'].map(pkg => (
                  <div key={pkg} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4">{pkg} Planı</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fiyat</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" defaultValue="₺299" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Aktif mi?</span>
                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-600" />
                      </div>
                      <button className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200">Kaydet</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Genel Ayarlar</h2>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="font-bold text-lg border-b border-slate-100 pb-2">Uygulama Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Uygulama Adı</label>
                    <input type="text" value={globalSettings.app_name} onChange={e => setGlobalSettings({...globalSettings, app_name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Ana Tema Rengi</label>
                    <div className="flex gap-2">
                      <input type="color" value={globalSettings.theme_color} onChange={e => setGlobalSettings({...globalSettings, theme_color: e.target.value})} className="w-10 h-10 p-1 border border-slate-200 rounded-lg" />
                      <input type="text" value={globalSettings.theme_color} onChange={e => setGlobalSettings({...globalSettings, theme_color: e.target.value})} className="flex-1 p-2 border border-slate-200 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Bakım Modu</div>
                    <div className="text-xs text-slate-500">Uygulamayı geçici olarak kullanıma kapatır.</div>
                  </div>
                  <input type="checkbox" checked={globalSettings.maintenance_mode} onChange={e => setGlobalSettings({...globalSettings, maintenance_mode: e.target.checked})} className="w-6 h-6 accent-orange-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="font-bold text-lg border-b border-slate-100 pb-2">Global Modül Yönetimi</h3>
                <p className="text-xs text-slate-500">Bu modülleri kapattığınızda tüm kullanıcılar için devre dışı kalır.</p>
                <div className="space-y-3">
                  {globalSettings.global_modules && Object.entries(globalSettings.global_modules).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <span className="font-medium capitalize">{key} Modülü</span>
                      <input 
                        type="checkbox" 
                        checked={value as boolean} 
                        onChange={e => setGlobalSettings({
                          ...globalSettings, 
                          global_modules: { ...globalSettings.global_modules, [key]: e.target.checked }
                        })} 
                        className="w-5 h-5 accent-orange-600" 
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <button onClick={saveGlobalSettings} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors">
                Tüm Ayarları Kaydet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Üye Düzenle: {editingUser.display_name}</h3>
              <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Rol</label>
                <select 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'agent'})}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                >
                  <option value="agent">Danışman (Agent)</option>
                  <option value="admin">Yönetici (Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Abonelik Tipi</label>
                <select 
                  value={editingUser.subscription_type} 
                  onChange={e => setEditingUser({...editingUser, subscription_type: e.target.value as any})}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                >
                  <option value="none">Yok</option>
                  <option value="trial">15 Gün Deneme</option>
                  <option value="1-month">1 Aylık</option>
                  <option value="3-month">3 Aylık</option>
                  <option value="6-month">6 Aylık</option>
                  <option value="12-month">12 Aylık</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Abonelik Bitiş Tarihi</label>
                <input 
                  type="datetime-local" 
                  value={editingUser.subscription_end_date ? new Date(editingUser.subscription_end_date).toISOString().slice(0, 16) : ''} 
                  onChange={e => setEditingUser({...editingUser, subscription_end_date: new Date(e.target.value).toISOString()})}
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Özel Modül İzinleri</label>
                <p className="text-[10px] text-slate-400 mb-3">Bu kullanıcıya özel olarak hangi modüllerin açık olacağını seçin. Seçilmezse global ayarlar geçerli olur.</p>
                <div className="space-y-2">
                  {['crm', 'tasks', 'map', 'ai', 'gamification'].map(mod => (
                    <label key={mod} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input 
                        type="checkbox" 
                        checked={(editingUser.active_modules || []).includes(mod)}
                        onChange={() => toggleUserModule(mod)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span className="font-medium capitalize">{mod}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200">İptal</button>
              <button onClick={saveUser} className="px-6 py-2 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2">
                <Save size={18} /> Kaydet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
