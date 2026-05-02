import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import {
  ShieldCheck,
  CreditCard,
  LogOut,
  MapPin,
  Sparkles,
  Star,
  User,
  ArrowRight,
  X,
  Check,
  Camera
} from "lucide-react";
import {
  UserProfile,
  BrokerAccount,
  MutationResult,
  ExternalListing,
  NotificationPreference
} from "../types";
import { getEffectiveAiTokenLimit } from "../config/subscriptionLimits";
import { 
  ensureDefaultNotificationPreferences, 
  updateNotificationPreference 
} from "../services/notificationPreferenceService";
import { Card, Badge } from "./UI";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services/profileService";

interface ProfilViewProps {
  profile: UserProfile | null;
  brokerAccount: BrokerAccount | null;
  logout: () => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowExternalListings: (show: boolean) => void;
  setShowIntegrationModal: (show: boolean) => void;
  syncListingsMutation: MutationResult<ExternalListing[], void>;
  updateProfileMutation: MutationResult<
    void,
    { id: string; data: Partial<UserProfile> }
  >;
  setShowRegionSetup: (show: boolean) => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  profile,
  brokerAccount,
  logout,
  setShowAdminPanel,
  setShowIntegrationModal,
  // Props not destructured as they are unused, but kept in interface for parent compatibility:
  // setShowExternalListings,
  // syncListingsMutation,
  updateProfileMutation,
  setShowRegionSetup,
}) => {
  const isExpired = profile?.subscription_end_date && new Date(profile.subscription_end_date) < new Date();
  
  let planStatusText = "Plan bilgisi yok";
  if (profile?.subscription_type && profile.subscription_type !== "none") {
    if (isExpired) {
      planStatusText = "Süresi doldu";
    } else if (profile.subscription_type === "trial") {
      planStatusText = "Deneme";
    } else {
      planStatusText = profile.subscription_type;
    }
  }

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [updatingNotificationType, setUpdatingNotificationType] = useState<string | null>(null);

  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [passwordResetStatus, setPasswordResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordResetMessage, setPasswordResetMessage] = useState("");

  const handlePasswordReset = async () => {
    if (!profile?.email) {
      setPasswordResetStatus("error");
      setPasswordResetMessage("E-posta adresi bulunamadı.");
      return;
    }
    
    if (isSendingPasswordReset) return;
    
    setIsSendingPasswordReset(true);
    setPasswordResetStatus("idle");
    setPasswordResetMessage("");
    
    try {
      // Mevcut özel reset-password route bulunmadığı için origin kullanıldı.
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo });
      
      if (error) throw error;
      
      setPasswordResetStatus("success");
      setPasswordResetMessage("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    } catch (error: unknown) {
      setPasswordResetStatus("error");
      const message = error instanceof Error 
        ? (error.message.includes('rate limit') ? 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' : error.message)
        : "Şifre sıfırlama e-postası gönderilemedi.";
      setPasswordResetMessage(message);
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
       setIsNotificationsLoading(true);
       ensureDefaultNotificationPreferences(profile.id)
         .then(prefs => {
            setNotificationPreferences(prefs);
         })
         .catch(err => {
            console.error("Bildirim tercihleri yüklenemedi:", err);
         })
         .finally(() => {
            setIsNotificationsLoading(false);
         });
    }
  }, [profile?.id]);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    phone: profile?.phone || "",
    city: profile?.city || "",
    district: profile?.district || "",
    bio: profile?.bio || "",
    company_name: profile?.company_name || "",
    title: profile?.title || "",
    whatsapp: profile?.whatsapp || "",
    instagram: profile?.instagram || "",
    website: profile?.website || "",
    expertise_areas: profile?.expertise_areas || [],
    working_style: profile?.working_style || [],
    preferred_start_time: profile?.preferred_start_time || "09:00",
    work_start_time: profile?.work_start_time || "09:00",
    work_end_time: profile?.work_end_time || "18:00",
    ai_coach_tone: profile?.ai_coach_tone || "direct",
    notification_preference: profile?.notification_preference || "normal",
  });

  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPanel || typeof document === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    const originalBodyOverflow = body.style.overflow;
    const originalHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = originalBodyOverflow;
      html.style.overflow = originalHtmlOverflow;
    };
  }, [selectedPanel]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        district: profile.district || "",
        bio: profile.bio || "",
        company_name: profile.company_name || "",
        title: profile.title || "",
        whatsapp: profile.whatsapp || "",
        instagram: profile.instagram || "",
        website: profile.website || "",
        expertise_areas: profile.expertise_areas || [],
        working_style: profile.working_style || [],
        preferred_start_time: profile.preferred_start_time || "09:00",
        work_start_time: profile.work_start_time || "09:00",
        work_end_time: profile.work_end_time || "18:00",
        ai_coach_tone: profile.ai_coach_tone || "direct",
        notification_preference: profile.notification_preference || "normal",
      });
    }
  }, [profile]);

  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setLocalAvatar(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const { data: disciplineLogs = [], isLoading: isDisciplineLoading } = useQuery({
    queryKey: ['workDisciplineLogs', profile?.id],
    queryFn: profileService.getWorkDisciplineLogs,
    enabled: !!profile?.id
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Fotoğraf seçilmedi.');
      }

      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece görsel dosyaları yüklenebilir.');
      }
      
      if (file.size > 5 * 1024 * 1024) {
         throw new Error('Dosya boyutu 5MB altında olmalıdır.');
      }
      
      if (!profile?.id) throw new Error('Kullanıcı bulunamadı.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      setLocalAvatar(newAvatarUrl);
      
      updateProfileMutation.mutate({ id: profile.id, data: { avatar_url: newAvatarUrl } });

    } catch (error: unknown) {
      console.error("Avatar yükleme hatası:", error);
      const message = error instanceof Error 
        ? (error.message.includes('bucket') ? 'Profil fotoğrafı yüklenemedi. Storage avatars bucket kurulmamış olabilir.' : error.message)
        : "Fotoğraf yüklenirken bir hata oluştu.";
      alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Profil Tamamlanma Skoru
  let score = 0;
  if (formData.display_name) score += 10;
  if (formData.phone) score += 10;
  if (formData.bio) score += 10;
  if (formData.city || formData.district) score += 10;
  if (profile?.region?.city || profile?.region?.district) score += 15;
  if (formData.company_name || formData.title) score += 10;
  if (formData.expertise_areas.length > 0) score += 15;
  if (brokerAccount) score += 20;
  const clampedScore = Math.min(score, 100);

  let scoreMessage = "Profilini tamamla, Portfy seni daha iyi yönlendirsin.";
  if (clampedScore >= 80) scoreMessage = "Profil güçlü görünüyor.";
  else if (clampedScore >= 50) scoreMessage = "İyi gidiyorsun, birkaç bilgi daha ekle.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 space-y-6"
    >
      {/* Premium Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <div className="flex items-start gap-4 sm:hidden mb-1">
             <div className="relative shrink-0">
               <div className="w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] bg-slate-200 rounded-3xl sm:rounded-[32px] overflow-hidden border-2 sm:border-4 border-slate-700/50 shadow-xl relative group">
                 {localAvatar ? (
                   <img
                     src={localAvatar}
                     alt="Profile"
                     className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
                   />
                 ) : (
                   <img
                     src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                     alt="Profile"
                     className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
                   />
                 )}
                 
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <input 
                     type="file" 
                     accept="image/*" 
                     className="hidden" 
                     onChange={handleAvatarUpload} 
                     ref={fileInputRef}
                     disabled={uploading}
                   />
                   <Camera className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                 </label>
                 
                 {uploading && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                     <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   </div>
                 )}
               </div>
               <div className="absolute -bottom-2 -right-2 z-10">
                 <Badge 
                   variant={planStatusText === 'Plan bilgisi yok' || planStatusText === 'Süresi doldu' ? 'warning' : 'success'} 
                   className="shadow-lg text-[9px] px-2 py-0.5"
                 >
                   {planStatusText}
                 </Badge>
               </div>
             </div>
             <div className="flex-1 mt-1">
               <h2 className="text-xl font-black tracking-tight leading-tight">
                 {formData.display_name || profile?.display_name || "İsimsiz Kullanıcı"} <span className="opacity-80">👋</span>
               </h2>
               <div className="flex flex-col gap-1 mt-1">
                 <p className="text-slate-300 text-[13px] font-medium truncate max-w-[200px]">{profile?.email}</p>
               </div>
             </div>
          </div>

          <div className="hidden sm:block relative shrink-0">
            <div className="w-[96px] h-[96px] bg-slate-200 rounded-[32px] overflow-hidden border-4 border-slate-700/50 shadow-xl relative group">
              {localAvatar ? (
                <img
                  src={localAvatar}
                  alt="Profile"
                  className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
                />
              ) : (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                  alt="Profile"
                  className={`w-full h-full object-cover transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
                />
              )}
              
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                  ref={fileInputRef}
                  disabled={uploading}
                />
                <Camera className="text-white w-8 h-8" />
              </label>
              
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 z-10">
              <Badge 
                variant={planStatusText === 'Plan bilgisi yok' || planStatusText === 'Süresi doldu' ? 'warning' : 'success'} 
                className="shadow-lg text-[10px] px-2 py-0.5"
              >
                {planStatusText}
              </Badge>
            </div>
          </div>

          <div className="hidden sm:block flex-1 text-left mt-0">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              {formData.display_name || profile?.display_name || "İsimsiz Kullanıcı"} <span className="opacity-80">👋</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-300 text-sm font-medium">{profile?.email}</p>
            </div>
          </div>

          <div className="w-full sm:max-w-xs mt-0">
             <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm relative transition-colors">
                <div className="absolute -top-3 -left-2 text-4xl text-slate-500/20 font-serif">"</div>
                <p className="text-slate-300 italic text-[12px] sm:text-[13px] leading-relaxed relative z-10 text-left line-clamp-3">
                   {formData.bio || profile?.bio || "Biyografi henüz eklenmedi."}
                </p>
                <div className="absolute -bottom-6 -right-2 text-4xl text-slate-500/20 font-serif">"</div>
             </div>
          </div>
        </div>

        {/* Tags */}
        <div className="relative z-10 mt-5 sm:ml-[120px] flex flex-wrap items-center justify-start gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl text-[10px] sm:text-[11px] font-bold text-slate-300 border border-slate-700/80">
            <ShieldCheck size={14} className="text-slate-400" />
            {formData.title || profile?.title || (profile?.role === "admin" ? "Yönetici" : "Unvan eklenmedi")}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-xl text-[10px] sm:text-[11px] font-bold text-slate-300 border border-slate-700/80">
            <MapPin size={14} className="text-slate-400" />
            {profile?.region ? `${profile.region.city} / ${profile.region.district}` : (
               (formData.city || formData.district) ? `${formData.city || ''} ${formData.district ? '/ ' + formData.district : ''}`.trim() : "Bölge eklenmedi"
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Plan Durumu */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 flex flex-col items-start shadow-sm justify-between hover:border-slate-200 transition-colors">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard size={16} />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plan</span>
            </div>
            <div className="text-xl font-black text-slate-900 capitalize mb-1">{planStatusText}</div>
            <div className="text-[11px] font-medium text-slate-500 truncate w-full">
               {profile?.subscription_end_date ? `Yenileme: ${new Date(profile.subscription_end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric'})}` : 'Plan bilgisi yok'}
            </div>
          </div>
          <button 
            onClick={() => setSelectedPanel("plan")}
            className="w-full mt-4 py-2.5 bg-[#0f172a] text-white rounded-xl text-[12px] font-bold shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Planı Yönet
          </button>
        </div>

        {/* AI Kullanım */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 flex flex-col items-start shadow-sm justify-between hover:border-indigo-100 transition-colors group">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <Sparkles size={16} />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Yapay Zeka</span>
            </div>
            <div className="text-xl font-black text-slate-900 mb-1">
              Aktif
            </div>
            <div className="text-[11px] font-medium text-slate-500">
               Kullanım: %{Math.round((profile.ai_tokens_used || 0) / Math.max(getEffectiveAiTokenLimit(profile), 1) * 100)}
            </div>
          </div>
          <button 
            onClick={() => setSelectedPanel("aiUsage")}
            className="w-full mt-4 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
          >
            Kullanımı Gör
          </button>
        </div>

        {/* Entegrasyon */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 flex flex-col items-start shadow-sm justify-between hover:border-slate-200 transition-colors">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                S
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Bağlantılar</span>
            </div>
            <div className="text-xl font-black text-slate-900 mb-1">{brokerAccount ? "1/3 Bağlı" : "0/3 Bağlı"}</div>
            <div className="text-[11px] font-medium text-slate-500 truncate w-full">
              {brokerAccount ? `Sahibinden bağlı` : "Kurulum bekliyor"}
            </div>
          </div>
          <button 
            onClick={() => setSelectedPanel("integrations")}
            className="w-full mt-4 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
          >
            Entegrasyonu Yönet
          </button>
        </div>
        
        {/* Profil Tamamlanma Skoru */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 flex flex-col items-start shadow-sm justify-between hover:border-slate-200 transition-colors">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <User size={16} />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tamamlanma</span>
            </div>
            <div className="text-xl font-black text-blue-600 mb-2">%{clampedScore}</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${clampedScore}%` }}></div>
            </div>
            <div className="text-[10px] font-medium text-slate-500 truncate w-full">
               {scoreMessage}
            </div>
          </div>
          <button 
            onClick={() => setSelectedPanel("completion")}
            className="w-full mt-3 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
          >
            Eksikleri Gör
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profile Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Profil Bilgileri */}
          <Card 
            onClick={() => setSelectedPanel("profile")}
            className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 relative cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors"
          >
            {/* Header / Mobile Summary */}
            <div className="flex items-center justify-between lg:border-b lg:border-slate-100 lg:pb-3">
              <div className="flex items-center gap-3 lg:gap-2">
                <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <User size={20} className="lg:w-4 lg:h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Profil Bilgileri</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Kişisel ve iletişim bilgilerini yönet.</p>
                  <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">{profile?.email || 'Eklenmedi'}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPanel("profile"); }}
                className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Düzenle
              </button>
            </div>
            
            {/* Desktop Details */}
            <div className="hidden lg:grid grid-cols-2 gap-y-4 gap-x-2 mt-4">
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">Ad Soyad</span>
                <span className="text-[11px] font-bold text-slate-700">{formData.display_name || profile?.display_name || 'Eklenmedi'}</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">E-posta</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{profile?.email || 'Eklenmedi'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">Telefon</span>
                <span className="text-[11px] font-bold text-slate-700">{formData.phone || profile?.phone || 'Eklenmedi'}</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">Unvan</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{formData.title || profile?.title || 'Eklenmedi'}</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">Firma</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{formData.company_name || profile?.company_name || 'Eklenmedi'}</span>
              </div>
               <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">Şehir / İlçe</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">
                  {formData.city || formData.district ? `${formData.city || ''} ${formData.district || ''}`.trim() : (profile?.city || profile?.district ? `${profile.city || ''} ${profile.district || ''}`.trim() : 'Eklenmedi')}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-0.5">WhatsApp</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{formData.whatsapp || profile?.whatsapp || 'Eklenmedi'}</span>
              </div>
              <div className="overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">Instagram</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{formData.instagram || profile?.instagram || 'Eklenmedi'}</span>
              </div>
               <div className="col-span-2 overflow-hidden">
                <span className="block text-[10px] text-slate-400 mb-0.5">Website</span>
                <span className="text-[11px] font-bold text-slate-700 truncate block w-full">{formData.website || profile?.website || 'Eklenmedi'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] text-slate-400 mb-0.5">Biyografi</span>
                <span className="text-[11px] font-bold text-slate-700 line-clamp-3">{formData.bio || profile?.bio || 'Eklenmedi'}</span>
              </div>
            </div>
          </Card>

          {/* Uzmanlık Alanları */}
          <Card 
            onClick={() => setSelectedPanel("expertise")}
            className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 relative cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors"
          >
            {/* Header / Mobile Summary */}
            <div className="flex items-center justify-between lg:border-b lg:border-slate-100 lg:pb-3">
              <div className="flex items-center gap-3 lg:gap-2">
                <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="lg:w-4 lg:h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Uzmanlık Alanları</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Uzmanlıklarını ve bölgelerini yönet.</p>
                  <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                    {profile?.expertise_areas && profile.expertise_areas.length > 0 
                      ? `${profile.expertise_areas.slice(0,2).join(', ')}${profile.expertise_areas.length > 2 ? ` +${profile.expertise_areas.length - 2}` : ''}`
                      : 'Eklenmedi'}
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPanel("expertise"); }}
                className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Düzenle
              </button>
            </div>
            
            {/* Desktop Details */}
            <div className="hidden lg:flex flex-wrap gap-2 mt-4">
              {profile?.expertise_areas && profile.expertise_areas.length > 0 ? (
                profile.expertise_areas.map((exp: string, idx: number) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition-colors duration-200">
                    {exp}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">Uzmanlık alanı eklenmedi.</span>
              )}
            </div>
          </Card>

          {/* Çalışma Stili */}
          <Card 
            onClick={() => setSelectedPanel("workingStyle")}
            className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 relative cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors"
          >
            {/* Header / Mobile Summary */}
            <div className="flex items-center justify-between lg:border-b lg:border-slate-100 lg:pb-3">
              <div className="flex items-center gap-3 lg:gap-2">
                <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                  <Star size={20} className="lg:w-4 lg:h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Çalışma Stili</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Çalışma modelini ve tercihlerini yönet.</p>
                  <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                    Mod: {profile?.role === 'admin' ? 'Yönetici' : 'Eklenmedi'}
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPanel("workingStyle"); }}
                className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Düzenle
              </button>
            </div>
            
            {/* Desktop Details */}
            <div className="hidden lg:block space-y-3 mt-4">
              {profile?.working_style && profile.working_style.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.working_style.map((ws: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">{ws}</span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">Mesai Başlangıç Saati</span>
                <span className="font-bold text-slate-700">{profile?.work_start_time || profile?.preferred_start_time || 'Eklenmedi'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">Mesai Bitiş Saati</span>
                <span className="font-bold text-slate-700">{profile?.work_end_time || 'Eklenmedi'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">Çalışma Modeli</span>
                <span className="font-bold text-slate-700">{profile?.role === 'admin' ? 'Yönetici' : 'Eklenmedi'}</span>
              </div>
              {(!profile?.working_style || profile.working_style.length === 0) && !profile?.preferred_start_time && (
                <div className="text-[11px] text-slate-500 pt-2">Çalışma stili eklenmedi.</div>
              )}
            </div>
          </Card>
        </div>

        {/* AI Koç Tonu */}
        <Card 
          onClick={() => setSelectedPanel("aiTone")}
          className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 relative cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors"
        >
          {/* Header / Mobile Summary */}
          <div className="flex items-center justify-between lg:border-b lg:border-slate-100 lg:pb-3">
             <div className="flex items-center gap-3 lg:gap-2">
                <div className="w-10 h-10 lg:w-8 lg:h-8 bg-indigo-50 rounded-xl lg:rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles size={20} className="lg:w-4 lg:h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Koç Tonu</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Asistanın iletişim dilini seçin.</p>
                  <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                    Aktif Ton: {
                      formData.ai_coach_tone === 'professional' ? 'Profesyonel' :
                      formData.ai_coach_tone === 'friendly' ? 'Dostça' :
                      formData.ai_coach_tone === 'motivational' ? 'Motivasyonel' :
                      'Direkt'
                    }
                  </p>
                </div>
             </div>
             <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
             <button 
               onClick={(e) => { e.stopPropagation(); setSelectedPanel("aiTone"); }}
               className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
             >
               Düzenle
             </button>
          </div>
          
          {/* Desktop Details */}
          <div className="hidden lg:block space-y-3 mt-4">
             <div className="flex flex-col">
               <span className="block text-[10px] text-slate-400 mb-0.5">Aktif Ton</span>
               <span className="text-[11px] font-bold text-slate-700">
                 {
                   formData.ai_coach_tone === 'professional' ? 'Profesyonel' :
                   formData.ai_coach_tone === 'friendly' ? 'Dostça' :
                   formData.ai_coach_tone === 'motivational' ? 'Motivasyonel' :
                   'Direkt'
                 }
               </span>
               <span className="text-[10px] text-slate-500 mt-1">
                 {
                   formData.ai_coach_tone === 'professional' ? 'Resmi ve net iletişim.' :
                   formData.ai_coach_tone === 'friendly' ? 'Samimi ve destekleyici iletişim.' :
                   formData.ai_coach_tone === 'motivational' ? 'Enerjik ve motive edici iletişim.' :
                   'Net ve doğrudan iletişim.'
                 }
               </span>
             </div>
          </div>
        </Card>

        {/* Çalışma Disiplini Arşivi */}
        <Card className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 transition-colors">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-start sm:items-center gap-3 lg:gap-2">
              <div className="w-10 h-10 lg:w-8 lg:h-8 bg-indigo-50 rounded-xl lg:rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                <Check size={20} className="lg:w-4 lg:h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Çalışma Disiplini Arşivi</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 lg:text-[12px] line-clamp-1">Mesai dışı hareketler (Erken başlama / Erken kapanış / Kapanmayan gün) listesi.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {isDisciplineLoading ? (
              <div className="text-xs text-slate-400">Yükleniyor...</div>
            ) : disciplineLogs.length > 0 ? (
              disciplineLogs.map(log => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.actual_time).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[13px] font-bold text-slate-700">
                      {log.type === 'early_start' ? 'Erken Başlangıç' : 
                       log.type === 'early_close' ? 'Erken Kapanış' : 
                       log.type === 'missed_close_penalty' ? 'Kapatılmayan Gün' : log.type}
                    </span>
                    {log.reason && <span className="text-xs text-slate-500 mt-1">{log.reason}</span>}
                  </div>
                  {log.xp_delta && log.xp_delta !== 0 && (
                    <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md">
                      {log.xp_delta} XP
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic">Hiç disiplin kaydı bulunmuyor.</div>
            )}
          </div>
        </Card>

        {/* Bildirim Tercihi & Bölge Ayarları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Bildirim Tercihi */}
           <Card 
             onClick={() => setSelectedPanel("notifications")}
             className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors relative"
           >
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPanel("notifications"); }}
                className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Düzenle
              </button>
              <div className="flex justify-between items-center lg:border-b lg:border-slate-100 lg:pb-3">
                 <div className="flex items-center gap-3 lg:gap-2">
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <Sparkles size={20} className="lg:w-4 lg:h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Bildirim Tercihleri</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Bildirim tercihlerini ve kanal ayarlarını yönet.</p>
                      <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                        {isNotificationsLoading 
                          ? 'Yükleniyor...' 
                          : `${notificationPreferences.filter(p => p.in_app).length}/5 açık`}
                      </p>
                    </div>
                 </div>
                 <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
              </div>

              <div className="hidden lg:block space-y-3 mt-4">
                {isNotificationsLoading ? (
                   <div className="text-xs text-slate-400">Yükleniyor...</div>
                ) : notificationPreferences.map(pref => {
                   const isActive = pref.in_app;
                   const labelMap: Record<string, string> = {
                     new_lead: 'Yeni Lead Bildirimleri',
                     price_revision: 'Fiyat Revizyonu Uyarıları',
                     ai_recommendation: 'AI Önerileri',
                     market_report: 'Pazar & Bölge Raporları',
                     system_announcement: 'Sistem Duyuruları'
                   };
                   const freqMap: Record<string, string> = {
                     instant: 'Anlık',
                     daily: 'Günlük',
                     weekly: 'Haftalık',
                     never: 'Asla'
                   };
                   const isUpdating = updatingNotificationType === pref.type;

                   return (
                   <div key={pref.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-700">{labelMap[pref.type] || pref.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] text-slate-400">{freqMap[pref.frequency] || pref.frequency}</span>
                         <div 
                           onClick={async () => {
                              if (!profile?.id) return;
                              const newValue = !isActive;
                              setUpdatingNotificationType(pref.type);
                              
                              setNotificationPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, in_app: newValue } : p));
                              
                              try {
                                await updateNotificationPreference(profile.id, pref.type, { in_app: newValue });
                              } catch {
                                setNotificationPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, in_app: !newValue } : p));
                                alert("Bildirim tercihi güncellenemedi.");
                              } finally {
                                setUpdatingNotificationType(null);
                              }
                           }}
                           className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors duration-200 ${isActive ? 'bg-indigo-500' : 'bg-slate-200'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all duration-200 shadow-sm ${isActive ? 'right-1' : 'left-1'}`} />
                         </div>
                      </div>
                   </div>
                )})}
              </div>
           </Card>

           {/* Bölge Ayarları */}
           <Card 
             onClick={() => setShowRegionSetup(true)}
             className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors relative"
           >
              {/* Desktop Edit Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowRegionSetup(true); }}
                className="hidden lg:block absolute top-4 right-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Düzenle
              </button>
              
              <div className="flex justify-between items-center lg:border-b lg:border-slate-100 lg:pb-3">
                 <div className="flex items-center gap-3 lg:gap-2">
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <MapPin size={20} className="lg:w-4 lg:h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Bölge Ayarları</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Çalışma bölgelerini ve alan tercihlerini yönet.</p>
                      <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                        {profile?.region ? profile.region.district : 'Bölge kurulumu yapılmadı'}
                      </p>
                    </div>
                 </div>
                 <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
              </div>

              <div className="hidden lg:block mt-4">
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-slate-500">Birincil Bölge</span>
                     <span className="text-[11px] font-bold text-slate-900">{profile?.region ? profile.region.district : 'Bölge kurulumu yapılmadı'}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-slate-500">İkincil Bölgeler</span>
                     <span className="text-[11px] font-bold text-slate-900">{profile?.region?.neighborhoods?.length ? profile.region.neighborhoods.slice(0,3).join(', ') + (profile.region.neighborhoods.length > 3 ? '...' : '') : 'Eklenmedi'}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-slate-500">Raporlama Bölgesi</span>
                     <span className="text-[11px] font-bold text-slate-900">{profile?.region ? `${profile.region.city} / ${profile.region.district}` : 'Eklenmedi'}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-slate-500">Para Birimi</span>
                     <span className="text-[11px] font-bold text-slate-900">₺ (TRY)</span>
                   </div>
                </div>
                <button 
                  onClick={() => setShowRegionSetup(true)}
                  className="w-full mt-5 py-2.5 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={14} /> Bölge Kurulumu
                </button>
              </div>
           </Card>
        </div>

        {/* Entegrasyonlar ve Hesap & Güvenlik */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            onClick={() => setSelectedPanel("integrations")}
            className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors relative"
          >
            <div className="flex justify-between items-center lg:border-b lg:border-slate-100 lg:pb-3">
               <div className="flex items-center gap-3 lg:gap-2">
                  <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black">
                    S
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Entegrasyonlar</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Hesaplarını ve araçlarını yönet.</p>
                    <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5 flex items-center gap-2">
                      <span className="font-bold">{brokerAccount ? '1/3' : '0/3'}</span> bağlı
                      <span className="flex gap-1 ml-1">
                         <span className="w-4 h-4 rounded-sm bg-yellow-100 text-yellow-600 flex items-center justify-center text-[8px] font-bold">S</span>
                         <span className="w-4 h-4 rounded-sm bg-red-50 text-red-500 flex items-center justify-center text-[8px] font-bold">G</span>
                         <span className="w-4 h-4 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-bold">f</span>
                      </span>
                    </p>
                  </div>
               </div>
               <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
            </div>

            <div className="hidden lg:block mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-[16px] bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 font-black">S</div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                        Sahibinden
                        {brokerAccount ? <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">Bağlı</span> : null}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate w-32 sm:w-48">
                         {brokerAccount ? (brokerAccount.store_name || "Bağlı hesap") : 'Kurulum Bekliyor'}
                      </div>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setShowIntegrationModal?.(true); }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                 >
                    Yönet
                 </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-[16px] bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 font-bold">G</div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                        Google
                      </div>
                      <div className="text-[10px] text-slate-500">
                         Bağlı değil
                      </div>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedPanel("integrations"); }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                 >
                    Yönet
                 </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-[16px] bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">f</div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 flex items-center gap-2">
                        Facebook
                      </div>
                      <div className="text-[10px] text-slate-500">
                         Bağlı değil
                      </div>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedPanel("integrations"); }}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                 >
                    Yönet
                 </button>
              </div>
            </div>
          </Card>

          <Card 
            onClick={() => setSelectedPanel("security")}
            className="rounded-[24px] p-5 sm:p-6 shadow-sm border border-slate-100 cursor-pointer lg:cursor-auto hover:bg-slate-50 lg:hover:bg-white transition-colors relative"
          >
            <div className="flex justify-between items-center lg:border-b lg:border-slate-100 lg:pb-3">
               <div className="flex items-center gap-3 lg:gap-2">
                  <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-xl lg:rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="lg:w-4 lg:h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Hesap & Güvenlik</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 lg:hidden line-clamp-1 pr-4">Şifre ve iki faktörlü doğrulamayı yönet.</p>
                    <p className="text-[10px] text-slate-400 lg:hidden line-clamp-1 pr-4 mt-0.5">
                      {profile?.email || '-'}
                    </p>
                  </div>
               </div>
               <ArrowRight size={18} className="text-slate-300 lg:hidden shrink-0" />
            </div>

            <div className="hidden lg:block mt-4">
               <div className="space-y-3">
                 <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-700">E-Posta</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[200px]">{profile?.email || '-'}</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className="text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-700">Şifre</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-400 hidden sm:block">Durum bilgisi yok</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handlePasswordReset(); }}
                         disabled={isSendingPasswordReset}
                         className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isSendingPasswordReset ? "Gönderiliyor..." : "Değiştir"}
                       </button>
                    </div>
                 </div>

                 <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className="text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-700">İki Faktörlü Doğrulama</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-400 hidden sm:block">Durum bilgisi yok</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedPanel("security"); }}
                         className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600"
                       >
                         Aktif Et
                       </button>
                    </div>
                 </div>

                 <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-slate-400" />
                       <span className="text-[11px] font-bold text-slate-700">Oturumlar</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-slate-400 hidden sm:block">Oturum bilgisi yok</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedPanel("security"); }}
                         className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600"
                       >
                         Görüntüle
                       </button>
                    </div>
                 </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Admin Card */}
        {profile?.role === "admin" && (
          <Card
            className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border border-purple-100 group rounded-[24px] p-5 sm:p-6 shadow-sm"
            onClick={() => setShowAdminPanel(true)}
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 transition-transform group-hover:scale-105 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">
                Yönetim Paneli
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Kullanıcıları ve sistem ayarlarını yönet
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-slate-300 group-hover:translate-x-1 group-hover:text-purple-500 transition-all shrink-0"
            />
          </Card>
        )}
      </div>

      {/* Çıkış Yap */}
      <div className="pt-2 flex justify-center w-full">
        <button
          onClick={logout}
          className="w-full sm:w-auto sm:px-16 p-4 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-[20px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all border border-rose-100 shadow-sm active:scale-[0.98] outline-none"
        >
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>

      <AnimatePresence>
        {selectedPanel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden pointer-events-auto"
          >
            <motion.div
              onClick={() => setSelectedPanel(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden max-h-[90dvh] h-[90dvh] sm:h-auto sm:max-h-[85dvh] sm:max-w-lg"
            >
              <header className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedPanel === "profile" && "Profil Bilgileri"}
                    {selectedPanel === "expertise" && "Uzmanlık Alanları"}
                    {selectedPanel === "workingStyle" && "Çalışma Stili"}
                    {selectedPanel === "aiTone" && "AI Koç Tonu"}
                    {selectedPanel === "notifications" && "Bildirim Tercihleri"}
                    {selectedPanel === "integrations" && "Entegrasyonlar"}
                    {selectedPanel === "security" && "Hesap & Güvenlik"}
                    {selectedPanel === "plan" && "Plan Yönetimi"}
                    {selectedPanel === "aiUsage" && "AI Kullanımı"}
                    {selectedPanel === "completion" && "Profil Eksikleri"}
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-1">
                    {selectedPanel === "profile" && "Kişisel bilgilerinizi güncelleyin."}
                    {selectedPanel === "expertise" && "Çalıştığınız alanları seçin."}
                    {selectedPanel === "workingStyle" && "Çalışma saatlerinizi belirleyin."}
                    {selectedPanel === "aiTone" && "AI asistanınızın tonunu seçin."}
                    {selectedPanel === "notifications" && "Hangi konularda bildirim almak istediğinizi ayarlayın."}
                    {selectedPanel === "integrations" && "Bağlantılı araçlarınızı yönetin."}
                    {selectedPanel === "security" && "Giriş ve güvenlik ayarları."}
                    {selectedPanel === "plan" && "Abonelik planınızı görün."}
                    {selectedPanel === "aiUsage" && "Token kullanım detaylarınız."}
                    {selectedPanel === "completion" && "Düzeltilmesi/eklenmesi gereken bilgiler."}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPanel(null)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </header>

              <section className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-4" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
                {selectedPanel === "profile" && (
                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Ad Soyad</label>
                      <input 
                        type="text" 
                        placeholder="Eklenmedi"
                        value={formData.display_name} 
                        onChange={(e) => setFormData(p => ({ ...p, display_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Telefon</label>
                      <input 
                        type="tel" 
                        placeholder="Telefon"
                        value={formData.phone} 
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Unvan</label>
                      <input 
                        type="text" 
                        placeholder="Unvan"
                        value={formData.title} 
                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Firma</label>
                      <input 
                        type="text" 
                        placeholder="Firma"
                        value={formData.company_name} 
                        onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Şehir</label>
                      <input 
                        type="text" 
                        placeholder="Şehir"
                        value={formData.city} 
                        onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">İlçe</label>
                      <input 
                        type="text" 
                        placeholder="İlçe"
                        value={formData.district} 
                        onChange={(e) => setFormData(p => ({ ...p, district: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="WhatsApp"
                        value={formData.whatsapp} 
                        onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Instagram</label>
                      <input 
                        type="text" 
                        placeholder="Instagram"
                        value={formData.instagram} 
                        onChange={(e) => setFormData(p => ({ ...p, instagram: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Website</label>
                      <input 
                        type="text" 
                        placeholder="Website"
                        value={formData.website} 
                        onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Biyografi</label>
                      <textarea 
                        value={formData.bio} 
                        placeholder="Eklenmedi"
                        onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                {selectedPanel === "expertise" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                       {['Konut', 'Ticari', 'Arsa', 'Lüks Konut', 'Satılık', 'Kiralık', 'Yatırım', 'Fabrika/Depo'].map(item => {
                         const isSelected = formData.expertise_areas.includes(item);
                         return (
                           <button
                             key={item}
                             onClick={() => {
                               setFormData(p => ({
                                 ...p,
                                 expertise_areas: isSelected 
                                   ? p.expertise_areas.filter(t => t !== item)
                                   : [...p.expertise_areas, item]
                               }))
                             }}
                             className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                           >
                             {item}
                           </button>
                         )
                       })}
                    </div>
                  </div>
                )}

                {selectedPanel === "workingStyle" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-2">Mesai Başlangıç Saati</label>
                        <input 
                          type="time" 
                          value={formData.work_start_time || formData.preferred_start_time} 
                          onChange={(e) => setFormData(p => ({ ...p, work_start_time: e.target.value, preferred_start_time: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-2">Mesai Bitiş Saati</label>
                        <input 
                          type="time" 
                          value={formData.work_end_time} 
                          onChange={(e) => setFormData(p => ({ ...p, work_end_time: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-2">Çalışma Etiketleri</label>
                      <div className="flex flex-wrap gap-2">
                         {['Tam Zamanlı', 'Yarı Zamanlı', 'Hafta Sonu', 'Esnek Saatler', 'Saha Odaklı', 'Ofis Odaklı'].map(item => {
                           const isSelected = formData.working_style.includes(item);
                           return (
                             <button
                               key={item}
                               onClick={() => {
                                 setFormData(p => ({
                                   ...p,
                                   working_style: isSelected 
                                     ? p.working_style.filter(t => t !== item)
                                     : [...p.working_style, item]
                                 }))
                               }}
                               className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${isSelected ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                             >
                               {item}
                             </button>
                           )
                         })}
                      </div>
                    </div>
                  </div>
                )}

                {selectedPanel === "aiTone" && (
                  <div className="space-y-3">
                     {[
                        { id: 'professional', legacyIds: ['professional', 'profesyonel'], title: 'Profesyonel', desc: 'Resmi ve net iletişim' },
                        { id: 'friendly', legacyIds: ['friendly', 'dostca', 'motive_edici'], title: 'Dostça', desc: 'Samimi ve destekleyici' },
                        { id: 'motivational', legacyIds: ['motivational', 'motivasyonel'], title: 'Motivasyonel', desc: 'Enerjik ve motive edici' },
                        { id: 'direct', legacyIds: ['net', 'sert_koc', 'direct'], title: 'Direkt', desc: 'Sadece sonuç odaklı ve keskin' }
                     ].map(tone => {
                         const currentTone = formData.ai_coach_tone || 'direct';
                         const isActive = tone.id === currentTone || tone.legacyIds.includes(currentTone);
                         return (
                           <button
                             key={tone.id}
                             onClick={() => {
                                setFormData(p => ({ ...p, ai_coach_tone: tone.id }));
                             }}
                             className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between ${isActive ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                           >
                              <div>
                                <div className={`font-bold text-sm mb-1 ${isActive ? "text-indigo-900" : "text-slate-900"}`}>{tone.title}</div>
                                <div className={`text-[11px] ${isActive ? 'text-indigo-700/80' : 'text-slate-500'}`}>{tone.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? 'border-indigo-500' : 'border-slate-300'}`}>
                                 {isActive && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                              </div>
                           </button>
                         )
                     })}
                  </div>
                )}

                {selectedPanel === "notifications" && (
                  <div className="space-y-4">
                     <div className="space-y-3 pt-2">
                       {isNotificationsLoading ? (
                          <div className="text-sm text-slate-500 text-center py-4">Yükleniyor...</div>
                       ) : notificationPreferences.map(pref => {
                          const isActive = pref.in_app;
                          const labelMap: Record<string, string> = {
                            new_lead: 'Yeni Lead Bildirimleri',
                            price_revision: 'Fiyat Revizyonu Uyarıları',
                            ai_recommendation: 'AI Önerileri',
                            market_report: 'Pazar & Bölge Raporları',
                            system_announcement: 'Sistem Duyuruları'
                          };
                          const freqMap: Record<string, string> = {
                            instant: 'Anlık',
                            daily: 'Günlük',
                            weekly: 'Haftalık',
                            never: 'Asla'
                          };
                          const isUpdating = updatingNotificationType === pref.type;

                          return (
                          <div key={pref.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                             <div>
                               <div className="text-sm font-bold text-slate-700">{labelMap[pref.type] || pref.type}</div>
                               <div className="text-[10px] text-slate-400 mt-0.5">{freqMap[pref.frequency] || pref.frequency}</div>
                             </div>
                             <div 
                               onClick={async () => {
                                  if (!profile?.id) return;
                                  const newValue = !isActive;
                                  setUpdatingNotificationType(pref.type);
                                  
                                  setNotificationPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, in_app: newValue } : p));
                                  
                                  try {
                                    await updateNotificationPreference(profile.id, pref.type, { in_app: newValue });
                                  } catch {
                                    setNotificationPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, in_app: !newValue } : p));
                                    alert("Bildirim tercihi güncellenemedi.");
                                  } finally {
                                    setUpdatingNotificationType(null);
                                  }
                               }}
                               className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-200 shadow-inner ${isActive ? 'bg-indigo-500' : 'bg-slate-200'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                             >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-sm ${isActive ? 'right-1' : 'left-1'}`} />
                             </div>
                          </div>
                       )})}
                     </div>
                  </div>
                )}

                {selectedPanel === "integrations" && (
                   <div className="space-y-4">
                     {/* Sahibinden */}
                     <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 font-black text-lg">S</div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">Sahibinden</div>
                              <div className="text-[11px] text-slate-500">{brokerAccount ? (brokerAccount.store_name || "Bağlı hesap") : 'Kurulum Bekliyor'}</div>
                           </div>
                        </div>
                        <button 
                           onClick={() => { setShowIntegrationModal?.(true); setSelectedPanel(null); }}
                           className={`px-4 py-2 rounded-xl text-[11px] font-bold ${brokerAccount ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'} transition-colors`}
                        >
                           {brokerAccount ? 'Yönet' : 'Bağla'}
                        </button>
                     </div>

                     {/* Google */}
                     <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between opacity-60 grayscale hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">G</div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">Google Takvim</div>
                              <div className="text-[11px] text-slate-500">Kurulum sonraki sürümde</div>
                           </div>
                        </div>
                        <button className="px-4 py-2 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                           Bağla
                        </button>
                     </div>

                     {/* Facebook */}
                     <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between opacity-60 grayscale hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">f</div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">Facebook Meta</div>
                              <div className="text-[11px] text-slate-500">Kurulum sonraki sürümde</div>
                           </div>
                        </div>
                        <button className="px-4 py-2 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                           Bağla
                        </button>
                     </div>
                   </div>
                )}

                {selectedPanel === "security" && (
                   <div className="space-y-4">
                      {passwordResetMessage && (
                        <div className={`p-3 rounded-xl border text-[11px] font-medium ${
                          passwordResetStatus === "success" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {passwordResetMessage}
                        </div>
                      )}
                      <div className="p-4 border border-slate-200 rounded-2xl">
                         <div className="text-[11px] text-slate-400 mb-1">Kayıtlı E-Posta</div>
                         <div className="text-sm font-bold text-slate-900">{profile?.email || '-'}</div>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-slate-900">Şifre</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Son güncelleme bilinmiyor</div>
                         </div>
                         <button 
                           onClick={handlePasswordReset}
                           disabled={isSendingPasswordReset}
                           className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           {isSendingPasswordReset ? "Gönderiliyor..." : "Şifre sıfırlama bağlantısı gönder"}
                         </button>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-slate-900">İki Faktörlü Doğrulama</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">İki faktörlü doğrulama sonraki sürümde aktif edilecek.</div>
                         </div>
                         <button className="px-3 py-1.5 bg-slate-100/50 text-slate-400 rounded-lg text-[11px] font-bold cursor-not-allowed">Aktif Et</button>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                         <div>
                            <div className="text-sm font-bold text-slate-900">Oturumlar</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Oturum yönetimi sonraki sürümde detaylandırılacak.</div>
                         </div>
                         <button className="px-3 py-1.5 bg-slate-100/50 text-slate-400 rounded-lg text-[11px] font-bold cursor-not-allowed">Yönet</button>
                      </div>
                   </div>
                )}

                {selectedPanel === "plan" && (
                   <div className="text-center py-6 space-y-5">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                         <CreditCard size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 capitalize">{planStatusText}</h4>
                        <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-2">
                           {profile?.subscription_end_date ? `Yenileme: ${new Date(profile.subscription_end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric'})}` : "Tarih bilgisi yok"}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSelectedPanel(null); // kapat
                          window.dispatchEvent(new Event('open-upgrade-modal'));
                        }}
                        className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors w-full sm:w-auto"
                      >
                         Planı Yükselt
                      </button>
                   </div>
                )}

                {selectedPanel === "aiUsage" && (
                   <div className="text-center py-6 space-y-4">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Sparkles size={32} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900">AI Kullanım Detayı</h4>
                      {getEffectiveAiTokenLimit(profile) > 0 ? (
                         <div className="space-y-2 mt-6">
                            <div className="flex justify-between text-sm font-bold text-slate-700">
                               <span>Kullanılan: {profile.ai_tokens_used || 0}</span>
                               <span>Limit: {getEffectiveAiTokenLimit(profile)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                               <div 
                                 className="bg-blue-500 rounded-full h-3" 
                                 style={{ width: `${Math.min(((profile.ai_tokens_used || 0) / Math.max(getEffectiveAiTokenLimit(profile), 1)) * 100, 100)}%` }} 
                               />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">Token kullanımınız bir sonraki fatura döneminde sıfırlanacaktır.</p>
                         </div>
                      ) : (
                         <p className="text-sm text-slate-500">Aboneliğiniz kapsamında detaylı kullanım verisi bulunmuyor.</p>
                      )}
                   </div>
                )}

                {selectedPanel === "completion" && (
                   <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center py-4">
                         <div className="text-4xl font-black text-indigo-600 mb-2">%{clampedScore}</div>
                         <div className="w-full max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${clampedScore}%` }} />
                         </div>
                         <div className="text-xs text-slate-500 mt-3">{scoreMessage}</div>
                      </div>
                      <div className="space-y-2 mt-4">
                         <h5 className="text-sm font-bold border-b border-slate-100 pb-2">Tamamlanması Gerekenler:</h5>
                         {!formData.display_name && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Ad Soyad eksik <button onClick={() => setSelectedPanel("profile")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {!formData.phone && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Telefon eksik <button onClick={() => setSelectedPanel("profile")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {!formData.bio && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Biyografi eksik <button onClick={() => setSelectedPanel("profile")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {(!formData.city && !formData.district) && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Açık Adres bilgisi eksik <button onClick={() => setSelectedPanel("profile")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {(!profile?.region?.city && !profile?.region?.district) && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Bölge Kurulumu yapılmadı <button onClick={() => { setShowRegionSetup(true); setSelectedPanel(null); }} className="text-xs font-bold underline">Düzenle</button></div>}
                         {(!formData.company_name && !formData.title) && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Firma/Unvan eksik <button onClick={() => setSelectedPanel("profile")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {(formData.expertise_areas.length === 0) && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Uzmanlık Alanları eksik <button onClick={() => setSelectedPanel("expertise")} className="text-xs font-bold underline">Düzenle</button></div>}
                         {(!brokerAccount) && <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 flex items-center justify-between">Hiçbir entegrasyon bağlı değil <button onClick={() => setSelectedPanel("integrations")} className="text-xs font-bold underline">Bağla</button></div>}
                         {clampedScore === 100 && <div className="text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 flex items-center font-bold"><Check size={18} className="mr-2"/> Harika, profilin tamamen dolu!</div>}
                      </div>
                   </div>
                )}
              </section>

              {['profile', 'expertise', 'workingStyle', 'aiTone'].includes(selectedPanel) && (
                <footer className="shrink-0 border-t border-slate-100 bg-white px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                  <button
                    disabled={updateProfileMutation.isPending}
                    onClick={() => {
                       if (!profile?.id) return;
                       let dataToSave = {};
                       if (selectedPanel === "profile") {
                          dataToSave = {
                             display_name: formData.display_name,
                             phone: formData.phone,
                             title: formData.title,
                             company_name: formData.company_name,
                             city: formData.city,
                             district: formData.district,
                             whatsapp: formData.whatsapp,
                             instagram: formData.instagram,
                             website: formData.website,
                             bio: formData.bio
                          };
                       } else if (selectedPanel === "expertise") {
                          dataToSave = { expertise_areas: formData.expertise_areas };
                       } else if (selectedPanel === "workingStyle") {
                          dataToSave = { working_style: formData.working_style, preferred_start_time: formData.work_start_time || formData.preferred_start_time, work_start_time: formData.work_start_time, work_end_time: formData.work_end_time };
                       } else if (selectedPanel === "aiTone") {
                          dataToSave = { ai_coach_tone: formData.ai_coach_tone };
                       }
                       
                       updateProfileMutation.mutate({ id: profile.id, data: dataToSave });
                    }}
                    className={`w-full py-4 rounded-[16px] font-bold text-sm transition-all focus:ring-4 focus:ring-indigo-100 text-white ${updateProfileMutation.isPending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.35)] -translate-y-0.5'}`}
                  >
                    {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </footer>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
