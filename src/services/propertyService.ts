import { 
  Property, BrokerAccount, ExternalListing, PropertySyncLink, Lead,
  PropertyAIContent, InstagramMarketingContent, WhatsAppMarketingContent, MarketingModuleContent 
} from '../types';
import { supabase } from '../lib/supabase';
import { getUserId } from './core/utils';
import { gamificationService } from './gamificationService';
import { generateContent } from '../lib/aiClient';
import { leadService } from './leadService';

export const propertyService = {
  // Calculate Property Scores
  calculatePropertyScores: (property: Partial<Property>, allProperties: Property[] = []) => {
    const price = property.price || 0;
    
    // Calculate real average price from properties in the same district, or fallback to 5M
    const districtProps = allProperties.filter(p => p.address?.district === property.address?.district && p.id !== property.id);
    const avgPrice = districtProps.length > 0 
      ? districtProps.reduce((sum, p) => sum + p.price, 0) / districtProps.length 
      : 5000000; 
      
    const priceIndex = price / avgPrice;
    
    let status: 'Fırsat' | 'Normal' | 'Pahalı' = 'Normal';
    if (priceIndex < 0.9) status = 'Fırsat';
    if (priceIndex > 1.1) status = 'Pahalı';

    // Probability Logic: Price (50%) + Health (30%) + Status (20%)
    const priceScore = priceIndex < 1 ? 100 : Math.max(0, 100 - (priceIndex - 1) * 200);
    const healthScore = property.health_score || 70;
    const probability = (priceScore * 0.5 + healthScore * 0.3 + 20) / 100;

    return {
      sale_probability: Math.min(0.99, Math.max(0.1, probability)),
      market_analysis: {
        avg_price_m2: 45000,
        price_index: priceIndex,
        status
      }
    };
  },

  // Portföy Yönetimi
  getProperties: async (): Promise<Property[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data || []) as Property[];
  },

  addProperty: async (property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'sale_probability' | 'market_analysis'>) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // Check if owner exists in leads, if not add them
    if (property.owner?.name && property.owner?.phone) {
      const leads = await leadService.getLeads();
      const existingLead = leads.find(l => l.phone === property.owner.phone);
      
      if (!existingLead) {
        await leadService.addLead({
          name: property.owner.name,
          phone: property.owner.phone,
          type: 'Mal Sahibi',
          status: 'Yetki Alındı',
          district: property.address.district,
          notes: `${property.title} portföyü üzerinden otomatik eklendi.`,
          created_at: new Date().toISOString() // EKLENDİ (TS2345 FIX)
        });
      }
    }

    const scores = propertyService.calculatePropertyScores(property);

    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...property,
        ...scores,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;

    // Award XP for adding a property
    try {
      await gamificationService.earnXP('ADD_PROPERTY', data.id);
    } catch (e) {
      console.warn("XP award failed for addProperty:", e);
    }

    return data.id;
  },

  updatePropertyStatus: async (id: string, status: Property['status']) => {
    const { error } = await supabase
      .from('properties')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },

  updateProperty: async (id: string, property: Partial<Property>) => {
    // Check if owner is being updated and exists in leads
    if (property.owner?.name && property.owner?.phone) {
      const leads = await leadService.getLeads();
      const existingLead = leads.find(l => l.phone === property.owner?.phone);
      
      if (!existingLead) {
        await leadService.addLead({
          name: property.owner.name,
          phone: property.owner.phone,
          type: 'Mal Sahibi',
          status: 'Yetki Alındı',
          district: property.address?.district || '',
          notes: `Portföy güncellemesi üzerinden otomatik eklendi.`,
          created_at: new Date().toISOString() // EKLENDİ (TS2345 FIX)
        });
      }
    }

    const scores = propertyService.calculatePropertyScores(property);
    
    // Normalize jsonb fields
    const safeParse = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    };
    const updatePayload = {
        ...property,
        ...scores,
        market_analysis: property.market_analysis ? safeParse(property.market_analysis) : undefined,
        details: property.details ? safeParse(property.details) : undefined,
        address: property.address ? safeParse(property.address) : undefined,
        owner: property.owner ? safeParse(property.owner) : undefined,
        updated_at: new Date().toISOString()
    };
    // Remove undefined keys
    Object.keys(updatePayload).forEach(key => updatePayload[key as keyof typeof updatePayload] === undefined && delete updatePayload[key as keyof typeof updatePayload]);

    try {
      const { error } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Property Update Error:', e.message || 'Bilinmeyen Hata');
      throw new Error(`Portföy güncellenemedi: ${e.message || 'Format hatası olabilir'}`);
    }
  },

  deleteProperty: async (id: string) => {
    // SİLME İŞLEMİ GÜNCELLENDİ: Hata durumunda daha net bilgi fırlatılıyor
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase property delete error:", error);
        throw new Error(error.message); // Supabase hatasını direkt yukarı gönder
      }
    } catch (err: unknown) {
      console.error("PropertyService delete exception:", err);
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      throw new Error(message);
    }
  },

  uploadPropertyImage: async (id: string, file: File) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${id}/${Math.random()}.${fileExt}`;
    const filePath = `property-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-assets')
      .upload(filePath, file);

    if (uploadError) {
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Supabase Storage\'da "property-assets" isminde bir Public Bucket bulunamadı. Lütfen Supabase panelinden bu bucket\'ı oluşturun.');
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-assets')
      .getPublicUrl(filePath);

    // Get current images
    const { data: property } = await supabase
      .from('properties')
      .select('images')
      .eq('id', id)
      .single();

    const currentImages = property?.images || [];
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        images: [...currentImages, publicUrl],
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;
    return publicUrl;
  },

  // ==========================================
  // AI İÇERİK ÜRETİMİ
  // ==========================================
  
  generatePropertyContent: async (property: Property) => {
    try {
      let data: any = await propertyService.getMarketingOutput(property.id);
      if (!data) {
        data = await propertyService.generateMarketingModule(property);
      }
      return data?.portal_description || data?.short_description || "İlan metni oluşturulamadı.";
    } catch (error) {
      console.error("İlan metni üretim hatası:", error);
      throw error;
    }
  },

  generateInstagramCaptions: async (property: Property) => {
    try {
      let data: any = await propertyService.getMarketingOutput(property.id);
      if (!data) {
        data = await propertyService.generateMarketingModule(property);
      }
      const posts: any = data?.instagram_posts || [];
      const kurumsal = posts.find((p: any) => p.tone === 'kurumsal') || posts[0];
      const satis = posts.find((p: any) => p.tone === 'satis_odakli') || posts[1] || posts[0];
      const samimi = posts.find((p: any) => p.tone === 'samimi') || posts[2] || posts[0];
      
      return {
        corporate: kurumsal?.caption || '',
        sales: satis?.caption || '',
        warm: samimi?.caption || ''
      };
    } catch (error) {
      console.error("Instagram metni üretim hatası:", error);
      throw error;
    }
  },

  generateWhatsAppMessages: async (property: Property) => {
    try {
      let data: any = await propertyService.getMarketingOutput(property.id);
      if (!data) {
        data = await propertyService.generateMarketingModule(property);
      }
      let statuses: any = data?.whatsapp_messages || {};
      if (Array.isArray(data?.whatsapp_messages)) {
          const arr = data.whatsapp_messages as any[];
          statuses = {
              single: arr.find(m => m.type === 'single')?.text || '',
              status: arr.find(m => m.type === 'status')?.text || '',
              investor: arr.find(m => m.type === 'investor')?.text || ''
          };
      }
      return {
        single: statuses.single || '',
        status: statuses.status || '',
        investor: statuses.investor || ''
      };
    } catch (error) {
      console.error("WhatsApp metni üretim hatası:", error);
      throw error;
    }
  },

  saveMarketingOutput: async (propertyId: string, outputJson: any) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('property_marketing_outputs')
      .upsert({
        user_id: userId,
        property_id: propertyId,
        output_type: 'full_marketing_pack',
        output_json: outputJson,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, property_id, output_type' });

    if (error) console.error("Error saving marketing output:", error);
  },

  getMarketingOutput: async (propertyId: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('property_marketing_outputs')
      .select('output_json')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .eq('output_type', 'full_marketing_pack')
      .maybeSingle();

    if (error) {
      console.error("Error fetching marketing output:", error);
      return null;
    }
    return data?.output_json || null;
  },

  generateMarketingModule: async (property: Property) => {
    const propertyDetails = `
      İlan Başlığı: ${property.title}
      İlan Tipi: ${property.type}
      Oda Sayısı: ${property.details.rooms}
      Metrekare: ${property.details.brut_m2} m2
      Kat Bilgisi: ${property.details.floor}. Kat
      Fiyat: ${property.price.toLocaleString()} TL
      Konum: ${property.address.neighborhood} / ${property.address.district} / ${property.address.city}
      Portföy Özeti: ${property.notes}
    `;

    const response = await generateContent("gemini-2.5-flash", propertyDetails, { featureKey: "property_marketing_content" }) as any;
    
    // Convert to the exact frontend format expected by types if needed, or if it matches exactly, just return it.
    // We already aligned the server responseSchema to match our needs, but whatsapp_messages is an object in server schema.
    // The previous prompt asked for:
    // "whatsapp_messages": [ { "type": "kisa_musteri_mesaji", "text": "...", "alternative_texts": ["...", "..."] }, ... ]
    // Let's normalize it to the MarketingModuleContent type.
    const normalizedResponse = {
      ...response,
      whatsapp_messages: response.whatsapp_messages ? (
        Array.isArray(response.whatsapp_messages) ? response.whatsapp_messages : [
          { type: 'single', text: response.whatsapp_messages.single || '', alternative_texts: [] },
          { type: 'status', text: response.whatsapp_messages.status || '', alternative_texts: [] },
          { type: 'investor', text: response.whatsapp_messages.investor || '', alternative_texts: [] }
       ]
      ) : []
    };

    await propertyService.saveMarketingOutput(property.id, normalizedResponse);
    return normalizedResponse as MarketingModuleContent;
  },

  // sahibinden.com Entegrasyonu
  connectSahibinden: async (apiKey: string) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const user_id = userId;
    
    if (apiKey.length < 10) throw new Error('Geçersiz API anahtarı');

    const account: Omit<BrokerAccount, 'id'> = {
      user_id,
      store_name: "Emlak Mağazası",
      api_key: apiKey.substring(0, 4) + "****",
      connected_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('broker_accounts')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, ...account };
  },

  getBrokerAccount: async () => {
    const userId = await getUserId();
    if (!userId) return null;
    const { data } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data as BrokerAccount | null;
  },

  getExternalListings: async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const { data } = await supabase
      .from('external_listings')
      .select('*')
      .eq('user_id', userId);
    return (data || []) as ExternalListing[];
  },

  syncExternalListings: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    const user_id = userId;

    const account = await propertyService.getBrokerAccount();
    if (!account) return [];

    const simulatedListings: Omit<ExternalListing, 'id'>[] = [
      {
        user_id,
        ext_id: '123456789',
        title: 'Sahibinden Satılık Lüks Daire',
        price: 4500000,
        status: 'Yayında',
        url: 'https://sahibinden.com/123456789',
        district: 'Kadıköy',
        last_sync: new Date().toISOString()
      },
      {
        user_id,
        ext_id: '987654321',
        title: 'Kiralık Modern Ofis',
        price: 25000,
        status: 'Yayında',
        url: 'https://sahibinden.com/987654321',
        district: 'Beşiktaş',
        last_sync: new Date().toISOString()
      }
    ];

    const results: ExternalListing[] = [];
    for (const listing of simulatedListings) {
      const { data, error } = await supabase
        .from('external_listings')
        .upsert(listing, { onConflict: 'user_id,ext_id' })
        .select()
        .single();
      if (data) results.push(data as ExternalListing);
    }

    return results;
  },

  linkPropertyToExternal: async (property_id: string, external_listing_id: string) => {
    await supabase
      .from('property_sync_links')
      .upsert({ property_id, external_listing_id }, { onConflict: 'property_id' });
  },

  getSyncLink: async (property_id: string) => {
    const { data } = await supabase
      .from('property_sync_links')
      .select('*')
      .eq('property_id', property_id)
      .maybeSingle();
    return data as PropertySyncLink | null;
  },

  importListingFromUrl: async (url: string) => {
    throw new Error('İlan linkinden içe aktarma yakında aktif olacak.');
  },
};