import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Zap,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Plus,
  Send,
  MessageSquare,
  BarChart,
  Target,
  ShieldAlert,
  Map,
  Briefcase
} from "lucide-react";
import { useAICoach } from "../../hooks/useAICoach";

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  time?: string;
}

export const AICoachPanel: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const {
    insight,
    isLoading,
    error,
    fetchInsightAsync,
    stats,
    profile
  } = useAICoach();

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => [
    {
      role: "ai",
      content: "Bugüne net bir planla başlayalım. Verilerini analiz edip en doğru odağı çıkarabilirim.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleAction = async (requestType: string, customMessage?: string) => {
    let userMsg = customMessage;
    if (!userMsg) {
        if (requestType === 'analyze') userMsg = "Verilerimi analiz et";
        else if (requestType === 'priorities') userMsg = "Önceliklerimi belirle";
        else if (requestType === 'risks') userMsg = "Takip risklerimi göster";
        else if (requestType === 'region') userMsg = "Bölge stratejisi öner";
        else if (requestType === 'portfolio') userMsg = "Portföy fırsatlarını çıkar";
    }

    if (userMsg) {
        setChatHistory(prev => [...prev, { role: "user", content: userMsg!, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }

    try {
        const response = await fetchInsightAsync({ requestType, customMessage });
        if (response?.insight?.coachComment) {
             setChatHistory(prev => [...prev, { role: "ai", content: response.insight.coachComment, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        }
    } catch (err) {
        console.error("AI Coach Error", err);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    handleAction("custom", message);
    setMessage("");
  };

  const routeMap: Record<string, string> = {
    "/tasks": "tasks",
    "/crm": "crm",
    "/portfolio": "portfoyler",
    "/bolgem": "bolgem",
    "/profil": "profil"
  };

  const handleNavigation = (route: string) => {
    const tab = routeMap[route] || route.replace("/", "");
    if (setActiveTab) setActiveTab(tab);
  };

  const toneMap: Record<string, string> = {
    professional: "Profesyonel",
    friendly: "Dostça",
    motivational: "Motivasyonel",
    direct: "Direkt"
  };

  const currentTone = profile?.ai_coach_tone ? toneMap[profile.ai_coach_tone] || "Profesyonel" : "Profesyonel";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* SOL KOLON: AI ETKİLEŞİM ALANI */}
      <div className="xl:col-span-7 space-y-6 flex flex-col">
        
        {/* PREMIUM HERO / HEADER */}
        <div className="bg-gradient-to-br from-[#061A32] via-[#082B55] to-[#061A32] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2B4]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-[#00D2B4]" />
                <span className="text-[#00D2B4] text-[11px] font-black tracking-widest uppercase">Portfy AI Koç</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">
                {profile?.display_name ? `Hazır mısın, ${profile.display_name.split(' ')[0]}?` : 'Performans Odaklı AI Koç'}
              </h1>
              <p className="text-sm font-medium text-white/70 max-w-md leading-relaxed">
                Bugüne net bir planla başlayalım. Verilerini analiz edip en doğru odağı çıkarabilirim.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 px-4 py-2 rounded-2xl text-sm font-bold shrink-0">
              <MessageSquare size={16} />
              Ton: {currentTone}
            </div>
          </div>
        </div>

        {/* AI Sohbet/Çıktı Alanı */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[32px] p-6 lg:p-8 min-h-[400px] max-h-[600px] overflow-y-auto flex flex-col shadow-sm gap-6 custom-scrollbar">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'ai' && (
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                  <Sparkles size={18} className="text-[#00D2B4]" />
                </div>
              )}

              <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-3 mb-1.5 px-1">
                  <span className="text-xs font-bold text-slate-900">{msg.role === 'ai' ? 'Portfy AI' : (profile?.display_name || 'Sen')}</span>
                  {msg.time && <span className="text-[10px] font-medium text-slate-400">{msg.time}</span>}
                </div>
                <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#061A32] text-white rounded-tr-md' 
                    : 'bg-slate-50 text-slate-800 rounded-tl-md border border-slate-200/60'
                }`}>
                  {msg.content}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 mt-1 ring-2 ring-white shadow-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                       {profile?.display_name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                 <Sparkles size={18} className="text-[#00D2B4] animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-200/60 rounded-3xl rounded-tl-md p-5 w-20 flex items-center justify-center gap-1.5 shadow-sm">
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                 <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center p-6 bg-red-50/50 rounded-3xl border border-red-100/50 my-2">
                <ShieldAlert size={24} className="text-red-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-red-900 mb-1">Şu an analiz edemiyorum</h4>
                <p className="text-xs font-medium text-red-600/80 max-w-sm mx-auto">Yoğunluk nedeniyle kısa bir duraksama yaşadık. Merak etme, verilerin güvende. Birkaç saniye sonra tekrar deneyebilirsin.</p>
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleChatSubmit} className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="AI Koç'a neye odaklanmak istediğini yaz..."
            className="w-full bg-white border border-slate-200 rounded-2xl md:rounded-3xl py-4 md:py-5 pl-5 pr-14 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!message.trim() || isLoading}
            className="absolute right-2.5 top-2.5 p-2.5 md:p-3 bg-[#061A32] text-white rounded-xl md:rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-[#061A32] shadow-sm flex items-center justify-center"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>

        {/* Hızlı Çözümler */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button onClick={() => handleAction("analyze")} disabled={isLoading} className="flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart size={16} className="text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">Verilerimi<br/>analiz et</span>
          </button>
          <button onClick={() => handleAction("priorities")} disabled={isLoading} className="flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all text-left group">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target size={16} className="text-orange-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">Önceliklerimi<br/>belirle</span>
          </button>
          <button onClick={() => handleAction("risks")} disabled={isLoading} className="flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-red-300 hover:shadow-md transition-all text-left group">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert size={16} className="text-red-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">Takip risklerimi<br/>göster</span>
          </button>
          <button onClick={() => handleAction("region")} disabled={isLoading} className="flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all text-left group">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Map size={16} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">Bölge stratejisi<br/>öner</span>
          </button>
          <button onClick={() => handleAction("portfolio")} disabled={isLoading} className="flex flex-col items-start gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all text-left group col-span-2 lg:col-span-1">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase size={16} className="text-purple-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">Portföy<br/>fırsatları</span>
          </button>
        </div>

      </div>

      {/* SAĞ KOLON: ANALİZ ÇIKTILARI */}
      <div className="xl:col-span-5 space-y-6">

        {/* Bugünkü Koç Yorumu */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-slate-400" />
              Bugünkü Koç Yorumu
            </h3>
            {insight?.coachComment && (
               <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">Günlük</span>
            )}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
             {insight?.coachComment || "Bugünkü koç yorumunu oluşturmak için AI Koç'u çalıştır."}
          </p>
        </div>
        
        {/* Operasyon Özeti */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart size={18} className="text-blue-500" />
            Operasyon Özeti
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl p-4 ${stats?.overdueTasks ? 'bg-red-50' : 'bg-slate-50'}`}>
              <div className={`text-2xl font-black mb-1 ${stats?.overdueTasks ? 'text-red-600' : 'text-slate-900'}`}>{stats?.overdueTasks || 0}</div>
              <div className={`text-xs font-medium ${stats?.overdueTasks ? 'text-red-800/60' : 'text-slate-500'}`}>Geciken Takip</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-black text-slate-900 mb-1">{stats?.openTasks || 0}</div>
              <div className="text-xs text-slate-500 font-medium">Açık Görev</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4">
              <div className="text-2xl font-black text-orange-600 mb-1">{stats?.hotLeads || 0}</div>
              <div className="text-xs text-orange-800/60 font-medium">Sıcak Aday</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="text-2xl font-black text-green-600 mb-1">{stats?.activeProperties || 0}</div>
              <div className="text-xs text-green-800/60 font-medium">Aktif Portföy</div>
            </div>
          </div>
        </div>

        {/* Günün Ana Odakları */}
        {(!insight?.mainFocus || insight.mainFocus.length === 0) ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-slate-400" />
              Günün Ana Odakları
            </h3>
            <div className="py-4 text-center">
               <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">Henüz analiz yapılmadı. AI Koç'u çalıştırınca bugünün en kritik 3 odağı burada görünecek.</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-lg shadow-slate-900/10">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Target size={18} className="text-orange-500" />
              Günün Ana Odakları
            </h3>
            <div className="space-y-4">
              {insight.mainFocus.map((focus, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 flex-shrink-0 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-orange-400">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm leading-tight mb-1">{focus.title}</h4>
                    <p className="text-xs text-white/50">{focus.reason}</p>
                    {focus.targetRoute && (
                      <button onClick={() => handleNavigation(focus.targetRoute)} className="mt-2 text-xs font-medium text-orange-400 flex items-center gap-1 hover:text-orange-300 transition-colors">
                        Aksiyon Al <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Önerilen Görevler */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" />
            Önerilen Aksiyonlar
          </h3>
          {!insight?.suggestedActions || insight.suggestedActions.length === 0 ? (
             <div className="py-6 text-center bg-slate-50 rounded-2xl px-4">
               <p className="text-sm font-medium text-slate-500 leading-relaxed">AI analizi sonrası uygulanabilir aksiyonlar burada listelenecek.</p>
             </div>
          ) : (
            <div className="space-y-3">
              {insight.suggestedActions.map((action, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-orange-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-slate-900 pr-4">{action.title}</h4>
                    {action.priority === 'high' && (
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    {action.description}
                  </p>
                  <button 
                    onClick={() => handleNavigation(action.targetRoute)}
                    className="w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all shadow-sm"
                  >
                     Hemen İncele
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
