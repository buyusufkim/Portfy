import React, { useState, useEffect } from 'react';
import { PackageRequest } from '../../types';
import { packageRequestService } from '../../services/packageRequestService';
import { maskEmail, maskPhone } from '../../utils/masking';
import { Check, X, Search, Clock, MessageSquare, AlertCircle } from 'lucide-react';

import { AdminConfirmIntent } from './AdminFeedback';

type AdminPackageRequestsTabProps = {
  showAdminToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  openAdminConfirm: (config: {
    title: string;
    message: string;
    confirmLabel: string;
    intent: AdminConfirmIntent;
    onConfirm: () => void | Promise<void>;
  }) => void;
  closeAdminConfirm: () => void;
};

export const AdminPackageRequestsTab: React.FC<AdminPackageRequestsTabProps> = ({
  showAdminToast,
  openAdminConfirm,
  closeAdminConfirm
}) => {
  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [filterStr, setFilterStr] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setMissingTable(false);
      const data = await packageRequestService.adminGetPackageRequests();
      setRequests(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'MISSING_TABLE') {
        setMissingTable(true);
        setRequests([]);
      } else {
        showAdminToast("error", "Hata!", err instanceof Error ? err.message : "Paket talepleri yüklenemedi");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = (req: PackageRequest) => {
    openAdminConfirm({
      intent: 'info',
      title: 'Paket Talebini Onayla',
      message: `Bu kullanıcıya ${req.requested_duration} Master erişimi tanımlanacak. Devam edilsin mi?`,
      confirmLabel: 'Onayla',
      onConfirm: async () => {
        try {
          await packageRequestService.adminApprovePackageRequest(req.id);
          showAdminToast('success', 'Başarılı', 'Paket talebi onaylandı ve süre eklendi.');
          loadRequests();
        } catch (err: unknown) {
          showAdminToast('error', 'Hata!', err instanceof Error ? err.message : 'Onaylanırken hata oluştu.');
        } finally {
          closeAdminConfirm();
        }
      }
    });
  };

  const handleReject = (req: PackageRequest) => {
    openAdminConfirm({
      intent: 'danger',
      title: 'Talebi Reddet',
      message: 'Bu paket talebini reddetmek istediğinize emin misiniz?',
      confirmLabel: 'Reddet',
      onConfirm: async () => {
        try {
          await packageRequestService.adminRejectPackageRequest(req.id);
          showAdminToast('success', 'Başarılı', 'Talep reddedildi.');
          loadRequests();
        } catch (err: unknown) {
          showAdminToast('error', 'Hata!', err instanceof Error ? err.message : 'Reddedilirken hata oluştu.');
        } finally {
          closeAdminConfirm();
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Bekliyor</span>;
      case 'approved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Onaylandı</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Reddedildi</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">İptal Edildi</span>;
      default: return null;
    }
  };

  const getDurationLabel = (dur: string) => {
    switch(dur) {
      case '1-month': return '1 Aylık';
      case '3-month': return '3 Aylık';
      case '6-month': return '6 Aylık';
      case '12-month': return '12 Aylık';
      default: return dur;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStr !== 'all' && req.status !== filterStr) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      if (!req.user?.display_name.toLowerCase().includes(q) && 
          !req.user?.email.toLowerCase().includes(q) &&
          !req.amount_text.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const pendingAmount = requests.filter(r => r.status === 'pending').reduce((acc, curr) => acc + curr.amount_numeric, 0);

  return (
    <div className="space-y-6">
      {missingTable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-bold">Tablo Bulunamadı</h4>
            <p className="text-sm mt-1">Paket talepleri tablosu bulunamadı. Lütfen "50_package_requests.sql" migration'ının production veritabanına uygulandığından emin olun.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div><div className="text-sm text-slate-500 font-bold mb-1">Bekleyen Talepler</div><div className="text-2xl font-black">{requests.filter(r => r.status==='pending').length}</div></div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><Clock /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div><div className="text-sm text-slate-500 font-bold mb-1">Onaylanan</div><div className="text-2xl font-black">{requests.filter(r => r.status==='approved').length}</div></div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><Check /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div><div className="text-sm text-slate-500 font-bold mb-1">Red / İptal</div><div className="text-2xl font-black">{requests.filter(r => ['rejected','cancelled'].includes(r.status)).length}</div></div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><X /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div><div className="text-sm text-slate-500 font-bold mb-1">Bekleyen Tutar</div><div className="text-2xl font-black">{pendingAmount.toLocaleString('tr-TR')} ₺</div></div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><AlertCircle /></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-full md:w-auto">
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(f => (
              <button 
                key={f}
                onClick={() => setFilterStr(f)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex-1 md:flex-none ${filterStr === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : f === 'approved' ? 'Onaylanan' : f === 'rejected' ? 'Reddedilen' : 'İptal'}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="İsim, e-posta veya tutar ara..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kullanıcı Bilgileri</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Talep</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mevcut Durumu</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Talep Tarihi</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Yükleniyor...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Talep bulunamadı.</td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{req.user?.display_name || 'İsimsiz'}</div>
                      <div className="text-xs text-slate-500">{req.user?.email ? maskEmail(req.user.email) : ''}</div>
                      {req.user?.phone && <div className="text-xs text-slate-500">{maskPhone(req.user.phone)}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">Master / {getDurationLabel(req.requested_duration)}</div>
                      <div className="text-sm font-bold text-indigo-600">{req.amount_text}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold capitalize bg-slate-100 inline-block px-2 py-1 rounded text-slate-600">
                         {req.user?.tier || 'free'} / {req.user?.subscription_type || 'none'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 font-medium">
                      {new Date(req.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4 px-4">
                       {getStatusBadge(req.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {req.user?.phone && (
                            <a href={`https://wa.me/${req.user.phone.replace(/\+/g,'').replace(/\s+/g,'')}?text=Merhaba, Portfy Master paketi talebinizle ilgili ulaşıyorum.`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors" title="WhatsApp ile İletişim">
                              <MessageSquare size={14} />
                            </a>
                          )}
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(req)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                <Check size={14} /> Onayla
                              </button>
                              <button onClick={() => handleReject(req)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1">
                                <X size={14} /> Reddet
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
