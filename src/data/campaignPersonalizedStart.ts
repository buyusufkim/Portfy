import { CampaignDayTemplate, CampaignTemplateTask } from './campaign90Template';

export const NEW_ADVISOR_DAY_1: CampaignTemplateTask[] = [
    { task_key: 'n_d1_g1', task_type: 'prospecting', title: 'Mesleki durumunu netleştir', description: 'Bağımsız mı, ofise bağlı mı, eğitim sürecinde mi çalışacağını belirle.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d1_g2', task_type: 'prospecting', title: 'Bağlı çalışacağın ofis / mentor adaylarını listele', description: 'Görüşülecek 3 ofis/broker veya mentor adayı yaz.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d1_p1', task_type: 'portfolio', title: 'MYK Seviye 4 / Seviye 5 farkını araştır', description: 'Hangisini alman gerektiğini ve gereksinimlerini not al.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d1_p2', task_type: 'portfolio', title: 'Taşınmaz ticareti yetki belgesi kavramını oku', description: 'Ofis adına mı kendi adına mı çalışacağını kurallarıyla öğren.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d1_a1', task_type: 'learning', title: 'Profesyonel imza bilgilerini tamamla', description: 'Kullanılacak ad, unvan, telefon, e-posta alanlarını netleştir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d1_a2', task_type: 'learning', title: 'Niyet notu yaz', description: '"Bu meslekte ilk 90 gün neden disiplin ister?" sorusuna yanıt ver.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d1_a3', task_type: 'learning', title: 'Resmi/mesleki hazırlıklarını listele', description: 'Gün sonu eksiklerini çıkar ve mentoruna/ofise sormak üzere not al.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d1_rev', task_type: 'review', title: 'Gün sonu GPA kapanışını yap', description: 'Bugün hangi yasal/mesleki temelleri öğrendiğini kaydet.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
];

export const NEW_ADVISOR_DAY_2: CampaignTemplateTask[] = [
    { task_key: 'n_d2_g1', task_type: 'prospecting', title: 'MYK belgeni kontrol et', description: 'Varsa profile işle, yoksa MYK/eğitim süreci için başvurulabilecek kurumları araştır.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d2_g2', task_type: 'prospecting', title: 'Ofis bağlantını işle veya listeni kullan', description: 'Ofisin varsa rolünü işle, yoksa dün listelediğin 3 adayla temasa geç.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d2_p1', task_type: 'portfolio', title: 'Ofise sorulacak soruları hazırla', description: 'Ofisin sağlayacağı sözleşme, eğitim ve ilan süreçleri hakkında sorular çıkar.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d2_p2', task_type: 'portfolio', title: 'Ofisinin sağladığı altyapıyı incele', description: 'Hangi portallarda hakkın olacak veya hangi bedelleri ödeyeceksin öğren.', gpa_bucket: 'P', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d2_a1', task_type: 'learning', title: 'Eğitim kaynaklarını belirle', description: 'Mesleki odalar ve markaların akademi takvimlerine bak.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d2_a2', task_type: 'learning', title: 'Portfy Eğitim modülünde 1 makale oku', description: 'Mevzuat ve resmi süreçlerle ilgili bir makale bitir.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d2_a3', task_type: 'learning', title: 'Self-audit yaz', description: '"Ben şu an müşteriyle çalışmaya ne kadar hazırım?" sorusunu cevapla.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 10 },
    { task_key: 'n_d2_rev', task_type: 'review', title: 'Gün sonu GPA kapanışını yap', description: 'Dünün ve bugünün hazırlıklarını değerlendir.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
];

export const NEW_ADVISOR_DAY_3: CampaignTemplateTask[] = [
    { task_key: 'n_d3_g1', task_type: 'prospecting', title: 'Yer gösterme formu örneği bul', description: 'Kullanacağın yer gösterme formu örneğini ofisinden veya mentorundan iste.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d3_g2', task_type: 'prospecting', title: 'Komisyon/hizmet sözleşmesi örneği incele', description: 'Yetki sözleşmesindeki haklarını ve müşterinin yükümlülüklerini oku.', gpa_bucket: 'G', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d3_p1', task_type: 'portfolio', title: 'Yetki/yazılı onay sürecini öğren', description: 'Mülk sahibiyle çalışırken nasıl sözleşme alman gerektiğini araştır.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d3_p2', task_type: 'portfolio', title: 'KVKK araştırması yap', description: 'Müşteri verisini kaydederken KVKK kurallarına nasıl uyacağını oku.', gpa_bucket: 'P', difficulty: 'required', xp_reward: 10 },
    { task_key: 'n_d3_a1', task_type: 'learning', title: 'İlan kurallarını not al', description: 'Yetkisiz, kopya veya izinsiz ilan paylaşmama kuralını oku.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 },
    { task_key: 'n_d3_a2', task_type: 'learning', title: 'Alıcı getiren emlakçı itirazına cevap çalış', description: '"Önce alıcı getir" diyen mülk sahibine güvenli cevap scripti yaz.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d3_a3', task_type: 'learning', title: 'Komisyon gecikmesi riskini yaz', description: '"Komisyonu sonra konuşuruz" yaklaşımının neden tehlikeli olduğunu not et.', gpa_bucket: 'A', difficulty: 'recommended', xp_reward: 10 },
    { task_key: 'n_d3_rev', task_type: 'review', title: 'Sahaya çıkmadan önceki 5 kontrol maddesini yaz', description: 'Kampın ilk haftasında sahaya çıkmadan halletmen gerekenleri özetle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 20 }
];

export const EXPERIENCED_DAY_1_BONUS: CampaignTemplateTask = { task_key: 'e_d1_a_bonus', task_type: 'learning', title: 'Belge ve Kimlik Kontrolü', description: 'Mevcut belgelerini, MYK tarihlerini, ofis/yetki bilgilerini profiline kaydet ve güncelle.', gpa_bucket: 'A', difficulty: 'required', xp_reward: 15 };

export const getPersonalizedDayTasks = (day: number, experienceLevel: 'new' | 'experienced' | null, defaultTasks: CampaignTemplateTask[]): CampaignTemplateTask[] => {
    if (experienceLevel === 'new') {
        if (day === 1) return NEW_ADVISOR_DAY_1;
        if (day === 2) return NEW_ADVISOR_DAY_2;
        if (day === 3) return NEW_ADVISOR_DAY_3;
    } else {
        if (day <= 3 && experienceLevel === 'experienced') {
            // For day 1, add a bonus task to check documents
            if (day === 1) {
                const hasTask = defaultTasks.some(t => t.task_key === EXPERIENCED_DAY_1_BONUS.task_key);
                if (!hasTask) {
                   return [...defaultTasks, EXPERIENCED_DAY_1_BONUS];
                }
            }
        }
    }
    return defaultTasks;
};
