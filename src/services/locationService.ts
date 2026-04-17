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
  }
};