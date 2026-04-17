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

  // Google Geocoding API Entegrasyonu
  getCoordsFromGoogle: async (address: string) => {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // .env dosandaki değişken adı
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}&language=tr`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const { lat, lng } = data.results[0].geometry.location;
        return {
          lat: lat,
          lng: lng,
          formattedAddress: data.results[0].formatted_address
        };
      } else {
        console.error("Geocoding Hatası Status:", data.status); // Örn: ZERO_RESULTS, REQUEST_DENIED
        return null;
      }
    } catch (error) {
      console.error("Google Geocoding API bağlantı hatası:", error);
      return null;
    }
  }
};