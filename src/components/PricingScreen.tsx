import React, { useEffect } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
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

  const plans = [
    { id: '1-month', name: '1 Aylık', price: '₺299', months: 1 },
    { id: '3-month', name: '3 Aylık', price: '₺799', months: 3, popular: true },
    { id: '6-month', name: '6 Aylık', price: '₺1.499', months: 6 },
    { id: '12-month', name: '12 Aylık', price: '₺2.499', months: 12 },
  ];

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

      <div className="space-y-4">
        {plans.map((plan) => (
          <button 
            key={plan.id}
            onClick={() => subscribe(plan.id as any)}
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
                <div className="text-[10px] text-slate-400 uppercase font-bold">Tek Ödeme</div>
              </div>
            </div>
          </button>
        ))}

        <button 
          onClick={() => subscribe('trial')}
          className="w-full mt-4 p-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
        >
          15 Gün Ücretsiz Dene
        </button>
      </div>

      <p className="text-center text-slate-400 text-[10px] mt-8 px-8">
        Ödeme işlemleri güvenli altyapı üzerinden gerçekleştirilir. Üyeliğiniz anında aktif olur.
      </p>
    </div>
  );
};

export default PricingScreen;
