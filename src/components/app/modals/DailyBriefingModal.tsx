import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Phone, Calendar, MapPin } from 'lucide-react';

import { Task, Building } from '../../../types';

interface DailyBriefingModalProps {
  showDailyBriefing: boolean;
  setShowDailyBriefing: (val: boolean) => void;
  tasks: Task[];
  fieldVisits: Building[];
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ 
  showDailyBriefing, 
  setShowDailyBriefing, 
  tasks, 
  fieldVisits 
}) => {
  if (!showDailyBriefing) return null;
  
  const todayTasks = tasks.filter((t: Task) => !t.completed);
  const todayVisits = fieldVisits.filter((v: Building) => v.status === 'Potansiyel');

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
          className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#FF3D00] to-[#FF9100] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Günlük Özet</h2>
                <p className="text-xs text-slate-500">Bugün seni neler bekliyor?</p>
              </div>
            </div>
            <button onClick={() => setShowDailyBriefing(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yapılacak Görevler ({todayTasks.length})</h3>
              {todayTasks.length > 0 ? (
                <div className="space-y-2">
                  {todayTasks.slice(0, 3).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                        {task.type === 'Arama' ? <Phone size={14} /> : <Calendar size={14} />}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{task.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Bugün için bekleyen görev yok.</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saha Ziyaretleri ({todayVisits.length})</h3>
              {todayVisits.length > 0 ? (
                <div className="space-y-2">
                  {todayVisits.slice(0, 2).map((visit: any) => (
                    <div key={visit.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <MapPin size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{visit.address}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Planlanmış saha ziyareti yok.</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setShowDailyBriefing(false)}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
          >
            Hadi Başlayalım!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
