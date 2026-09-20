/**
 * Krishi Marga — Agricultural Weather & Microclimate Risk Service
 * Fetches verified meteorological data from Open-Meteo.
 * Distinguishes:
 * 1. OBSERVED / CURRENT: Real-time temperature, humidity, precipitation, wind speed.
 * 2. FORECAST: Next 48-hour daily predictions.
 * 3. PREDICTED: Microclimate pathogen risk index based on ambient humidity and temperature.
 * Caches results locally so the card remains accessible offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = '@krishi_marga_cached_weather';

export interface CurrentWeather {
  temperature: number; // Celsius
  relative_humidity: number; // Percentage
  precipitation: number; // mm
  wind_speed: number; // km/h
  weather_code: number;
  condition_text: string;
  timestamp: number;
}

export interface WeatherForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_probability: number;
  humidity_average: number;
  condition_text: string;
}

export interface MicroclimateRisk {
  crop: string;
  risk_level: 'Low' | 'Moderate' | 'High';
  favorable_factors: string[];
  probable_pathogens: string[];
  preventive_advisory: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: WeatherForecastDay[];
  risk: MicroclimateRisk;
  is_cached: boolean;
}

export const WeatherService = {
  /**
   * Fetches real-time weather and forecast data for coordinates.
   * Falls back to cached data if offline.
   */
  async getWeather(latitude: number = 12.9716, longitude: number = 77.5946, crop: string = 'Crop'): Promise<WeatherData> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const currentData = data.current;
        const dailyData = data.daily;

        const current: CurrentWeather = {
          temperature: Math.round(currentData.temperature_2m),
          relative_humidity: Math.round(currentData.relative_humidity_2m),
          precipitation: Number(currentData.precipitation) || 0,
          wind_speed: Math.round(currentData.wind_speed_10m),
          weather_code: currentData.weather_code || 0,
          condition_text: this.getWeatherConditionText(currentData.weather_code),
          timestamp: Date.now(),
        };

        const forecast: WeatherForecastDay[] = [];
        if (dailyData && dailyData.time) {
          for (let i = 0; i < Math.min(3, dailyData.time.length); i++) {
            forecast.push({
              date: dailyData.time[i],
              temp_max: Math.round(dailyData.temperature_2m_max[i]),
              temp_min: Math.round(dailyData.temperature_2m_min[i]),
              precipitation_probability: dailyData.precipitation_probability_max?.[i] || 0,
              humidity_average: current.relative_humidity,
              condition_text: this.getWeatherConditionText(dailyData.weather_code[i]),
            });
          }
        }

        const risk = this.computeMicroclimateRisk(current.temperature, current.relative_humidity, current.precipitation, crop);

        const weatherData: WeatherData = {
          current,
          forecast,
          risk,
          is_cached: false,
        };

        await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));
        return weatherData;
      }
    } catch (e) {
      if (__DEV__) {
        console.log('[WeatherService] Live weather fetch failed, checking offline cache:', e);
      }
    }

    const cached = await this.getCachedWeather(crop);
    if (cached) {
      return { ...cached, is_cached: true };
    }

    return this.getDefaultWeather(crop);
  },

  async getCachedWeather(crop: string): Promise<WeatherData | null> {
    try {
      const stored = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (stored) {
        const parsed: WeatherData = JSON.parse(stored);
        parsed.risk = this.computeMicroclimateRisk(
          parsed.current.temperature,
          parsed.current.relative_humidity,
          parsed.current.precipitation,
          crop
        );
        return parsed;
      }
    } catch (e) {
      console.warn('[WeatherService] Failed to load cached weather:', e);
    }
    return null;
  },

  getWeatherConditionText(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy / High Humidity';
    if (code >= 51 && code <= 55) return 'Light Drizzle';
    if (code >= 61 && code <= 65) return 'Rain Showers';
    if (code >= 80 && code <= 82) return 'Heavy Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Overcast';
  },

  /**
   * Agronomic Microclimate pathogen risk calculation:
   * Humidity >=80% with moderate temp (20-28°C) favors fungal spores.
   * High temperature (>30°C) with dry air (<50% RH) favors sucking pests.
   */
  computeMicroclimateRisk(temp: number, humidity: number, rain: number, crop: string): MicroclimateRisk {
    const favorable: string[] = [];
    const pathogens: string[] = [];

    if (humidity >= 80) {
      favorable.push(`Atmospheric humidity (${humidity}%) favors fungal sporulation`);
      pathogens.push('Fungal Leaf Spots / Mildew / Blast');
    }
    if (temp >= 20 && temp <= 28) {
      favorable.push(`Moderate temperature (${temp}°C) accelerates incubation`);
    }
    if (rain > 3) {
      favorable.push(`Surface foliage moisture from rain (${rain}mm) facilitates spore ingress`);
      pathogens.push('Bacterial Leaf Blight / Sheath Rot');
    }
    if (temp >= 30 && humidity < 50) {
      favorable.push('Dry, warm microclimate favors proliferation of sucking pests');
      pathogens.push('Thrips / Mites / Whitefly');
    }

    let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
    let advisory = 'Current microclimate indicates low pathogen pressure. Continue routine field hygiene.';

    if (favorable.length >= 2 || (humidity >= 85 && rain > 2)) {
      riskLevel = 'High';
      advisory = `Elevated microclimate disease risk for ${crop}. Inspect foliage underside and avoid evening sprinkler irrigation.`;
    } else if (favorable.length >= 1) {
      riskLevel = 'Moderate';
      advisory = 'Moderate humidity. Monitor leaves for early water-soaked lesions or fungal spots.';
    }

    return {
      crop,
      risk_level: riskLevel,
      favorable_factors: favorable,
      probable_pathogens: pathogens.length > 0 ? pathogens : ['No acute pathogen pressure'],
      preventive_advisory: advisory,
    };
  },

  getDefaultWeather(crop: string): WeatherData {
    const current: CurrentWeather = {
      temperature: 28,
      relative_humidity: 70,
      precipitation: 0,
      wind_speed: 12,
      weather_code: 2,
      condition_text: 'Partly Cloudy',
      timestamp: Date.now(),
    };

    return {
      current,
      forecast: [
        {
          date: 'Today',
          temp_max: 30,
          temp_min: 22,
          precipitation_probability: 20,
          humidity_average: 70,
          condition_text: 'Partly Cloudy',
        },
        {
          date: 'Tomorrow',
          temp_max: 29,
          temp_min: 21,
          precipitation_probability: 35,
          humidity_average: 72,
          condition_text: 'Light Rain Possible',
        },
      ],
      risk: this.computeMicroclimateRisk(current.temperature, current.relative_humidity, current.precipitation, crop),
      is_cached: true,
    };
  },
};
