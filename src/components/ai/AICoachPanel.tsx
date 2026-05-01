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
      content: `Günaydın${profile?.display_name ? ` ${profile.display_name.split(' ')[0]}` : ''}! Bugüne net bir planla başlamak başarıyı katlar. Verilerini analiz ederek odaklanman gereken alanları bulabilirim.\n\nHadi bugünü güçlü kapatalım! Nereden başlamak istersin?`,
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
        
        {/* Başlık ve Ton */}
        <div className="flex items-start justify-between flex-col md:flex-row gap-4 md:gap-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Portfy AI Koç</h1>
            <p className="text-sm font-medium text-slate-500">Günlük, haftalık ve aylık verilerini analiz ederek sana net aksiyon planı çıkarır.</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
            <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-sm font-semibold">
              <MessageSquare size={14} />
              Ton: {currentTone}
            </div>
            <span className="text-[10px] text-slate-400 font-medium md:mr-2">Profilim'den yönetilir</span>
          </div>
        </div>

        {/* AI Sohbet/Çıktı Alanı */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-6 min-h-[400px] max-h-[600px] overflow-y-auto flex flex-col shadow-sm gap-6">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'ai' && (
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 shrink-0 mt-1">
                  <Sparkles size={20} className="text-orange-500" />
                </div>
              )}

              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-700">{msg.role === 'ai' ? 'AI Koç' : (profile?.display_name || 'Sen')}</span>
                  {msg.time && <span className="text-xs text-slate-400">{msg.time}</span>}
                </div>
                <div className={`p-4 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-100 text-slate-800 rounded-tr-sm' 
                    : 'bg-slate-50 text-slate-800 rounded-tl-sm border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 mt-1">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">
                       {profile?.display_name?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 shrink-0 mt-1">
                 <Sparkles size={20} className="text-orange-500 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm p-4 w-16 flex items-center justify-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                 <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center p-4">
                <p className="text-sm text-red-500 font-medium bg-red-50 py-2 px-4 rounded-lg inline-block">AI Koç şu an yanıt üretemedi. Biraz sonra tekrar dene.</p>
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
            placeholder="AI Koç'a bugün neyi netleştirmek istediğini yaz..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!message.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900"
          >
            <Send size={18} />
          </button>
        </form>

        {/* Hızlı Çözümler */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <button onClick={() => handleAction("analyze")} disabled={isLoading} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all text-left">
            <BarChart size={14} className="text-blue-500 shrink-0" />
            <span className="truncate">Verilerimi analiz et</span>
          </button>
          <button onClick={() => handleAction("priorities")} disabled={isLoading} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all text-left">
            <Target size={14} className="text-orange-500 shrink-0" />
            <span className="truncate">Önceliklerimi belirle</span>
          </button>
          <button onClick={() => handleAction("risks")} disabled={isLoading} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all text-left">
            <ShieldAlert size={14} className="text-red-500 shrink-0" />
            <span className="truncate">Takip risklerimi göster</span>
          </button>
          <button onClick={() => handleAction("region")} disabled={isLoading} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all text-left">
            <Map size={14} className="text-green-500 shrink-0" />
            <span className="truncate">Bölge stratejisi öner</span>
          </button>
          <button onClick={() => handleAction("portfolio")} disabled={isLoading} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:shadow-sm text-xs font-semibold text-slate-700 transition-all text-left col-span-2 lg:col-span-1">
            <Briefcase size={14} className="text-purple-500 shrink-0" />
            <span className="truncate">Portföy fırsatlarını çıkar</span>
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
