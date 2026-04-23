import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Brain, 
  ShieldCheck, 
  User as UserIcon,
  Building2
} from 'lucide-react';
import { UserProfile } from '../../types';

interface NavigationProps {
  activeTab: string;
  showAdminPanel: boolean;
  profile: UserProfile | null;
  onTabChange: (tab: string) => void;
  onAdminClick: () => void;
}

export function NavButton({ icon, active, onClick, id }: { icon: React.ReactNode, active: boolean, onClick: () => void, id?: string }) {
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

export function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
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

export const DesktopSidebar = ({ 
  activeTab, 
  showAdminPanel, 
  profile, 
  onTabChange, 
  onAdminClick 
}: NavigationProps) => (
  <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen">
    <div className="flex items-center gap-3 mb-10">
      <div className="w-10 h-10 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
        <Building2 size={24} />
      </div>
      <span className="text-2xl font-black italic font-logo text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D00] to-[#FF9100] tracking-wide">Portfy</span>
    </div>
    
    <div className="space-y-2 flex-1">
      <SidebarLink icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard' && !showAdminPanel} onClick={() => onTabChange('dashboard')} />
      <SidebarLink icon={<MapIcon size={20} />} label="Bölgem" active={activeTab === 'bolgem' && !showAdminPanel} onClick={() => onTabChange('bolgem')} />
      <SidebarLink icon={<Briefcase size={20} />} label="Portföyler" active={activeTab === 'portfoyler' && !showAdminPanel} onClick={() => onTabChange('portfoyler')} />
      <SidebarLink icon={<Users size={20} />} label="CRM" active={activeTab === 'crm' && !showAdminPanel} onClick={() => onTabChange('crm')} />
      <SidebarLink icon={<MessageSquare size={20} />} label="İçerik & Notlar" active={activeTab === 'notes' && !showAdminPanel} onClick={() => onTabChange('notes')} />
      <SidebarLink icon={<Brain size={20} />} label="AI Koç" active={activeTab === 'koc' && !showAdminPanel} onClick={() => onTabChange('koc')} />
    </div>

    <div className="pt-6 border-t border-slate-100">
      {profile?.role === 'admin' && (
        <SidebarLink icon={<ShieldCheck size={20} />} label="Admin Paneli" active={showAdminPanel} onClick={onAdminClick} />
      )}
      <SidebarLink icon={<UserIcon size={20} />} label="Profilim" active={activeTab === 'profil' && !showAdminPanel} onClick={() => onTabChange('profil')} />
    </div>
  </aside>
);

export const MobileNav = ({ 
  activeTab, 
  showAdminPanel, 
  profile, 
  onTabChange, 
  onAdminClick 
}: NavigationProps) => (
  // Mobilde ikonların yan yana sığması için paddingleri kısıp ikonları size={22} yaptık
  <nav id="bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-4 flex justify-between items-center z-40 pb-safe">
    <NavButton id="nav-dashboard" icon={<LayoutDashboard size={22} />} active={activeTab === 'dashboard' && !showAdminPanel} onClick={() => onTabChange('dashboard')} />
    <NavButton id="nav-map" icon={<MapIcon size={22} />} active={activeTab === 'bolgem' && !showAdminPanel} onClick={() => onTabChange('bolgem')} />
    <NavButton id="nav-portfolio" icon={<Briefcase size={22} />} active={activeTab === 'portfoyler' && !showAdminPanel} onClick={() => onTabChange('portfoyler')} />
    <NavButton id="nav-crm" icon={<Users size={22} />} active={activeTab === 'crm' && !showAdminPanel} onClick={() => onTabChange('crm')} />
    
    {/* 🔥 EKSİK OLAN AI KOÇ BUTONU BURAYA GELDİ 🔥 */}
    <NavButton id="nav-coach" icon={<Brain size={22} />} active={activeTab === 'koc' && !showAdminPanel} onClick={() => onTabChange('koc')} />
    
    {profile?.role === 'admin' ? (
      <NavButton id="nav-admin" icon={<ShieldCheck size={22} />} active={showAdminPanel} onClick={onAdminClick} />
    ) : (
      <NavButton id="nav-notes" icon={<MessageSquare size={22} />} active={activeTab === 'notes' && !showAdminPanel} onClick={() => onTabChange('notes')} />
    )}
  </nav>
);