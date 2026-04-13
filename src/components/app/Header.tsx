import React from 'react';
import { UserProfile } from '../../types';

interface HeaderProps {
  activeTab: string;
  profile: UserProfile | null;
}

export const Header = ({ 
  activeTab, 
  profile 
}: HeaderProps) => (
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
