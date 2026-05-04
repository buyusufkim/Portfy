export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CampaignCurriculumDay {
  module_title: string;
  lesson_title: string;
  learning_goals: string[];
  lesson_body: string;
  field_example: string;
  common_mistake: string;
  pro_tip: string;
  script_example: string;
  mini_quiz: QuizQuestion[];
  practice_assignment: string;
}

const customDays: Record<number, CampaignCurriculumDay> = {
  1: {
    module_title: "Modül 1: Zihniyet",
    lesson_title: "1. Gün: Gayrimenkulde Başarının Yeni Tanımı ve Sistemin Gücü",
    learning_goals: ["Sistemin önemini anlamak", "Doğru zihniyeti kurmak", "Görünürlük başlatmak"],
    lesson_body: "Bu meslekte başarılı olmak şansa, rastgele ilan girmeye veya piyasanın iyi olmasına değil, kuracağınız sisteme bağlıdır. Birçok yeni ve hatta tecrübeli danışman, her gün 'ne yapacağını' önceden planlamadığı için savrulur. İşimizin özü insanlarla bağ kurmak, güven inşa etmek ve onların gayrimenkul problemlerini proaktif bir şekilde tespit edip çözmektir. İlk 90 gün, tüm kariyerinizi şekillendirecek alışkanlıkların oturduğu en kritik evredir. Ofise gelip bilgisayar başında saatlerce ilanlara bakmak, başkalarının portföylerini incelemek size para kazandırmaz. Para kazandıran tek şey, sahada olmak ve gerçek insanlarla doğru çerçevede konuşmaktır. 'Acaba insanları rahatsız eder miyim?' korkusunu bugün çöpe atın. Unutmayın, siz sıradan bir aracı değil, piyasa verilerine hakim bir uzmansınız. Uzmanlar insanları rahatsız etmez, onlara değerli bilgiler sunarak yardımcı olurlar. Bugünden itibaren her gün düzenli aktiviteler yapacaksınız. Çevrenizi arayın, yepyeni vizyonunuzu onlara aşılayın.",
    field_example: "Rehberindeki 10 kişiyi seçip gayrimenkul hedeflerini aktarmak ve onlara danışman kimliğiyle ücretsiz değer analizi sunmak.",
    common_mistake: "'Şu an satacak yerin var mı?' diye aniden sormak ve amatörce yaklaşmak.",
    pro_tip: "Görüşmenin sonuna 'Çevrenizde taşınmayı düşünen var mı?' sorusunu doğallıkla ekleyin.",
    script_example: "Ahmet Abi merhaba. Gayrimenkul sektöründe yeni ve analitik bir sistemle hizmet veriyorum. Evinizin m2 değeri veya yatırımla ilgili her sorunuzda buradayım.",
    mini_quiz: [
      { question: "En asli görev nedir?", options: ["İlan bakmak", "Yeni insanlarla bağ kurup veri tabanını büyütmek", "Ofiste beklemek"], correctAnswer: 1, explanation: "Temel olan müşteri bulmaktır." },
      { question: "İlk aramada hedef nedir?", options: ["Satış yapmak", "Akıllarda güvenilir iz bırakmak", "Portföy istemek"], correctAnswer: 1, explanation: "İlk temas güven içindir." },
      { question: "En amatör hata hangisidir?", options: ["Değer katmadan baba iş var mı diye sormak", "Analiz yollamak", "Güven aşılamak"], correctAnswer: 0, explanation: "Faydasız beklenti iter." }
    ],
    practice_assignment: "Bugün 5 arkadaşını ara ve onlara işine ne kadar profesyonel yaklaştığını hissettir."
  },
  7: {
    module_title: "Modül 2: Temas ve Güven",
    lesson_title: "7. Gün: Soğuk Aramaya (FSBO) Giriş ve Randevu Yetkinliği",
    learning_goals: ["Soğuk arama dinamikleri", "Reddedilmeyi normalleştirmek", "Randevu koparmak"],
    lesson_body: "Kampın ilk haftası geride kaldı. Sıcak çevreyle temastan sonra gerçek büyüme, hiç tanımadığınız insanların (soğuk pazar) size güvenmesini sağladığınızda başlar. Soğuk arama (Cold Calling) ve özellikle Sahibinden (FSBO) aramaları, sektörün en çok kazandıran kasıdır. Müşteri sizi reddetmiyor, sizin henüz sunamadığınız 'katma değeri' reddediyor. Sahibinden satan birinin motivasyonu 'komisyon ödememek' veya 'emlakçılara güvenmemek'tir. Onları 'Hemen satarım' yalanıyla ikna edemezsiniz. Farklı olduğunuzu, pazar verileri, profesyonel fiyat raporu (CMA) ve vizyoner bir pazarlama ile kanıtlayabilirsiniz. Soğuk aramalarda amacınız telefonda mülkü satmak veya pat diye yetki almak asla değildir; amacınız sadece ama sadece 'Randevu' koparmaktır. Telefonda mülk satılmaz, yüz yüze gelme fırsatı satılır. Onlara 15 dakikalık, bağlayıcılığı olmayan, sadece bölgesel bir piyasa analizi sunacağınız bir yüz yüze görüşme teklif edin.",
    field_example: "10 FSBO ilanını arayıp, 3 randevu kapmak. Cümleleriniz bilgi vermek üzerine olmalı.",
    common_mistake: "Telefonda 'Ben şöyle harikayım' diye kendini övmek ve komisyon pazarlığı yapmak.",
    pro_tip: "Her 'Hayır', sizi 'Evet'e yaklaştıran bir istatistiktir. Günde 20 arama hedefinden şaşmayın.",
    script_example: "Burak Bey merhabalar, doğrudan yetki istemek için aramadım. Bölgedeki emsallerle ilgili 1 aylık gerçek satışları içeren bir raporum var. Uygun olduğunuzda kahve eşliğinde bırakmak isterim.",
    mini_quiz: [
      { question: "Soğuk aramada tek nihai hedef nedir?", options: ["Komisyonu onaylatmak", "Yetki almak", "Yüz yüze randevu oluşturmak"], correctAnswer: 2, explanation: "Görüşmeden hiçbir şey satılamaz." },
      { question: "FSBO satanların birincil motivasyonu nedir?", options: ["Komisyon ödememek ve önceki kötü tecrübeler", "Can sıkıntısı", "Emlakçılarla sohbet isteği"], correctAnswer: 0, explanation: "Maddi koruma güdüsü başkadır." },
      { question: "Komisyon sorusuna telefonda en iyi yanıt?", options: ["Hemen indirim", "Değeri hissettirmeden bedel konuşmayı etik bulmam, rapor sonrası detaylandırırız demek", "Kızmak"], correctAnswer: 1, explanation: "Fiyat en son tartışılır." }
    ],
    practice_assignment: "Bölgeden 3 farklı 'Sahibinden' ilanına pazar analizi bahanesiyle arama yap."
  },
  14: {
    module_title: "Modül 3: Değer İnşası ve CMA",
    lesson_title: "14. Gün: Emsal Okuryazarlığı ve Fiyatın Ötesi",
    learning_goals: ["Karşılaştırmalı Piyasa Analizi", "Şişirilmiş fiyatı kırmak", "Satıcıya verilerle gitmek"],
    lesson_body: "Bugün 14. gün, müşterinin karşısına çıktığınızda alacağınız o büyük soruya hazırlıklıyız: 'Sizce benim evim ne kadar eder?' Eğer ön hazırlıksız, havadan bir rakamla veya ona yaranmak için gerçek dışı bir fiyatı onaylayarak cevap verirseniz, o ev elinizde patlar ve 'acemi' etiketi yersiniz. Fiyatı siz veya satıcı değil, PİYASA ve ALICILAR belirler. Gerçek bir CMA (Piyasa Değer Analizi), sadece o an internette aylardır çürüyen ilanlar demek değildir; bunlar satıcıların pembe rüyalarıdır. Asıl vizyon 'Yakın zamanda gerçekte kaça satılmış' verisini toplamaktır. Mal sahibine konum, cephe, yaş ile dengelenmiş gerçek satış rakamlarını sunmalısınız. Objektif analizle doğru belirlenen fiyat satış getirirken, hatalı ve manipülatif fiyat ancak çevredeki akılcı rakiplere bir basamak olur. Satıcıların şişirilmiş hayallerini kırmak bir sanat formudur. Rakamlar sizin en sadık dostunuzdur.",
    field_example: "Sadece aktif ilan listesini değil, satışı bitmiş geçmiş ilanların fiyat dökümlerini müşteriye kanıt sunmak.",
    common_mistake: "Mülk sahibinin uçuk fiyat hayalini anlamsızca yetki almak uğruna kabul etmek.",
    pro_tip: "Müşteriye Acil, Piyasa, Hayal şeklinde 3 fiyat senaryosu sunarak seçimi ona bırakın.",
    script_example: "Hakan Bey, bu eve 10 Milyon istemek elbette hakkınız. Ama yan daire 8'e satılmışken alıcı neden 2 Milyon fazla ödesin? Kanıtlanmış verilere göre strateji kuralım.",
    mini_quiz: [
      { question: "CMA hazırlanırken en kritik veri hangisidir?", options: ["Aylardır satılamayan evlerin fiyatı", "Yakın geçmişte gerçekten satılan/kapanan mülklerin fiyatı", "Mal sahibinin arzusu"], correctAnswer: 1, explanation: "Bedeli alıcıların ödediği gerçek para belirler." },
      { question: "Fiyatı haddinden yüksek belirlemenin sonu ne olur?", options: ["Çabuk satılır", "Satılmaz, markanıza leke sürer ve piyasa kirliliği yaratır", "Zararsızdır"], correctAnswer: 1, explanation: "Yanlış fiyat itibar kaybıdır." },
      { question: "Fahiş fiyatta inat eden satıcıya nasıl yaklaşılır?", options: ["Siz bilirsiniz demek", "Tartışmak", "Verilerle 3 farklı senaryosunu göstererek riskleri anlatmak"], correctAnswer: 2, explanation: "Mantık her zaman ikna edicidir." }
    ],
    practice_assignment: "Uzmanlık bölgenden 1 portföy için 5 aktif, 3 kesinleşmiş/çıkarılmış emsal bul."
  },
  30: {
    module_title: "Modül 4: Sözleşme Disiplini",
    lesson_title: "30. Gün: Tek Yetki Sözleşmesinin Ciddiyeti",
    learning_goals: ["Münhasır çalışmanın gerekliliği", "İtiraz kırılması", "Rest çekebilme yetisi"],
    lesson_body: "Harika, 1 ay devrildi! Deneyim cebinizde birikiyor. Bugün gayrimenkul işinin şah damarındayız: Münhasırlık (Tek Yetki) inancı. Yetkisiz, açıktan alıcı beklenen o mülk sizin 'portföyünüz' değildir. O sahipsiz bir meta ve siz de ümit tacirliği yapıyorsunuz demektir. Bir satıcı 'Sözleşme imzalamam' diyorsa, aslında 'Sana aylarca mülkümü bağlayacak kadar güvenmiyorum' diyordur. Zayıf danışman 'Peki' der ve portföy çöpünün içine dalar. Güçlü ve deneyimli danışman ise, sözleşmenin bir zincir değil; aksine drone, premium öne çıkarma, profesyonel çekim ve gerçek reklam yatırımı için tek resmi ve yasal garanti olduğunu anlatır. İtirazları asla kişisel bir saldırı saymayın. Satıcı sizden değil, geçmiş travmalarından ve bağlayıcılıktan çekinmektedir. Onun korkusunu bir mantık kalesine çevirerek aşmak ancak uzmanlara mahsustur. Bazen ustalık, sırf sözleşme yapmamakta inat eden toksik bir satıcıya 'O halde iyi günler' deyip lüksünüzü kullanarak o masadan kalkabilmektir.",
    field_example: "Tek yetkisi olmayan çalışmalara katiyen reklam ve pazarlama bütçesi harcamama kararlılığını hissettirmek.",
    common_mistake: "Tüm sokak elden ele dolaşan 'yitik' mülklere adını yazdırmak için yalvarmak.",
    pro_tip: "Yanlış fiyatta direten ve sözleşme reddeden adaya ret verme hakkınızı kullanın. Bu özgüven çok satıcıyı size döndürür.",
    script_example: "Ceren Hanım, herkesin koşturduğu açık bir ev alıcılar elitinde şüphe doğurur. Emsalsiz pazarlama istiyorsanız tam koruma, yani tek yetki şarttır.",
    mini_quiz: [
      { question: "Tek yetki vermeyen satıcı bize ne demektedir?", options: ["Çok güvenmiştir", "Pazarlama stratejisine ve markamıza henüz ikna olmamıştır", "Sözleşmeyi sevmez"], correctAnswer: 1, explanation: "İçteki korkuyu yenen yetkiyi alır." },
      { question: "Açık, yetkisiz listelenmiş mülkün algısı nasıldır?", options: ["Çok temiz algılanır", "Sahipsiz, indirim koparması çok kolay ve zor/sorunlu mülk hissi yaratır", "Popülerdir"], correctAnswer: 1, explanation: "Pazar çöpü haline gelir." },
      { question: "Sözleşme istemeyen yüksek fiyatlı adaya ne yapılmalı?", options: ["Sürekli aramak", "Göz yummak", "Profesyonelce ret verip bırakmak ve vakit kurtarmak"], correctAnswer: 2, explanation: "Zamandan çalana geçit verilmez." }
    ],
    practice_assignment: "Sana yetki vermemiş eski bir müşterine ses kaydıyla tek yetkinin mülke kazandırdığı somut faydayı açıkla."
  },
  45: {
    module_title: "Modül 5: Besleme ve Analiz",
    lesson_title: "45. Gün: Sessiz Takip, Drip İletişim ve Gerçek Alıcı Ayrımı",
    learning_goals: ["Follow-up sihri", "Turist alıcıdan korunmak", "Bilgi ile besleme"],
    lesson_body: "Kampın tam yarısındasınız. Kariyerde kırılım noktasına geliyoruz. İşin büyük parası ilk merhabaların değil, 5. ile 12. görüşmelerin ve derin takiplerin (Follow-up) içindedir. Yeni danışmanlar bir reddediliş sonrası küser. Uzmanlar ise onları demler. 'Ne karar verdiniz, evi aldınız mı?' şeklinde baskıcı standart aramalar iletişim kopartır. Profesyonel takip; müşteriye rutin aralıklarla, bölge faiz raporları, gerçekleşmiş komşu sokak satışı veya mimari trend gibi sadece 'değer' katan içerik formasyonlarında gitmektir. Bu onlarda, sizin hala sahada, aktif ve piyasa denetleyicisi olduğunuz hissini yaratır. Ancak enerjinizi çalanlara dikkat edin: Zaman hırsızları (Turist alıcılar). Finansmanı hazır olmayan eşiyle karar almadan evleri sadece 'bir bakalım abi' diyerek ücretsiz müze niyetine gezen profiller sizi bitirir. Sadece A kalitesindeki (Nakdi hazır, kararları 30 güne sınırlanmış) alıcıları arabanıza atıp gezdirin. Diğerlerini damlama bildirimlerine bırakın.",
    field_example: "Sana ilgilenmediğini/bekleyeceğini söylemiş 3 pasif müşteriye güncel kredi faizi karşılaştırması yollamak.",
    common_mistake: "Sadece alıcı hazırken ona odaklanmak, bedava gezi rehberliği yapmak.",
    pro_tip: "Bütçeyi dürüstçe sorgulamak sizin hakkınızdır. Cebinde parası hazır olmayana zaman kaptırmayın.",
    script_example: "Filiz Hanım, rahatsızlık vermek için değil; bölgenizdeki son 2 ayda değişen faiz oranlarının fiyat baskısındaki analiz dosyasını atmak için aradım. Ne zaman hazır olursanız buradayım.",
    mini_quiz: [
      { question: "Etkili takip araması nasıl olmalıdır?", options: ["Karar ver diye sıkıştırmak", "Tüketiciye fayda katan rapor/bilgiyi cömertçe sunmak", "Her gün naber demek"], correctAnswer: 1, explanation: "Fayda odaklı kalırsan seni kalıcı lider görür." },
      { question: "Satışların büyük bloğu nezaman kapanır?", options: ["İlk dakikalarda", "İlk ay", "Takibin 5-12 tekrarlı güven inşa evresinden sonra"], correctAnswer: 2, explanation: "Bağ kurulmadan yatırım çıkmaz." },
      { question: "Gerçek A Sınıfı alıcı kimdir?", options: ["Çok para soran", "Ev bakan rastgele biri", "Kredibiletisi/Bütçesi hazır teste tabi olan ve zaman aciliyeti olan kişi"], correctAnswer: 2, explanation: "Aciliyet artı bütçe eşittir Alıcı." }
    ],
    practice_assignment: "Suskun 3 adayını bul, bir pazar özeti ile hatırlatma yolla."
  },
  60: {
    module_title: "Modül 6: Müzakere Ustası",
    lesson_title: "60. Gün: Masayı Yönetmek ve Yazılı Teklifin İktidarı",
    learning_goals: ["Arabulucu dengesini kurmak", "Sözlü teklif amatörlüğünü bırakmak", "kriz tırmanışını durdurmak"],
    lesson_body: "Tam 2 ayı bitiriyorsunuz! Artık süreçleriniz ciddi meyveler veriyor olmalı. Geldiğimiz nokta işin kalbi: Müzakere! Pazar masası kurulduğunda eğer rakamları WhatsApp veya telefonda mahalle ağzıyla sözlü tartışıyorsanız, o işlemi elinizle sabote ediyorsunuz demektir. Teklif, kesinlikle ve kesinlikle YAZILI dökümana işlenmiş kaporalı formlarla ciddiyet bulur. Mal sahibini, boş ümitlerle arayıp 'Bize yarı fiyatı veriyorlar' diye üzmek profesyonel intiharıdır. Masadayken her iki taraf da haklı görünmek ve ezilmemek ister. Siz iki düşman savaşçı arasındaki hakem değil, ikisinin aynı limana barışla inmesini sağlayan 'Yatıştırıcı Köprüsünüz'. Pazarlık yalnızca paradan ibaret değildir; kapora bedelleri, taşınma tarihi, demirbaş eşyaların mülkte kalması gibi esnek yan maddeler, tırmanan bir kriz anında bir hava yastığı görevi görür. Sessiz kalarak karşı tarafın gardını okuyun, ego savaşına değil çözüm tasarımcılığına odaklanın.",
    field_example: "Alıcının heyecanlı, hızlı ve fahiş indirimli teklifini hemen kağıda dökmeye zorlayıp onun gerçek ciddiyetini test etmek.",
    common_mistake: "Sözlü WhatsApp teklifini sırtlayıp arayıcılık oynamak ve iki tarafı da birbirine düşürecek gaflar yapmak.",
    pro_tip: "Müzakere tıkandığında tamamen konuyu değiştirip evi teslim tarihinde veya ufak bir vergi ödemesinde mutabık kalıp psikolojik yumuşama sağlayın.",
    script_example: "Murat Bey, o fiyat mülk sahibinin sınırlarını çok aşıyor. Ama niyetinizi resmi bir belgeye yazar ve kaporanızı çivilerseniz, onun aklını çelecek gücümüz olur.",
    mini_quiz: [
      { question: "Müzakerenin en sağlam iskeleti nedir?", options: ["Sözlü inanç", "Yazılı bir niyet mektubu ve teminatı (Kapora)", "Whatsapp logları"], correctAnswer: 1, explanation: "Yazı her masayı ağırlaştırır." },
      { question: "Rakam pazarlığı durduğunda ne yapmalı?", options: ["Ödünleri fiyat dışında zaman, tarih eşya gibi yan esnek maddelerden takaslaşmak", "Komisyondan vazgeçmek", "Masadan kalkmak"], correctAnswer: 0, explanation: "Alternatif çözümler yeni pencereler açar." },
      { question: "Danışman masada nasıl görünmelidir?", options: ["Çözüm üreten, tarafsız dengeleyici köprü", "Alıcının sert avukatı", "Satıcının çalışanı"], correctAnswer: 0, explanation: "Tarafsızlık adaleti, adalet güveni doğurur." }
    ],
    practice_assignment: "Ofis teklif formunu aç, maddeleri baştan aşağı ezberle ve mental bir doldurma provası yap."
  },
  75: {
    module_title: "Modül 7: Kapanış Hissi ve Sorunları Giderme",
    lesson_title: "75. Gün: Tapu Öncesi Due Diligence ve Komisyon Kalkanı",
    learning_goals: ["Tapu ve iskan analiz pürüzlerini elemek", "Komisyon saldırısına dik durmak", "Son saniye caymalarını tutmak"],
    lesson_body: "Son faza girdik. 75 olağanüstü gün! İlerleyen süreçte her şeyi bağladınız, kapanış anına yürüdünüz. İşte tam bu 'imza anı', şeytanın en çok saklandığı köşedir. Müşteri kredisinin yatmaması, hisse çatışmaları ya da haciz şerhi masada bomba gibi patlar. Bu yıkım, 'Due Diligence' yani detaylı evrak ve hukuki ön-analiz yapmamanın faturalarıdır. Siz bir profesyonel olarak dairenin tüm karanlık evraklarını satış ilanına girmeden önce, ta en başında temizlemiş olmalısınız. Ve tabii en meşhur sahne: 'Komisyondan bize bir kıyak yap' saldırısı. Aylar süren emeklerin, gecelerin yok sayılıp, cebinize giren paranın haksız olduğunu ima eden o acı an. Siz eğer sunduğunuz hız, mükemmel analiz, tarafsız pazarlık ve güven kalkanınıza inancını tam oturttuysanız; işte o masada gülümseyerek diklemesine durursunuz! Emeğiniz asla verilen %2 veya bir kiralık aydan daha ucuz değildir. Nezaketi bozmadan, verdiğiniz değerin sözleşmesini yüzlerinde birer teşekkür ışığına çevirin.",
    field_example: "İndirim yap talebi gelince net ve dostane bir dille bunun sunduğum yüksek profesyonelliğin bir sigortası olduğunu söyleyip masayı kapatmak.",
    common_mistake: "Süreci sadece sözleşmede tutmak ve malın haciz, ipotek, hisse gibi temel verilerini hiçbir zaman arka planda kontrol etmemek.",
    pro_tip: "Son anlarda müşterinin korkusu (Buyer's Remorse) yükselir. Onları geçmişte gösterdikleri bu olumlu tercih üzerinden sürekli rahatlatıp sakinleştirin.",
    script_example: "Serkan Bey, süreç boyunca mülkü en iyi hıza ve fiyata ulaştırmayı vadederek başladım. Başardıklarımız ortada. İndirim yapmam kariyer standardıma ve kalite sigortanıza ters düşer, haydi imzalayalım.",
    mini_quiz: [
      { question: "Kapanışta işlemler iptal olma nedeni genelde ne olur?", options: ["Kararsızlık", "Baştan sorgulanmayan hukuki eksiklikler, iskan veya şerhler gibi due diligence hataları", "Küslük"], correctAnswer: 1, explanation: "Ön tespit hayat kurtarır." },
      { question: "Komisyon indirimi emrivakisi gelirse çözüm nedir?", options: ["İndirmek", "Nazikçe ama tavizsiz bir tutumla sağlanan katma değeri ve kaliteyi hatırlatmak", "Tepki göstermek"], correctAnswer: 1, explanation: "Duruşunuz hizmetinizin kalitesidir, ona sahip çıkın." },
      { question: "Son saniye alıcı paniği neyle çözülür?", options: ["Panikle", "Sakince mantık süzgecini yeniden göstererek konfor hissini pompalamakla", "Terk edip giderek"], correctAnswer: 1, explanation: "Müşteri, limandaki en sağlam kayaya (size) sığınır." }
    ],
    practice_assignment: "Aktif 2 portföyünün tapu ve imar durumlarını, hisse veya sorun yapısı ihtimallerini teyit et."
  },
  90: {
    module_title: "Modül 8: Mezuniyet, Öz-Raporlama",
    lesson_title: "90. Gün: Çarkı Döndürmek, Referans Matematiği ve Yeni Başlangıç",
    learning_goals: ["Başarı kutlamasını yönetmek", "Pasiflerin ağa (referans) dönmesini sağlamak", "Disiplini kalıcılaştırmak"],
    lesson_body: "BAŞARDINIZ! KAMP BİTTİ! Lütfen durup bugüne kadar kendi emeğinize ve geldiğiniz noktaya bir bakın. Hiçbir bağınız yokken arama yaptınız, red yediniz, pazarlık sürdürdünüz. Ancak tehlike çanları esas şimdi başlar. Bir başarı veya kapalı satış sonrası 'nasılsa oldu' diye 2 hafta yatışa geçmek asıl ölümcüldür. Kazanımlar ivme kaybolduğu an uçecek olan bir kum tepesidir. Kamp bitti diye günlük 3 arama rutini çöpe gitmeyecek. Bugün amacınız 'soğuk' olan dünyayı 'sıcak' referans havuzuna çekmektir. Her mutlu müşteri sizin sahada canlı dolaşan billbordunuz, satış temsilcinizdir. Google profilleri için referans isteme vakti tam the kapanış haftalarıdır. Tapu atandı, anahtarlar verildiği anda onları bu referans çağına ortak edin. İşlemi mutlu kapatıp o güzelim bağlantıyı bir CRM töz yığınına atmayın; doğum gününde veya yıl dönümünde onlarda ışıldayın. Zinciri kurduğunuz an peşinden koşan değil, kapısı doğrudan çalınan o büyük danışmana dönüşeceksiniz. Hoş geldin Ustalık Sınıfı!",
    field_example: "Memnun ayrılan geçmiş satışınızdaki müşteriye süreci öven ve yönlendirme talep eden harika bir sesli not atmak.",
    common_mistake: "Parayı kazandıktan sonra müşteriye elveda deyip sıfırlanmak ve ömürlük bir ref kaynağını çöpe atmak.",
    pro_tip: "Kazandıkça daha çok rutin bağlamalısınız. Tatmin hissi duraklamaya, açgözlülük hataya neden olur; dengede, sisteme sadık kalın.",
    script_example: "Burak Bey, sizin o harika evin işlerini tamamlarken çok keyif aldım. Eğer aynı profesyonelliği deneyimlemesini istediğiniz arkadaşlarınız olursa, memnuniyetle sizin hatrınızla yönlendirebilirsiniz.",
    mini_quiz: [
      { question: "Kapalı (büyük) işlemden sonra en çok yapılan hata nedir?", options: ["Sistemi ve randevu aramalarını o doyumla tamamen kesmek", "Dinlenmek", "Kutlama"], correctAnswer: 0, explanation: "İvme, her başarının ateşidir. Yanmayan odun kül olur." },
      { question: "Büyümenin kalbi olan sürdürülebilir kavram nedir?", options: ["Referans zinciri; her mutlu müşterinin bedava savunucu ve pazarlamacı olması", "Ofiste daha çok beklemek", "Uygun komisyon yapmak"], correctAnswer: 0, explanation: "Referans, maliyetsiz ve güven oranı %100 bir reklamdır." },
      { question: "90 günlük kapanış sonrasında hangi vizyon temel alınır?", options: ["Sıfıra dönmek", "Tüm öğrendiklerini rutin bir kariyer omurgasına, nefes almak gibi doğal bir sisteme yedirmek", "Terk etmek"], correctAnswer: 1, explanation: "Artık oyun yeni kurallarıyla sonsuzluğa çevrildi." }
    ],
    practice_assignment: "Geçen 90 güne bak. En büyük üç eksiğini bir kağıda yaz ve kendine hedeflerin için sessiz bir yemin mektubu yaz."
  }
};

export function getCurriculumForDay(dayNumber: number): CampaignCurriculumDay {
  if (customDays[dayNumber]) {
    return customDays[dayNumber];
  }

  // Faz bazlı genel fallback (1,7,14,30,45,60,75,90 dışındaki günler)
  if (dayNumber <= 7) {
    return {
      module_title: "Modül 1: Zihniyet",
      lesson_title: "Temel ve Kurallar (Ara Gün)",
      learning_goals: ["Disiplin", "Araştırma", "Planlama"],
      lesson_body: "Bu evrede sisteminizin taşları oturacak. Rutininizi bozmayın. Çevrenizi, rehberinizdeki kişileri arayın ve onlara yeni vizyonunuzdan bahsedin. Her gün güne başlarken 3 öncelikli hedefinizi belirleyin ve bunlardan taviz vermeden ilerleyin.",
      field_example: "Sıcak çevre temaslarına hız kesmeden devam etmek.",
      common_mistake: "Günü plansız ve sadece akışına bırakarak ilan bakmakla tüketmek.",
      pro_tip: "Takvimde zaman blokajı tekniğini uygulayın. Sabah saatlerini proaktif aramaya ayırın.",
      script_example: "'Piyasadaki son gelişmeleri süzdüğüm yeni analizlerime dair bilgilendirmelerim sürecek.'",
      mini_quiz: [
        { question: "Temel alışkanlık neden önemlidir?", options: ["Patrona hoş görünmek", "İstikrarla güven inşası yapmak", "Zaman geçirmek"], correctAnswer: 1, explanation: "Gayrimenkul maraton işidir, sprint değil." }
      ],
      practice_assignment: "Zaman blokajı kavramını yarının ajandasına uygula."
    };
  } else if (dayNumber <= 30) {
    return {
      module_title: "Modül 3: Sunum ve Gelişim",
      lesson_title: "Piyasa ve Karar (Ara Gün)",
      learning_goals: ["Trend takibi", "Rakip ilanı analizi", "Veri"],
      lesson_body: "Müşterinin karşısına çıktığınızda size ilk soracağı şey evinin değeridir. Buna verilerle (CMA) cevap vermek zorundasınız. Gün gün bölgenizin hakimiyetini artırın. İlanlardan ziyade, neyin satıldığını ve neyin fiyatının kırıldığını analiz edin. Uzmanlık, bölgenizdeki arz ve talebin ritmini bilmektir.",
      field_example: "Bölgenizdeki 5 sokak ötedeki emsalleri dolaşmak ve not almak.",
      common_mistake: "Sadece ilanda yazan fiyata inanmak.",
      pro_tip: "Her gün minimum 5 portföy analizi yaparak değer reflekslerinizi güçlendirin.",
      script_example: "'Bu sokakta satılmayan ilan oranının artması bize yeni bir fiyat stratejisi gerektiğini söylüyor.'",
      mini_quiz: [
        { question: "Gelişim için sahada en değerli olan şey nedir?", options: ["Broşür", "Güncel ve gerçekleşmiş piyasa verisi", "Yaka kartı"], correctAnswer: 1, explanation: "Sahibinin hisleri değil, piyasa verileri satışı doğrular." }
      ],
      practice_assignment: "Sokak sokak dolaşıp, bugün en az 1 saat bölgeni zihninde haritalandır."
    };
  } else if (dayNumber <= 60) {
    return {
      module_title: "Modül 5: Besleme ve Bekleme",
      lesson_title: "Sessizliği Yönetme (Ara Gün)",
      learning_goals: ["Damlama iletişim", "Segmentasyon", "Sabır"],
      lesson_body: "Kariyerinizin omurgası takip süreçleridir. Çoğu işlem 5. ile 12. görüşmeler arasında kapanır. Müşterinizi CRM'de unuttuğunuz her gün, rakiplerinize para kazandırıyorsunuz demektir. Sessiz aday tehlikesine dikkat edin. Onlara rutin aralıklarla değer sağlayan (piyasa raporu vb.) bildirimler sunarak güven inşa edin.",
      field_example: "Sessiz adaya piyasa faizi raporu yollamak.",
      common_mistake: "Hemen satış baskısı kuran takip aramaları yapmak.",
      pro_tip: "'Sizi bir sonraki hafta tekrar bilgi vermek için aramam uygun mu?' sorusu sihir gibidir.",
      script_example: "'Burak Bey geçen ayki piyasa analizinden farklı bir faiz tablosu oluştu, incelemenizi tavsiye ederim.'",
      mini_quiz: [
        { question: "Follow-up özünde nedir?", options: ["Sürekli ürün itmek", "Değerli bilgi damlasıyla güveni canlı tutmak", "Geçiştirmek"], correctAnswer: 1, explanation: "Müşteri güvendiği kişiyle hareket eder." }
      ],
      practice_assignment: "Sessiz 3 potansiyel adaya değer katan birer mesaj at."
    };
  } else {
    return {
      module_title: "Modül 7: Kapanışa Doğru",
      lesson_title: "Soğukkanlı Adımlar (Ara Gün)",
      learning_goals: ["Müzakere masası", "Kriz yönetimi", "Yazılı teklif"],
      lesson_body: "Müzakere masasında soğukkanlılığını koruyan ve taraflar arasında adaletli, köprü işlevi gören kazanır. İtirazlar genellikle fiyatta çıkar ama asıl ödünler başka konulardan (vadeler, eşyalar) sağlanır. Masada sessizliğin gücünü kullanın ve komisyon kırılması taleplerine her zaman profesyonelce şerh koyarak vizyonunuzu savunun.",
      field_example: "Tarafları ortak noktada buluşturmak için form üzerinden ilerlemek.",
      common_mistake: "Sözlü teklif yüzünden ciddiyetsiz bir duruma düşmek.",
      pro_tip: "Masada çıkan tüm anlaşmazlıkları, iki tarafında egosu kırılmadan esnek tekliflere çevirin.",
      script_example: "'Bu teklifi ancak somut bir niyet formuna dökersek rakam ciddiye alınır.'",
      mini_quiz: [
        { question: "Kapanışta müzakere nasıl güvenceye alınır?", options: ["Bağırarak", "Yazılı imzalı bağlayıcı (kaporalı) formlarla", "Geçiştirerek"], correctAnswer: 1, explanation: "Belge, niyetin en samimi halidir." }
      ],
      practice_assignment: "Potansiyel kapanış adaylarıyla ilgili evrak eksiklerinizi (due diligence) kontrol edin."
    };
  }
}
