import React from 'react';
import { Phone, Save } from 'lucide-react';

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
      <h2 className="text-2xl font-bold text-slate-900">Genel Sistem Ayarları</h2>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Phone size={20} /></div>
          <div><h3 className="font-bold text-lg text-slate-900">WhatsApp Aktivasyon Hattı</h3><p className="text-xs text-slate-500">Müşterilerin paket taleplerini göndereceği telefon numarası.</p></div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Telefon Numarası (Ülke kodu ile, artısız)</label>
          <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="Örn: 905551234567" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-lg font-medium" />
          <p className="text-[10px] text-slate-400 mt-2">* Satın alma butonlarına basıldığında bu numaraya hazır şablon ile mesaj gönderilir.</p>
        </div>
        <div className="pt-4 text-right">
          <button onClick={saveSystemSettings} disabled={settingsLoading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 inline-flex"><Save size={18} /> {settingsLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</button>
        </div>
      </div>
    </div>
  );
};
