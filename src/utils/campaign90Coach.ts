import { CampaignTask } from '../types';
import { CampaignTaskProgress } from '../services/campaignProgressService';
import { Campaign90Stats } from '../hooks/useCampaign90Stats';

interface CoachParams {
    todayTotal: number;
    todayCompleted: number;
    todayG: number;
    todayP: number;
    todayA: number;
    currentDay: number;
    taskProgressMap?: Record<string, CampaignTaskProgress>;
    todayTasks: CampaignTask[];
    crmStats?: Campaign90Stats | null;
}

export function getCampaignCoachMessage(params: CoachParams): string {
    const {
        todayTotal,
        todayCompleted,
        todayG,
        todayP,
        todayA,
        currentDay,
        taskProgressMap,
        todayTasks,
        crmStats
    } = params;

    let coachMessage = "Bugün kamp disiplini aktif.";

    if (todayTotal > 0) {
        if (todayCompleted === 0 && currentDay <= 14) coachMessage = "Bugünün dersini okumadan arama yapma; yanlış script güven kaybettirir.";
        else if (todayCompleted === 0 && currentDay <= 30) coachMessage = "Bugünün konusu değer analizi. Sadece fiyat söyleme, emsal mantığını anlat.";
        else if (todayCompleted === 0) coachMessage = "Bugünün eğitim detayını incelemeden günün ilk adımını atma.";
        else if (todayG < 1 && todayA >= 1) coachMessage = "Bugün bilgi topluyorsun ama insanla konuşmuyorsun. Gelir getirici aktivite olmadan portföy gelmez.";
        else if (todayP < 1 && todayG >= 1) coachMessage = "Temas var ama portföy üretimi zayıf. Görüştüğün kişilerden en az 1 mülk sahibi görüşmesi ekle.";
        else if (todayA < 1 && todayG >= 1) coachMessage = "Saha yapıyorsun ama bölge hakimiyeti eksik. 10 ilan analizi yapmadan günü kapatma.";
        else if (todayCompleted >= todayTotal - 2) coachMessage = "Bugün kamp disiplini harika çalıştı. Kalanları da tamamla efsane bir günü kapat.";
    }

    let hasVerifiedPending = false;
    if (taskProgressMap) {
        Object.keys(taskProgressMap).forEach(taskId => {
            const prog = taskProgressMap[taskId];
            const task = todayTasks.find(t => t.id === taskId);
            if (task && task.status !== 'completed' && prog.current >= prog.target) {
                hasVerifiedPending = true;
            }
        });

        if (hasVerifiedPending) {
            coachMessage = "Bazı görevler veride tamamlanmış görünüyor. XP almak için onaylamayı unutma.";
        }
    }

    if (crmStats && !hasVerifiedPending) {
        if (crmStats.lowHealthPropertiesCount > 0 && todayCompleted < todayTotal * 0.7) {
            coachMessage = "Sağlığı düşük portföyler pipeline’ı kirletir. Fiyat, açıklama veya hedef alıcıyı gözden geçir.";
        } else if (crmStats.attentionNeededCount > 0 && todayCompleted < todayTotal * 0.7) {
            coachMessage = "Dikkat veya fiyat revizyonu isteyen portföylerin var, bekleme.";
        } else if (crmStats.buyersTenantsAdded > 0 && crmStats.missedFollowups > 5) {
            coachMessage = "Bugün yeni lead eklemişsin ama geciken takiplerin var. Takipsiz CRM mezarlıktır.";
        } else if (crmStats.hotLeadsTouched === 0 && todayCompleted < todayTotal * 0.7) {
            coachMessage = "Sıcak adayların var ama bugün temas görünmüyor. Önce sıcak fırsatları canlı tut.";
        } else if (crmStats.showingTasksToFollowUp > 0) {
            coachMessage = "Gösterim sonrası takip yoksa müşteri soğur. 24 saat kuralını kaçırma.";
        }
    }

    return coachMessage;
}
