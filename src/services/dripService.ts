import { Task } from '../types';
import { taskService } from './taskService';

export type DripEventType = 'OFFER_MADE' | 'SHOWING_DONE' | 'PORTFOLIO_LISTED';

export const dripService = {
  createDripCampaign: async (leadId: string, propertyId: string | undefined, eventType: DripEventType) => {
    const campaigns: Record<DripEventType, { days: number, title: string, suggestion: string }[]> = {
      'OFFER_MADE': [
        { 
          days: 3, 
          title: 'Teklif Takibi - 3. Gün', 
          suggestion: 'Teklif vereli 3 gün oldu. Ahmet Bey\'in nabzını yoklamak için: "Selamlar Ahmet Bey, teklifimizle ilgili mülk sahibiyle tekrar görüştüm, gün içinde bir değerlendirme yapabildiniz mi?" şeklinde bir mesaj atabilirsin.' 
        },
        { 
          days: 7, 
          title: 'Teklif Sıcak Tutma - 7. Gün', 
          suggestion: '1 hafta geçti. Müşterinin ilgisi dağılmadan: "Ahmet Bey merhaba, mülk için başka ciddi ilgilenenler de var. Karar sürecinizi hızlandırmak adına merak ettiğiniz son bir detay var mı?" diye sorabilirsin.' 
        },
        { 
          days: 14, 
          title: 'Son Hatırlatma - 14. Gün', 
          suggestion: '2 hafta doldu. Artık netleşme zamanı: "Ahmet Bey, bu mülk hakkındaki teklifinizi hala geçerli sayalım mı? Eğer fikriniz değiştiyse size daha uygun alternatif portföylerim üzerinde çalışmaya başlayabilirim."' 
        }
      ],
      'SHOWING_DONE': [
        { 
          days: 2, 
          title: 'Yer Gösterme Değerlendirme', 
          suggestion: 'Mülkü göstereli 2 gün oldu. İlk izlenimi almak için: "Mülkü birlikte gezdikten sonra aklınızda kalan soru işaretleri oldu mu? Eşinizle/ortağınızla değerlendirme fırsatınız oldu mu?" mesajı uygun olacaktır.' 
        },
        { 
          days: 5, 
          title: 'Yeni Alternatif Sunumu', 
          suggestion: 'Müşteri hala sessizse, o mülk olmamış olabilir: "Gezdiğimiz mülke benzer özelliklerde ama [Farklı Özellik] olan yeni bir yer girdi portföyüme. Görmek ister misiniz?"' 
        }
      ],
      'PORTFOLIO_LISTED': [
        {
          days: 4,
          title: 'Mal Sahibi Güncellemesi',
          suggestion: 'Mülkü yayına alalı 4 gün oldu. Gelen ilk tepkileri mal sahibiyle paylaş: "Yayına girişimizden bu yana [X] kişi tıkladı, [Y] kişiyle görüştüm. Pazarın ilk tepkisi oldukça pozitif."'
        }
      ]
    };

    const campaign = campaigns[eventType];
    if (!campaign) return;

    for (const step of campaign) {
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
