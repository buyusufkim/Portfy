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
}: NavigationProps) => {
  const [showModules, setShowModules] = React.useState(false);
  const [showQuickMenu, setShowQuickMenu] = React.useState(false);
  const [lastModule, setLastModule] = React.useState<string>(activeTab !== 'dashboard' ? activeTab : 'bolgem');

  React.useEffect(() => {
    if (activeTab !== 'dashboard') {
      setLastModule(activeTab);
    }
  }, [activeTab]);

  const handleModulesClick = () => {
    if (activeTab === 'dashboard') {
      if (lastModule === 'profil' || lastModule === 'admin') {
        onTabChange('bolgem');
      } else {
        onTabChange(lastModule);
      }
    } else {
      setShowModules(!showModules);
    }
  };

  const navItems = [
    { id: 'bolgem', icon: <MapIcon size={24} />, label: 'Bölgem' },
    { id: 'portfoyler', icon: <Briefcase size={24} />, label: 'Portföyler' },
    { id: 'crm', icon: <Users size={24} />, label: 'CRM' },
    { id: 'notes', icon: <MessageSquare size={24} />, label: 'İçerik' },
    { id: 'koc', icon: <Brain size={24} />, label: 'AI Koç' },
    { id: 'profil', icon: <UserIcon size={24} />, label: 'Profilim' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ id: 'admin', icon: <ShieldCheck size={24} />, label: 'Admin' });
  }

  return (
    <>
      {/* Modules Overlay */}
      {showModules && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-md flex items-end pb-24" onClick={() => setShowModules(false)}>
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            className="bg-white rounded-t-3xl p-6 w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-slate-900 mb-6 text-center">Modüller</h3>
            <div className="grid grid-cols-4 gap-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setShowModules(false);
                    if (item.id === 'admin') onAdminClick();
                    else onTabChange(item.id);
                  }}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-colors ${(item.id === 'admin' ? showAdminPanel : activeTab === item.id) ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className={`p-3 rounded-2xl ${(item.id === 'admin' ? showAdminPanel : activeTab === item.id) ? 'bg-orange-100' : 'bg-slate-50'}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <nav id="bottom-nav" className="md:hidden fixed bottom-5 left-4 right-4 bg-slate-900 shadow-2xl shadow-slate-900/40 rounded-3xl px-6 py-3 flex justify-between items-center z-[60]">
        <button 
          onClick={() => { setShowModules(false); onTabChange('dashboard'); }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' && !showAdminPanel ? 'text-white' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Bugün</span>
        </button>

        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
          className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-lg -mt-8 border-4 border-slate-50 relative z-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
        </button>

        <button 
          onClick={handleModulesClick}
          className={`flex flex-col items-center gap-1 transition-colors ${(activeTab !== 'dashboard' || showAdminPanel) && !showModules ? 'text-white' : 'text-slate-400'}`}
        >
          <div className="flex gap-1 flex-wrap w-5 h-5 opacity-80">
            <div className="w-2 h-2 rounded-sm bg-current"></div>
            <div className="w-2 h-2 rounded-sm bg-current"></div>
            <div className="w-2 h-2 rounded-sm bg-current"></div>
            <div className="w-2 h-2 rounded-sm bg-current"></div>
          </div>
          <span className="text-[10px] font-bold">Modüller</span>
        </button>
      </nav>
    </>
  );
};