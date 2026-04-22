// Dosya: src/components/portfolios/PropertyDetailModal.tsx

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  TrendingUp, 
  Zap, 
  Activity, 
  Globe, 
  Link as LinkIcon, 
  Sparkles, 
  ChevronRight, 
  MessageSquare, 
  MapPin,
  User as UserIcon,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Database,
  Loader2
} from 'lucide-react';
import { Property } from '../../types';
import { Badge, Card } from '../UI';
import { MagicLinkButton } from '../premium/MagicLinkButton';
import { api } from '../../services/api';

const Users = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

interface PropertyDetailModalProps {
  selectedProperty: Property | null;
  onClose: () => void;
  leads: any[];
  regionScores: any[];
  brokerAccount: any;
  onShowExternalListings: () => void;
  onGenerateMarketingHub: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUploadImage: (file: File) => void;
  isUploading: boolean;
  isDeleting?: boolean; // YENİ: Siliniyor durumu
  magicLinkSlot?: React.ReactNode;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  selectedProperty,
  onClose,
  leads,
  regionScores,
  brokerAccount,
  onShowExternalListings,
  onGenerateMarketingHub,
  onEdit,
  onDelete,
  onUploadImage,
  isUploading,
  isDeleting = false, // Varsayılan değer eklendi
  magicLinkSlot
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: liveMarketAnalysis, isLoading: isMarketLoading } = useQuery({
    queryKey: ['liveMarketAnalysis', selectedProperty?.id],
    queryFn: () => selectedProperty ? api.getLiveMarketAnalysis(selectedProperty) : Promise.resolve(null),
    enabled: !!selectedProperty,
    staleTime: 1000 * 60 * 15,
  });

  if (!selectedProperty) return null;

  const matchedLeads = (leads || []).filter(l => 
    l.status !== 'Pasif' && 
    (l.district === selectedProperty.address?.district || l.type === selectedProperty.type)
  );
  
  const staticRegionScore = (regionScores || []).find((r: any) => r.district === selectedProperty.address?.district);

  const marketData = liveMarketAnalysis?.data;

  const saleProbVal = marketData?.saleProbability 
    ? Math.round(marketData.saleProbability * 100) 
    : Math.round((selectedProperty.sale_probability || 0.5) * 100);
    
  const healthScoreVal = marketData?.healthScore || selectedProperty.health_score || 50;
  const currentRegionScore = marketData?.regionEfficiency || staticRegionScore?.score || 50;

  const getSaleProbStyles = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', textDark: 'text-emerald-700', desc: 'Bu fiyat bandında talep yüksek. Pazarlama modüllerini hemen kullanın.' };
    if (score >= 50) return { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'text-orange-600', textDark: 'text-orange-700', desc: 'Piyasa koşullarına göre dengeli bir talep var. Hedef kitleye odaklanın.' };
    return { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-600', textDark: 'text-red-700', desc: 'Fiyat veya bölge dinamikleri zorlayıcı olabilir. Fiyat analizi önerilir.' };
  };

  const getInvStyles = (score: number) => {
    if (score >= 80) return { level: 'Yüksek', bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', textDark: 'text-blue-700', desc: 'Bölge verimliliği ve kira çarpanı yatırımcılar için çok ideal.' };
    if (score >= 50) return { level: 'Orta', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: 'text-indigo-600', textDark: 'text-indigo-700', desc: 'Uzun vadeli yatırımlar için değerlendirilebilir bir portföy.' };
    return { level: 'Düşük', bg: 'bg-slate-50', border: 'border-slate-100', icon: 'text-slate-600', textDark: 'text-slate-700', desc: 'Yatırımdan ziyade doğrudan oturum amaçlı alıcılara hitap ediyor.' };
  };

  const getRegionDesc = (score: number) => {
    if (score >= 80) return "Bölgede emlak sirkülasyonu çok yüksek. İlanlar hızlı eriyor.";
    if (score >= 50) return "Bölgede ortalama bir hareketlilik var. Doğru fiyatlandırma kritik.";
    return "Bölgedeki işlem hacmi şu an durgun. Satış süreci normalden uzun sürebilir.";
  };

  const saleProbConfig = getSaleProbStyles(saleProbVal);
  const invConfig = getInvStyles(healthScoreVal);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Image */}
          <div className="relative h-64 shrink-0">
            <img 
              src={selectedProperty.images[selectedProperty.images.length - 1] || `https://picsum.photos/seed/${selectedProperty.id}/800/600`} 
              className="w-full h-full object-cover"
              alt={selectedProperty.title}
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-6 left-6 flex gap-2 z-10">
              <button 
                onClick={onEdit}
                className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all"
                title="Düzenle"
              >
                <Edit2 size={20} />
              </button>
              
              {/* SİLME BUTONU GÜNCELLENDİ: Spinner ve e.stopPropagation eklendi */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Tıklamanın başka yerleri tetiklemesini engeller
                  if (window.confirm('Bu portföyü silmek istediğinize emin misiniz?')) {
                    onDelete();
                  }
                }}
                disabled={isDeleting}
                className="p-3 bg-red-500/20 backdrop-blur-md text-white rounded-2xl hover:bg-red-500/40 transition-all disabled:opacity-50"
                title="Sil"
              >
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all disabled:opacity-50"
                title="Fotoğraf Ekle"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadImage(file);
                }}
              />
            </div>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex gap-2 mb-2">
                  <Badge variant="success">{selectedProperty.status}</Badge>
                  {selectedProperty.market_analysis?.status === 'Fırsat' && (
                    <Badge variant="info" className="bg-emerald-500 border-none">FIRSAT</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">{selectedProperty.title}</h2>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl shadow-xl flex flex-col items-end">
                <span className="text-orange-600 font-bold text-lg">₺{selectedProperty.price.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  {isMarketLoading ? (
                    <Loader2 size={10} className="animate-spin text-orange-600" />
                  ) : (
                    <TrendingUp size={10} />
                  )}
                  <span>%{saleProbVal} Satış Olasılığı</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-8 space-y-8 no-scrollbar">

            {/* SİHİRLİ LİNK BANNER'I */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                  <Sparkles className="text-indigo-500" size={20} />
                  Müşteriye Özel Sunum
                </h3>
                <p className="text-sm text-indigo-700 font-medium mt-1">Bu portföy için kendi fotoğrafın ve markanla anında web sitesi linki oluştur.</p>
              </div>
              <div className="w-full sm:w-auto min-w-[220px]">
                {magicLinkSlot || <MagicLinkButton propertyId={selectedProperty.id} />}
              </div>
            </div>

            {/* Veri Kaynakları Göstergesi */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all ${isMarketLoading ? 'bg-orange-500' : 'bg-slate-900'}`}>
                  {isMarketLoading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    Canlı Piyasa Analizi
                    {isMarketLoading && <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Taranıyor...</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isMarketLoading 
                      ? `${selectedProperty.address?.district} bölgesindeki güncel veriler çekiliyor...` 
                      : `Veriler ${selectedProperty.address?.district} bölgesinden güncellendi.`}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className={`${saleProbConfig.bg} ${saleProbConfig.border} p-4 flex flex-col gap-2 transition-colors relative overflow-hidden`}>
                {isMarketLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={24} /></div>}
                <div className={`flex items-center gap-2 ${saleProbConfig.icon}`}>
                  <TrendingUp size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Satış İhtimali</span>
                </div>
                <div className={`text-2xl font-black ${saleProbConfig.textDark}`}>%{saleProbVal}</div>
                <p className={`text-[10px] ${saleProbConfig.icon} opacity-80 font-medium`}>{saleProbConfig.desc}</p>
              </Card>

              <Card className={`${invConfig.bg} ${invConfig.border} p-4 flex flex-col gap-2 transition-colors relative overflow-hidden`}>
                {isMarketLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={24} /></div>}
                <div className={`flex items-center gap-2 ${invConfig.icon}`}>
                  <Zap size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Yatırımcı Uygunluğu</span>
                </div>
                <div className={`text-2xl font-black ${invConfig.textDark}`}>{invConfig.level}</div>
                <p className={`text-[10px] ${invConfig.icon} opacity-80 font-medium`}>{invConfig.desc}</p>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Oda</div>
                <div className="font-bold text-slate-900">{selectedProperty.details?.rooms}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">M2</div>
                <div className="font-bold text-slate-900">{selectedProperty.details?.brut_m2}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kat</div>
                <div className="font-bold text-slate-900">{selectedProperty.details?.floor}</div>
              </div>
            </div>

            {/* Pazarlama Butonu vb... (Diğer kodlar aynen korundu) */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-600" />
                Pazarlama
              </h3>
              
              <button 
                onClick={onGenerateMarketingHub}
                className="w-full p-5 bg-slate-900 text-white rounded-3xl flex items-center justify-between shadow-xl shadow-slate-900/20 active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-black">AI Pazarlama Hub</div>
                    <div className="text-xs text-slate-400 mt-1">Tüm sosyal medya, ilan ve mesaj metinlerini üret</div>
                  </div>
                </div>
                <ChevronRight size={24} className="text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </button>
            </div>
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};