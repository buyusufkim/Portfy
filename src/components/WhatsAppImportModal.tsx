import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GoogleGenAI, Type } from "@google/genai";
import { api } from '../services/api';

interface WhatsAppImportModalProps {
  showWhatsAppImport: boolean;
  setShowWhatsAppImport: (show: boolean) => void;
}

export const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({
  showWhatsAppImport,
  setShowWhatsAppImport
}) => {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();

  const whatsappImportMutation = useMutation({
    mutationFn: async (text: string) => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Aşağıdaki WhatsApp mesajından emlak müşterisi bilgilerini çıkar. 
        JSON formatında şu alanları döndür: name (isim), phone (telefon), type (Alıcı/Satıcı/Kiracı/Kiralayan), status (Aday/Sıcak/Pasif), notes (notlar).
        
        Mesaj: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Alıcı', 'Satıcı', 'Kiracı', 'Kiralayan'] },
              status: { type: Type.STRING, enum: ['Aday', 'Sıcak', 'Pasif'] },
              notes: { type: Type.STRING }
            },
            required: ["name", "phone", "type", "status", "notes"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      return api.addLead(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowWhatsAppImport(false);
    }
  });
    
  return (
    <AnimatePresence>
      {showWhatsAppImport && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowWhatsAppImport(false)}
          />
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-[70] max-h-[90vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">WhatsApp'tan Aktar</h3>
                <p className="text-sm text-slate-500">Gelen mesajı yapıştırın, AI bilgileri çıkarsın.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mesaj Metni</label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Örn: Merhaba, ben Ahmet. Kadıköy'de 3+1 kiralık daire bakıyorum. 0532..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button 
                onClick={() => whatsappImportMutation.mutate(text)}
                disabled={!text || whatsappImportMutation.isPending}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {whatsappImportMutation.isPending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><RefreshCw size={20} /></motion.div>
                ) : <Sparkles size={20} />}
                Analiz Et ve Kaydet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppImportModal;
