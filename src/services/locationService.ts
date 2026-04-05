export interface City {
  name: string;
  districts: District[];
}

export interface District {
  name: string;
  neighborhoods: string[];
  lat: number;
  lng: number;
}

export const TURKEY_LOCATIONS: City[] = [
  {
    name: "İstanbul",
    districts: [
      {
        name: "Beşiktaş",
        neighborhoods: ["Abbasağa", "Akatlar", "Arnavutköy", "Balmumcu", "Bebek", "Cihannüma", "Dikilitaş", "Etiler", "Gayrettepe", "Konaklar", "Kuruçeşme", "Kültür", "Levazım", "Levent", "Mecidiye", "Muradiye", "Nisbetiye", "Ortaköy", "Sinanpaşa", "Türkali", "Ulus", "Vişnezade", "Yıldız"],
        lat: 41.0422,
        lng: 29.0074
      },
      {
        name: "Kadıköy",
        neighborhoods: ["19 Mayıs", "Acıbadem", "Bostancı", "Caddebostan", "Caferağa", "Dumlupınar", "Eğitim", "Erenköy", "Fenerbahçe", "Feneryolu", "Fikirtepe", "Göztepe", "Hasanpaşa", "Koşuyolu", "Kozyatağı", "Merdivenköy", "Osmanağa", "Rasimpaşa", "Sahrayıcedit", "Suadiye", "Zühtüpaşa"],
        lat: 40.9910,
        lng: 29.0270
      },
      {
        name: "Şişli",
        neighborhoods: ["19 Mayıs", "Bozkurt", "Cumhuriyet", "Duatepe", "Ergenekon", "Esentepe", "Eskişehir", "Feriköy", "Fulya", "Gülbahar", "Halaskargazi", "Halide Edip Adıvar", "Halil Rıfat Paşa", "Harbiye", "İnönü", "İzzet Paşa", "Kaptanpaşa", "Kuştepe", "Mahmut Şevket Paşa", "Mecidiyeköy", "Merkez", "Meşrutiyet", "Paşa", "Teşvikiye", "Yayla"],
        lat: 41.0600,
        lng: 28.9870
      },
      {
        name: "Sarıyer",
        neighborhoods: ["Ayazağa", "Bahçeköy", "Baltalimanı", "Büyükdere", "Cumhuriyet", "Çayırbaşı", "Darüşşafaka", "Demirciköy", "Emirgan", "Fatih Sultan Mehmet", "Ferahevler", "Garipçe", "Gümüşdere", "Huzur", "İstinye", "Kemer", "Kısırkaya", "Kireçburnu", "Kocataş", "Kumköy", "Madaden", "Maslak", "Pınar", "Poligon", "PTT Evleri", "Reşitpaşa", "Rumeli Hisarı", "Rumeli Kavağı", "Rumelifeneri", "Tarabya", "Uskumruköy", "Yeniköy", "Yenimahalle", "Zekeriyaköy"],
        lat: 41.1670,
        lng: 29.0500
      }
    ]
  },
  {
    name: "Ankara",
    districts: [
      {
        name: "Çankaya",
        neighborhoods: ["Ayrancı", "Bahçelievler", "Balgat", "Beysukent", "Birlik", "Cebeci", "Dikmen", "Emek", "Esat", "Gaziosmanpaşa", "Hürriyet", "Kavaklıdere", "Kırkkonaklar", "Kızılay", "Maltepe", "Mebusevleri", "Oran", "Öveçler", "Söğütözü", "Yıldız"],
        lat: 39.9208,
        lng: 32.8541
      },
      {
        name: "Yenimahalle",
        neighborhoods: ["Batıkent", "Çayyolu", "Demetevler", "İvedik", "Ostimi", "Şentepe", "Ümitköy"],
        lat: 39.9680,
        lng: 32.7980
      }
    ]
  },
  {
    name: "İzmir",
    districts: [
      {
        name: "Konak",
        neighborhoods: ["Alsancak", "Basmane", "Göztepe", "Güzelyalı", "Kahramanlar", "Kemeraltı", "Küçükyalı", "Pasaport", "Varyant"],
        lat: 38.4189,
        lng: 27.1287
      },
      {
        name: "Karşıyaka",
        neighborhoods: ["Alaybey", "Atakent", "Bostanlı", "Mavişehir", "Nergiz", "Şemikler", "Yalı"],
        lat: 38.4590,
        lng: 27.1100
      }
    ]
  }
];

export const locationService = {
  getCities: () => TURKEY_LOCATIONS.map(c => c.name),
  getDistricts: (cityName: string) => {
    const city = TURKEY_LOCATIONS.find(c => c.name === cityName);
    return city ? city.districts.map(d => d.name) : [];
  },
  getNeighborhoods: (cityName: string, districtName: string) => {
    const city = TURKEY_LOCATIONS.find(c => c.name === cityName);
    if (!city) return [];
    const district = city.districts.find(d => d.name === districtName);
    return district ? district.neighborhoods : [];
  },
  getDistrictCoords: (cityName: string, districtName: string) => {
    const city = TURKEY_LOCATIONS.find(c => c.name === cityName);
    if (!city) return null;
    const district = city.districts.find(d => d.name === districtName);
    return district ? { lat: district.lat, lng: district.lng } : null;
  }
};
