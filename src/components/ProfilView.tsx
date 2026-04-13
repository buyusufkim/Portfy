import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CreditCard, 
  Globe, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Bell, 
  MessageSquare, 
  LogOut 
} from 'lucide-react';
import { UserProfile, BrokerAccount } from '../types';
import { Card, Badge } from './UI';

interface ProfilViewProps {
  profile: UserProfile | null;
  brokerAccount: BrokerAccount | null;
  logout: () => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowExternalListings: (show: boolean) => void;
  setShowIntegrationModal: (show: boolean) => void;
  syncListingsMutation: any;
  updateProfileMutation: any;
  setShowTemplateManager: (show: boolean) => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  profile,
  brokerAccount,
  logout,
  setShowAdminPanel,
  setShowExternalListings,
  setShowIntegrationModal,
  syncListingsMutation,
  updateProfileMutation,
  setShowTemplateManager
}) => (
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
        <h2 className="text-2xl font-bold text-slate-900">{profile?.display_name}</h2>
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
            {profile?.subscription_type === 'none' ? 'Aktif Üyelik Yok' : `${profile?.subscription_type?.split('-')[0]} Aylık Plan`}
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
              {brokerAccount ? `${brokerAccount.store_name} Bağlı` : 'Resmi API ile bağla'}
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
            defaultValue={profile?.notification_settings?.time || "09:00"}
            onChange={(e) => {
              if (profile) {
                updateProfileMutation.mutate({ 
                  uid: profile.uid, 
                  data: { 
                    notification_settings: { 
                      ...(profile.notification_settings || { push: true, email: false, time: "09:00" }), 
                      time: e.target.value 
                    } 
                  } 
                });
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
