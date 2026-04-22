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
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'unsupported' | 'parsing' | 'recording' | null>(null);
  const [isSupported, setIsSupported] = useState(true);

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
        if (event.error === 'not-allowed') {
          setErrorType('permission');
          setError('Mikrofon erişimi engellendi. Lütfen tarayıcı ayarlarından mikrofon izni verin.');
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors as they happen frequently
          return;
        } else {
          setErrorType('recording');
          setError('Ses tanıma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      setIsSupported(false);
      setErrorType('unsupported');
      setError('Tarayıcınız ses tanıma özelliğini desteklemiyor.');
    }
  }, []);

  const toggleListening = () => {
    setError(null);
    setErrorType(null);
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      try {
        recognition?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition', err);
        setErrorType('permission');
        setError('Mikrofon başlatılamadı. Lütfen izni kontrol edip tekrar deneyin.');
      }
    }
  };

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setIsParsing(true);
    setError(null);
    setErrorType(null);
    try {
      const result = await api.parseVoiceCommand(transcript);
      setParsedResult(result);
    } catch (err) {
      console.error('Parse error:', err);
      setErrorType('parsing');
      setError('Notunuz işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedResult) return;
    
    try {
      if (parsedResult.actions && parsedResult.actions.length > 0) {
        // Handle composite actions simultaneously
        for (const action of parsedResult.actions) {
          if (action.type === 'lead') {
            const budgetText = action.payload.budget ? `\nTahmini Bütçe: ${action.payload.budget}` : '';
            const notes = `${action.payload.notes || parsedResult.original_text}${budgetText}`;
            
            await addLeadMutation.mutateAsync({
              name: action.payload.name || 'İsimsiz Müşteri',
              phone: action.payload.phone || '',
              type: 'Alıcı',
              status: 'Aday',
              district: action.payload.district || action.payload.location || '',
              notes: notes
            } as any);
          } else if (action.type === 'task') {
            await addTaskMutation.mutateAsync({
              title: action.payload.title || 'Yeni Görev',
              time: action.payload.time || action.payload.due_date || new Date().toISOString(),
              type: action.payload.type || 'Arama',
              completed: false
            } as any);
          } else if (action.type === 'note') {
            await addVisitMutation.mutateAsync({
              address: action.payload.location || 'Bilinmeyen Adres',
              district: action.payload.location || '',
              status: 'Potansiyel',
              notes: action.payload.notes || action.payload.description || parsedResult.original_text
            } as any);
          }
        }
      } else {
        // Fallback for single intent
        if (parsedResult.intent === 'lead') {
          const budgetText = parsedResult.extracted_data.budget ? `\nTahmini Bütçe: ${parsedResult.extracted_data.budget}` : '';
          const notes = `${parsedResult.extracted_data.description || parsedResult.original_text}${budgetText}`;
          await addLeadMutation.mutateAsync({
            name: parsedResult.extracted_data.name || 'İsimsiz Müşteri',
            phone: parsedResult.extracted_data.phone || '',
            type: 'Alıcı',
            status: 'Aday',
            district: parsedResult.extracted_data.location || '',
            notes: notes
          } as any);
        } else if (parsedResult.intent === 'task') {
          await addTaskMutation.mutateAsync({
            title: parsedResult.extracted_data.description || 'Yeni Görev',
            time: parsedResult.extracted_data.due_date || new Date().toISOString(),
            type: (parsedResult.extracted_data as any).task_type || 'Arama',
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
      }
    } catch (e) {
      console.error("Error saving composite actions", e);
    }

    setShowVoiceQuickAdd(false);
    setTranscript('');
    setParsedResult(null);
  };

  useEffect(() => {
    if (!showVoiceQuickAdd) {
      setIsListening(false);
      setIsParsing(false);
      setError(null);
      setErrorType(null);
      setTranscript('');
      setParsedResult(null);
      try {
        recognition?.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
  }, [showVoiceQuickAdd, recognition]);

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
              {error ? (
                <div className="w-full p-6 bg-red-50 rounded-[32px] border border-red-100 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
                    <X size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-900">
                      {errorType === 'unsupported' ? 'Tarayıcı Desteklenmiyor' : 
                       errorType === 'permission' ? 'Erişim Engellendi' :
                       errorType === 'parsing' ? 'İşleme Hatası' : 'Hata Oluştu'}
                    </p>
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {errorType === 'parsing' ? (
                      <button 
                        onClick={handleParse}
                        className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-200"
                      >
                        Tekrar Dene
                      </button>
                    ) : errorType !== 'unsupported' ? (
                      <button 
                        onClick={toggleListening}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-200"
                      >
                        Tekrar Dene
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowVoiceQuickAdd(false)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg shadow-slate-200"
                      >
                        Kapat
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

              <div className="w-full px-4">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={isListening || isParsing}
                  placeholder="Veya konuşma metninizi buraya yapıştırın/yazın..."
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none disabled:opacity-70"
                />
              </div>

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
                     parsedResult.intent === 'note' ? '📝 Saha Notu' : 
                     parsedResult.intent === 'composite' ? '🔄 Çoklu İşlem' : '❓ Bilinmeyen'}
                  </Badge>
                </div>
                
                {parsedResult.intent === 'composite' && parsedResult.actions ? (
                  <div className="space-y-4">
                    {parsedResult.actions.map((action, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 uppercase">{action.type}</span>
                          <span className="text-xs text-slate-500">{action.explanation}</span>
                        </div>
                        {Object.entries(action.payload).map(([k, v]) => {
                          if (!v) return null;
                          return (
                            <div key={k} className="flex flex-col">
                              <span className="text-[10px] text-slate-400 capitalize">{k}</span>
                              <span className="text-sm text-slate-800">{String(v)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  Object.entries(parsedResult.extracted_data).map(([key, value]) => {
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
                  })
                )}
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
