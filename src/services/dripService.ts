import { Task } from '../types';
import { taskService } from './taskService';

export type DripEventType = 'OFFER_MADE' | 'SHOWING_DONE' | 'PORTFOLIO_LISTED' | 'POST_SALE_REF';

export const DRIP_CAMPAIGNS: Record<DripEventType, { label: string, steps: { days: number, title: string, suggestion: string }[] }> = {
  'OFFER_MADE': {
    label: 'Teklif Takip Serisi',
    steps: [
      { 
        days: 3, 
        title: 'Teklif Takibi - 3. Gün', 
        suggestion: 'Selamlar, teklifimizle ilgili mülk sahibiyle tekrar görüştüm, gün içinde bir değerlendirme yapabildiniz mi?' 
      },
      { 
        days: 7, 
        title: 'Teklif Sıcak Tutma - 7. Gün', 
        suggestion: 'Mülk için başka ciddi ilgilenenler de var. Karar sürecinizi hızlandırmak adına merak ettiğiniz bir detay var mı?' 
      }
    ]
  },
  'SHOWING_DONE': {
    label: 'Yer Gösterme Takibi',
    steps: [
      { 
        days: 2, 
        title: 'İzlenim Değerlendirme', 
        suggestion: 'Mülkü gezdikten sonra aklınızda kalan soru işaretleri oldu mu? Değerlendirme fırsatınız oldu mu?' 
      }
    ]
  },
  'PORTFOLIO_LISTED': {
    label: 'Mal Sahibi Güncelleme',
    steps: [
      { 
        days: 4, 
        title: 'İlk 4 Gün Raporu', 
        suggestion: 'Yayına girişimizden bu yana gelen tepkileri mal sahibiyle paylaş. Pazarın ilk tepkisi oldukça pozitif.' 
      }
    ]
  },
  'POST_SALE_REF': {
    label: 'Satış Sonrası Referans',
    steps: [
      { 
        days: 30, 
        title: 'Memnuniyet Kontrolü', 
        suggestion: 'Yeni mülkünüzde bir ayınız doldu, her şey yolunda mı? Memnun kaldıysanız çevrenize de beni önerebilirsiniz.' 
      }
    ]
  }
};

export const dripService = {
  createDripCampaign: async (leadId: string, propertyId: string | undefined, eventType: DripEventType) => {
    const campaign = DRIP_CAMPAIGNS[eventType];
    if (!campaign) return;

    for (const step of campaign.steps) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + step.days);

      await taskService.addTask({
        title: step.title,
        type: 'Takip',
        time: scheduledDate.toISOString(),
        completed: false,
        property_id: propertyId,
        lead_id: leadId,
        ai_suggestion: step.suggestion,
        is_drip: true
      });
    }
  }
};