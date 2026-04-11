import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  Zap, 
  Activity, 
  Globe, 
  Link as LinkIcon, 
  Sparkles, 
  ChevronRight, 
  ImageIcon, 
  MessageSquare, 
  Share2, 
  MapPin,
  User as UserIcon,
  Phone,
  Plus
} from 'lucide-react';
import { Property } from '../../types';
import { Badge, Card } from '../UI';

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
  onShowSharePanel: () => void;
  onGenerateMarketingHub: () => void;
  onGenerateListing: () => void;
  onGenerateInstagram: () => void;
  onGenerateWhatsApp: () => void;
  isGenerating: boolean;
  aiMarketingType: 'listing' | 'instagram' | 'whatsapp' | 'share' | 'hub' | null;
  aiContent: string | null;
  instagramCaptions: { corporate: string, sales: string, warm: string } | null;
  whatsappMessages: { single: string, status: string, investor: string } | null;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  selectedProperty,
  onClose,
  leads,
  regionScores,
  brokerAccount,
  onShowExternalListings,
  onShowSharePanel,
  onGenerateMarketingHub,
  onGenerateListing,
  onGenerateInstagram,
  onGenerateWhatsApp,
  isGenerating,
  aiMarketingType,
  aiContent,
  instagramCaptions,
  whatsappMessages
}) => {
  if (!selectedProperty) return null;

  const matchedLeads = leads.filter(l => 
    l.status !== 'Pasif' && 
    (l.district === selectedProperty.address.district || l.type === selectedProperty.type)
  );
  const regionScore = regionScores.find((r: any) => r.district === selectedProperty.address.district);

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
              src={selectedProperty.images[0] || `https://picsum.photos/seed/${selectedProperty.id}/800/600`} 
              className="w-full h-full object-cover"
              alt={selectedProperty.title}
              referrerPolicy="no-referrer"
            />
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
                  <TrendingUp size={10} />
                  <span>%{Math.round((selectedProperty.sale_probability || 0.5) * 100)} Satış Olasılığı</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-8 space-y-8 no-scrollbar">
            {/* Sales Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-emerald-50 border-emerald-100 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Satış İhtimali</span>
                </div>
                <div className="text-2xl font-black text-emerald-700">%{Math.round((selectedProperty.sale_probability || 0.5) * 100)}</div>
                <p className="text-[10px] text-emerald-600/80 font-medium">Bu fiyat bandında talep yüksek. Bugün paylaşım için çok uygun.</p>
                <button 
                  onClick={onGenerateWhatsApp}
                  className="mt-2 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                >
                  Hemen Paylaş
                </button>
              </Card>
              <Card className="bg-blue-50 border-blue-100 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <Zap size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Yatırımcı Uygunluğu</span>
                </div>
                <div className="text-2xl font-black text-blue-700">Yüksek</div>
                <p className="text-[10px] text-blue-600/80 font-medium">Bölge verimliliği ve kira çarpanı yatırımcılar için ideal görünüyor.</p>
                <button 
                  onClick={onGenerateWhatsApp}
                  className="mt-2 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                >
                  Yatırımcıya Gönder
                </button>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Oda</div>
                <div className="font-bold text-slate-900">{selectedProperty.details.rooms}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">M2</div>
                <div className="font-bold text-slate-900">{selectedProperty.details.brut_m2}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kat</div>
                <div className="font-bold text-slate-900">{selectedProperty.details.floor}</div>
              </div>
            </div>

            {/* Region Efficiency */}
            {regionScore && (
              <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedProperty.address.district} Bölge Verimliliği</h4>
                    <p className="text-xs text-slate-500">Bu bölge şu an %{regionScore.score} verimlilikle çalışıyor.</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-orange-600">%{regionScore.score}</div>
              </div>
            )}

            {/* External Sync */}
            {brokerAccount && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Globe size={18} className="text-orange-600" />
                  Pazar Entegrasyonu
                </h3>
                <Card className="bg-slate-50 border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                        <LinkIcon size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">sahibinden.com Eşleşmesi</h4>
                        <p className="text-[10px] text-slate-500">İlan durumunu otomatik takip et</p>
                      </div>
                    </div>
                    <button 
                      onClick={onShowExternalListings}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-orange-600"
                    >
                      İlan Bağla
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* AI Marketing */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-600" />
                AI Pazarlama Asistanı
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onGenerateMarketingHub}
                  className="col-span-2 p-6 bg-slate-900 text-white rounded-[32px] flex items-center justify-between shadow-xl shadow-slate-900/20 active:scale-95 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500">
                      <Sparkles size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">AI Pazarlama Hub</div>
                      <div className="text-[10px] text-slate-400">Tüm sosyal medya ve mesaj alternatiflerini üret</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={onGenerateListing}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">İlan Metni</span>
                </button>
                <button 
                  onClick={onGenerateInstagram}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                    <ImageIcon size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Instagram Post</span>
                </button>
                <button 
                  onClick={onGenerateWhatsApp}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">WhatsApp Mesajı</span>
                </button>
                <button 
                  onClick={onShowSharePanel}
                  className="p-4 bg-orange-600 rounded-3xl flex flex-col items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                    <Share2 size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Paylaş & Topla</span>
                </button>
              </div>

              {/* AI Content Display */}
              <AnimatePresence>
                {isGenerating && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-orange-50 border border-orange-100 rounded-3xl p-8 flex flex-col items-center gap-4"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="text-orange-600"
                    >
                      <Sparkles size={32} />
                    </motion.div>
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900">AI İçerik Hazırlıyor</h4>
                      <p className="text-xs text-slate-500">Mülk verileri analiz ediliyor ve en etkili metinler oluşturuluyor...</p>
                    </div>
                  </motion.div>
                )}

                {aiMarketingType === 'listing' && aiContent && !isGenerating && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oluşturulan İlan Metni</span>
                      <button onClick={onGenerateListing} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{aiContent}</div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(aiContent); }}
                      className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2"
                    >
                      <LinkIcon size={14} /> Metni Kopyala
                    </button>
                  </motion.div>
                )}

                {aiMarketingType === 'instagram' && instagramCaptions && !isGenerating && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instagram Varyasyonları</span>
                      <button onClick={onGenerateInstagram} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {[
                        { id: 'corporate', label: 'Kurumsal', content: instagramCaptions.corporate },
                        { id: 'sales', label: 'Satış Odaklı', content: instagramCaptions.sales },
                        { id: 'warm', label: 'Samimi', content: instagramCaptions.warm }
                      ].map(variant => (
                        <Card key={variant.id} className="min-w-[280px] p-5 space-y-3 bg-white border-slate-100">
                          <Badge variant="info">{variant.label}</Badge>
                          <div className="text-xs text-slate-600 leading-relaxed line-clamp-6">{variant.content}</div>
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => { navigator.clipboard.writeText(variant.content); }}
                              className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                            >
                              <LinkIcon size={12} /> Kopyala
                            </button>
                            <button 
                              onClick={() => window.open('instagram://library', '_blank')}
                              className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                            >
                              <ExternalLink size={12} /> Instagram'da Aç
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {aiMarketingType === 'whatsapp' && whatsappMessages && !isGenerating && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Mesajları</span>
                      <button onClick={onGenerateWhatsApp} className="text-xs font-bold text-orange-600">Yeniden Üret</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'single', label: 'Müşteriye Özel', content: whatsappMessages.single },
                        { id: 'status', label: 'Durum Paylaşımı', content: whatsappMessages.status },
                        { id: 'investor', label: 'Yatırımcıya Özel', content: whatsappMessages.investor }
                      ].map(variant => (
                        <Card key={variant.id} className="p-4 bg-white border-slate-100 space-y-3">
                          <div className="flex justify-between items-center">
                            <Badge variant="success">{variant.label}</Badge>
                            <button onClick={() => { navigator.clipboard.writeText(variant.content); }} className="text-slate-400"><LinkIcon size={14} /></button>
                          </div>
                          <div className="text-xs text-slate-600 leading-relaxed">{variant.content}</div>
                          <button 
                            onClick={() => {
                              const text = encodeURIComponent(variant.content.replace('[ilan_linki]', `https://portfy.app/ilan/${selectedProperty.id}`));
                              window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}
                            className="w-full py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"
                          >
                            <MessageSquare size={12} /> WhatsApp'ta Paylaş
                          </button>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Matching Leads */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-orange-600" />
                Eşleşen Müşteriler
              </h3>
              <div className="space-y-3">
                {matchedLeads.length === 0 ? (
                  <Card className="bg-slate-50 border-dashed border-slate-200 p-10 flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                      <Users size={40} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-slate-900">Henüz otomatik eşleşme yok</h4>
                      <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                        Bu mülk için şu an aktif bir adayımız bulunmuyor. Paylaşarak yeni talep toplayabilirsin.
                      </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                      <button 
                        onClick={onShowSharePanel}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 size={16} /> Paylaşarak Talep Topla
                      </button>
                      <button 
                        onClick={onGenerateWhatsApp}
                        className="w-full py-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} /> WhatsApp Mesajı Oluştur
                      </button>
                    </div>
                  </Card>
                ) : matchedLeads.slice(0, 3).map(lead => (
                  <Card key={lead.id} className="p-5 space-y-4 bg-white border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                          <UserIcon size={24} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="success">Uyumluluk: %92</Badge>
                            <Badge variant="info">Bütçe: Uygun</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
                          <Phone size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const text = encodeURIComponent(`Merhaba ${lead.name}, bu mülk ilginizi çekebilir: ${selectedProperty.title}\nFiyat: ₺${selectedProperty.price.toLocaleString()}\nDetaylar için: https://portfy.app/ilan/${selectedProperty.id}`);
                            window.open(`https://wa.me/${lead.phone}?text=${text}`, '_blank');
                          }}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-500 italic">
                      "Müşteri Beşiktaş bölgesinde 3+1 daire arıyor, bütçesi bu ilan için ideal."
                    </div>
                    <button className="w-full py-2 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
                      <Plus size={12} /> Not Ekle
                    </button>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Konum Bilgisi</h3>
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <MapPin size={18} />
                <span>{selectedProperty.address.neighborhood}, {selectedProperty.address.district}, {selectedProperty.address.city}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ExternalLink = ({ size, className }: { size: number, className?: string }) => (
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
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
