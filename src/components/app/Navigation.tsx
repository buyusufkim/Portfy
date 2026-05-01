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
  Building2,
  CheckSquare
} from 'lucide-react';
import { UserProfile } from '../../types';
import { PortfyLogo } from '../PortfyLogo';

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
          ? 'bg-[#061A32] text-white font-bold' 
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
  <aside id="desktop-sidebar" className="hidden lg:flex flex-col w-[260px] shrink-0 bg-white border-r border-slate-100 p-6 sticky top-0 h-screen overflow-y-auto">
    <div className="flex items-center gap-3 mb-10">
      <PortfyLogo className="h-8" />
    </div>
    
    <div className="space-y-1 flex-1">
      <SidebarLink icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard' && !showAdminPanel} onClick={() => onTabChange('dashboard')} />
      <SidebarLink icon={<CheckSquare size={20} />} label="Günlük Akış" active={activeTab === 'tasks' && !showAdminPanel} onClick={() => onTabChange('tasks')} />
      <SidebarLink icon={<MapIcon size={20} />} label="Bölgem" active={activeTab === 'bolgem' && !showAdminPanel} onClick={() => onTabChange('bolgem')} />
      <SidebarLink icon={<Briefcase size={20} />} label="Portföyler" active={activeTab === 'portfoyler' && !showAdminPanel} onClick={() => onTabChange('portfoyler')} />
      <SidebarLink icon={<Users size={20} />} label="CRM" active={activeTab === 'crm' && !showAdminPanel} onClick={() => onTabChange('crm')} />
      <SidebarLink icon={<Brain size={20} />} label="AI Koç" active={activeTab === 'koc' && !showAdminPanel} onClick={() => onTabChange('koc')} />
    </div>

    <div className="pt-6 mt-4 border-t border-slate-100 flex flex-col space-y-1">
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
  const [lastModule, setLastModule] = React.useState<string>(activeTab !== 'dashboard' && activeTab !== 'tasks' && activeTab !== 'bolgem' && activeTab !== 'portfoyler' ? activeTab : 'crm');

  React.useEffect(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'tasks' && activeTab !== 'bolgem' && activeTab !== 'portfoyler') {
      setLastModule(activeTab);
    }
  }, [activeTab]);

  const handleModulesClick = () => {
    if (showModules) {
      setShowModules(false);
    } else {
      setShowModules(true);
    }
  };

  const navItems = [
    { id: 'crm', icon: <Users size={24} />, label: 'CRM' },
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
        <div 
          className="lg:hidden fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px] flex items-end" 
          onClick={() => setShowModules(false)}
        >
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-[32px] p-6 w-full shadow-2xl pb-[calc(2rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

            <div className="mb-8">
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Daha Fazla</h3>
              <p className="text-slate-500 text-sm font-medium">Diğer Portfy araçlarına hızlı eriş.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {navItems.map(item => {
                const isActive = item.id === 'admin' ? showAdminPanel : activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowModules(false);
                      if (item.id === 'admin') onAdminClick();
                      else onTabChange(item.id);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 border-2 ${
                      isActive 
                        ? 'bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100' 
                        : 'bg-slate-50 border-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${
                      isActive 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'bg-white text-slate-400 shadow-inner ring-1 ring-slate-100'
                    }`}>
                      {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                    </div>
                    <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      <nav id="bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-between items-center z-[60] px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
        <button 
          onClick={() => { setShowModules(false); onTabChange('dashboard'); }}
          className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${activeTab === 'dashboard' && !showAdminPanel ? 'text-[#061A32]' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={22} className={activeTab === 'dashboard' && !showAdminPanel ? 'fill-[#061A32]/10' : ''} />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button 
          onClick={() => { setShowModules(false); onTabChange('tasks'); }}
          className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${activeTab === 'tasks' && !showAdminPanel ? 'text-[#061A32]' : 'text-slate-400'}`}
        >
          <CheckSquare size={22} className={activeTab === 'tasks' && !showAdminPanel ? 'fill-[#061A32]/10' : ''} />
          <span className="text-[10px] font-bold">Günlük Akış</span>
        </button>
        <button 
          onClick={() => { setShowModules(false); onTabChange('bolgem'); }}
          className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${activeTab === 'bolgem' && !showAdminPanel ? 'text-[#061A32]' : 'text-slate-400'}`}
        >
          <MapIcon size={22} className={activeTab === 'bolgem' && !showAdminPanel ? 'fill-[#061A32]/10' : ''} />
          <span className="text-[10px] font-bold">Bölgem</span>
        </button>
        <button 
          onClick={() => { setShowModules(false); onTabChange('portfoyler'); }}
          className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${activeTab === 'portfoyler' && !showAdminPanel ? 'text-[#061A32]' : 'text-slate-400'}`}
        >
          <Briefcase size={22} className={activeTab === 'portfoyler' && !showAdminPanel ? 'fill-[#061A32]/10' : ''} />
          <span className="text-[10px] font-bold">Portföyler</span>
        </button>

        <button 
          onClick={handleModulesClick}
          className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${(activeTab !== 'dashboard' && activeTab !== 'tasks' && activeTab !== 'bolgem' && activeTab !== 'portfoyler' || showAdminPanel) && !showModules ? 'text-[#061A32]' : 'text-slate-400'}`}
        >
          <div className="flex gap-0.5 flex-wrap w-5 h-5 items-center justify-center">
             <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
             <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
             <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
             <div className="w-1.5 h-1.5 rounded-sm bg-current"></div>
          </div>
          <span className="text-[10px] font-bold">Daha Fazla</span>
        </button>
      </nav>
    </>
  );
};