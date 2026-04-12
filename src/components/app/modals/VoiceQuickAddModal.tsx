import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, RefreshCw } from 'lucide-react';
import { Badge } from '../../UI';
import { api } from '../../../services/api';

import { VoiceParseResult } from '../../../types';

interface VoiceQuickAddModalProps {
  showVoiceQuickAdd: boolean;
  setShowVoiceQuickAdd: (val: boolean) => void;
  addLeadMutation: any;
  addTaskMutation: any;
  addVisitMutation: any;
}

export const VoiceQuickAddModal: React.FC<VoiceQuickAddModalProps> = ({ 
  showVoiceQuickAdd, 
  setShowVoiceQuickAdd, 
  addLeadMutation, 
  addTaskMutation, 
  addVisitMutation 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<VoiceParseResult | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'tr-TR';
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(prev => prev + ' ' + currentTranscript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setIsParsing(true);
    const result = await api.parseVoiceCommand(transcript);
    setParsedResult(result);
    setIsParsing(false);
  };

  const handleSave = async () => {
    if (!parsedResult) return;
    
    if (parsedResult.intent === 'lead') {
      await addLeadMutation.mutateAsync({
        name: parsedResult.extracted_data.name || 'İsimsiz Müşteri',
        phone: parsedResult.extracted_data.phone || '',
        type: 'Alıcı',
        status: 'Aday',
        district: parsedResult.extracted_data.location || '',
        notes: parsedResult.extracted_data.description || parsedResult.original_text
      } as any);
    } else if (parsedResult.intent === 'task') {
      await addTaskMutation.mutateAsync({
        title: parsedResult.extracted_data.description || 'Yeni Görev',
        time: parsedResult.extracted_data.due_date || new Date().toISOString(),
        type: 'Arama',
        completed: false
      } as any);
    } else if (parsedResult.intent === 'note') {
      await addVisitMutation.mutateAsync({
        address: parsedResult.extracted_data.location || 'Bilinmeyen Adres',
        district: parsedResult.extracted_data.location || '',
        status: 'Potansiyel',
        notes: parsedResult.extracted_data.description || parsedResult.original_text
      } as any);
    }

    setShowVoiceQuickAdd(false);
    setTranscript('');
    setParsedResult(null);
  };

  if (!showVoiceQuickAdd) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[180] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                <Mic size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sesli Hızlı Kayıt</h2>
                <p className="text-xs text-slate-500">Konuşarak CRM'e veri ekleyin</p>
              </div>
            </div>
            <button onClick={() => setShowVoiceQuickAdd(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          {!parsedResult ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-8">
              <button 
                onClick={toggleListening}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Mic size={48} />
              </button>
              
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-slate-900">
                  {isListening ? 'Dinleniyor...' : 'Konuşmak için dokunun'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Örn: "Yarın saat 3'te Mehmet Bey'i ara" veya "Yeni müşteri Zeynep Hanım, bütçesi 3 milyon"
                </p>
              </div>

              {transcript && (
                <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-700 italic">"{transcript}"</p>
                </div>
              )}

              {isParsing && (
                <div className="flex items-center gap-2 text-orange-600">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm font-bold">Yapay zeka notunuzu düzenliyor...</span>
                </div>
              )}

              {transcript && !isListening && !isParsing && (
                <button 
                  onClick={handleParse}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200"
                >
                  Metni İşle
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info" className="bg-orange-50 text-orange-700 border-orange-200">
                    {parsedResult.intent === 'lead' ? '👤 Müşteri' : 
                     parsedResult.intent === 'task' ? '📅 Görev' : 
                     parsedResult.intent === 'note' ? '📝 Saha Notu' : '❓ Bilinmeyen'}
                  </Badge>
                </div>
                
                {Object.entries(parsedResult.extracted_data).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">{key}</label>
                      <input 
                        type="text" 
                        value={value as string} 
                        onChange={(e) => setParsedResult({...parsedResult, extracted_data: {...parsedResult.extracted_data, [key]: e.target.value}})}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 italic">Orijinal metin: "{parsedResult.original_text}"</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setParsedResult(null); setTranscript(''); }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
