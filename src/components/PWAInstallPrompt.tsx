import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt({ disabled }: { disabled?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (disabled) return;

    // Check if user dismissed prompt recently
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissedAt');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        return; // Don't show if dismissed within 3 days
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      return; 
    }

    // iOS detection
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (isIOSDevice) {
      setIsIOS(true);
      // Wait a bit before showing iOS prompt so it doesn't interrupt immediate app flow
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Android/Chrome detection (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [disabled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    } else {
      // User cancelled native prompt
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissedAt', Date.now().toString());
  };

  if (!showPrompt || disabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-slate-800 text-white rounded-xl shadow-2xl p-4 z-40 border border-slate-700 overflow-hidden"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-700 transition"
        >
          <X size={16} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-teal-500/20 p-2 rounded-lg">
            <Download className="w-6 h-6 text-teal-400" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="font-semibold text-sm mb-1">Portfy'yi Telefonuna Ekle</h3>
            
            {isIOS ? (
              <p className="text-xs text-slate-300 leading-relaxed mb-1">
                Uygulamayı yüklemek için Safari menüsünden <Share className="inline w-3 h-3 mx-1" /> ikonuna dokun ve <strong>"Ana Ekrana Ekle"</strong> seçeneğini seç.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Saha ve müşteri yönetimine tek tıkla ulaş.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold py-2 px-4 rounded-lg transition"
                >
                  Şimdi Yükle
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
