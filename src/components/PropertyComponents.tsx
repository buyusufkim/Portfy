import React from 'react';
import { motion } from 'framer-motion';
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
  X
} from 'lucide-react';
import { Property } from '../types';
import { Badge, Card } from './UI';

export const PropertyCard: React.FC<{ property: Property, onClick: () => void }> = ({ property, onClick }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card onClick={onClick} className="group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={property.images[0] || `https://picsum.photos/seed/${property.id}/400/300`} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          alt={property.title}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="success" className="bg-white/90 backdrop-blur-md border-none shadow-sm">{property.status}</Badge>
          {property.market_analysis?.status === 'Fırsat' && (
            <Badge variant="info" className="bg-emerald-500 text-white border-none shadow-sm">FIRSAT</Badge>
          )}
        </div>
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-sm">
          <span className="text-orange-600 font-bold text-sm">₺{property.price.toLocaleString()}</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">{property.title}</h3>
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-1">
            <MapPin size={10} />
            <span>{property.address.district}, {property.address.city}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Oda</div>
              <div className="text-xs font-bold text-slate-700">{property.details.rooms}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase">M2</div>
              <div className="text-xs font-bold text-slate-700">{property.details.brut_m2}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-xs font-bold ${getHealthColor(property.health_score)}`}>%{property.health_score} Sağlık</div>
            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full rounded-full ${property.health_score >= 80 ? 'bg-emerald-500' : property.health_score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${property.health_score}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const text = encodeURIComponent(`Merhaba, bu mülk ilginizi çekebilir: ${property.title}\nFiyat: ₺${property.price.toLocaleString()}\nKonum: ${property.address.district}, ${property.address.city}\nDetaylar: ${property.details.rooms}, ${property.details.brut_m2}m²`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-600 hover:text-white transition-all"
          >
            <MessageSquare size={12} /> Paylaş
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-orange-600 hover:text-white transition-all"
          >
            <Sparkles size={12} /> AI Analiz
          </button>
        </div>
      </div>
    </Card>
  );
};

export const PipelineColumn: React.FC<{ title: string, properties: Property[], status: string, onPropertyClick: (p: Property) => void }> = ({ title, properties, status, onPropertyClick }) => {
  const totalRevenue = properties.reduce((acc, p) => acc + (p.price * p.commission_rate / 100), 0);
  
  return (
    <div className="flex flex-col gap-4 min-w-[300px] w-[300px]">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <Badge variant="default" className="bg-slate-200 text-slate-600">{properties.length}</Badge>
        </div>
        <div className="text-[10px] font-bold text-emerald-600">₺{totalRevenue.toLocaleString()}</div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar min-h-[500px]">
        {properties.map(property => (
          <motion.div
            key={property.id}
            layoutId={property.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card onClick={() => onPropertyClick(property)} className="p-4 space-y-3 hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{property.title}</h4>
                <div className="text-[10px] font-bold text-orange-600 shrink-0">₺{property.price.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <MapPin size={8} />
                <span>{property.address.district}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold text-slate-500">{property.details.rooms}</span>
                  <span className="text-[9px] font-bold text-slate-500">{property.details.brut_m2}m²</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${property.health_score}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
        {properties.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 text-xs font-medium">
            Mülk yok
          </div>
        )}
      </div>
    </div>
  );
};
