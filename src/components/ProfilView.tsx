import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock,
  ShieldCheck, 
  ArrowRight, 
  CreditCard, 
  Globe, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Bell, 
  MessageSquare, 
  LogOut,
  MapPin,
  Users,
  Share2
} from 'lucide-react';
import { UserProfile, BrokerAccount, MutationResult, Referral } from '../types';
import { Card, Badge } from './UI';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface ProfilViewProps {
  profile: UserProfile | null;
  brokerAccount: BrokerAccount | null;
  logout: () => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowExternalListings: (show: boolean) => void;
  setShowIntegrationModal: (show: boolean) => void;
  syncListingsMutation: MutationResult<void, void>;
  updateProfileMutation: MutationResult<void, { id: string, data: Partial<UserProfile> }>;
  setShowRegionSetup: (show: boolean) => void;
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
  setShowRegionSetup
}) => {
  return (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-6 space-y-8"
  >
    <div className="text-center space-y-4">
      <div className="w-24 h-24 bg-slate-200 rounded-[32px] mx-auto overflow-hidden border-4 border-white shadow-xl">
        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`} alt="Profile" />
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
            {profile?.subscription_type === 'none' ? 'Aktif Üyelik Yok' : 
             profile?.subscription_type === 'trial' ? '7 Günlük Deneme Süresi' :
             `${profile?.subscription_type?.split('-')[0]} Aylık Plan`}
          </p>
          {profile?.subscription_end_date && (
            <p className="text-[10px] text-orange-600 font-bold mt-1">
              Bitiş: {new Date(profile.subscription_end_date).toLocaleDateString('tr-TR')}
            </p>
          )}
        </div>
        <Badge variant="success">Aktif</Badge>
      </Card>

      <Card 
        className="flex items-center gap-4 border-l-4 border-blue-500 cursor-pointer hover:bg-blue-50/30 transition-colors"
        onClick={() => setShowRegionSetup(true)}
      >
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
          <MapPin size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900">Çalışma Bölgesi</h4>
          <p className="text-xs text-slate-500">
            {profile?.region ? `${profile.region.city}, ${profile.region.district}` : 'Bölge ayarlanmamış'}
          </p>
          {profile?.region?.neighborhoods && profile.region.neighborhoods.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.region.neighborhoods.map(n => (
                <span key={n} className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 text-slate-400">
          <ArrowRight size={20} />
        </div>
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

      <button 
        onClick={logout}
        className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> Çıkış Yap
      </button>
    </div>
  </motion.div>
  );
};
