import React from 'react';
import { PremiumGate } from './components/premium/PremiumGate';
import { AICoachPanel } from './components/ai/AICoachPanel';
import { WhatsAppAnalysisPanel } from './components/whatsapp/WhatsAppAnalysisPanel';
import { PremiumBadge } from './components/premium/PremiumBadge';
import { useFeatureAccess } from './hooks/useFeatureAccess';

export const PremiumDemoPage: React.FC = () => {
  const { userTier } = useFeatureAccess();

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-12">
      <header className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Premium Özellikler</h1>
          <p className="text-slate-500 font-medium">Portfy'ın tüm gücünü keşfedin.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mevcut Planın</span>
          <PremiumBadge tier={userTier} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 gap-12">
        {/* AI Coach - Pro Feature */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">AI Koç Analizi</h2>
            <PremiumBadge tier="pro" />
          </div>
          <PremiumGate featureKey="ai_coach">
            <AICoachPanel />
          </PremiumGate>
        </section>

        {/* WhatsApp Analysis - Pro Feature */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">WhatsApp Müşteri Analizi</h2>
            <PremiumBadge tier="pro" />
          </div>
          <PremiumGate featureKey="whatsapp_analysis">
            <WhatsAppAnalysisPanel />
          </PremiumGate>
        </section>

        {/* Team Collaboration - Elite Feature */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Ekip Çalışması</h2>
            <PremiumBadge tier="elite" />
          </div>
          <PremiumGate featureKey="team_collaboration">
            <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center space-y-4">
              <h4 className="text-lg font-bold text-slate-900">Ekip Arkadaşlarını Davet Et</h4>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Portföylerinizi ekibinizle paylaşın ve satış sürecini birlikte yönetin.
              </p>
              <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">
                Davet Gönder
              </button>
            </div>
          </PremiumGate>
        </section>
      </div>
    </div>
  );
};
