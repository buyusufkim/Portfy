import * as dotenv from "dotenv";

dotenv.config();

export const fetchMarketData = async (params: {
  city: string;
  district: string;
  neighborhood: string;
  propertyType: string;
  m2: number;
}) => {
  const apiKey = process.env.EVOMI_API_KEY;

  if (!apiKey) {
    return {
      status: "unavailable",
      is_estimated: true,
      source: "System",
      error: "API key missing",
      raw_count: 0,
      averagePrice: null,
      priceTrend: null,
      demandScore: null,
      saleProbability: null,
      lastUpdated: new Date().toISOString()
    };
  }

  try {
    const payload = {
      source: "emlakjet",
      url: `https://www.emlakjet.com/satilik-konut/${params.city.toLowerCase()}-${params.district.toLowerCase()}/`,
      render_js: false
    };

    const response = await fetch('https://api.evomi.com/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Evomi API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Tam doğrulama: Gerekli alanlar var mı?
    const hasData = data && 
       (data.averagePrice !== null && data.averagePrice !== undefined) &&
       (data.priceTrend !== null && data.priceTrend !== undefined) &&
       (data.demandScore !== null && data.demandScore !== undefined) &&
       (data.saleProbability !== null && data.saleProbability !== undefined);

    if (!hasData) {
      return {
        status: "estimated",
        is_estimated: true,
        source: "Evomi (Partial)",
        error: "Insufficient data for live status",
        raw_count: data?.raw_count || 0,
        averagePrice: null,
        priceTrend: null,
        demandScore: null,
        saleProbability: null,
        lastUpdated: new Date().toISOString()
      };
    }

    return {
      status: "live",
      is_estimated: false,
      source: "Evomi Market Data",
      error: null,
      raw_count: data.raw_count || 0,
      averagePrice: data.averagePrice,
      priceTrend: data.priceTrend,
      demandScore: data.demandScore,
      saleProbability: data.saleProbability,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Market Data Fetch Error:", error);
    return {
      status: "unavailable",
      is_estimated: true,
      source: "Fallback",
      error: error instanceof Error ? error.message : "Scraping failed",
      raw_count: 0,
      averagePrice: null,
      priceTrend: null,
      demandScore: null,
      saleProbability: null,
      lastUpdated: new Date().toISOString()
    };
  }
};