// Dosya Yolu: src/services/smartMatchService.ts

import { supabase } from '../lib/supabase';

export const smartMatchService = {
  /**
   * Yeni portföy eklendiğinde çapraz analiz yapıp AI Insight oluşturur
   */
  async runSmartMatchForNewProperty(propertyId: string, userId: string) {
    try {
      // 1. Yeni eklenen portföyü getir
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propError || !property) throw propError;

      // 2. Kullanıcının Alıcı adaylarını getir
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, phone, district, status, notes')
        .eq('user_id', userId)
        .in('type', ['Alıcı', 'Yatırımcı']); // Sadece potansiyel alıcıları getir

      if (leadsError || !leads) throw leadsError;

      // 3. Eşleştirme Logiği (Smart Match Algorithm)
      const matchedLeads = leads.filter(lead => {
        // Kriter 1: İlçe eşleşmesi
        const isDistrictMatch = lead.district && property.address?.district && 
                                lead.district.toLowerCase() === property.address.district.toLowerCase();
        
        // Kriter 2: Lead notlarında portföy tipine dair bir ipucu var mı? (örn: "Villa arıyor")
        const notesMatch = lead.notes && lead.notes.toLowerCase().includes(property.type.toLowerCase());
        
        // Kriter 3: Müşteri zaten "Sıcak" statüsündeyse her zaman fırsat olarak değerlendirilebilir
        const isHotLead = lead.status === 'Sıcak';

        // Eşleşme skoru
        return isDistrictMatch || notesMatch || isHotLead;
      });

      // 4. Eşleşme varsa proaktif AI Insight (Fırsat) oluştur
      if (matchedLeads.length > 0) {
        // En potansiyel (sıcak) olan ilk 3 lead'i sınırla
        const topMatches = matchedLeads.slice(0, 3);
        await this.createMatchInsight(property, topMatches, userId);
      }

      return matchedLeads;
    } catch (error) {
      console.error('Smart match trigger failed:', error);
      throw error;
    }
  },

  /**
   * Eşleşme bulunduğunda veritabanına AI Insight (Fırsat Bildirimi) yazar
   */
  async createMatchInsight(property: any, matchedLeads: any[], userId: string) {
    const leadNames = matchedLeads.map(l => l.name).join(', ');
    
    const insightData = {
      user_id: userId,
      type: 'opportunity',
      title: 'Akıllı Eşleşme (Smart Match) 🎯',
      description: `Bu yeni portföy (${property.title}) için kriterleri uyan ${matchedLeads.length} sıcak müşterin var: ${leadNames}. Hemen tek tıkla WhatsApp üzerinden standart teklif mesajını göndermek ister misin?`,
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price,
        matchedLeads: matchedLeads.map(l => ({
          id: l.id,
          name: l.name,
          phone: l.phone
        }))
      }
    };

    const { error } = await supabase
      .from('ai_insights')
      .insert([insightData]);

    if (error) {
      console.error('Error creating Smart Match AI Insight:', error);
    }
  },

  /**
   * Tek tıkla standart WhatsApp mesajı oluşturur
   */
  generateWhatsAppLink(leadPhone: string, propertyTitle: string, propertyPrice: number): string {
    const message = `Merhaba, aradığınız kriterlere uygun harika bir portföyümüz sisteme eklendi!\n\n📍 ${propertyTitle}\n💰 ${propertyPrice.toLocaleString('tr-TR')} ₺\n\nDetaylı bilgi almak isterseniz bana dönüş yapabilirsiniz. İyi günler dilerim!`;
    const encodedMessage = encodeURIComponent(message);
    
    // Telefon numarasını WhatsApp URL formatına uygun hale getir
    let formattedPhone = (leadPhone || '').replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '90' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
      formattedPhone = '9' + formattedPhone.substring(1);
    }

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }
};