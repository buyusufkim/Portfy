import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export const Badge = ({ children, variant = 'default', className = "" }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'info' | 'error', className?: string }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-orange-100 text-orange-600',
    info: 'bg-blue-100 text-blue-600',
    error: 'bg-red-100 text-red-600'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <span className={`animate-pulse bg-slate-200 rounded-xl inline-block ${className}`} />
);

export const StatCard: React.FC<{ id?: string, label: string, value: string | number, icon: React.ReactNode, trend?: string, color: 'orange' | 'purple' | 'emerald' | 'blue' }> = ({ id, label, value, icon, trend, color }) => {
  const colors = {
    orange: 'from-orange-500 to-orange-600 shadow-orange-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    blue: 'from-blue-500 to-blue-600 shadow-blue-200'
  };

  return (
    <Card id={id} className="p-6 relative group overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-[0.03] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${colors[color]} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold">
            <TrendingUp size={10} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </Card>
  );
};
