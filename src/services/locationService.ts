import * as tn from 'turkey-neighbourhoods';

export const locationService = {
  getCities: () => {
    return [...tn.getCityNames()].sort((a, b) => a.localeCompare(b, 'tr'));
  },
  getDistricts: (cityName: string) => {
    const cityCode = Object.keys(tn.cityNamesByCode).find(key => tn.cityNamesByCode[key] === cityName);
    if (!cityCode) return [];
    return [...tn.getDistrictsByCityCode(cityCode)].sort((a, b) => a.localeCompare(b, 'tr'));
  },
  getNeighborhoods: (cityName: string, districtName: string) => {
    const cityCode = Object.keys(tn.cityNamesByCode).find(key => tn.cityNamesByCode[key] === cityName);
    if (!cityCode) return [];
    return [...tn.getNeighbourhoodsByCityCodeAndDistrict(cityCode, districtName)].sort((a, b) => a.localeCompare(b, 'tr'));
  },
  
  // getDistrictCoords yerine dinamik geocoding için adres formatı üretiyoruz
  getGeocodeAddressString: (cityName: string, districtName: string, neighborhood?: string) => {
    if (!cityName || !districtName) return null;
    return `${neighborhood ? neighborhood + ', ' : ''}${districtName}, ${cityName}, Türkiye`;
  },

  // OpenStreetMap Nominatim Geocoding API Entegrasyonu (Google Maps yerine ücretsiz)
  getCoordsFromOSM: async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name
        };
      } else {
        console.warn("Geocoding Uyarı: Sonuç bulunamadı");
        return null;
      }
    } catch (error) {
      console.warn("OSM Geocoding API bağlantı uyarısı:", error);
      return null;
    }
  }
};