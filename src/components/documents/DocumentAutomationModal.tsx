import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Download, 
  Loader2, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  UserPlus, 
  Building, 
  User 
} from 'lucide-react';
import { Property, Lead, MutationResult } from '../../types';
import { documentService, DocumentType } from '../../services/documentService';
import { dripService } from '../../services/dripService';

interface DocumentAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  lead?: Lead | null;
  agentProfile: any;
  allLeads: Lead[];
  allProperties: Property[];
  addLeadMutation: MutationResult<any, any>;
}

type WizardStep = 'type' | 'property' | 'lead' | 'details' | 'preview';

export const DocumentAutomationModal: React.FC<DocumentAutomationModalProps> = ({
  isOpen,
  onClose,
  property: initialProperty,
  lead: initialLead,
  agentProfile,
  allLeads,
  allProperties,
  addLeadMutation
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [selectedType, setSelectedType] = useState<DocumentType>('yer-gosterme');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // New Lead Form
  const [isAddingNewLead, setIsAddingNewLead] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', phone: '', notes: '' });

  const [isGenerating, setIsGenerating] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [commissionRate, setCommissionRate] = useState('');

  const [searchProperty, setSearchProperty] = useState('');
  const [searchLead, setSearchLead] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProperty(initialProperty || null);
      setSelectedLead(initialLead || null);
      setCurrentStep('type');
      setIsAddingNewLead(false);
    }
  }, [isOpen, initialProperty, initialLead]);

  if (!isOpen) return null;

  const filteredProperties = allProperties.filter(p => 
    p.title.toLowerCase().includes(searchProperty.toLowerCase()) ||
    p.address.district.toLowerCase().includes(searchProperty.toLowerCase())
  );

  const filteredLeads = allLeads.filter(l => 
    l.name.toLowerCase().includes(searchLead.toLowerCase()) ||
    l.phone.includes(searchLead)
  );

  const handleNext = async () => {
    if (currentStep === 'type') setCurrentStep('property');
    else if (currentStep === 'property') setCurrentStep('lead');
    else if (currentStep === 'lead') {
      if (isAddingNewLead) {
        try {
          const result = await addLeadMutation.mutateAsync({
            ...newLeadData,
            status: 'Aday',
            type: selectedType === 'yetki-sozlesmesi' ? 'Satıcı' : 'Alıcı'
          });
          setSelectedLead(result);
          setIsAddingNewLead(false);
        } catch (error) {
          console.error('Failed to add lead:', error);
          return;
        }
      }
      setCurrentStep('details');
    }
    else if (currentStep === 'details') setCurrentStep('preview');
  };

  const handleBack = () => {
    if (currentStep === 'preview') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('lead');
    else if (currentStep === 'lead') setCurrentStep('property');
    else if (currentStep === 'property') setCurrentStep('type');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await documentService.generatePDF(selectedType, { 
        property: selectedProperty, 
        lead: selectedLead, 
        agent: agentProfile, 
        customNotes: `
          ${customNotes}
          ${offerPrice ? `\nTeklif Bedeli: ₺${offerPrice}` : ''}
          ${commissionRate ? `\nHizmet Bedeli: %${commissionRate}` : ''}
        `.trim()
      }, 'document-preview');

      // Trigger Drip Campaign (Ghosting Prevention)
      if (selectedLead?.id) {
        if (selectedType === 'teklif-formu') {
          await dripService.createDripCampaign(selectedLead.id, selectedProperty?.id, 'OFFER_MADE');
        } else if (selectedType === 'yer-gosterme') {
          await dripService.createDripCampaign(selectedLead.id, selectedProperty?.id, 'SHOWING_DONE');
        } else if (selectedType === 'yetki-sozlesmesi') {
          await dripService.createDripCampaign(selectedLead.id, selectedProperty?.id, 'PORTFOLIO_LISTED');
        }
      }
    } catch (error) {
      console.error('PDF Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString('tr-TR');

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'type', label: 'Belge Türü' },
    { key: 'property', label: 'Portföy' },
    { key: 'lead', label: 'Müşteri' },
    { key: 'details', label: 'Detaylar' },
    { key: 'preview', label: 'Önizleme' }
  ];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="text-orange-600" />
                Doküman Hazırlayıcı
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {steps.map((s, idx) => (
                  <React.Fragment key={s.key}>
                    <div className={`flex items-center gap-2 ${currentStep === s.key ? 'text-orange-600' : 'text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === s.key ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className="w-4 h-px bg-slate-200" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentStep === 'type' && (
                  <motion.div 
                    key="step-type"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2 mb-8">
                      <h3 className="text-2xl font-black text-slate-900">Ne hazırlamak istersin?</h3>
                      <p className="text-slate-500">Saniyeler içinde resmi evraklarını oluşturup paylaşabilirsin.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {(['yer-gosterme', 'yetki-sozlesmesi', 'teklif-formu'] as DocumentType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => { setSelectedType(type); handleNext(); }}
                          className={`group p-8 rounded-[32px] border-2 transition-all flex flex-col items-center gap-6 text-center ${
                            selectedType === type 
                            ? 'bg-orange-50 border-orange-600 ring-4 ring-orange-50' 
                            : 'bg-white border-slate-100 hover:border-orange-200'
                          }`}
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                            selectedType === type ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600'
                          }`}>
                            <FileText size={32} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900">
                              {type === 'yer-gosterme' && 'Yer Gösterme'}
                              {type === 'yetki-sozlesmesi' && 'Yetki Sözleşmesi'}
                              {type === 'teklif-formu' && 'Teklif Formu'}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {type === 'yer-gosterme' && 'Mülk sunumu sonrası yasal güvence.'}
                              {type === 'yetki-sozlesmesi' && 'Portföy pazarlama yetki onayı.'}
                              {type === 'teklif-formu' && 'Resmi fiyat ve şart teklifi.'}
                            </p>
                          </div>
                          <div className={`mt-auto px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            selectedType === type ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            SEÇ
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 'property' && (
                  <motion.div 
                    key="step-property"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900">Gayrimenkul Seçin</h3>
                        <p className="text-slate-500">Belge hangi mülk için düzenlenecek?</p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Mülk ara..."
                          value={searchProperty}
                          onChange={(e) => setSearchProperty(e.target.value)}
                          className="pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none w-64 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                      {filteredProperties.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProperty(p); handleNext(); }}
                          className={`p-4 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${
                            selectedProperty?.id === p.id 
                            ? 'bg-orange-50 border-orange-600 shadow-xl shadow-orange-100' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Building size={24} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-slate-900 truncate">{p.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{p.address.district}, {p.address.city}</div>
                            <div className="text-[10px] text-orange-600 font-bold mt-1">₺{p.price?.toLocaleString()}</div>
                          </div>
                          {selectedProperty?.id === p.id && <Check className="text-orange-600" size={20} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 'lead' && (
                  <motion.div 
                    key="step-lead"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900">Müşteri Seçin</h3>
                        <p className="text-slate-500">
                          {selectedType === 'yetki-sozlesmesi' ? 'Mülk sahibi bilgilerini onaylayın.' : 'Alıcı adayını seçin veya yeni ekleyin.'}
                        </p>
                      </div>
                      {!isAddingNewLead && (
                        <div className="flex gap-4">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              placeholder="Müşteri ara..."
                              value={searchLead}
                              onChange={(e) => setSearchLead(e.target.value)}
                              className="pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 outline-none w-64 text-sm"
                            />
                          </div>
                          <button 
                            onClick={() => setIsAddingNewLead(true)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold text-sm"
                          >
                            <UserPlus size={18} />
                            Yeni Ekle
                          </button>
                        </div>
                      )}
                    </div>

                    {isAddingNewLead ? (
                      <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100 space-y-6">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <UserPlus className="text-orange-600" />
                          Yeni Müşteri Oluştur
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                            <input 
                              type="text" 
                              value={newLeadData.name}
                              onChange={e => setNewLeadData({...newLeadData, name: e.target.value})}
                              className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                              placeholder="Müşteri tam adı..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
                            <input 
                              type="tel" 
                              value={newLeadData.phone}
                              onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})}
                              className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none"
                              placeholder="05xx ..."
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notlar</label>
                          <textarea 
                            value={newLeadData.notes}
                            onChange={e => setNewLeadData({...newLeadData, notes: e.target.value})}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-orange-500 outline-none h-24"
                            placeholder="Müşteri hakkında kısa not (Kayıt altına alınacak)"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => setIsAddingNewLead(false)}
                            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold"
                          >
                            Vazgeç
                          </button>
                          <button 
                            onClick={handleNext}
                            className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200"
                          >
                            Kaydet ve Devam Et
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                        {filteredLeads.map(l => (
                          <button
                            key={l.id}
                            onClick={() => { setSelectedLead(l); handleNext(); }}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col gap-3 items-center text-center ${
                              selectedLead?.id === l.id 
                              ? 'bg-orange-50 border-orange-600 shadow-xl shadow-orange-100' 
                              : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                              selectedLead?.id === l.id ? 'bg-orange-600' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {l.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900 truncate max-w-full">{l.name}</div>
                              <div className="text-xs text-slate-400 mt-1">{l.phone}</div>
                            </div>
                            {selectedLead?.id === l.id && <Check className="text-orange-600 mt-2" size={18} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {currentStep === 'details' && (
                  <motion.div 
                    key="step-details"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-2 mb-8">
                      <h3 className="text-2xl font-black text-slate-900">Belge Detayları</h3>
                      <p className="text-slate-500">Eklenmesini istediğin özel bilgiler var mı?</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {selectedType === 'teklif-formu' && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teklif Edilen Fiyat (₺)</label>
                            <input 
                              type="number" 
                              value={offerPrice}
                              onChange={e => setOfferPrice(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-xl font-black focus:border-orange-500 outline-none"
                              placeholder="Örn: 5.500.000"
                            />
                          </div>
                        )}
                        {selectedType === 'yetki-sozlesmesi' && (
                          <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hizmet Bedeli Oranı (%)</label>
                            <input 
                              type="number" 
                              value={commissionRate}
                              onChange={e => setCommissionRate(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-xl font-black focus:border-orange-500 outline-none"
                              placeholder="Örn: 2 veya 4"
                            />
                          </div>
                        )}
                        <div className="space-y-2 col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Özel Notlar & Şartlar</label>
                          <textarea 
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            placeholder="Evraka eklenmesini istediğiniz özel şartlar..."
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-sm focus:border-orange-500 outline-none h-32 transition-all"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleNext}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg transition-all hover:bg-slate-800 shadow-xl shadow-slate-100"
                      >
                        Önizle ve Hazırla
                      </button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'preview' && (
                  <motion.div 
                    key="step-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-full flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-900">Son Kontrol</h3>
                        <p className="text-slate-500">Her şey hazırsa PDF'i indirebilirsin.</p>
                      </div>
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-lg shadow-xl shadow-orange-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Download size={24} />}
                        PDF İNDİR
                      </button>
                    </div>

                    <div className="bg-slate-200 p-8 rounded-[40px] w-full overflow-y-auto max-h-[60vh] flex justify-center custom-scrollbar">
                      <div 
                        id="document-preview"
                        ref={printRef}
                        className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl relative text-slate-900 font-sans leading-relaxed"
                        style={{ fontSize: '11pt' }}
                      >
                        {/* Logo & Agent Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                          <div className="space-y-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">PORTFY</h1>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gayrimenkul Teknoloji Çözümleri</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-bold text-lg">{agentProfile?.display_name}</div>
                            <div className="text-sm text-slate-600">{agentProfile?.email}</div>
                            <div className="text-sm text-slate-600">{agentProfile?.phone}</div>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-12">
                          <h2 className="text-2xl font-black uppercase tracking-widest underline decoration-2 underline-offset-8">
                            {selectedType === 'yer-gosterme' && 'GAYRİMENKUL YER GÖSTERME TUTANAĞI'}
                            {selectedType === 'yetki-sozlesmesi' && 'TAŞINMAZ GÖSTERME VE PAZARLAMA YETKİ BELGESİ'}
                            {selectedType === 'teklif-formu' && 'GAYRİMENKUL SATIN ALMA / KİRALAMA TEKLİF FORMU'}
                          </h2>
                        </div>

                        <div className="space-y-8">
                          {selectedType === 'yer-gosterme' && (
                            <>
                              <p>İşbu tutanak, aşağıda belirtilen mülkün danışman tarafından alıcı adayına bizzat gösterildiğini tevsik eder.</p>
                              <div className="grid grid-cols-2 gap-8 border border-slate-200 p-6 rounded-xl bg-slate-50/50">
                                <div className="space-y-4">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ALICI ADAYI</div>
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-900">{selectedLead?.name || '...................'}</div>
                                    <div className="text-sm text-slate-600">{selectedLead?.phone || '...................'}</div>
                                  </div>
                                </div>
                                <div className="space-y-4 text-right">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TARİH</div>
                                  <div className="font-bold text-slate-900">{today}</div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MÜLK BİLGİLERİ</div>
                                <div className="border border-slate-200 p-6 rounded-xl space-y-2">
                                  <div className="font-bold text-lg text-slate-900">{selectedProperty?.title || '...................'}</div>
                                  <div className="text-sm text-slate-600">{selectedProperty?.address.neighborhood}, {selectedProperty?.address.district}, {selectedProperty?.address.city}</div>
                                </div>
                              </div>
                            </>
                          )}

                          {selectedType === 'yetki-sozlesmesi' && (
                            <>
                              <p>Aşağıdaki mülkün pazarlama süreçleri için danışmana tam yetki verilmiştir.</p>
                              <div className="grid grid-cols-2 gap-8 border border-slate-200 p-6 rounded-xl">
                                <div className="space-y-4">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MAL SAHİBİ</div>
                                  <div className="font-bold">{selectedProperty?.owner.name || selectedLead?.name || '...................'}</div>
                                </div>
                                <div className="space-y-4 text-right">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HİZMET BEDELİ</div>
                                  <div className="font-bold text-orange-600">%{commissionRate || selectedProperty?.commission_rate || '4'}</div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PORTFÖY</div>
                                <div className="p-4 bg-slate-50 rounded-xl">{selectedProperty?.title}</div>
                              </div>
                            </>
                          )}

                          {selectedType === 'teklif-formu' && (
                            <>
                              <p>Resmi fiyat ve şart teklifi aşağıda detaylandırılmıştır.</p>
                              <div className="space-y-6">
                                <div className="flex justify-between border-b pb-4">
                                  <span className="text-slate-500 font-bold">Teklif Fiyatı:</span>
                                  <span className="text-2xl font-black text-orange-600">₺{offerPrice ? Number(offerPrice).toLocaleString() : '.........'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-4">
                                  <span className="text-slate-500 font-bold">Teklif Veren:</span>
                                  <span className="font-bold">{selectedLead?.name || '...................'}</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-xs font-bold text-slate-400 uppercase">ÖZEL ŞARTLAR</div>
                                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm italic">
                                    {customNotes || 'Belirtilmedi'}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Footer - Signatures */}
                          <div className="mt-24 pt-24 grid grid-cols-2 gap-12 text-center">
                            <div className="space-y-12">
                              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">TARAF / MÜŞTERİ</div>
                              <div className="w-48 h-px bg-slate-300 mx-auto" />
                              <div className="text-sm font-bold">{selectedLead?.name || selectedProperty?.owner.name || 'İmza'}</div>
                            </div>
                            <div className="space-y-12">
                              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">DANIŞMAN</div>
                              <div className="w-48 h-px bg-slate-300 mx-auto" />
                              <div className="text-sm font-bold">{agentProfile?.display_name || 'İmza'}</div>
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-slate-300 uppercase tracking-[0.5em]">
                          Generated by Portfy AI Document Engine
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            {currentStep !== 'type' ? (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:border-slate-300 transition-all"
              >
                <ChevronLeft size={20} />
                Geri Git
              </button>
            ) : <div />}

            {currentStep !== 'preview' && currentStep !== 'type' && (
              <button 
                onClick={handleNext}
                disabled={
                  (currentStep === 'property' && !selectedProperty) ||
                  (currentStep === 'lead' && !selectedLead && !isAddingNewLead)
                }
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                Devam Et
                <ChevronRight size={20} />
              </button>
            )}
            
            {currentStep === 'type' && selectedType && (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all hover:bg-slate-800"
              >
                Başla
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
