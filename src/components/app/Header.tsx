import React from 'react';
import { UserProfile } from '../../types';
import { Bell, Clock } from 'lucide-react';
import { PortfyLogo } from '../PortfyLogo';
import { useTurkeyClock } from '../../hooks/useTurkeyClock';

interface HeaderProps {
  activeTab: string;
  profile: UserProfile | null;
}

export const Header = ({ 
  activeTab, 
  profile 
}: HeaderProps) => {
  const { dateLabel, timeLabel, isSynced } = useTurkeyClock();
  const shortDate = dateLabel.split(' ').slice(0, 2).join(' '); // "29 Nisan"

  return (
  <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
    <div className="flex items-center gap-4">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center">
         <PortfyLogo className="h-7" />
      </div>

      <div className="hidden lg:flex flex-col">
        <h1 className="text-xl font-bold text-[#061A32]">
          {activeTab === 'dashboard' && 'Günaydın ' + (profile?.display_name?.split(' ')[0] || 'Danışman') + ' 👋'}
          {activeTab === 'tasks' && 'Günlük Akış'}
          {activeTab === 'bolgem' && 'Bölge Analizi'}
          {activeTab === 'portfoyler' && 'Portföylerim'}
          {activeTab === 'crm' && 'Müşteri Yönetimi'}
          {activeTab === 'profil' && 'Profilim'}
          {activeTab === 'koc' && 'Yapay Zeka Koçu'}
        </h1>
      </div>
    </div>
    
    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
      {/* Clock Display */}
      <div 
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg"
        title={isSynced ? "Sunucu zamanı ile senkronize" : "Yerel zaman (Senkronizasyon bekleniyor)"}
      >
        <Clock size={14} className={isSynced ? "text-slate-400" : "text-amber-500"} />
        <span className="text-xs font-semibold text-slate-600">TR {shortDate} · {timeLabel}</span>
      </div>
      <div 
        className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg"
        title={isSynced ? "Sunucu zamanı ile senkronize" : "Yerel zaman (Senkronizasyon bekleniyor)"}
      >
        <Clock size={12} className={isSynced ? "text-slate-400" : "text-amber-500"} />
        <span className="text-[11px] font-semibold text-slate-600">{shortDate} · {timeLabel}</span>
      </div>

      <div className="text-slate-400 relative p-2 flex items-center justify-center -mr-2" title="Bildirimler yakında">
        <Bell size={22} />
      </div>

      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-sm shrink-0">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
          alt="Profile"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </header>
  );
};

