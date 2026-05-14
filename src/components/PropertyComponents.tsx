import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  MapPin, 
  TrendingUp, 
  MessageSquare, 
  Share2, 
  Users, 
  Sparkles,
  ChevronRight,
  Phone,
  Calendar,
  Zap,
  Activity,
  Globe,
  Link as LinkIcon,
  ImageIcon,
  ExternalLink,
  Plus,
  User as UserIcon,
  X,
  AlertCircle,
  Activity as ActivityIcon
} from 'lucide-react';
import { Property, PortfolioBlocker } from '../types';
import { Badge, Card } from './UI';

export const getPropertyCardQuality = (property: Property): {
  level: 'good' | 'medium' | 'weak';
  label: string;
  missing: string[];
} => {
  const missing: string[] = [];

  if (!property.images || property.images.length === 0) missing.push('Fotoğraf');
  if (!property.price || property.price <= 0) missing.push('Fiyat');
  if (!property.address?.district) missing.push('Konum');
  if (!property.details?.brut_m2 || !property.details?.rooms) missing.push('Özellik');
  if (!property.owner?.name || !property.owner?.phone) missing.push('Mal sahibi');
  if (!property.notes || property.notes.trim().length < 10) missing.push('Açıklama');

  const count = missing.length;
  let level: 'good' | 'medium' | 'weak' = 'good';
  let label = 'Hazır';

  if (count >= 3) {
    level = 'weak';
    label = 'Zayıf veri';
  } else if (count > 0) {
    level = 'medium';
    label = 'Eksik var';
  }

  return { level, label, missing };
};

export const CompactPropertyCard: React.FC<{ 
  property: Property, 
  onClick: () => void,
  activeBlockers?: PortfolioBlocker[],
  onResolveBlocker?: (id: string) => void
}> = ({ property, onClick, activeBlockers, onResolveBlocker }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const blocker = activeBlockers?.[0]; // Show the first active blocker
  const quality = getPropertyCardQuality(property);

  const getQualityStyle = (level: string) => {
    if (level === 'good') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <Card onClick={onClick} className="group flex flex-row border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all rounded-2xl cursor-pointer bg-white p-2.5 sm:p-3 gap-3 sm:gap-4 w-full items-start md:items-center">
      {/* Left: Image Container */}
      <div className="relative w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            alt={property.title || 'Mülk Fotoğrafı'}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-500 relative bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
            <ImageIcon size={24} className="mb-1 opacity-50 text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 text-slate-500">Görsel Yok</span>
            <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          <Badge 
            variant="success" 
            className={`scale-75 sm:scale-90 origin-top-left ${
              property.status === 'Pasif' ? 'bg-rose-500 text-white' : 
              ['Satıldı', 'Kiralandı'].includes(property.status) ? 'bg-indigo-600 text-white' :
              'bg-white/95 text-slate-800'
            } backdrop-blur-md border border-slate-200 shadow-sm font-semibold px-2 py-0.5`}
          >
            {property.status === 'Pasif' ? 'Satış (Pasif)' : property.status}
          </Badge>
          {property.market_analysis?.status === 'Fırsat' && (
            <Badge variant="info" className="scale-75 sm:scale-90 origin-top-left bg-emerald-600 text-white border-none shadow-sm font-semibold px-2 py-0.5">FIRSAT</Badge>
          )}
        </div>
      </div>

      {/* Right: Info Container */}
      <div className="flex flex-col flex-1 min-w-0 self-stretch justify-between py-0.5">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-slate-900 line-clamp-1 sm:line-clamp-2 text-xs sm:text-[13px] leading-snug group-hover:text-indigo-600 transition-colors" title={property.title}>{property.title || 'Başlık Eksik'}</h3>
            <span className="text-slate-900 font-bold text-[11px] sm:text-xs tracking-tight shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">₺{property.price ? property.price.toLocaleString() : '-'}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] sm:text-[11px] font-medium">
            <MapPin size={10} className="shrink-0" />
            <span className="line-clamp-1">{property.address?.district || 'İlçe yok'}, {property.address?.city || 'İl yok'}</span>
            <div className={`ml-auto px-1.5 py-0.5 rounded border text-[8px] font-bold flex items-center gap-1 shadow-sm shrink-0 disable-selection ${getQualityStyle(quality.level)}`}>
              <ActivityIcon size={8} />
              {quality.label}
            </div>
          </div>

          <div className="mt-1.5 flex flex-col gap-1 items-start">
            {property.status === 'Pasif' && (
              blocker ? (
                <div className="bg-rose-600/95 px-1.5 py-0.5 rounded shadow-sm border border-rose-500/50 inline-flex items-center gap-1 max-w-full">
                  <AlertCircle size={8} className="text-white shrink-0" />
                  <span className="text-[9px] font-bold text-white truncate">{blocker.blocker_type}: {blocker.note}</span>
                  {onResolveBlocker && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onResolveBlocker(blocker.id); }}
                      className="ml-1 text-[8px] bg-white text-rose-600 px-1.5 py-0.5 rounded font-bold hover:bg-rose-50 transition-colors shadow-sm shrink-0"
                    >
                      Çözüldü
                    </button>
                  )}
                </div>
              ) : property.unsold_reason && (
                <div className="bg-rose-500/95 px-1.5 py-0.5 rounded shadow-sm border border-rose-400/20 inline-flex items-center gap-1 max-w-full">
                  <AlertCircle size={8} className="text-white shrink-0" />
                  <span className="text-[9px] font-bold text-white truncate">{property.unsold_reason}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mt-2 pt-1 border-t border-slate-100">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Oda</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">{property.details?.rooms || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">M2</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">{property.details?.brut_m2 ? `${property.details.brut_m2}` : '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 ${getHealthColor(property.health_score)}`}>%{property.health_score}</span>
              <div className="w-8 sm:w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${property.health_score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const rooms = property.details?.rooms || 'belirtilmemiş';
                const m2 = property.details?.brut_m2 ? `${property.details.brut_m2}m²` : 'm² belirtilmemiş';
                const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${property.title || ''}\nFiyat: ₺${property.price ? property.price.toLocaleString() : '-'}\nKonum: ${property.address?.district || ''}, ${property.address?.city || ''}\nDetaylar: ${rooms}, ${m2}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-50 text-slate-500 rounded border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all font-bold text-[10px] flex items-center gap-1 shadow-sm"
              title="Paylaş"
            >
              <Share2 size={12} /> <span className="hidden sm:inline">Paylaş</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="p-1.5 sm:px-2 sm:py-1.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all font-bold text-[10px] flex items-center gap-1 shadow-sm"
              title="AI Analiz"
            >
              <Sparkles size={12} /> <span className="hidden sm:inline">Analiz</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const VisualPropertyCard: React.FC<{ 
  property: Property, 
  onClick: () => void,
  activeBlockers?: PortfolioBlocker[],
  onResolveBlocker?: (id: string) => void
}> = ({ property, onClick, activeBlockers, onResolveBlocker }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const blocker = activeBlockers?.[0]; // Show the first active blocker
  const quality = getPropertyCardQuality(property);

  const getQualityStyle = (level: string) => {
    if (level === 'good') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <Card onClick={onClick} className="group flex flex-col h-full border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all overflow-hidden rounded-3xl cursor-pointer">
      <div className="relative h-[160px] md:h-[180px] xl:h-[200px] overflow-hidden bg-slate-100 flex-shrink-0">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            alt={property.title || 'Mülk Fotoğrafı'}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-500 relative bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
            <ImageIcon size={40} className="mb-2 opacity-50 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 decoration-slate-300 text-slate-500">Görsel Yok</span>
            <div className="absolute inset-0 bg-slate-900/5 mix-blend-overlay"></div>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <div className="flex gap-1.5 items-center flex-wrap">
            <Badge 
              variant="success" 
              className={`scale-90 origin-top-left ${
                property.status === 'Pasif' ? 'bg-rose-500 text-white' : 
                ['Satıldı', 'Kiralandı'].includes(property.status) ? 'bg-indigo-600 text-white' :
                'bg-white/95 text-slate-800'
              } backdrop-blur-md border border-slate-200 shadow-sm font-semibold`}
            >
              {property.status === 'Pasif' ? 'Satış (Pasif)' : property.status}
            </Badge>
            {property.market_analysis?.status === 'Fırsat' && (
              <Badge variant="info" className="scale-90 origin-top-left bg-emerald-600 text-white border-none shadow-sm font-semibold">FIRSAT</Badge>
            )}
          </div>
          {property.status === 'Pasif' && (
            blocker ? (
              <div className="bg-rose-600/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm border border-rose-500/50 max-w-[180px]">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={10} className="text-white shrink-0 mt-0.5" />
                  <span className="text-[9px] font-bold text-white line-clamp-2 leading-tight">{blocker.blocker_type}: {blocker.note}</span>
                </div>
                {onResolveBlocker && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onResolveBlocker(blocker.id); }}
                    className="mt-1.5 w-full text-[9px] bg-white text-rose-600 py-1 rounded font-bold hover:bg-rose-50 transition-colors shadow-sm"
                  >
                    Çözüldü
                  </button>
                )}
              </div>
            ) : property.unsold_reason && (
              <div className="bg-rose-500/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm border border-rose-400/20 max-w-[180px]">
                <div className="flex items-start gap-1.5">
                  <AlertCircle size={10} className="text-white shrink-0 mt-0.5" />
                  <span className="text-[9px] font-bold text-white line-clamp-2">{property.unsold_reason}</span>
                </div>
              </div>
            )
          )}
        </div>
        <div className="absolute top-3 right-3">
          <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-md ${getQualityStyle(quality.level)}`}>
            <ActivityIcon size={10} />
            {quality.label}
          </div>
        </div>
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/10">
          <span className="text-white font-bold text-[13px] tracking-tight">₺{property.price ? property.price.toLocaleString() : 'Yok'}</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900 line-clamp-1 text-[14px] group-hover:text-indigo-600 transition-colors">{property.title || 'Başlık Eksik'}</h3>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-1 font-medium">
            <MapPin size={12} className="shrink-0" />
            <span className="line-clamp-1">{property.address?.district || 'İlçe yok'}, {property.address?.city || 'İl yok'}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2.5 border-y border-slate-100 mb-3 mt-auto">
          <div className="flex gap-3">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Oda</div>
              <div className="text-[11px] font-bold text-slate-700">{property.details?.rooms || '-'}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">M2</div>
              <div className="text-[11px] font-bold text-slate-700">{property.details?.brut_m2 ? `${property.details.brut_m2}` : '-'}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-[9px] font-bold uppercase tracking-widest ${getHealthColor(property.health_score)}`}>%{property.health_score} Sağlık</div>
            <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${property.health_score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 relative z-10 pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const rooms = property.details?.rooms || 'belirtilmemiş';
              const m2 = property.details?.brut_m2 ? `${property.details.brut_m2}m²` : 'm² belirtilmemiş';
              const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${property.title || ''}\nFiyat: ₺${property.price ? property.price.toLocaleString() : '-'}\nKonum: ${property.address?.district || ''}, ${property.address?.city || ''}\nDetaylar: ${rooms}, ${m2}`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="flex-1 py-2 bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-200"
          >
            <Share2 size={12} /> Paylaş
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 hover:border-indigo-600"
          >
            <Sparkles size={12} /> AI Analiz
          </button>
        </div>
      </div>
    </Card>
  );
};

export const PipelineColumn: React.FC<{ 
  title: string, 
  properties: Property[], 
  status: string, 
  onPropertyClick: (p: Property) => void,
  blockers?: PortfolioBlocker[],
  onResolveBlocker?: (id: string) => void
}> = ({ title, properties, status, onPropertyClick, blockers, onResolveBlocker }) => {
  const totalRevenue = properties.reduce((acc, p) => acc + ((p.price || 0) * (p.commission_rate || 0) / 100), 0);
  
  return (
    <div className="flex flex-col gap-4 min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[300px] bg-slate-50/50 p-2 rounded-3xl h-full border border-slate-100/50">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
          <Badge variant="default" className="bg-white border border-slate-200 text-slate-600 shadow-sm">{properties.length}</Badge>
        </div>
        <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">₺{totalRevenue.toLocaleString()}</div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4 no-scrollbar min-h-[500px]">
        {properties.map(property => {
          const activeBlocker = blockers?.find(b => b.property_id === property.id && b.is_active);
          const quality = getPropertyCardQuality(property);
          
          return (
            <motion.div
              key={property.id}
              layoutId={property.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -2 }}
            >
              <Card onClick={() => onPropertyClick(property)} className="p-3 space-y-2 shadow-sm hover:shadow-md transition-all border border-slate-200 border-l-4 border-l-indigo-400 relative cursor-pointer bg-white group rounded-2xl">
                {activeBlocker && (
                  <div className="bg-rose-50 text-rose-700 p-2 rounded-lg text-[9px] font-bold border border-rose-100 flex justify-between items-center mb-2 shadow-sm">
                    <span className="flex items-center gap-1.5"><AlertCircle size={10}/> {activeBlocker.blocker_type} engeli</span>
                    {onResolveBlocker && (
                      <button onClick={e => { e.stopPropagation(); onResolveBlocker(activeBlocker.id); }} className="px-2 py-0.5 bg-white border border-rose-200 rounded text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors shadow-sm">Çöz</button>
                    )}
                  </div>
                )}
                
                {property.status === 'Pasif' && !activeBlocker && property.unsold_reason && (
                  <div className="bg-rose-50 text-rose-700 p-2 rounded-lg text-[9px] font-bold border border-rose-100 flex items-center gap-1.5 mb-2 shadow-sm">
                    <AlertCircle size={10}/> <span className="line-clamp-1">{property.unsold_reason}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{property.title || 'Başlık Yok'}</h4>
                  <div className="text-[11px] font-black text-slate-800 shrink-0 bg-slate-100 px-1.5 py-1 rounded border border-slate-200">₺{property.price ? property.price.toLocaleString() : '-'}</div>
                </div>
                
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <MapPin size={10} className="shrink-0" />
                    <span className="line-clamp-1">{property.address?.district || 'Konum yok'}{property.address?.city ? `, ${property.address.city}` : ''}</span>
                  </div>
                  {quality.level !== 'good' && (
                    <div className={`px-1 py-0.5 rounded flex items-center gap-1 text-[8px] font-bold border ${quality.level === 'weak' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      <AlertCircle size={8} />
                      {quality.label}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                  <div className="flex gap-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Oda</span>
                      <span className="text-[10px] font-bold text-slate-700">{property.details?.rooms || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">M2</span>
                      <span className="text-[10px] font-bold text-slate-700">{property.details?.brut_m2 ? `${property.details.brut_m2}` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sağlık</span>
                    <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${property.health_score}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
        {properties.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 bg-white/50 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2">
            <Home size={20} className="opacity-50" />
            <span className="text-xs font-semibold">Bu aşamada mülk yok</span>
          </div>
        )}
      </div>
    </div>
  );
};

