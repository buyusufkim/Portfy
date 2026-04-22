import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalService } from '../services/portalService';
import { 
  Building2, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Users, 
  Activity,
  CheckCircle2,
  Share2,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const ClientPortalPage: React.FC = () => {
  const token = window.location.pathname.split('/portal/')[1];

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => portalService.getSecurePortalData(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Rapor hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Bağlantı Geçersiz</h2>
          <p className="text-slate-500 mb-6">Ulaşmaya çalıştığınız rapor bulunamadı veya süresi dolmuş olabilir. Lütfen danışmanınızla iletişime geçin.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const { property, agent, stats, recentActivities } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">PORTFY Portal</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
               CANLI RAPOR
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Intro */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin size={16} />
            <span className="text-sm">
              {property.address.district}, {property.address.city}
            </span>
          </div>
        </motion.div>

        {/* Vital Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard 
            icon={<Phone className="text-blue-500" />} 
            label="Görüşülen Kişi" 
            value={stats.calls}
            suffix="Arama"
            delay={0.1}
          />
          <StatCard 
            icon={<Calendar className="text-emerald-500" />} 
            label="Saha Ziyareti" 
            value={stats.visits}
            suffix="Gösterim"
            delay={0.2}
          />
          <StatCard 
            icon={<Clock className="text-amber-500" />} 
            label="Pazarlama Süresi" 
            value={stats.daysOnMarket}
            suffix="Gün"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Section */}
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Pazarlama Durumu
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Satış Olasılığı</span>
                    <span className="font-bold text-indigo-600">%{Math.round(property.sale_probability * 100)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${property.sale_probability * 100}%` }}
                      className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500 mb-1">Mevcut Durum</p>
                    <p className="font-bold text-slate-900">{property.status}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-xs text-slate-500 mb-1">Listeleme Fiyatı</p>
                    <p className="font-bold text-slate-900">
                      {property.price.toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Activities */}
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-emerald-600" />
                Son Etkinlikler
              </h3>
              
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        task.type === 'Arama' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {task.type === 'Arama' ? <Phone size={18} /> : <Users size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(task.time), 'd MMMM HH:mm', { locale: tr })}
                        </p>
                      </div>
                      <div className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-1 rounded-md">
                        {task.type}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock size={24} />
                    </div>
                    <p className="text-slate-400">Henüz kaydedilmiş bir etkinlik bulunmuyor.</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200"
            >
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-4">Sorumlu Danışman</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold backdrop-blur-sm border border-white/30">
                  {agent?.display_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h4 className="font-bold text-xl">{agent?.display_name || 'Gayrimenkul Danışmanı'}</h4>
                  <p className="text-indigo-200 text-sm">Portfy Profesyoneli</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="w-full bg-white/10 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/20">
                  <Activity size={18} />
                  Aktif Süreç
                </div>
              </div>
            </motion.div>

            {/* AI Insights (Transparent part) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            >
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Danışman Notu</h3>
              <p className="text-slate-600 leading-relaxed italic">
                "{property.notes?.substring(0, 150) || 'Portföyünüzün pazarlama süreci aktif olarak devam etmektedir. Tüm kanallardan gelen talepler titizlikle değerlendirilmektedir.'}..."
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, suffix, delay }: { icon: React.ReactNode, label: string, value: number, suffix: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center"
  >
    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
      {icon}
    </div>
    <span className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-wider">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black text-slate-900">{value}</span>
      <span className="text-sm font-bold text-slate-400">{suffix}</span>
    </div>
  </motion.div>
);
