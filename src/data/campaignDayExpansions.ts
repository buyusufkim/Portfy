export interface GlossaryTerm {
  term: string;
  meaning: string;
  example?: string;
}

const termsPhase1: GlossaryTerm[] = [
  { term: "Yetki Belgesi", meaning: "Portföy pazarlama sürecini başlatan resmi sözleşme.", example: "Yetki belgesi olmadan kesinlikle ilan çıkmamalısın." },
  { term: "Münhasır Yetki", meaning: "Tek yetkili olarak pazarlama hakkı veren sözleşme tipi." },
  { term: "Değer Analizi (CMA)", meaning: "Benzer mülklerin piyasadaki değerlerini karşılaştırarak doğru fiyatlandırma tespiti." },
  { term: "Emsal", meaning: "Değerlenen mülkle aynı özelliklere sahip, piyasadaki diğer mülk." },
  { term: "Rayiç Bedel", meaning: "Belediyenin o gayrimenkul için belirlediği minimum vergi matrah değeri." },
  { term: "Tapu", meaning: "Mülkiyet hakkını gösteren resmi devlet belgesi." },
  { term: "DASK", meaning: "Zorunlu Deprem Sigortası.", example: "Satış veya kiralama devrinden önce mutlaka DASK yenilenmelidir." },
  { term: "Kira Çarpanı", meaning: "Mülkün satış fiyatının, aylık veya yıllık kira bedeline bölünmesiyle bulunan amortisman oranı." },
  { term: "Amortisman", meaning: "Yatırımın kendini kira veya getiri ile karşılama süresi." },
  { term: "Brüt m²", meaning: "Kat alanındaki duvar payları, merdiven gibi ortak alanları içeren toplam mülk metrekaresi." },
  { term: "Net m²", meaning: "Duvarların içinde kalan, doğrudan kullanılabilir alan." },
  { term: "Aidat", meaning: "Ortak alanların giderleri için ödenen aylık tutar." },
  { term: "İskan", meaning: "Yapı kullanım izin belgesi." },
  { term: "Kat Mülkiyeti", meaning: "İskan alınmış binalarda, her bir bağımsız bölümün mülkiyet durumunu gösteren belge sınıfı." },
  { term: "Kat İrtifakı", meaning: "Henüz inşaat halindeyken veya iskan aşamasından önce verilmiş, mülkiyet payını gösteren tapu türü." }
];

const termsPhase2: GlossaryTerm[] = [
  { term: "Portföy", meaning: "Satışa veya kiralamaya çıkarılan ve pazarlaması üstlenilen gayrimenkul." },
  { term: "FSBO (Sahibinden)", meaning: "Mülk sahibinin emlak danışmanı kullanmadan kendisinin satmaya/kiralamaya çalıştığı mülkler." },
  { term: "Alıcı Segmenti", meaning: "Alıcıların yatırımcı, oturumcu, A/B/C kitlesi gibi demografik veya davranışsal gruplandırılması." },
  { term: "Sıcak Lead", meaning: "Hemen alım veya satım kararı vermek üzere olan, aciliyeti yüksek müşteri." },
  { term: "Takip Tarihi (Follow-up)", meaning: "Bir adayla yeniden iletişime geçilmesi planlanan zaman." },
  { term: "Fiyat Revizyonu", meaning: "Pazarda ilgi görmeyen veya piyasayla uyuşmayan mülkün fiyatının yeniden belirlenmesi/düşürülmesi." },
  { term: "Yer Gösterme (Viewing)", meaning: "Müşteriye gayrimenkulün fiziksel veya sanal olarak gezdirilmesi ve tanıtılması." },
  { term: "Saha Çalışması (Farming)", meaning: "Belirli bir hedef bölgede sistemli olarak varlık gösterme ve portföy/müşteri avlama süreci." },
  { term: "İlan Kalitesi", meaning: "Açıklama, fotoğraf kalitesi ve bilgi tamlığı ile ilanın öne çıkma derecesi." },
  { term: "Brandaj & Branda", meaning: "Satılık/Kiralık olduğunu belirten ve danışmanın iletişim bilgilerini taşıyan afiş." },
  { term: "Kapı Çalma (Door Knocking)", meaning: "Doğrudan hedef bölgedeki ev veya işyerlerinin kapısını çalarak kendini tanıtma." },
  { term: "İhtiyaç Analizi", meaning: "Müşterinin ne istediğini, bütçesini ve asıl motivasyonunu anlama çalışması." },
  { term: "Mülk Sunumu", meaning: "Mülkün özelliklerini ve faya/ihtiyaç eşleşmesini profesyonelce aktarma yeteneği." },
  { term: "Rakip Analizi", meaning: "Piyasadaki diğer emlak danışmanlarının veya ilanların neyi nasıl yaptığını inceleme süreci." },
  { term: "Huni (Pipeline)", meaning: "Aday müşterilerin kazanılmasından kapanışa kadar geçen aşamaların bütünü." }
];

const termsPhase3: GlossaryTerm[] = [
  { term: "Kapora", meaning: "Anlaşmanın sağlandığını göstermek için ön ödeme." },
  { term: "Ekspertiz (Değerleme)", meaning: "SPK lisanslı veya uzman taraflarca yapılan resmi değer tahmini." },
  { term: "Kredi Ön Onayı", meaning: "Alıcının konut kredisi kullanabilme uygunluğunun banka tarafından baştan teyit edilmesi." },
  { term: "Komisyon / Hizmet Bedeli", meaning: "İşlemin başarıyla kapanması sonucunda emlak danışmanının aldığı yasal hak." },
  { term: "Co-brokering (Ortak Çalışma)", meaning: "Mülkün bir danışmanda, alıcının diğer danışmanda olduğu ve komisyonun paylaşıldığı işlem modelidir." },
  { term: "Tapu Harcı", meaning: "Satış işlemlerinde devlet tarafından alıcı ve satıcıdan %2 oranında alınan vergi." },
  { term: "Emlak Vergisi", meaning: "Mülk sahiplerince her yıl belediyelere ödenen varlık vergisi." },
  { term: "ROI (Yatırım Getirisi)", meaning: "Bir yatırımın kârlılığını belirten finansal terim." },
  { term: "Kapanış Desteği", meaning: "Alıcı ve satıcıyı anlaşma noktasında ikna edip resmi süreci başlatma manevrası." },
  { term: "Due Diligence", meaning: "Alıcının mülkü almadan önce gerçekleştirdiği hukuki, finansal ve yapısal risk/durum tespiti araştırması." },
  { term: "Hisseli Tapu", meaning: "Mülkiyetin birden fazla kişiye ait olduğu ve tam sınırların net belli olmadığı tapu hali." },
  { term: "İpotek", meaning: "Bir borca karşılık gayrimenkulün teminat gösterilmesi." },
  { term: "Devir Teslim", meaning: "İşlemler bittikten sonra anahtarın ve mülkün fiziksel kontrolünün yeni sahibine geçmesi süreci." },
  { term: "Alım-Satım Sözleşmesi", meaning: "Taraflar arasındaki anlaşmanın şartlarını güvenceye alan, kapora vb ödemeleri tescilleyen belge." },
  { term: "Satış Sonrası Follow-up", meaning: "İşlem kapandıktan sonra müşteri sadakati ve referans için iletişime devam etme." }
];

export function getGlossaryForDay(dayNumber: number): GlossaryTerm[] {
  let pool = termsPhase1;
  if (dayNumber > 30 && dayNumber <= 60) pool = termsPhase2;
  if (dayNumber > 60) pool = termsPhase3;

  const terms: GlossaryTerm[] = [];
  const subsetIndex = (dayNumber - 1) % 3; 
  const baseIndex = subsetIndex * 5;
  for (let i = 0; i < 5; i++) {
    terms.push(pool[(baseIndex + i) % pool.length]);
  }
  return terms;
}

export function getHomeworkForDay(dayNumber: number) {
  if (dayNumber <= 30) {
    return {
      homework_title: "Bugünün Ödevi / Script",
      homework_body: "Bugün aradığın en az 3 kişiye şu cümleyi kur: 'Sizi arama sebebim, bölgenizdeki güncel gelişmelerle ilgili düzenli pazar raporu göndermek istemem. E-postanızı alabilir miyim?'",
      resource_title: "Saha & Ağı Kurmak",
      resource_type: "video" as const,
      resource_placeholder: "Topluluk bulma ve bağlantı haritası (yakında)"
    };
  } else if (dayNumber <= 60) {
    return {
      homework_title: "Bugünün Ödevi / Müzakere",
      homework_body: "Bugünkü portföy görüşmelerinde itirazları dinlerken ilk tepkiyi vermek yerine sadece 'Haklısınız, buna daha detaylı bakalım' deyin ve not alın.",
      resource_title: "Portföy Geliştirme Taktikleri",
      resource_type: "reading" as const,
      resource_placeholder: "İtiraz Karşılama Teknikleri (yakında)"
    };
  } else {
    return {
      homework_title: "Bugünün Ödevi / Kapanış",
      homework_body: "En potansiyelli sıcak adayınla yapacağın görüşmede 'O halde süreci başlatalım mı?' diyerek doğrudan kapanışa gitmeyi dene.",
      resource_title: "Satış Kapanış Senaryoları",
      resource_type: "checklist" as const,
      resource_placeholder: "İşlem kapama kontrol listesi (yakında)"
    };
  }
}
