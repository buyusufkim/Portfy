import React from 'react';
import { Card } from '../UI';
import { Trophy, Play, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
    isStarting: boolean;
    setIsStarting: (v: boolean) => void;
    region: string;
    setRegion: (v: string) => void;
    niche: string;
    setNiche: (v: string) => void;
    isPending: boolean;
    onStart: () => void;
}

export const CampaignStartCard: React.FC<Props> = ({
    isStarting,
    setIsStarting,
    region,
    setRegion,
    niche,
    setNiche,
    isPending,
    onStart
}) => {
    return (
        <div className="max-w-xl mx-auto p-4 md:p-8 pb-32">
            <Card className="p-6 md:p-10 bg-gradient-to-br from-[#061A32] to-[#041A33] text-white rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                   <Trophy size={200} />
                </div>
                
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                        <Trophy size={32} className="text-[#00D2B4]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-4">Portfy 90 Günlük Danışman Kampı</h1>
                    <p className="text-xl font-bold text-[#FF6B1A] mb-4">"İlk 90 gün, önümüzdeki 10 yılın temelini atar."</p>
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        Portfy sana sadece boş bir CRM vermez. Her gün ne yapacağını söyleyen,
                        yaptığını ölçen ve seni gerçek bir gayrimenkul profesyoneline dönüştüren dijital bir mentor sistemi sunar.
                    </p>

                    {!isStarting ? (
                        <button 
                            onClick={() => setIsStarting(true)}
                            className="w-full bg-[#00D2B4] hover:bg-[#00e3c5] text-[#061A32] font-black text-lg py-4 rounded-xl transition-colors shadow-lg shadow-[#00D2B4]/20 flex items-center justify-center gap-2"
                        >
                            Kampa Başla <Play size={20} className="fill-current" />
                        </button>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Uzmanlık Bölgen</label>
                                <div className="relative">
                                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                    type="text" 
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="Örn: Talas, Mevlana" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2B4]"
                                  />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Uzmanlık Alanın</label>
                                <div className="relative">
                                  <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input 
                                    type="text" 
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="Örn: Satılık Daire, Kiralık Daire, Arsa, Ticari" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00D2B4]"
                                  />
                                </div>
                            </div>
                            <div className="pt-4 pb-2">
                                <button 
                                    onClick={onStart}
                                    disabled={isPending || !region || !niche}
                                    className="w-full bg-[#FF6B1A] hover:bg-[#ff803d] text-white font-black text-lg py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 relative z-50 mb-12 lg:mb-0"
                                >
                                    {isPending ? 'Başlatılıyor...' : 'Hedefi Onayla ve Başla!'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </Card>
        </div>
    );
};
