import { UserProfile, GamifiedTask, UserStats, Lead } from '../types';
import { supabase } from '../lib/supabase';
import { getUserId, getTodayStr } from './core/utils';
import { leadService } from './leadService';

// GMT+3 (Türkiye) saatiyle bugünün tarihini (YYYY-MM-DD) net olarak alır
const getTurkishTodayStr = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 3));
  return nd.toISOString().split('T')[0];
};

export const gamificationService = {
  earnXP: async (actionType: string, ids: { taskId?: string, leadId?: string, propertyId?: string, sessionId?: string } = {}, stats?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch('/api/ai/earn-xp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ actionType, ...ids, stats })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'XP update failed');
    }
  },

  getDailyGamifiedTasks: async (force: boolean = false): Promise<GamifiedTask[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const agentId = user.id;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', agentId)
        .maybeSingle();
      
      if (!profile) {
        await supabase.from('profiles').insert({
          uid: agentId,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || 'İsimsiz Danışman',
          role: 'agent'
        });
      }
      
      const today = getTurkishTodayStr();

      // 🔥 OTOMATİK SERİ (STREAK), GÜNLÜK GİRİŞ VE CEZA KONTROLÜ 🔥
      if (profile && profile.last_active_date !== today) {
        const lastActiveDateStr = profile.last_active_date;
        let newStreak = profile.current_streak || 0;
        let newTotalXp = profile.total_xp || 0;
        
        if (lastActiveDateStr) {
          const lastActiveDate = new Date(lastActiveDateStr);
          const todayDate = new Date(today);
          const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1; // Dün de girmiş, seriyi bozmadan devam et
          } else if (diffDays > 1) {
            newStreak = 1; // Dün girmemiş, seri bozuldu, baştan başla
          }

          // 🔥 GÜNÜ KAPATMAMA CEZASI 🔥
          // last_ritual_completed_at değerinin sadece tarih kısmını (YYYY-MM-DD) alıp kontrol ediyoruz
          const lastClosedDateStr = profile.last_ritual_completed_at ? profile.last_ritual_completed_at.substring(0, 10) : null;
          
          if (lastClosedDateStr !== lastActiveDateStr) {
             // Kullanıcı en son aktif olduğu gün 'Günü Kapat' butonuna basmamış!
             newTotalXp = Math.max(0, newTotalXp - 50); // Puanı 50 düşür (0'ın altına inmemesini sağla)
             
             // Kullanıcıya ceza yediğini bildiren ve Dashboard'da görünecek bir "Eksi" kayıt ekliyoruz
             await supabase.from('gamified_tasks').insert({
                agent_id: agentId,
                title: `Günü Kapatmama Cezası`,
                points: -50,
                category: 'main',
                is_completed: true,
                date: today,
                ai_reason: "Dün 00:00'dan önce Günü Kapatmadığın için -50 XP ceza aldın. Serini korumak için gün sonu kapanışını unutma!"
             });
          }

        } else {
          newStreak = 1; // İlk defa giriyor
        }

        // Arka planda profili sessizce yeni XP, Seri ve Tarih ile güncelle
        await supabase.from('profiles').update({
          last_active_date: today,
          current_streak: newStreak,
          total_xp: newTotalXp
        }).eq('uid', agentId);
      }

      const { data: existingTasksData } = await supabase
        .from('gamified_tasks')
        .select('*')
        .eq('agent_id', agentId)
        .eq('date', today);
      
      let existingTasks = (existingTasksData || []) as GamifiedTask[];

      const coreTasks = [
        { title: "Peş peşe girişini sürdür", points: 10, category: 'sweet' as const },
        { title: "Bugün 100 puan kazan", points: 20, category: 'sweet' as const }
      ];

      if (existingTasks.length > 0 && !force) {
        const missingCore = coreTasks.filter(ct => !existingTasks.find(et => et.title === ct.title));
        if (missingCore.length > 0) {
          for (const ct of missingCore) {
            const newTask = { agent_id: agentId, ...ct, is_completed: false, date: today };
            const { data: created } = await supabase.from('gamified_tasks').insert(newTask).select().single();
            if (created) existingTasks.push(created as any);
          }
        }
        return existingTasks;
      }

      if (force && existingTasks.length > 0) {
        await supabase
          .from('gamified_tasks')
          .delete()
          .eq('agent_id', agentId)
          .eq('date', today);
        existingTasks = [];
      }

      const sweetTemplates = [
        "Bugünkü hedefini belirle",
        "Cevapsız mesajlarını temizle",
        "1 müşteriye dönüş yap",
        "1 portföy notu güncelle",
        "Gün sonu raporunu tamamla",
        "Eski bir müşterini ara",
        "Bölge haberlerini oku",
        "Instagram story paylaşımı yap",
        "LinkedIn bağlantı isteği gönder"
      ];
      const mainTemplates = [
        "5 malik araması yap",
        "1 saha ziyareti kaydet",
        "1 yeni portföy ekle",
        "2 müşteri takibi yap",
        "1 randevu oluştur",
        "Bölge esnafı ziyareti",
        "İlan fiyat analizi yap",
        "Portföyün için Reels videosu çek",
        "Müşteri yorumu paylaş"
      ];
      
      const tasks: any[] = [];
      tasks.push({ agent_id: agentId, title: "Peş peşe girişini sürdür", points: 10, category: 'sweet', is_completed: false, date: today });
      tasks.push({ agent_id: agentId, title: "Bugün 100 puan kazan", points: 20, category: 'sweet', is_completed: false, date: today });

      const shuffledSweet = [...sweetTemplates].sort(() => 0.5 - Math.random());
      shuffledSweet.slice(0, 3).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 10, category: 'sweet', is_completed: false, date: today }));

      const shuffledMain = [...mainTemplates].sort(() => 0.5 - Math.random());
      shuffledMain.slice(0, 2).forEach(t => tasks.push({ agent_id: agentId, title: t, points: 50, category: 'main', is_completed: false, date: today }));

      const leads = await leadService.getLeads();
      const neglectedLeads = leads.filter(l => {
        const lastContact = new Date(l.last_contact);
        const diffDays = Math.floor((new Date().getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 7 && l.status !== 'Pasif';
      });

      if (neglectedLeads.length > 0) {
        const targetLead = neglectedLeads[0];
        tasks.push({ 
          agent_id: agentId, 
          title: `"${targetLead.name}" isimli müşteriyi ara`, 
          points: 100, 
          category: 'smart', 
          is_completed: false, 
          date: today,
          ai_reason: `Bu müşteri ${targetLead.status} statüsünde ama uzun süredir temas kurulmadı.`
        });
      } else {
        tasks.push({ 
          agent_id: agentId, 
          title: "Bölgendeki yeni bir esnafla tanış", 
          points: 100, 
          category: 'smart', 
          is_completed: false, 
          date: today,
          ai_reason: "Tüm müşterilerinle güncel iletişimdesin, yeni bağlantılar kurma zamanı."
        });
      }

      const createdTasks: GamifiedTask[] = [];
      for (const task of tasks) {
        const { data: created } = await supabase.from('gamified_tasks').insert(task).select().single();
        if (created) createdTasks.push(created as any);
      }

      return createdTasks as GamifiedTask[];
    } catch (error) {
      console.error("Error in getDailyGamifiedTasks:", error);
      throw error;
    }
  },

  completeGamifiedTask: async (taskId: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const { error: taskError } = await supabase.from('gamified_tasks').update({ is_completed: true }).eq('id', taskId);
    if (taskError) throw taskError;

    await gamificationService.earnXP('COMPLETE_TASK', { taskId });
    
    return { success: true };
  },

  verifyGamifiedTask: async (task: GamifiedTask): Promise<{ verified: boolean, message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTurkishTodayStr();

    if (task.is_completed) return { verified: true };

    try {
      const title = task.title.toLowerCase();

      // 🔥 KUSURSUZ ÇÖZÜM: Giriş Görevi Asla Hata Vermez
      if (title.includes("peş peşe girişini sürdür")) {
        return { verified: true }; // Zaten butona basabiliyorsa uygulamaya girmiştir!
      }

      // 🔥 1. DOĞRUDAN ONAYLANAN MANUEL GÖREVLER
      if (
        title.includes("linkedin") || 
        title.includes("instagram") || 
        title.includes("reels") || 
        title.includes("story") || 
        title.includes("haberlerini oku") || 
        title.includes("sosyal medya") || 
        title.includes("paylaşım") ||
        title.includes("hedefini belirle") ||
        title.includes("gün sonu raporu") ||
        title.includes("günü kurtar")
      ) {
        return { verified: true };
      }

      // 🔥 2. "NASIL YAPILIR?" YÖNLENDİRMELİ SİSTEM GÖREVLERİ
      if (title.includes("cevapsız mesaj") || title.includes("müşteriye dönüş yap")) {
        const { data: leads } = await supabase.from('leads').select('id').eq('agent_id', agentId).gte('last_contact', today);
        if (leads && leads.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için CRM (Adaylar) ekranına gidip, bir müşterinin detayına yeni bir not veya görüşme kaydetmelisin." };
      }

      if (title.includes("malik araması") || title.includes("5 malik araması")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 5) return { verified: true };
        return { verified: false, message: `Şu an ${count}/5 arama yaptın. CRM üzerinden bir müşteriye 'Arama' görevi ekleyip tamamlandı olarak işaretlemelisin.` };
      }

      if (title.includes("saha ziyareti") || title.includes("esnafı ziyareti") || title.includes("esnafla tanış")) {
        const { data: visits } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Saha').eq('completed', true).gte('created_at', today);
        if (visits && visits.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için CRM ekranından 'Saha' tipinde bir görev/ziyaret ekleyip tamamlamalısın." };
      }

      if (title.includes("yeni portföy ekle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('created_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için 'Portföyler' sekmesinden sisteme yeni bir ilan eklemelisin." };
      }

      if (title.includes("müşteri takibi")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Takip').eq('completed', true).gte('created_at', today);
        const count = tasks?.length || 0;
        if (count >= 2) return { verified: true };
        return { verified: false, message: `Şu an ${count}/2 takip yaptın. CRM üzerinden 'Takip' görevleri oluşturup tamamlamalısın.` };
      }

      if (title.includes("randevu oluştur")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Randevu').gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için CRM'de bir müşteriye 'Randevu' tipinde yeni bir etkinlik planlamalısın." };
      }

      if (title.includes("100 puan kazan")) {
        const { data: completedToday } = await supabase.from('gamified_tasks').select('points').eq('agent_id', agentId).eq('is_completed', true).eq('date', today);
        const totalPointsToday = completedToday?.reduce((acc, t) => acc + t.points, 0) || 0;
        if (totalPointsToday >= 100) return { verified: true };
        return { verified: false, message: `Bugün ${totalPointsToday}/100 puan topladın. Listeden başka görevler yaparak bu kilidi açabilirsin!` };
      }

      if (title.includes("fiyat analizi") || title.includes("portföy notu güncelle")) {
        const { data: props } = await supabase.from('properties').select('id').eq('agent_id', agentId).gte('updated_at', today);
        if (props && props.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için Portföyler ekranından bir ilanın detayına girip düzenleme (fiyat veya not) yapmalısın." };
      }

      if (title.includes("eski bir müşterini ara") || title.includes("isimli müşteriyi ara")) {
        const { data: tasks } = await supabase.from('tasks').select('id').eq('agent_id', agentId).eq('type', 'Arama').eq('completed', true).gte('created_at', today);
        if (tasks && tasks.length >= 1) return { verified: true };
        return { verified: false, message: "Bu görevi tamamlamak için CRM üzerinden iletişimde olmadığın bir müşteriye 'Arama' kaydı girmelisin." };
      }

      // Güvenlik Ağı: Sweet kategorisi
      if (task.category === 'sweet') {
         return { verified: true };
      }

      return { verified: false, message: "Bu görevi tamamlamak için ilgili modülden işleminizi sisteme kaydetmelisiniz." };
    } catch (error) {
      console.error("Verification error:", error);
      return { verified: false, message: "Sistemde anlık bir doğrulama hatası oluştu, lütfen sayfayı yenileyin." };
    }
  },
  
  updateGamifiedTask: async (taskId: string, data: Partial<GamifiedTask>) => {
    const dbData: any = {};
    if (data.is_completed !== undefined) dbData.is_completed = data.is_completed;
    if (data.ai_reason !== undefined) dbData.ai_reason = data.ai_reason;
    if (data.title !== undefined) dbData.title = data.title;
    if (data.points !== undefined) dbData.points = data.points;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.date !== undefined) dbData.date = data.date;
    if (data.notified !== undefined) dbData.notified = data.notified;
    if (data.reminder_time !== undefined) dbData.reminder_time = data.reminder_time;

    const { error } = await supabase
      .from('gamified_tasks')
      .update(dbData)
      .eq('id', taskId);
    if (error) throw error;
  },

  getGamifiedStats: async (): Promise<UserStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const agentId = user.id;
    const today = getTurkishTodayStr();

    const { data: profile } = await supabase.from('profiles').select('*').eq('uid', agentId).maybeSingle();
    const points = profile ? (profile.total_xp || 0) : 0;

    const { data: tasksData } = await supabase
      .from('gamified_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today);
    
    const tasks = (tasksData || []).map((t: any) => ({
      ...t,
      agent_id: t.agent_id,
      is_completed: t.is_completed,
      ai_reason: t.ai_reason
    })) as GamifiedTask[];
    
    const completedTasks = tasks.filter(t => t.is_completed);
    const pointsToday = completedTasks.reduce((sum, t) => sum + t.points, 0);
    const mainTasks = tasks.filter(t => t.category === 'main');
    const completedMainTasks = mainTasks.filter(t => t.is_completed);

    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) : 0;
    const mainCompletionRate = mainTasks.length > 0 ? (mainTasks.filter(t => t.is_completed).length / mainTasks.length) : 0;
    
    let streak = profile ? (profile.current_streak || 0) : 0;
    
    const streakEffect = streak > 0 ? 20 : 0;
    const momentum = Math.round((completionRate * 50) + (mainCompletionRate * 30) + streakEffect);

    let level = 1;
    let level_name = "Başlangıç";
    let next_level_points = 1000;

    if (points > 15000) { level = 5; level_name = "Kapanışa Yakın"; next_level_points = 30000; }
    else if (points > 7000) { level = 4; level_name = "Saha Oyuncusu"; next_level_points = 15000; }
    else if (points > 3000) { level = 3; level_name = "Üretici"; next_level_points = 7000; }
    else if (points > 1000) { level = 2; level_name = "Aktif"; next_level_points = 3000; }

    return {
      points,
      points_today: pointsToday,
      streak,
      momentum,
      level,
      level_name,
      next_level_points,
      daily_progress: Math.round(completionRate * 100),
      tasks_completed_today: completedTasks.length,
      total_tasks_today: tasks.length
    };
  }
};