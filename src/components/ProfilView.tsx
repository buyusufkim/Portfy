import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldCheck,
  ArrowRight,
  CreditCard,
  Globe,
  ExternalLink,
  Plus,
  RefreshCw,
  LogOut,
  MapPin,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import {
  UserProfile,
  BrokerAccount,
  MutationResult,
  ExternalListing,
} from "../types";
import { Card, Badge } from "./UI";

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
  setShowExternalListings,
  setShowIntegrationModal,
  syncListingsMutation,
  updateProfileMutation,
  setShowRegionSetup,
}) => {
  const isPassive =
    !profile?.subscription_type ||
    profile.subscription_type === "none" ||
    (profile.subscription_end_date &&
      new Date(profile.subscription_end_date) < new Date());

  const planStatus = isPassive
    ? "Ücretsiz"
    : profile?.subscription_type === "trial"
      ? "Deneme"
      : "Premium";

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
    ai_coach_tone: profile?.ai_coach_tone || "net",
    notification_preference: profile?.notification_preference || "normal",
  });

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
        ai_coach_tone: profile.ai_coach_tone || "net",
        notification_preference: profile.notification_preference || "normal",
      });
    }
  }, [profile]);

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

  const toggleArrayItem = (key: 'expertise_areas' | 'working_style', value: string) => {
    setFormData(prev => {
      const arr = prev[key];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(i => i !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  };

  const EXPERTISE_OPTIONS = ["Konut", "Ticari", "Arsa", "Lüks Konut", "Kiralık", "Satılık", "Yatırım", "Fabrika/Depo"];
  const WORKING_STYLE_OPTIONS = ["Satılık", "Kiralık", "Bölge Uzmanı", "Portföy Avcısı", "Yatırım Danışmanı", "Ticari Danışman"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6 pb-24"
    >
      {/* Premium Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white text-center shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-slate-200 rounded-[32px] overflow-hidden border-4 border-slate-700 shadow-xl">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3">
              {isPassive ? (
                <Badge
                  variant="default"
                  className="bg-slate-700 text-white border-slate-600 shadow-lg"
                >
                  Pasif
                </Badge>
              ) : profile?.subscription_type === "trial" ? (
                <Badge variant="warning" className="shadow-lg">
                  Deneme
                </Badge>
              ) : (
                <Badge variant="success" className="shadow-lg">
                  Aktif
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-1">
            <h2 className="text-2xl font-black tracking-tight">
              {profile?.display_name || "İsimsiz Kullanıcı"}
            </h2>
            <p className="text-slate-300 font-medium">{profile?.email}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 rounded-xl text-xs font-bold text-slate-300 border border-slate-700/50">
              <ShieldCheck size={14} className="text-slate-400" />
              {profile?.role === "admin" ? "Yönetici" : "Emlak Danışmanı"}
            </div>
            {(profile?.region?.city || profile?.region?.district) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 rounded-xl text-xs font-bold text-slate-300 border border-slate-700/50">
                <MapPin size={14} className="text-slate-400" />
                {profile?.region.city}, {profile?.region.district}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Plan Durumu */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CreditCard size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Plan
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-700">
              {planStatus}
            </div>
          </div>
        </div>

        {/* AI Kullanım */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Yapay Zeka
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-700">
              {profile?.ai_token_limit !== undefined &&
              profile?.ai_token_limit !== null
                ? `${profile.ai_token_limit}`
                : "Tanımlı değil"}
            </div>
          </div>
        </div>

        {/* Entegrasyon */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-100 flex flex-col items-center justify-center text-center gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Globe size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sahibinden
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-700">
              {brokerAccount ? "Bağlı" : "Yok"}
            </div>
          </div>
        </div>
      </div>

      {/* Profil Tamamlanma Skoru */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Profil Tamamlanma</h4>
            <p className="text-xs text-slate-500 mt-1">{scoreMessage}</p>
          </div>
          <span className="text-lg font-black text-indigo-600">%{clampedScore}</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${clampedScore}%` }}></div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profil Bilgileri Form */}
        <Card className="space-y-6">
          {/* A) Temel Bilgiler */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <User size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Temel Bilgiler
                </h4>
                <p className="text-xs text-slate-500">
                  Kişisel detaylarınız
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, display_name: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="5XX XXX XX XX"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    İl
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, city: e.target.value }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="İstanbul"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, district: e.target.value }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="Kadıköy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hakkımda / Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bio: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-24"
                  placeholder="Kendinizden ve uzmanlık alanlarınızdan bahsedin..."
                />
              </div>
            </div>
          </div>

          {/* B) Danışman Kimliği */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Danışman Kimliği</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ünvan</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Lüks Konut Uzmanı"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ofis/Şirket</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="RE/MAX vs."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Hattı</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData((p) => ({ ...p, whatsapp: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="5XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="instagram.com/kullaniciadi"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Kişisel Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="https://www.isimsoyisim.com"
                />
              </div>
            </div>
          </div>

          {/* C) Uzmanlık ve Çalışma Tarzı */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Uzmanlık ve Çalışma Tarzı</h4>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Uzmanlık Alanları</label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map(exp => (
                  <button
                    key={exp}
                    onClick={() => toggleArrayItem("expertise_areas", exp)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.expertise_areas.includes(exp) 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Çalışma Tarzı</label>
              <div className="flex flex-wrap gap-2">
                {WORKING_STYLE_OPTIONS.map(sty => (
                  <button
                    key={sty}
                    onClick={() => toggleArrayItem("working_style", sty)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.working_style.includes(sty) 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Uygulama Tercihleri */}
        <Card className="space-y-4">
           <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Uygulama Tercihleri</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Güne Başlama Saati</label>
                <input
                  type="time"
                  value={formData.preferred_start_time}
                  onChange={(e) => setFormData((p) => ({ ...p, preferred_start_time: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Yapay Zeka Koç Tonu</label>
                <select
                  value={formData.ai_coach_tone}
                  onChange={(e) => setFormData((p) => ({ ...p, ai_coach_tone: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="net">Net ve Doğrudan</option>
                  <option value="motive_edici">Motive Edici</option>
                  <option value="sert_koc">Sert ve Disiplinli (Patron)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Bildirim Tercihi</label>
                <select
                  value={formData.notification_preference}
                  onChange={(e) => setFormData((p) => ({ ...p, notification_preference: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="sessiz">Sessiz (Sadece kritik uyarılar)</option>
                  <option value="normal">Normal (Günlük özet ve hatırlatmalar)</option>
                  <option value="yogun">Yoğun (Anlık takipler ve tüm bildirimler)</option>
                </select>
              </div>
           </div>
        </Card>

        <div className="pt-2">
          <button
            onClick={() => {
              if (!profile) return;
              updateProfileMutation.mutate({
                id: profile.id,
                data: formData,
              });
            }}
            disabled={!profile || updateProfileMutation.isPending}
            className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
          >
            {updateProfileMutation.isPending
              ? "Kaydediliyor..."
              : "Tüm Değişiklikleri Kaydet"}
          </button>
        </div>

        {/* Abonelik Planı Full Card */}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Abonelik Planı
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPassive
                    ? "Aktif bir aboneliğiniz bulunmuyor."
                    : profile?.subscription_type === "trial"
                      ? "Premium aboneliği 7 gün ücretsiz deneyin."
                      : "Tüm özelliklere sınırsız erişim."}
                </p>
              </div>
            </div>
            {profile?.subscription_end_date &&
              new Date(profile.subscription_end_date) >= new Date() && (
                <div className="sm:text-right bg-slate-50 p-2 sm:bg-transparent sm:p-0 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Bitiş Tarihi
                  </div>
                  <div className="text-xs font-black text-slate-700">
                    {new Date(profile.subscription_end_date).toLocaleDateString(
                      "tr-TR",
                    )}
                  </div>
                </div>
              )}
          </div>

          {isPassive && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold">
                  Premium özelliklerini keşfet
                </span>
              </div>
              <div className="px-3 py-1.5 bg-white/60 border border-amber-200/50 rounded-lg text-xs font-black text-amber-600/80">
                Yakında
              </div>
            </div>
          )}
        </Card>

        {/* Sahibinden Entegrasyonu Full Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  sahibinden.com Entegrasyonu
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {brokerAccount
                    ? `Mağaza: ${brokerAccount.store_name}`
                    : "İlanlarını tek tıkla uygulamaya çek."}
                </p>
              </div>
            </div>
          </div>

          {brokerAccount ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setShowExternalListings(true)}
                className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
              >
                <ExternalLink size={16} /> İlanları Gör
              </button>
              <button
                onClick={() => syncListingsMutation.mutate()}
                disabled={syncListingsMutation.isPending}
                className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-100 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    syncListingsMutation.isPending ? "animate-spin" : ""
                  }
                />
                Senkronize Et
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowIntegrationModal(true)}
              className="w-full p-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Plus size={16} /> Resmi API ile Bağla
            </button>
          )}
        </Card>

        {/* Çalışma Bölgesi Card */}
        <Card
          className="flex items-center justify-between cursor-pointer group hover:bg-slate-50 hover:border-indigo-100 transition-all"
          onClick={() => setShowRegionSetup(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105 shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Çalışma Bölgesi
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.region
                  ? `${profile.region.city}, ${profile.region.district}`
                  : "Bölge ayarlanmamış"}
              </p>
              {profile?.region?.neighborhoods &&
                profile.region.neighborhoods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.region.neighborhoods.map((n) => (
                      <span
                        key={n}
                        className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!profile?.region && (
              <div className="hidden sm:block px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold whitespace-nowrap">
                Bölge Kur
              </div>
            )}
            <ArrowRight
              size={20}
              className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all shrink-0"
            />
          </div>
        </Card>

        {/* Admin Card */}
        {profile?.role === "admin" && (
          <Card
            className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-purple-100 group"
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
      <div className="pt-8">
        <button
          onClick={logout}
          className="w-full p-4 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-100"
        >
          <LogOut size={18} /> Çıkış Yap
        </button>
      </div>
    </motion.div>
  );
};
