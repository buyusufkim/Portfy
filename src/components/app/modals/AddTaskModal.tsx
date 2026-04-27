import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Phone,
  Users,
  MapPin,
  Calendar,
  Clock,
  Bookmark,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Property, Lead, Task, PersonalTask } from "../../../types";
import toast from "react-hot-toast";
import { getTodayStr } from "../../../services/core/utils";

type TaskMode = "work" | "followup" | "personal" | "activity" | "content";
type ContentType = "reels" | "post" | "story" | "ilan_metni" | "genel";
type ContentPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "diger";

const isContentType = (value: string): value is ContentType =>
  ["reels", "post", "story", "ilan_metni", "genel"].includes(value);

const isContentPlatform = (value: string): value is ContentPlatform =>
  ["instagram", "facebook", "tiktok", "linkedin", "diger"].includes(value);

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Task, "id" | "user_id">) => Promise<void> | void;
  onSubmitPersonal?: (
    data: Omit<PersonalTask, "id" | "user_id" | "created_at">,
  ) => Promise<void> | void;
  properties: Property[];
  leads: Lead[];
  initialPropertyId?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSubmitPersonal,
  properties,
  leads,
  initialPropertyId,
}) => {
  const [taskMode, setTaskMode] = useState<TaskMode>("work");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "Arama" as
      | "Arama"
      | "Randevu"
      | "Saha"
      | "Takip"
      | "Güncelleme"
      | "Sosyal Medya"
      | "İçerik",
    property_id: initialPropertyId || "",
    lead_id: "",
    notes: "",
    due_date: getTodayStr(),
    time: "",
    priority: "medium" as "low" | "medium" | "high",
    completed: false,
    content_type: "reels" as ContentType,
    platform: "instagram" as ContentPlatform,
  });

  if (!isOpen) return null;

  const handleModeChange = (mode: TaskMode) => {
    setTaskMode(mode);
    setFormData((prev) => ({
      ...prev,
      type:
        mode === "followup" ? "Takip" : mode === "content" ? "İçerik" : "Arama",
      completed: mode === "activity",
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Başlık gerekli");
      return;
    }

    setIsSubmitting(true);
    let success = true;

    try {
      if (taskMode === "personal") {
        if (onSubmitPersonal) {
          let reminderTimeStr = undefined;
          if (formData.time) {
            const dueDate = formData.due_date || getTodayStr();
            reminderTimeStr = new Date(
              `${dueDate}T${formData.time}:00`,
            ).toISOString();
          }

          await onSubmitPersonal({
            title: formData.title,
            notes: formData.notes,
            priority: formData.priority,
            due_date: formData.due_date || getTodayStr(),
            reminder_time: reminderTimeStr,
            is_completed: formData.completed,
            notified: false,
          });
        }
      } else {
        const metadata =
          taskMode === "content"
            ? {
                content_type: formData.content_type,
                platform: formData.platform,
                property_id: formData.property_id || undefined,
              }
            : {};

        let scheduledAt = formData.due_date
          ? new Date(formData.due_date).toISOString()
          : new Date().toISOString();
        if (formData.due_date && formData.time) {
          scheduledAt = new Date(
            `${formData.due_date}T${formData.time}:00`,
          ).toISOString();
        }

        await onSubmit({
          title: formData.title,
          type: formData.type,
          property_id: formData.property_id || undefined,
          lead_id: formData.lead_id || undefined,
          notes: formData.notes,
          due_date: formData.due_date || getTodayStr(),
          time: scheduledAt,
          completed: formData.completed,
          source: taskMode === "content" ? "content" : undefined,
          metadata,
        });
      }
    } catch (error) {
      success = false;
    } finally {
      setIsSubmitting(false);
    }

    if (success) {
      setFormData({
        title: "",
        type: "Arama",
        property_id: initialPropertyId || "",
        lead_id: "",
        notes: "",
        due_date: getTodayStr(),
        time: "",
        priority: "medium",
        completed: false,
        content_type: "reels",
        platform: "instagram",
      });
      setTaskMode("work");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 max-h-[90vh] overflow-auto shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Görev / Hatırlatıcı Ekle
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
              <button
                onClick={() => handleModeChange("work")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${taskMode === "work" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                İş Görevi
              </button>
              <button
                onClick={() => handleModeChange("followup")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${taskMode === "followup" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Takip
              </button>
              <button
                onClick={() => handleModeChange("content")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${taskMode === "content" ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                İçerik / Reels
              </button>
              <button
                onClick={() => handleModeChange("personal")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${taskMode === "personal" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Kişisel Hatırlatıcı
              </button>
              <button
                onClick={() => handleModeChange("activity")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${taskMode === "activity" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Aktivite Kaydı
              </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Başlık
                </label>
                <input
                  type="text"
                  placeholder={
                    taskMode === "personal"
                      ? "Örn: Eve dönerken yoğurt al"
                      : "Örn: Portföy hakkında bilgi verildi"
                  }
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              {taskMode !== "personal" && taskMode !== "content" && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, type: "Arama" })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${formData.type === "Arama" ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  >
                    <Phone size={18} />
                    <span className="text-[10px] font-bold">Arama</span>
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, type: "Randevu" })
                    }
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${formData.type === "Randevu" ? "border-sky-500 bg-sky-50 text-sky-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  >
                    <Users size={18} />
                    <span className="text-[10px] font-bold">Randevu</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: "Saha" })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${formData.type === "Saha" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  >
                    <MapPin size={18} />
                    <span className="text-[10px] font-bold">Gösterme</span>
                  </button>
                </div>
              )}

              {taskMode === "personal" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Öncelik
                  </label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() =>
                          setFormData({ ...formData, priority: p })
                        }
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border-2 ${
                          formData.priority === p
                            ? p === "high"
                              ? "border-red-500 bg-red-50 text-red-600"
                              : p === "medium"
                                ? "border-orange-500 bg-orange-50 text-orange-600"
                                : "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-slate-100 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {p === "high"
                          ? "Yüksek"
                          : p === "medium"
                            ? "Orta"
                            : "Düşük"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {taskMode === "content" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      İçerik Türü
                    </label>
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                      value={formData.content_type}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isContentType(value))
                          setFormData({ ...formData, content_type: value });
                      }}
                    >
                      <option value="reels">Reels Videosu</option>
                      <option value="post">Gönderi (Post)</option>
                      <option value="story">Hikaye (Story)</option>
                      <option value="ilan_metni">İlan Metni</option>
                      <option value="genel">Genel Fikir</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Platform
                    </label>
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                      value={formData.platform}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isContentPlatform(value))
                          setFormData({ ...formData, platform: value });
                      }}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="facebook">Facebook</option>
                      <option value="diger">Diğer</option>
                    </select>
                  </div>
                </div>
              )}

              {taskMode !== "personal" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {taskMode === "activity"
                        ? "İlgili Portföy"
                        : "İlgili Portföy (Opsiyonel)"}
                    </label>
                    <select
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                      value={formData.property_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          property_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Seçiniz...</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {taskMode !== "content" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {taskMode === "followup"
                          ? "İlgili Müşteri"
                          : "İlgili Müşteri (Opsiyonel)"}
                      </label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                        value={formData.lead_id}
                        onChange={(e) =>
                          setFormData({ ...formData, lead_id: e.target.value })
                        }
                      >
                        <option value="">Seçiniz...</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarih
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                {(taskMode === "personal" || taskMode === "content") && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Saat
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none transition-colors"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Notlar
                </label>
                <textarea
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-slate-400 outline-none h-24 transition-colors"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div
                className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 cursor-pointer"
                onClick={() =>
                  setFormData({ ...formData, completed: !formData.completed })
                }
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${formData.completed ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`}
                >
                  {formData.completed && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700">
                    Tamamlandı mı?
                  </div>
                  <div className="text-xs text-slate-500">
                    {formData.completed
                      ? "Evet, işaretlendi."
                      : "Hayır, bekliyor."}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSubmitting
                  ? "Kayıt ediliyor..."
                  : taskMode === "personal"
                    ? "Hatırlatıcı Oluştur"
                    : "Görev Kaydet"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
