import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, User, MessageSquare, ArrowRight } from 'lucide-react';
import { Property, Lead } from '../../types';

interface SmartMatchModalProps {
  show: boolean;
  onClose: () => void;
  properties: Property[];
  leads: Lead[];
}

export const SmartMatchModal: React.FC<SmartMatchModalProps> = ({ show, onClose, properties, leads }) => {

  // Eşleşme Mantığı (Sadece Aktif Portföyler ve Aktif Alıcılar)
  const matches = useMemo(() => {
    const activeProperties = properties.filter(p => !['Satıldı', 'Pasif'].includes(p.status));
    const activeLeads = leads.filter(l => !['Pasif'].includes(l.status) && ['Alıcı', 'Yatırımcı', 'Aday'].includes(l.type));

    const results = activeProperties.map(property => {
      const matchedLeads = activeLeads.filter(lead => {
        // Kriter 1: İlçe eşleşmesi
        const isDistrictMatch = lead.district && property.address?.district && lead.district.toLowerCase() === property.address.district.toLowerCase();
        // Kriter 2: Notlarda portföy tipinin geçmesi (örn: "villa arıyor")
        const isTypeMatch = lead.notes && lead.notes.toLowerCase().includes(property.type.toLowerCase());
        
        return isDistrictMatch || isTypeMatch;
      });
      return { property, matchedLeads };
    }).filter(m => m.matchedLeads.length > 0);

    return results;
  }, [properties, leads]);

  const generateWhatsAppLink = (lead: Lead, property: Property) => {
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '9' + cleanPhone : (cleanPhone.length === 10 ? '90' + cleanPhone : cleanPhone);
    const text = encodeURIComponent(`Merhaba ${lead.name},\n\nAradığınız kriterlere ve bölgeye (${property.address?.district}) uygun portföyümüze yeni bir mülk eklendi:\n\n📍 ${property.title}\n💰 ${property.price.toLocaleString('tr-TR')} TL\n\nİncelemek isterseniz detayları sizinle paylaşabilirim. İyi günler dilerim!`);
    return `https://wa.me/${waPhone}?text=${text}`;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-slate-50 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <Zap size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Akıllı Eşleşmeler</h2>
                  <p className="text-xs text-slate-500 mt-1">Sistemdeki alıcılarınız ile portföyleriniz otomatik eşleştirildi.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto flex-1">
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 opacity-60">
                  <Zap size={64} className="text-slate-300 mb-6" />
                  <h3 className="text-lg font-bold text-slate-900">Şu an yeni bir eşleşme yok</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Mevcut portföyleriniz ve alıcılarınız arasında birebir eşleşen bir kriter bulunamadı. Yeni kayıtlar eklendikçe burası güncellenecektir.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {matches.map((match, index) => (
                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                      {/* Property Info */}
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                          <img 
                            src={match.property.images?.[0] || `https://picsum.photos/seed/${match.property.id}/200`} 
                            alt="Property" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                            {match.property.address?.district} • {match.property.type}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-1">{match.property.title}</h3>
                          <div className="text-sm font-bold text-orange-600 mt-1">{match.property.price.toLocaleString('tr-TR')} ₺</div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                          {match.matchedLeads.length} Aday Bulundu
                        </div>
                      </div>

                      {/* Matched Leads */}
                      <div className="space-y-3 pl-4 border-l-2 border-indigo-50">
                        {match.matchedLeads.map(lead => (
                          <div key={lead.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                                <User size={18} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{lead.name}</div>
                                <div className="text-[10px] text-slate-500">{lead.phone} • {lead.type}</div>
                              </div>
                            </div>
                            <a 
                              href={generateWhatsAppLink(lead, match.property)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                              <MessageSquare size={14} /> Öner <ArrowRight size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};