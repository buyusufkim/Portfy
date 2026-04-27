import React from 'react';
import { Phone, Save, MessageCircle } from 'lucide-react';

interface AdminSettingsProps {
  whatsappNumber: string;
  setWhatsappNumber: (val: string) => void;
  saveSystemSettings: () => void;
  settingsLoading: boolean;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  whatsappNumber,
  setWhatsappNumber,
  saveSystemSettings,
  settingsLoading
}) => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Genel Sistem Ayarları</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Uygulamanın çalışmasını etkileyen temel yapılandırmalar.</p>
      </div>
      
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">WhatsApp Satış Hattı</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Kullanıcılar "Premium Yap" veya ödeme işlemlerinde bu numaraya yönlendirilir.
            </p>
          </div>
        </div>
        
        <div className="py-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Telefon Numarası
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              value={whatsappNumber} 
              onChange={e => setWhatsappNumber(e.target.value)} 
              placeholder="Örn: 905551234567" 
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:border-emerald-500 focus:ring-emerald-100 transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white outline-none" 
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            Numarayı alan kodu ile birlikte boşluk bırakmadan girin (Örn: 90532...).
          </p>
        </div>
        
        <div className="pt-2 flex justify-end">
          <button 
            onClick={saveSystemSettings} 
            disabled={settingsLoading} 
            className="px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-70"
          >
            <Save size={18} className={settingsLoading ? "animate-pulse" : ""} /> 
            {settingsLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
