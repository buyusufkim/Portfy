import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  User as UserIcon,
  Calendar,
  MapPin,
  Tag,
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react';
import { Lead, Property } from '../types';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  properties: Property[];
  setShowDocumentAutomation?: (val: boolean) => void;
  setDocumentAutomationLead?: (val: Lead | null) => void;
  setDocumentAutomationProperty?: (val: Property | null) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onEdit,
  onDelete,
  properties,
  setShowDocumentAutomation,
  setDocumentAutomationLead,
  setDocumentAutomationProperty
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!lead) return null;

  // Check if lead is an owner of any property
  const associatedProperties = properties.filter(p => p.owner.phone === lead.phone);
  const canDelete = associatedProperties.length === 0;

  return (
    <AnimatePresence>
      {lead && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-orange-600">
                <UserIcon size={40} />
              </div>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Title & Actions */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{lead.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      lead.status === 'Sıcak' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lead.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{lead.type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={onEdit}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-3 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefon</div>
                    <div className="text-sm font-bold text-slate-900">{lead.phone}</div>
                  </div>
                </a>
                <a 
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</div>
                    <div className="text-sm font-bold text-slate-900">Mesaj Gönder</div>
                  </div>
                </a>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={18} className="text-slate-400" />
                  <span className="text-sm font-medium">{lead.district || 'Bölge belirtilmemiş'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="text-sm font-medium">Son İletişim: {new Date(lead.last_contact).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Tag size={18} className="text-slate-400" />
                  <span className="text-sm font-medium">Kategori: {lead.type}</span>
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notlar</label>
                  <div className="p-4 bg-slate-50 rounded-3xl text-sm text-slate-600 leading-relaxed">
                    {lead.notes}
                  </div>
                </div>
              )}

              {/* Associated Properties */}
              {associatedProperties.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bağlantılı Portföyler ({associatedProperties.length})</label>
                  <div className="space-y-2">
                    {associatedProperties.map(prop => (
                      <div key={prop.id} className="p-4 bg-orange-50 rounded-2xl flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-900">{prop.title}</div>
                        <div className="text-[10px] font-bold text-orange-600 uppercase">{prop.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* DOKÜMAN OTOMASYONU BUTONU */}
              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setDocumentAutomationLead?.(lead);
                    setDocumentAutomationProperty?.(null); // Lead detayındayız, mülk henüz seçili değil (seçtirilebilir)
                    setShowDocumentAutomation?.(true);
                  }}
                  className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-orange-500 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-black text-slate-900">Resmi Doküman Oluştur</div>
                      <div className="text-xs text-slate-400 mt-1">Yer gösterme veya teklif formu</div>
                    </div>
                  </div>
                  <Plus size={24} className="text-slate-300 group-hover:text-orange-500 transition-all" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Overlay */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto text-red-600">
                    <AlertCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Kaydı Sil?</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      {canDelete 
                        ? "Bu müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                        : "Bu müşterinin üzerine kayıtlı portföyler olduğu için silinemez. Önce portföyleri silmeli veya mal sahibini değiştirmelisiniz."
                      }
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                    >
                      Vazgeç
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => {
                          onDelete(lead.id);
                          setShowDeleteConfirm(false);
                          onClose();
                        }}
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-200"
                      >
                        Evet, Sil
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
