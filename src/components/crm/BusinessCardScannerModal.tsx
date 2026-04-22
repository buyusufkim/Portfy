import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { aiService } from '../../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadData: any) => void;
}

export const BusinessCardScannerModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Fotoğrafı önizleme için oku
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      setIsScanning(true);

      try {
        const parsedData = await aiService.parseBusinessCard(base64String, file.type);
        
        // İşlem başarılı, ana bileşene veriyi gönder
        setTimeout(() => {
          onSuccess({
            ...parsedData,
            status: 'Aday',
            type: 'Alıcı', // Varsayılan
            district: ''
          });
          setIsScanning(false);
          setPreviewImage(null);
        }, 1000); // Kullanıcıya başarılı ikonunu göstermek için kısa bir bekleme

      } catch (error) {
        alert("Kartvizit okunamadı, lütfen tekrar deneyin.");
        setIsScanning(false);
        setPreviewImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 z-10 transition-colors">
                <X size={20} />
              </button>

              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mb-6 shadow-inner">
                  <Camera size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Kartvizit Tara</h2>
                <p className="text-slate-500 mb-8 font-medium">Yapay zeka kartvizitteki bilgileri okur ve saniyeler içinde CRM'e kaydeder.</p>

                {previewImage ? (
                  <div className="w-full relative rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                    <img src={previewImage} alt="Kartvizit" className="w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-slate-900/30 flex flex-col items-center justify-center backdrop-blur-[2px]">
                      {isScanning ? (
                        <>
                          <Loader2 className="w-12 h-12 text-white animate-spin mb-3" />
                          <span className="text-white font-bold tracking-wide">Yapay Zeka Analiz Ediyor...</span>
                        </>
                      ) : (
                        <>
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 rounded-full p-2 mb-2">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                          </motion.div>
                          <span className="text-white font-bold tracking-wide">Veriler Çıkarıldı!</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-600/30"
                  >
                    <Upload size={24} />
                    Fotoğraf Çek / Yükle
                  </button>
                )}

                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};