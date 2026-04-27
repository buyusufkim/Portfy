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

export const PropertyCard: React.FC<{ 
  property: Property, 
  onClick: () => void,
  activeBlockers?: PortfolioBlocker[],
  onResolveBlocker?: (id: string) => void
}> = ({ property, onClick, activeBlockers, onResolveBlocker }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const blocker = activeBlockers?.[0]; // Show the first active blocker
  const quality = getPropertyCardQuality(property);

  const getQualityStyle = (level: string) => {
    if (level === 'good') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (level === 'medium') return 'bg-orange-50 text-orange-600 border-orange-200';
    return 'bg-red-50 text-red-600 border-red-200';
  };

  return (
    <Card onClick={onClick} className="group flex flex-col h-full border-2 border-transparent hover:border-orange-500 hover:shadow-xl transition-all overflow-hidden rounded-3xl cursor-pointer">
      <div className="relative h-48 overflow-hidden bg-slate-100 flex-shrink-0">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            alt={property.title || 'Mülk Fotoğrafı'}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-500 relative bg-gradient-to-br from-slate-100 to-slate-200">
            <ImageIcon size={40} className="mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 decoration-slate-300">Fotoğraf Eksik</span>
            <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <Badge 
              variant="success" 
              className={`${
                property.status === 'Pasif' ? 'bg-red-500 text-white' : 
                ['Satıldı', 'Kiralandı'].includes(property.status) ? 'bg-indigo-500 text-white' :
                'bg-white/90 text-slate-900'
              } backdrop-blur-md border border-black/5 shadow-sm`}
            >
              {property.status === 'Pasif' ? 'Satış Engeli (Pasif)' : property.status}
            </Badge>
            {property.market_analysis?.status === 'Fırsat' && (
              <Badge variant="info" className="bg-emerald-500 text-white border-none shadow-sm">FIRSAT</Badge>
            )}
          </div>
          {property.status === 'Pasif' && (
            blocker ? (
              <div className="bg-red-600/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-red-500/50 max-w-[200px]">
                <div className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-white shrink-0 mt-0.5" />
                  <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">{blocker.blocker_type}: {blocker.note}</span>
                </div>
                {onResolveBlocker && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onResolveBlocker(blocker.id); }}
                    className="mt-2 w-full text-[10px] bg-white text-red-600 py-1.5 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Çözüldü İşaretle
                  </button>
                )}
              </div>
            ) : property.unsold_reason && (
              <div className="bg-red-500/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-red-400/20 max-w-[200px]">
                <div className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-white shrink-0 mt-0.5" />
                  <span className="text-[10px] font-bold text-white line-clamp-2">{property.unsold_reason}</span>
                </div>
              </div>
            )
          )}
        </div>
        <div className="absolute top-4 right-4">
          <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${getQualityStyle(quality.level)}`}>
            <ActivityIcon size={12} />
            {quality.label}
          </div>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-100/50">
          <span className="text-orange-600 font-bold text-base tracking-tight">₺{property.price ? property.price.toLocaleString() : 'Fiyat Yok'}</span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 line-clamp-1 text-base group-hover:text-orange-600 transition-colors">{property.title || 'Başlık Eksik'}</h3>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1.5 font-medium">
            <MapPin size={12} className="shrink-0" />
            <span className="line-clamp-1">{property.address?.district || 'İlçe yok'}, {property.address?.city || 'İl yok'}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-3 border-y border-slate-100 mb-4 mt-auto">
          <div className="flex gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Oda</div>
              <div className="text-xs font-bold text-slate-700">{property.details?.rooms || 'Belirtilmedi'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">M2</div>
              <div className="text-xs font-bold text-slate-700">{property.details?.brut_m2 ? `${property.details.brut_m2} m²` : 'm² belirtilmedi'}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${getHealthColor(property.health_score)}`}>%{property.health_score} Sağlık</div>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${property.health_score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const rooms = property.details?.rooms || 'belirtilmemiş';
              const m2 = property.details?.brut_m2 ? `${property.details.brut_m2}m²` : 'm² belirtilmemiş';
              const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${property.title || ''}\nFiyat: ₺${property.price ? property.price.toLocaleString() : '-'}\nKonum: ${property.address?.district || ''}, ${property.address?.city || ''}\nDetaylar: ${rooms}, ${m2}`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 hover:border-emerald-600"
          >
            <MessageSquare size={14} /> Paylaş
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex-1 py-2.5 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-orange-600 hover:text-white transition-all border border-orange-100 hover:border-orange-600"
          >
            <Sparkles size={14} /> AI Analiz
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
    <div className="flex flex-col gap-4 min-w-[300px] w-[300px] bg-slate-50/50 p-2 rounded-3xl h-full border border-slate-100/50">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
          <Badge variant="default" className="bg-white border border-slate-200 text-slate-600 shadow-sm">{properties.length}</Badge>
        </div>
        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">₺{totalRevenue.toLocaleString()}</div>
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
              <Card onClick={() => onPropertyClick(property)} className="p-4 space-y-3 shadow-sm hover:shadow-md transition-all border-l-4 border-l-orange-500 relative cursor-pointer bg-white group">
                {activeBlocker && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-[10px] font-bold border border-red-100 flex justify-between items-center mb-3 shadow-sm">
                    <span className="flex items-center gap-1.5"><AlertCircle size={12}/> {activeBlocker.blocker_type} engeli</span>
                    {onResolveBlocker && (
                      <button onClick={e => { e.stopPropagation(); onResolveBlocker(activeBlocker.id); }} className="px-2.5 py-1 bg-white border border-red-200 rounded-lg text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors shadow-sm">Çöz</button>
                    )}
                  </div>
                )}
                
                {property.status === 'Pasif' && !activeBlocker && property.unsold_reason && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-1.5 mb-3 shadow-sm">
                    <AlertCircle size={12}/> <span className="line-clamp-1">{property.unsold_reason}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start gap-3">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">{property.title || 'Başlık Yok'}</h4>
                  <div className="text-xs font-black text-orange-600 shrink-0 bg-orange-50 px-2 py-1 rounded-lg">₺{property.price ? property.price.toLocaleString() : '-'}</div>
                </div>
                
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <MapPin size={10} className="shrink-0" />
                    <span className="line-clamp-1">{property.address?.district || 'Konum yok'}{property.address?.city ? `, ${property.address.city}` : ''}</span>
                  </div>
                  {quality.level !== 'good' && (
                    <div className={`px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold ${quality.level === 'weak' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                      <AlertCircle size={8} />
                      {quality.label}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="flex gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Oda</span>
                      <span className="text-[11px] font-bold text-slate-700">{property.details?.rooms || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">M2</span>
                      <span className="text-[11px] font-bold text-slate-700">{property.details?.brut_m2 ? `${property.details.brut_m2}` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sağlık</span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${property.health_score}%` }} />
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

