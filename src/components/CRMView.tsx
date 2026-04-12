import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Sparkles, 
  Users, 
  User as UserIcon, 
  Phone 
} from 'lucide-react';
import { Lead } from '../types';
import { Card, Badge, Skeleton } from './UI';

interface CRMViewProps {
  leads: Lead[];
  leadsLoading: boolean;
  setShowWhatsAppImport: (show: boolean) => void;
  setShowAddLead: (show: boolean) => void;
  isAnalyzingLeads: boolean;
  setIsAnalyzingLeads: (analyzing: boolean) => void;
  analyzeLeadsMutation: any;
  categories: any[];
}

export const CRMView: React.FC<CRMViewProps> = ({
  leads,
  leadsLoading,
  setShowWhatsAppImport,
  setShowAddLead,
  isAnalyzingLeads,
  setIsAnalyzingLeads,
  analyzeLeadsMutation,
  categories
}) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-6 space-y-6"
  >
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteri Rehberi</h1>
      <div className="flex gap-2">
        <button 
          onClick={() => setShowWhatsAppImport(true)} 
          className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-2 text-xs font-bold"
        >
          <MessageSquare size={18} />
          WhatsApp'tan Aktar
        </button>
        <button onClick={() => setShowAddLead(true)} className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
          <Plus size={20} />
        </button>
      </div>
    </div>

    <div className="flex gap-3">
      <div className="flex-1 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Müşteri ara..." 
          className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-sm shadow-sm"
        />
      </div>
      <button 
        onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
        disabled={isAnalyzingLeads || leads.length === 0}
        className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center gap-2 text-xs font-bold disabled:opacity-50"
      >
        {isAnalyzingLeads ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={16} /></motion.div>
        ) : <Sparkles size={16} />}
        Rehber Analizi
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {leadsLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          </Card>
        ))
      ) : leads.length === 0 ? (
        <div className="text-center p-20 space-y-4 col-span-full">
          <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
            <Users size={40} />
          </div>
          <p className="text-slate-500 text-sm">Henüz müşteri kaydetmedin.</p>
        </div>
      ) : leads.map(lead => {
        const category = categories.find(c => c.label === lead.type);
        const iconColor = category ? category.color : (lead.type === 'Alıcı' ? '#ea580c' : '#9333ea');
        const iconBg = category ? `${category.color}20` : (lead.type === 'Alıcı' ? '#fff7ed' : '#faf5ff');
        
        return (
          <Card key={lead.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: iconBg, color: iconColor }}
              >
                <UserIcon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={lead.status === 'Sıcak' ? 'warning' : 'default'}>{lead.status}</Badge>
                  <span className="text-[10px] text-slate-400">{lead.type}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a 
                href={`tel:${lead.phone}`}
                className="p-2 bg-slate-50 rounded-xl text-orange-600"
              >
                <Phone size={18} />
              </a>
              <a 
                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-50 rounded-xl text-emerald-500"
              >
                <MessageSquare size={18} />
              </a>
            </div>
          </Card>
        );
      })}
    </div>
  </motion.div>
);
