import { useState, useEffect } from 'react';

interface WeatherData {
    temperature: number;
    weathercode: number;
}

export const useWeather = (rawCity?: string, rawDistrict?: string) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Normalize
    const city = rawCity?.split(',')[0]?.trim();
    let district = rawDistrict?.split(',')[0]?.trim();
    if (district && city && district.includes(city)) {
        district = district.replace(city, '').replace(',', '').trim();
    }

    useEffect(() => {
        let isMounted = true;

        const fetchWeather = async () => {
            if (!city) {
                setWeather(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let latitude: number | null = null;
                let longitude: number | null = null;

                // 1. Geocode
                const queriesToTry = [];
                if (district && city) queriesToTry.push(`${district}, ${city}, Turkey`);
                if (city) queriesToTry.push(`${city}, Turkey`);
                if (district) queriesToTry.push(`${district}, Turkey`);

                for (const query of queriesToTry) {
                    try {
                        const geocodeRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=tr&format=json`);
                        if (geocodeRes.ok) {
                            const geocodeData = await geocodeRes.json();
                            if (geocodeData.results && geocodeData.results.length > 0) {
                                latitude = geocodeData.results[0].latitude;
                                longitude = geocodeData.results[0].longitude;
                                break;
                            }
                        }
                    } catch (e) {
                        // ignore and try next
                    }
                }

                // Fallback for Kayseri
                if ((latitude === null || longitude === null) && (city.toLowerCase().includes('kayseri') || (district && district.toLowerCase().includes('kayseri')))) {
                    latitude = 38.7205;
                    longitude = 35.4826;
                }

                if (latitude === null || longitude === null) {
                    if (isMounted) setWeather(null);
                    return;
                }

                // 2. Weather
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=Europe/Istanbul`);
                if (!weatherRes.ok) throw new Error("Weather failed");
                const weatherData = await weatherRes.json();

                if (isMounted && weatherData.current) {
                    setWeather({
                        temperature: Math.round(weatherData.current.temperature_2m),
                        weathercode: weatherData.current.weather_code,
                    });
                } else if (isMounted) {
                    setWeather(null);
                }
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchWeather();

        return () => {
            isMounted = false;
        };
    }, [city, district]);

    return { weather, loading, error };
};
