import * as tn from 'turkey-neighbourhoods';

export const locationService = {
  getCities: () => {
    return tn.getCityNames().sort((a, b) => a.localeCompare(b, 'tr'));
  },
  getDistricts: (cityName: string) => {
    const cityCode = Object.keys(tn.cityNamesByCode).find(key => tn.cityNamesByCode[key] === cityName);
    if (!cityCode) return [];
    return tn.getDistrictsByCityCode(cityCode).sort((a, b) => a.localeCompare(b, 'tr'));
  },
  getNeighborhoods: (cityName: string, districtName: string) => {
    const cityCode = Object.keys(tn.cityNamesByCode).find(key => tn.cityNamesByCode[key] === cityName);
    if (!cityCode) return [];
    return tn.getNeighbourhoodsByCityCodeAndDistrict(cityCode, districtName).sort((a, b) => a.localeCompare(b, 'tr'));
  },
  getDistrictCoords: (cityName: string, districtName: string) => {
    // turkey-neighbourhoods doesn't provide coordinates, so we return a default or null
    return { lat: 41.0082, lng: 28.9784 }; // Default to Istanbul coordinates
  }
};
