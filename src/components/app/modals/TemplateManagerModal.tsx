import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Trash2 } from 'lucide-react';

import { MessageTemplate } from '../../../types';

interface TemplateManagerModalProps {
  showTemplateManager: boolean;
  setShowTemplateManager: (val: boolean) => void;
  templates: MessageTemplate[];
  addTemplateMutation: any;
  deleteTemplateMutation: any;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({ 
  showTemplateManager, 
  setShowTemplateManager, 
  templates, 
  addTemplateMutation, 
  deleteTemplateMutation 
}) => {
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

  if (!showTemplateManager) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Mesaj Şablonları</h2>
                <p className="text-xs text-slate-500">Hızlı paylaşım için şablon oluştur</p>
              </div>
            </div>
            <button onClick={() => setShowTemplateManager(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar">
            <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yeni Şablon Ekle</h3>
              <input 
                type="text" 
                placeholder="Şablon Adı (Örn: İlk Tanıtım)" 
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                value={newTemplate.name}
                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <textarea 
                placeholder="Mesaj içeriği... {title}, {price}, {district} gibi değişkenler kullanabilirsiniz." 
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                value={newTemplate.content}
                onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
              />
              <button 
                onClick={() => {
                  if (newTemplate.name && newTemplate.content) {
                    addTemplateMutation.mutate({ ...newTemplate, is_default: false });
                    setNewTemplate({ name: '', content: '' });
                  }
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-100"
              >
                Şablonu Kaydet
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kayıtlı Şablonlar ({templates.length})</h3>
              {templates.map((template: MessageTemplate) => (
                <div key={template.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex justify-between items-start group">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{template.name}</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{template.content}</p>
                  </div>
                  <button 
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
