import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  MapPin,
  User as UserIcon,
  Users,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  FileText,
  Radar as RadarIcon,
  Share2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ImageIcon
} from 'lucide-react';
import { Property, Lead, PortfolioBlocker, RegionEfficiencyScore, BrokerAccount, Task } from '../../types';
import { MagicLinkButton } from '../premium/MagicLinkButton';
import { OwnerPortalButton } from '../premium/OwnerPortalButton';
import { CompetitorRadar } from './CompetitorRadar';
import { api } from '../../services/api';

interface PropertyDetailModalProps {
  selectedProperty: Property | null;
  onClose: () => void;
  leads: Lead[];
  regionScores: RegionEfficiencyScore[];
  brokerAccount: BrokerAccount | null;
  blockers?: PortfolioBlocker[];
  onResolveBlocker?: (id: string) => void;
  onShowExternalListings: () => void;
  onGenerateMarketingHub: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUploadImage: (file: File) => void;
  isUploading: boolean;
  isDeleting?: boolean;
  magicLinkSlot?: React.ReactNode;
  setShowAddTask?: (show: boolean) => void;
  tasks?: Task[];
  setShowDocumentAutomation?: (val: boolean) => void;
  setDocumentAutomationProperty?: (val: Property | null) => void;
  setDocumentAutomationLead?: (val: Lead | null) => void;
}

const getLeadMatchReasons = (lead: Lead, property: Property): string[] => {
  const reasons: string[] = [];
  const leadDistrict = lead.district?.trim().toLowerCase();
  const propertyDistrict = property.address?.district?.trim().toLowerCase();

  if (leadDistrict && propertyDistrict && leadDistrict === propertyDistrict) {
    reasons.push('Bölge Eşleşmesi');
  }

  const leadNotesLower = lead.notes?.trim().toLowerCase() || '';
  if (property.type && leadNotesLower.includes(property.type.trim().toLowerCase())) {
    reasons.push('Notlardan Tip Eşleşmesi');
  }
  if (propertyDistrict && leadNotesLower.includes(propertyDistrict)) {
    reasons.push('Notlardan Bölge Eşleşmesi');
  }
  if (reasons.length > 0 && (lead.status === 'Sıcak' || lead.temperature === 'hot')) {
    reasons.push('Sıcak Takip');
  }

  return reasons;
};

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  selectedProperty,
  onClose,
  leads,
  blockers = [],
  onGenerateMarketingHub,
  onEdit,
  onDelete,
  isDeleting = false,
  magicLinkSlot,
  setShowAddTask,
  tasks = [],
  setShowDocumentAutomation,
  setDocumentAutomationProperty
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: liveMarketAnalysis, isLoading: isMarketLoading } = useQuery({
    queryKey: ['liveMarketAnalysis', selectedProperty?.id],
    queryFn: () => selectedProperty ? api.getLiveMarketAnalysis(selectedProperty) : Promise.resolve(null),
    enabled: !!selectedProperty,
    staleTime: 1000 * 60 * 15,
  });

  if (!selectedProperty) return null;

  const matchedLeads = (leads || []).filter(l => 
    l.status !== 'Pasif' && 
    l.type !== 'Bölge Network' &&
    getLeadMatchReasons(l, selectedProperty).length > 0
  );

  const marketData = liveMarketAnalysis?.data;
  const saleProbVal = marketData?.saleProbability !== undefined
    ? Math.round(marketData?.saleProbability * 100) 
    : (selectedProperty.sale_probability !== undefined ? Math.round(selectedProperty.sale_probability * 100) : null);

  const activeBlockers = blockers.filter(b => b.property_id === selectedProperty.id && b.is_active);
  const propertyTasks = tasks.filter(t => t.property_id === selectedProperty.id);

  const totalImages = selectedProperty.images?.length || 0;
  const currentImage = selectedProperty.images?.[currentImageIndex];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end md:items-center justify-center md:p-4"
      >
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-[#F8FAFC] w-full max-w-[1200px] rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[95vh] md:h-[90vh] relative"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2">
                <ArrowLeft size={20} className="text-slate-600" />
                <span className="hidden md:block text-sm font-bold text-slate-800">Portföylerime Dön</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                 <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                   Portfy ID: #{selectedProperty.id.split('-')[0].toUpperCase()}
                 </div>
                 {/* Removed broker account photo to match types */}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            {/* Top Hero Card (Image + Basic Info) */}
            <div className="p-4 md:p-6 pb-0">
              <div className="bg-white rounded-[24px] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-6 xl:gap-8">
                
                {/* Image Section */}
                <div className="relative w-full xl:w-[460px] h-[300px] md:h-[340px] shrink-0 rounded-2xl overflow-hidden group bg-slate-100 flex items-center justify-center">
                   {totalImages > 0 ? (
                     <>
                       <img 
                          src={currentImage} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt={selectedProperty.title}
                          referrerPolicy="no-referrer"
                       />
                       <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
                         {currentImageIndex + 1} / {totalImages}
                       </div>
                       {totalImages > 1 && (
                         <>
                           <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10">
                             <ChevronLeft size={20} />
                           </button>
                           <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10">
                             <ChevronRightIcon size={20} />
                           </button>
                         </>
                       )}
                     </>
                   ) : (
                     <div className="text-slate-400 flex flex-col items-center">
                       <ImageIcon size={48} className="mb-2 opacity-50" />
                       <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Görsel Yok</span>
                     </div>
                   )}
                   
                   <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                     {selectedProperty.status === 'Yeni' ? (
                       <span className="bg-emerald-100/90 backdrop-blur-sm text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200 uppercase tracking-wide">Yeni</span>
                     ) : (
                       <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20 uppercase tracking-wide">Aktif</span>
                     )}
                     {selectedProperty.market_analysis?.status === 'Fırsat' && <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-500 uppercase tracking-wide">Fırsat</span>}
                   </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 flex flex-col pt-1">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-2 mb-1">
                       <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${selectedProperty.status === 'Pasif' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                         {selectedProperty.status}
                       </span>
                       <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                         {selectedProperty.type || 'Konut'}
                       </span>
                     </div>
                     {/* Desktop Actions */}
                     <div className="hidden sm:flex items-center gap-2">
                        <button onClick={onEdit} className="w-10 h-10 rounded-[14px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all bg-slate-50 shadow-sm" title="Düzenle">
                           <Edit2 size={16} />
                        </button>
                        {confirmDelete ? (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1 rounded-[14px] shadow-sm">
                             <button onClick={() => setConfirmDelete(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-500 hover:bg-slate-100"><X size={14}/></button>
                             <button onClick={() => { setConfirmDelete(false); onDelete(); }} disabled={isDeleting} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-xl mr-1">{isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'SİL'}</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(true)} disabled={isDeleting} className="w-10 h-10 rounded-[14px] bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm" title="Sil">
                             {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                        <button onClick={() => {
                           const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${selectedProperty.title || ''}\nFiyat: ₺${selectedProperty.price ? selectedProperty.price.toLocaleString() : '-'}\nDetaylar için: https://portfy.app/ilan/${selectedProperty.id}`);
                           window.open(`https://wa.me/?text=${text}`, '_blank');
                        }} className="w-10 h-10 rounded-[14px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all bg-slate-50 shadow-sm" title="Paylaş">
                           <Share2 size={16} />
                        </button>
                     </div>
                   </div>

                   <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mt-2">{selectedProperty.title || 'İsimsiz Portföy'}</h2>
                   <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-sm font-medium">
                     <MapPin size={16} className="text-slate-400" />
                     <span>{selectedProperty.address?.neighborhood}, {selectedProperty.address?.district}, {selectedProperty.address?.city}</span>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-6 md:mt-8">
                     <div className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">₺{selectedProperty.price ? selectedProperty.price.toLocaleString() : '-'}</div>
                     <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <TrendingUp size={16} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-600">{saleProbVal !== null ? `%${saleProbVal}` : '-'} Satış Olasılığı</span>
                     </div>
                   </div>
                   
                   {/* Mobile Actions Only */}
                   <div className="flex sm:hidden items-center gap-2 mt-6 pb-2">
                       <button onClick={onEdit} className="flex-1 h-12 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 bg-white">
                           <Edit2 size={18} />
                       </button>
                       <button onClick={() => setConfirmDelete(!confirmDelete)} className="flex-1 h-12 border border-rose-200 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                           <Trash2 size={18} />
                       </button>
                       <button onClick={() => {
                           const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${selectedProperty.title || ''}\nFiyat: ₺${selectedProperty.price ? selectedProperty.price.toLocaleString() : '-'}\nDetaylar için: https://portfy.app/ilan/${selectedProperty.id}`);
                           window.open(`https://wa.me/?text=${text}`, '_blank');
                       }} className="flex-1 h-12 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 bg-white">
                           <Share2 size={18} />
                       </button>
                   </div>
                   {confirmDelete && (
                     <div className="sm:hidden mt-2 mb-4 bg-rose-600 text-white rounded-2xl p-4 flex items-center justify-between">
                       <span className="text-xs font-bold">Kalıcı silinsin mi?</span>
                       <div className="flex gap-2">
                         <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-bold">İptal</button>
                         <button onClick={() => { setConfirmDelete(false); onDelete(); }} className="px-3 py-1.5 bg-white text-rose-600 rounded-xl text-xs font-black shadow-sm">Sil</button>
                       </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-auto pt-6 xl:pt-8 w-full max-w-full lg:max-w-3xl">
                     <div className="border border-slate-100 rounded-[20px] p-4 flex flex-col justify-center items-center text-center bg-white shadow-sm">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Oda</span>
                       <span className="text-base font-black text-slate-900">{selectedProperty.details?.rooms || '-'}</span>
                     </div>
                     <div className="border border-slate-100 rounded-[20px] p-4 flex flex-col justify-center items-center text-center bg-white shadow-sm">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">M²</span>
                       <span className="text-base font-black text-slate-900">{selectedProperty.details?.brut_m2 || '-'}</span>
                     </div>
                     <div className="border border-slate-100 rounded-[20px] p-4 flex flex-col justify-center items-center text-center bg-white shadow-sm">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kat</span>
                       <span className="text-base font-black text-slate-900">{selectedProperty.details?.floor || '-'}</span>
                     </div>
                     <div className="border border-slate-100 rounded-[20px] p-4 flex flex-col justify-center items-center text-center bg-white shadow-sm hidden md:flex">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bina Yaşı</span>
                       <span className="text-base font-black text-slate-900">{selectedProperty.details?.age || '-'}</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="p-4 md:p-6 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (Sales Plan, Leads, Actions) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                  
                  {/* Portföy Satış Planı */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                          <Users className="text-teal-600" size={18} /> Portföy Satış Planı
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Bu portföy için bugün yapılacak en mantıklı aksiyonlar</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                      <div className="border border-slate-100 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-white shadow-sm hover:border-slate-300 transition-all">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Durum</span>
                        <span className="text-[15px] font-black text-slate-900">{selectedProperty.status}</span>
                      </div>
                      <div className="border border-slate-100 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-white shadow-sm hover:border-slate-300 transition-all">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Satış İhtimali</span>
                        <span className="text-[15px] font-black text-emerald-500">{saleProbVal !== null ? `%${saleProbVal}` : 'Veri Yok'}</span>
                      </div>
                      <div className="border border-slate-100 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-white shadow-sm hover:border-rose-300 transition-all">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Engel Durumu</span>
                        <span className={`text-[15px] font-black ${activeBlockers.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{activeBlockers.length} Açık</span>
                      </div>
                      <div className="border border-slate-100 rounded-3xl p-5 flex flex-col justify-center items-center text-center bg-white shadow-sm hover:border-teal-300 transition-all">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Eşleşen Müşteri</span>
                        <span className="text-[15px] font-black text-teal-600">{matchedLeads.length} Kişi</span>
                      </div>
                    </div>
                  </div>

                  {/* Eşleşen Müşteriler */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                          <Users className="text-emerald-500" size={18} /> Eşleşen Müşteriler
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Bu portföye uygun potansiyel müşteriler</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {matchedLeads.length === 0 ? (
                        <div className="text-center py-8 text-sm font-medium text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          Bu portföy için henüz eşleşen müşteri yok.
                        </div>
                      ) : (
                        matchedLeads.slice(0, 3).map(lead => {
                          const primaryReason = getLeadMatchReasons(lead, selectedProperty)[0] || 'İLGİLENİYOR';
                          const hasPhone = typeof lead.phone === 'string' && lead.phone.trim().length > 3;

                          return (
                            <div key={lead.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white group">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                    <UserIcon size={24} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{lead.name}</h4>
                                    <div className="mt-1.5 flex transition-all">
                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 uppercase tracking-widest">{primaryReason}</span>
                                    </div>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  {hasPhone ? (
                                     <a href={`tel:${lead.phone}`} className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 hover:border-slate-200 hover:text-slate-700 transition-all">
                                       <Phone size={16} />
                                     </a>
                                  ) : (
                                     <button disabled className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed">
                                       <Phone size={16} />
                                     </button>
                                  )}
                                  {hasPhone ? (
                                     <button onClick={() => {
                                        const cleanPhone = lead.phone.replace(/\D/g, '');
                                        const waPhone = cleanPhone.startsWith('9') ? cleanPhone : (cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone);
                                        const text = encodeURIComponent(`Merhaba ${lead.name}, bu mülk ilginizi çekebilir: ${selectedProperty.title || ''}\nFiyat: ₺${selectedProperty.price.toLocaleString()}\nDetaylar için: https://portfy.app/ilan/${selectedProperty.id}`);
                                        window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank');
                                     }} className="w-10 h-10 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 hover:border-emerald-200 transition-all">
                                       <MessageSquare size={16} />
                                     </button>
                                  ) : (
                                     <button disabled className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed">
                                       <MessageSquare size={16} />
                                     </button>
                                  )}
                               </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Hızlı Aksiyonlar */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Eşleşenlere sun */}
                    <div className="flex-[1.2] bg-emerald-50 rounded-[24px] p-5 border border-emerald-100 flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
                           <Users size={20} />
                         </div>
                         <div>
                           <h4 className="text-sm font-black text-emerald-900 mt-0.5">Eşleşen müşterilere sun</h4>
                           <p className="text-[10px] font-medium text-emerald-700 mt-1">{matchedLeads.length} uygun müşteri adayı bulundu.</p>
                         </div>
                       </div>
                    </div>
                    
                    {/* 3 Square Actions */}
                    <div className="flex-1 grid grid-cols-3 gap-3 md:gap-4">
                      <button onClick={onGenerateMarketingHub} className="bg-white border border-slate-100 rounded-[24px] p-4 flex flex-col items-center justify-center gap-3 hover:border-teal-300 hover:shadow-md transition-all shadow-sm group">
                        <Sparkles size={24} className="text-slate-400 group-hover:text-teal-600" />
                        <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Pazarlama Üret</span>
                      </button>
                      
                      <button onClick={() => setShowAddTask?.(true)} className="bg-white border border-slate-100 rounded-[24px] p-4 flex flex-col items-center justify-center gap-3 hover:border-slate-300 hover:shadow-md transition-all shadow-sm group">
                        <Plus size={24} className="text-slate-400 group-hover:text-slate-700" />
                        <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Aktivite Ekle</span>
                      </button>

                      <button onClick={() => {
                            setDocumentAutomationProperty?.(selectedProperty);
                            setShowDocumentAutomation?.(true);
                          }} className="bg-white border border-slate-100 rounded-[24px] p-4 flex flex-col items-center justify-center gap-3 hover:border-slate-300 hover:shadow-md transition-all shadow-sm group">
                        <FileText size={24} className="text-slate-400 group-hover:text-slate-700" />
                        <span className="text-[10px] font-black text-slate-800 text-center leading-tight">Doküman Ekle</span>
                      </button>
                    </div>
                  </div>

                  {/* Alıcı Sunumu & Mülk Sahibi Portalı */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alıcı Sunumu */}
                    <div className="bg-indigo-50/70 rounded-[24px] p-6 border border-indigo-100 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md transition-shadow">
                       <div>
                         <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2"><Sparkles size={18} className="text-indigo-500" /> AI ile Sunum</h4>
                         <p className="text-[11px] font-medium text-indigo-700 mt-1.5 leading-relaxed">İlanın web sitesi linkini paylaşarak yapay zeka destekli sunum yapın.</p>
                       </div>
                       {magicLinkSlot || <MagicLinkButton propertyId={selectedProperty.id} />}
                    </div>
                    
                    {/* Owner Portal */}
                    <div className="bg-[#0f172a] rounded-[24px] p-6 border border-[#1e293b] flex flex-col justify-between gap-5 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all relative overflow-hidden">
                       <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none w-[200px]" style={{ backgroundImage: 'radial-gradient(circle at right center, white, transparent 70%)' }}></div>
                       <div className="relative z-10">
                         <h4 className="text-sm font-black text-white flex items-center gap-2"><TrendingUp size={18} className="text-indigo-400" /> Mülk Sahibi Portalı</h4>
                         <p className="text-[11px] font-medium text-slate-400 mt-1.5 leading-relaxed">Şeffaflık raporu linkini mülk sahibine gönder.</p>
                       </div>
                       <div className="relative z-10">
                         <OwnerPortalButton propertyId={selectedProperty.id} />
                       </div>
                    </div>
                  </div>

                </div>

                {/* Right Column (Live Market, Activity, Document, Location) */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                  
                  {/* Rekabet Radarı */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2 mb-1.5">
                      <RadarIcon size={18} className="text-indigo-500" /> Canlı Piyasa Analizi
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 mb-6">
                      {isMarketLoading ? 'Canlı veriler taranıyor...' : `Veriler ${selectedProperty.address?.district || 'bölge'} bölgesinden güncellendi.`}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-6">
                       <div className="bg-slate-50 rounded-2xl p-3 flex flex-col justify-center items-center text-center border border-slate-100">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-2">Satış İhtimali</span>
                         <span className="text-sm font-black text-emerald-500">{saleProbVal !== null ? `%${saleProbVal}` : '-'}
                           {isMarketLoading && <Loader2 size={10} className="animate-spin text-emerald-500 ml-1 inline" />}
                         </span>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-3 flex flex-col justify-center items-center text-center border border-slate-100">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-2">Yatırımcı Uygunluğu</span>
                         <span className="text-sm font-black text-indigo-500">Orta</span>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-3 flex flex-col justify-center items-center text-center border border-slate-100">
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-2">Rekabet Yoklama</span>
                         <span className="text-sm font-black text-slate-800">Düşük</span>
                       </div>
                    </div>

                    <React.Suspense fallback={<div className="h-[250px] flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200"><Loader2 size={24} className="animate-spin text-slate-300" /></div>}>
                      {!liveMarketAnalysis && !isMarketLoading ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                           <RadarIcon size={32} className="text-slate-300 mb-2" />
                           <p className="text-xs font-bold text-slate-600">Bölgesel veri şu an doğrulanamadı.</p>
                           <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">Gerçek zamanlı piyasa verileri şu an doğrulanamıyor. Sistemi yanıltmamak için doğrudan kendiniz değerlendirin.</p>
                        </div>
                      ) : (
                        <div className="-mx-2 -mb-2">
                           <CompetitorRadar property={selectedProperty} />
                        </div>
                      )}
                    </React.Suspense>
                  </div>

                  {/* Resmi Doküman Oluştur */}
                  <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-rose-300 hover:shadow-md transition-all group" onClick={() => {
                          setDocumentAutomationProperty?.(selectedProperty);
                          setShowDocumentAutomation?.(true);
                        }}>
                     <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 group-hover:bg-rose-100 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">Resmi Doküman Oluştur</h4>
                           <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-1">Yer gösterme, yetki sözleşmesi veya teklif formu</p>
                        </div>
                     </div>
                     <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-rose-200 group-hover:text-rose-500 group-hover:bg-rose-50 transition-all shrink-0">
                       <Plus size={16} />
                     </button>
                  </div>

                  {/* Aktivite Geçmişi */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <Users className="text-teal-600" size={18} /> Aktivite Geçmişi
                      </h3>
                      <button onClick={() => setShowAddTask?.(true)} className="text-[9px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors tracking-widest uppercase">YENİ EKLE</button>
                    </div>
                    
                    <div className="space-y-6">
                      {propertyTasks.length === 0 ? (
                        <div className="text-center text-xs font-medium text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8">Henüz aktivite kaydedilmedi.</div>
                      ) : (
                        propertyTasks.map((task, idx) => (
                          <div key={task.id} className="relative flex gap-4">
                            {idx !== propertyTasks.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-slate-100 rounded-full"></div>}
                            <div className="w-6 h-6 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shrink-0 z-10 text-slate-400 mt-0.5">
                              {/* Dot */}
                            </div>
                            <div className="pb-1">
                              <div className="text-sm font-bold text-slate-800 leading-none">{task.title}</div>
                              <div className="text-[10px] font-medium text-slate-400 mt-1.5">{new Date(task.due_date || task.time || Date.now()).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Konum Bilgisi */}
                  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                     <h3 className="font-black text-slate-900 text-base flex items-center gap-2 mb-4">
                       <MapPin className="text-slate-400" size={18} /> Konum Bilgisi
                     </h3>
                     <p className="text-[11px] font-bold text-slate-600 mb-5 pb-4 border-b border-slate-100 flex items-center gap-1.5">
                       <MapPin size={12} className="text-slate-400 shrink-0" />
                       <span className="truncate">{selectedProperty.address?.neighborhood}, {selectedProperty.address?.district}, {selectedProperty.address?.city}</span>
                     </p>
                     
                     <div className="w-full h-[180px] bg-slate-50 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-200">
                       <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
                       <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-white shadow-xl relative z-10 animate-bounce">
                         <MapPin size={20} />
                       </div>
                       <div className="w-6 h-1.5 bg-black/10 rounded-full blur-sm absolute top-[calc(50%+20px)] left-1/2 -translate-x-1/2"></div>
                     </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
