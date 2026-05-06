import { useState, useEffect } from 'react';

interface WeatherData {
    temperature: number;
    weathercode: number;
}

export const useWeather = (city?: string, district?: string) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

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
                // 1. Geocode
                const query = district ? `${district}, ${city}, Turkey` : `${city}, Turkey`;
                const geocodeRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=tr&format=json`);
                
                if (!geocodeRes.ok) throw new Error("Geocoding failed");
                const geocodeData = await geocodeRes.json();
                
                if (!geocodeData.results || geocodeData.results.length === 0) {
                    if (isMounted) setWeather(null);
                    return;
                }

                const { latitude, longitude } = geocodeData.results[0];

                // 2. Weather
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                if (!weatherRes.ok) throw new Error("Weather failed");
                const weatherData = await weatherRes.json();

                if (isMounted && weatherData.current_weather) {
                    setWeather({
                        temperature: Math.round(weatherData.current_weather.temperature),
                        weathercode: weatherData.current_weather.weathercode,
                    });
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
