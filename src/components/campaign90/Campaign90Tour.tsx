import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X, Sparkles } from 'lucide-react';

interface Campaign90TourProps {
    userId: string;
    campaignId: string;
}

export const Campaign90Tour: React.FC<Campaign90TourProps> = ({ userId, campaignId }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetPos, setTargetPos] = useState<DOMRect | null>(null);

    const storageKey = `portfy_campaign90_tour_seen_${userId}_${campaignId}`;

    const tourSteps = [
        {
            id: 'campaign-progress',
            title: 'Kamp durumun burada',
            desc: 'Kaçıncı günde olduğunu, bugünkü hedef durumunu ve G/P/A dengenin nasıl gittiğini buradan takip edersin.',
            position: 'bottom' as const,
        },
        {
            id: 'campaign-mentor',
            title: 'Mentor önce yön verir',
            desc: 'Portfy, o gün hangi noktaya dikkat etmen gerektiğini burada söyler. Önce bu mesajı oku.',
            position: 'bottom' as const,
        },
        {
            id: 'campaign-today-flow',
            title: 'Günü sırayla yürüt',
            desc: 'Önce eğitim, sonra görevler, ardından kontrol ve kapanış. Bu alan sana günün akışını gösterir.',
            position: 'bottom' as const,
        },
        {
            id: 'campaign-education',
            title: 'Önce öğren',
            desc: 'Her gün kısa bir meslek dersi, saha örneği, script ve mini quiz görürsün.',
            position: 'bottom' as const,
        },
        {
            id: 'campaign-glossary',
            title: 'Meslek dilini öğren',
            desc: 'Her gün 5 terimle gayrimenkul dilini güçlendirirsin. Terimleri bilmek sahada güven verir.',
            position: 'top' as const,
        },
        {
            id: 'campaign-tasks',
            title: 'Sonra uygula',
            desc: 'Görevler G/P/A mantığıyla ayrılır: gelir getirici aktivite, portföy üretimi ve alan uzmanlığı.',
            position: 'top' as const,
        },
        {
            id: 'campaign-report-guides',
            title: 'Gelişimini kontrol et',
            desc: 'Raporlardan ilerlemeni görür, rehberlerden alıcı, satıcı, CMA, yetki ve portföy süreci desteği alırsın.',
            position: 'top' as const,
        }
    ];

    useEffect(() => {
        // Run after giving original DOM some time to paint
        const timer = setTimeout(() => {
            const hasSeen = localStorage.getItem(storageKey);
            if (!hasSeen) {
                setIsVisible(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [storageKey]);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const el = document.querySelector(`[data-tour="${tourSteps[currentStep].id}"]`);
            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetPos(rect);
                
                // Scroll into view if needed
                if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // If element is not found, maybe move to next step or clear
                setTargetPos(null);
            }
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, { passive: true });
        
        // Wait a bit and retry if element is rendered late
        const retryTimer = setTimeout(updatePosition, 300);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(retryTimer);
        };
    }, [currentStep, isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem(storageKey, 'true');
    };

    if (!isVisible) return null;

    // Use current active step
    const stepDef = tourSteps[currentStep];

    return createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto" />

            {/* Target highlight cutout */}
            {targetPos && (
                <div 
                    className="absolute border-4 border-indigo-500 rounded-2xl transition-all duration-300 pointer-events-none"
                    style={{
                        top: targetPos.top - 8,
                        left: targetPos.left - 8,
                        width: targetPos.width + 16,
                        height: targetPos.height + 16,
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)'
                    }}
                />
            )}

            {/* Tooltip Content */}
            <div 
                className={`absolute bg-white rounded-2xl p-5 shadow-2xl w-[90%] max-w-[340px] pointer-events-auto transition-all duration-300 ${!targetPos ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                style={targetPos ? {
                    top: stepDef.position === 'bottom' 
                        ? Math.min(targetPos.bottom + 16, window.innerHeight - 200)
                        : Math.max(16, targetPos.top - 180),
                    left: Math.max(16, Math.min(targetPos.left, window.innerWidth - 340 - 16)), // Keep in screen bounds safely
                    zIndex: 101 // Using 340 + 16 for better margin on mobile
                } : { zIndex: 101 }}
            >
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-800 text-lg mb-1.5 pr-6 leading-tight">
                            {stepDef.title}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            {stepDef.desc}
                        </p>
                        
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-400">
                                Adım {currentStep + 1} / {tourSteps.length}
                            </span>
                            
                            <div className="flex items-center gap-2">
                                {currentStep > 0 && (
                                    <button 
                                        onClick={handlePrev}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Geri
                                    </button>
                                )}
                                <button 
                                    onClick={handleNext}
                                    className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm shadow-indigo-200"
                                >
                                    {currentStep === tourSteps.length - 1 ? 'Kampa Başla' : 'Sıradaki'}
                                    {currentStep < tourSteps.length - 1 && <ChevronRight size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global controls */}
            <button 
                onClick={handleComplete}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-colors pointer-events-auto"
                title="Turu Kapat"
            >
                <X size={20} />
            </button>
            <button 
                onClick={handleComplete}
                className="absolute bottom-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl backdrop-blur-md transition-colors pointer-events-auto shadow-xl border border-white/10"
            >
                Turu Geç
            </button>
        </div>
    , document.body);
};
