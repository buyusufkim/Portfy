import React, { useEffect } from 'react';
import { LogOut, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const PricingScreen = () => {
  const { subscribe, logout } = useAuth();
  
  // Safety check: if we are in a popup, try to signal success and close
  useEffect(() => {
    const isPopup = window.location.search.includes('popup=true') || 
                   window.location.hash.includes('access_token=') ||
                   window.name === 'oauth_popup';
    
    if (isPopup) {
      localStorage.setItem('oauth_success', Date.now().toString());
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
      }
      setTimeout(() => window.close(), 1000);
    }
  }, []);

  const [showManualMessage, setShowManualMessage] = React.useState(false);

  const plans = [
    { id: '1-month', name: '1 Aylık', price: '₺299', months: 1 },
    { id: '3-month', name: '3 Aylık', price: '₺799', months: 3, popular: true },
    { id: '6-month', name: '6 Aylık', price: '₺1.499', months: 6 },
    { id: '12-month', name: '12 Aylık', price: '₺2.499', months: 12 },
  ];

  const handlePaidPlanClick = () => {
    setShowManualMessage(true);
    setTimeout(() => setShowManualMessage(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Üyelik Planları</h1>
        <button onClick={logout} className="p-2 text-slate-400"><LogOut size={20} /></button>
      </div>
      
      <div className="bg-orange-600 rounded-[32px] p-6 text-white mb-8 shadow-xl shadow-orange-200">
        <ShieldCheck size={32} className="mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Profesyonel Araçlara Erişin</h2>
        <p className="text-orange-100 text-sm leading-relaxed">
          Saha takibi, CRM ve performans analizlerini kullanmak için bir üyelik planı seçin.
        </p>
      </div>

      {showManualMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          Ücretli planlar şu an sadece manuel aktivasyon ile sunulmaktadır. Lütfen destek ekibimizle iletişime geçin.
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <button 
            key={plan.id}
            onClick={handlePaidPlanClick}
            className={`w-full p-5 rounded-[28px] border-2 text-left transition-all relative overflow-hidden ${
              plan.popular ? 'border-orange-600 bg-white shadow-lg' : 'border-slate-100 bg-white'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                En Popüler
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Tüm özelliklere sınırsız erişim</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">{plan.price}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Aktivasyon Talebi</div>
              </div>
            </div>
          </button>
        ))}

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3 font-medium text-center">Henüz karar vermediniz mi?</p>
          <button 
            onClick={() => subscribe('trial')}
            className="w-full p-5 rounded-[28px] bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            <Zap size={18} className="text-orange-400 fill-orange-400" />
            7 Gün Ücretsiz Dene
          </button>
        </div>
      </div>

      <p className="text-center text-slate-400 text-[10px] mt-8 px-8">
        Deneme süreniz anında aktif olur. Ücretli plan aktivasyonları için lütfen destek ekibimizle iletişime geçin.
      </p>
    </div>
  );
};

export default PricingScreen;
