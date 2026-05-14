import React, { useState, useEffect } from 'react';
import { Package, Search, Info, Check, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminToastType, AdminConfirmIntent } from './AdminFeedback';

export interface SubscriptionPackageAdminItem {
  id: string;
  code?: string | null;
  tier?: string | null;
  name: string;
  description?: string | null;
  price_text: string;
  price_numeric?: number | null;
  interval?: string | null;
  badge?: string | null;
  features?: string[] | string | any;
  is_popular?: boolean | null;
  is_active: boolean;
}

type AdminPackagesTabProps = {
  showAdminToast: (type: AdminToastType, title: string, message?: string) => void;
  openAdminConfirm: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    intent: AdminConfirmIntent;
    onConfirm: () => void | Promise<void>;
  }) => void;
  closeAdminConfirm: () => void;
};

export const AdminPackagesTab: React.FC<AdminPackagesTabProps> = ({ showAdminToast, openAdminConfirm, closeAdminConfirm }) => {
  const [packages, setPackages] = useState<SubscriptionPackageAdminItem[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [editingPkg, setEditingPkg] = useState<SubscriptionPackageAdminItem | null>(null);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setPackagesLoading(true);
    const { data } = await supabase.from('subscription_packages').select('*').order('is_active', { ascending: false }).order('price_numeric', { ascending: true });
    if (data) setPackages(data as SubscriptionPackageAdminItem[]);
    setPackagesLoading(false);
  };

  const handleSavePackage = async () => {
    if(!editingPkg) return;
    let featuresArr: string[] = [];
    if (typeof editingPkg.features === 'string') {
        featuresArr = editingPkg.features.split('\n').filter((f:string) => f.trim() !== '');
    } else if (Array.isArray(editingPkg.features)) {
        featuresArr = editingPkg.features;
    }
    const { error } = await supabase.from('subscription_packages').update({
        name: editingPkg.name, 
        price_text: editingPkg.price_text, 
        price_numeric: editingPkg.price_numeric,
        interval: editingPkg.interval, 
        description: editingPkg.description, 
        badge: editingPkg.badge,
        is_popular: editingPkg.is_popular, 
        is_active: editingPkg.is_active,
        features: featuresArr
    }).eq('id', editingPkg.id);

    if(!error) {
        showAdminToast("success", "Başarılı", "Paket başarıyla güncellendi! Sitede anında değişti.");
        setEditingPkg(null);
        fetchPackages();
    } else {
        showAdminToast("error", "Hata", "Paket güncellenirken hata: " + error.message);
    }
  };

  const handleTogglePackageStatus = async (pkg: SubscriptionPackageAdminItem) => {
    const isActivating = !pkg.is_active;
    
    let title = isActivating ? "Paketi aktif et" : "Paketi pasife al";
    let message = isActivating 
      ? "Bu paketi aktif etmek istediğinize emin misiniz? Paket tekrar kullanıcılara görünür olacaktır."
      : "Bu paketi pasife almak istediğinize emin misiniz? Paket silinmeyecek, sadece listelerden kaldırılıp gizlenecektir.";
    let intent: AdminConfirmIntent = isActivating ? 'info' : 'warning';

    // Core packages warning
    if (!isActivating && ['free', '1-month', '3-month', '6-month', '12-month'].includes(pkg.code || '')) {
      title = "Temel satış paketini pasife al";
      message = "Bu temel satış paketlerinden biri. Pasife alırsan fiyat ekranından kaybolabilir. Devam etmek istiyor musun?";
      intent = 'danger';
    }
    
    openAdminConfirm({
      title,
      message,
      intent,
      confirmLabel: isActivating ? 'Aktif Et' : 'Pasife Al',
      onConfirm: async () => {
        const { error } = await supabase.from('subscription_packages').update({
          is_active: isActivating
        }).eq('id', pkg.id);

        if (!error) {
          showAdminToast("success", "Başarılı", "Paket durumu güncellendi.");
          fetchPackages();
        } else {
          showAdminToast("error", "Hata", "Paket durumu güncellenirken hata: " + error.message);
        }
        closeAdminConfirm();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Abonelik Paketleri Yönetimi</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Uygulama içi satın almalarda gösterilen paketleri yapılandırın.</p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 border border-blue-100 rounded-xl flex items-start gap-3">
        <Info size={20} className="shrink-0 mt-0.5 text-blue-500" />
        <div className="text-sm font-medium">
          <strong>Not:</strong> Public fiyat ekranında sadece <strong>aktif</strong> paketler gösterilir. Pasif paketler kullanıcıya görünmez.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-slate-500">Toplam Paket</div>
          <div className="text-3xl font-black text-slate-900">{packages.length}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-emerald-600">Aktif Paket</div>
          <div className="text-3xl font-black text-emerald-700">{packages.filter(p => p.is_active).length}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="text-sm font-bold text-slate-500">Pasif Paket</div>
          <div className="text-3xl font-black text-slate-700">{packages.filter(p => !p.is_active).length}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex-1 relative w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Paket ara (isim, kod, tier)..." 
            value={packageSearchQuery}
            onChange={(e) => setPackageSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto">
          <button onClick={() => setPackageFilter('all')} className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${packageFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tümü</button>
          <button onClick={() => setPackageFilter('active')} className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${packageFilter === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aktif</button>
          <button onClick={() => setPackageFilter('inactive')} className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${packageFilter === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pasif</button>
        </div>
      </div>
      
      {editingPkg ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-900">
              <Package className="text-indigo-600" /> Paketi Düzenle: <span className="uppercase text-indigo-600">{editingPkg.tier}</span>
            </h3>
            <div className="flex items-center gap-4">
              {editingPkg.is_active ? 
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Check size={14}/> Aktif Paket</span> :
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Trash2 size={14}/> Pasif Paket</span>
              }
              <button onClick={() => setEditingPkg(null)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20}/></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Paket Kodu</label><input type="text" value={editingPkg.code || ''} readOnly className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Paket Tier</label><input type="text" value={editingPkg.tier || ''} readOnly className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Paket Görünen Adı</label><input type="text" value={editingPkg.name} onChange={e => setEditingPkg({...editingPkg, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Periyot</label><input type="text" value={editingPkg.interval || ''} onChange={e => setEditingPkg({...editingPkg, interval: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Görünen Fiyat Metni</label><input type="text" value={editingPkg.price_text || ''} onChange={e => setEditingPkg({...editingPkg, price_text: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Sıralama Değeri (Sayı)</label><input type="number" value={editingPkg.price_numeric || 0} onChange={e => setEditingPkg({...editingPkg, price_numeric: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">Avantaj Rozeti</label><input type="text" value={editingPkg.badge || ''} onChange={e => setEditingPkg({...editingPkg, badge: e.target.value})} placeholder="Boş bırakılabilir" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" /></div>
            
            <div className="flex flex-col justify-center space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 transition-colors h-[48px] group">
                <span className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">"En Popüler" Etiketi Göster</span>
                <div className="relative flex items-center">
                  <input type="checkbox" checked={editingPkg.is_popular || false} onChange={e => setEditingPkg({...editingPkg, is_popular: e.target.checked})} className="peer sr-only" />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-500 mb-2">Özellikler (Her satıra bir özellik yazın)</label>
            <textarea 
              value={typeof editingPkg.features === 'string' ? editingPkg.features : (Array.isArray(editingPkg.features) ? editingPkg.features.join('\n') : '')} 
              onChange={e => setEditingPkg({...editingPkg, features: e.target.value})}
              rows={6}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium leading-relaxed resize-none"
              placeholder="Özellik 1&#10;Özellik 2&#10;Özellik 3..."
            ></textarea>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button onClick={handleSavePackage} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
              <Check size={18} /> Değişiklikleri Kaydet
            </button>
            <button onClick={() => handleTogglePackageStatus(editingPkg)} className={`px-6 py-3 border rounded-xl transition-all font-bold flex items-center justify-center gap-2 ${editingPkg.is_active ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              {editingPkg.is_active ? <><Trash2 size={18} /> Pasife Al</> : <><Check size={18} /> Aktif Et</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packagesLoading ? (
            <div className="col-span-full p-12 text-center text-slate-500">Paketler yükleniyor...</div>
          ) : packages
              .filter(pkg => {
                if (packageFilter === 'active' && !pkg.is_active) return false;
                if (packageFilter === 'inactive' && pkg.is_active) return false;
                if (packageSearchQuery) {
                  const s = packageSearchQuery.toLowerCase();
                  return pkg.name.toLowerCase().includes(s) || 
                         (pkg.code || '').toLowerCase().includes(s) || 
                         (pkg.tier || '').toLowerCase().includes(s);
                }
                return true;
              }).map(pkg => (
            <div key={pkg.id} className={`p-6 rounded-3xl shadow-sm flex flex-col justify-between group transition-all relative overflow-hidden ${pkg.is_active ? 'bg-white border border-slate-100 hover:shadow-md hover:border-slate-200' : 'bg-slate-50 border border-slate-200 opacity-80'}`}>
              {pkg.is_popular && pkg.is_active && (
                 <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">Popüler</div>
              )}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-200/50 px-2 py-0.5 rounded uppercase tracking-wider">KOD: {pkg.code || pkg.id}</span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-200/50 px-2 py-0.5 rounded uppercase tracking-wider">Tier: {pkg.tier}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pkg.badge && <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{pkg.badge}</span>}
                    {!pkg.is_active && <span className="bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">PASİF</span>}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{pkg.price_text}</span>
                  <span className="text-sm text-slate-400 font-medium">{pkg.interval}</span>
                </div>
                <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">{pkg.description}</p>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Özellikler</div>
                <ul className="text-xs space-y-2.5 mb-6 text-slate-600 font-medium">
                  {(Array.isArray(pkg.features) ? pkg.features : []).slice(0,5).map((f:string, i:number) => (
                    <li key={i} className="flex items-start gap-2"><Check size={14} className="text-teal-500 shrink-0 mt-0.5" /><span className="line-clamp-2">{f}</span></li>
                  ))}
                  {(Array.isArray(pkg.features) ? pkg.features.length : 0) > 5 && <li className="text-indigo-500 italic font-bold">+{(Array.isArray(pkg.features) ? pkg.features.length : 0) - 5} özellik daha...</li>}
                </ul>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPkg(pkg)} className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                  <Edit2 size={16} /> Düzenle
                </button>
                <button onClick={() => handleTogglePackageStatus(pkg)} title={pkg.is_active ? "Pasife Al" : "Aktif Et"} className={`py-3 px-4 border rounded-xl transition-all flex items-center justify-center ${pkg.is_active ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                  {pkg.is_active ? <Trash2 size={18} /> : <Check size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
