import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://api.open-meteo.com/v1';

/** Key agricultural locations for weather monitoring */
const AGRICULTURAL_LOCATIONS: Record<string, { name: string; lat: number; lon: number }> = {
  US_IOWA: { name: 'Iowa (US Corn Belt)', lat: 41.88, lon: -93.10 },
  US_KANSAS: { name: 'Kansas (US Wheat Belt)', lat: 38.50, lon: -98.77 },
  US_TEXAS: { name: 'Texas (US Cotton/Livestock)', lat: 31.97, lon: -99.90 },
  BRAZIL_MATO_GROSSO: { name: 'Mato Grosso (Brazil Soybeans)', lat: -12.64, lon: -55.42 },
  BRAZIL_SAO_PAULO: { name: 'Sao Paulo (Brazil Sugar/Coffee)', lat: -23.55, lon: -46.63 },
  ARGENTINA_BUENOS_AIRES: { name: 'Buenos Aires (Argentina Grains)', lat: -34.61, lon: -58.38 },
  INDIA_PUNJAB: { name: 'Punjab (India Wheat/Rice)', lat: 31.15, lon: 75.34 },
  INDIA_MAHARASHTRA: { name: 'Maharashtra (India Cotton/Sugar)', lat: 19.75, lon: 75.71 },
  CHINA_HENAN: { name: 'Henan (China Wheat)', lat: 34.77, lon: 113.65 },
  UKRAINE_KYIV: { name: 'Kyiv (Ukraine Grains)', lat: 50.45, lon: 30.52 },
  AUSTRALIA_NSW: { name: 'New South Wales (Australia Wheat)', lat: -33.87, lon: 151.21 },
  FRANCE_ILE_DE_FRANCE: { name: 'Ile-de-France (France Wheat)', lat: 48.86, lon: 2.35 },
  IVORY_COAST: { name: 'Ivory Coast (Cocoa)', lat: 6.83, lon: -5.29 },
  COLOMBIA_COFFEE: { name: 'Colombia (Coffee)', lat: 4.81, lon: -75.70 },
  THAILAND_CENTRAL: { name: 'Central Thailand (Rice/Sugar)', lat: 14.88, lon: 100.40 },
  INDONESIA_SUMATRA: { name: 'Sumatra (Palm Oil)', lat: 0.59, lon: 101.43 },
};

/** Weather variables available from Open-Meteo */
const HOURLY_VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'rain',
  'soil_temperature_0cm',
  'soil_moisture_0_to_1cm',
  'et0_fao_evapotranspiration',
  'wind_speed_10m',
  'cloud_cover',
] as const;

const DAILY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'rain_sum',
  'et0_fao_evapotranspiration',
  'wind_speed_10m_max',
  'precipitation_hours',
  'sunshine_duration',
] as const;

type HourlyVariable = (typeof HOURLY_VARIABLES)[number];
type DailyVariable = (typeof DAILY_VARIABLES)[number];

interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units?: Record<string, string>;
  hourly?: Record<string, (number | null)[]> & { time: string[] };
  daily_units?: Record<string, string>;
  daily?: Record<string, (number | null)[]> & { time: string[] };
}

interface OpenMeteoHistoricalResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  daily_units?: Record<string, string>;
  daily?: Record<string, (number | null)[]> & { time: string[] };
}

/** Parsed daily weather data point */
export interface DailyWeatherData {
  date: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  temperatureMean: number | null;
  precipitationSum: number | null;
  rainSum: number | null;
  et0Evapotranspiration: number | null;
  windSpeedMax: number | null;
  precipitationHours: number | null;
  sunshineDuration: number | null;
}

/** Parsed hourly weather data point */
export interface HourlyWeatherData {
  time: string;
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  soilTemperature: number | null;
  soilMoisture: number | null;
  evapotranspiration: number | null;
  windSpeed: number | null;
  cloudCover: number | null;
}

/** Agricultural weather impact assessment */
export interface AgriWeatherAssessment {
  location: string;
  locationName: string;
  period: string;
  avgTemperature: number | null;
  totalPrecipitation: number | null;
  totalEvapotranspiration: number | null;
  droughtRisk: 'low' | 'moderate' | 'high' | 'severe';
  frostRisk: boolean;
  heatStressRisk: boolean;
}

class OpenMeteoConnector extends BaseConnector {
  readonly name = 'open-meteo';
  readonly source = 'Open-Meteo';
  readonly rateLimit: ConnectorRateLimit = { requests: 30, windowMs: 60_000 };

  private readonly client: AxiosInstance;
  private readonly historicalClient: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(30, 0.5);

  constructor() {
    super();
    this.client = axios.create({
      baseURL: `${BASE_URL}/forecast`,
      timeout: 15_000,
    });
    this.historicalClient = axios.create({
      baseURL: `${BASE_URL}/archive`,
      timeout: 30_000,
    });
  }

  /**
   * Weather is not price data -- returns empty.
   * Use fetchDailyForecast() or fetchAgriWeather() instead.
   */
  async fetchLatestPrices(_symbols: string[]): Promise<PriceQuote[]> {
    return [];
  }

  /**
   * Weather is not OHLCV -- returns empty.
   * Use fetchHistoricalWeather() for time-series weather data.
   */
  async fetchOHLCV(
    _symbol: string,
    _interval: string,
    _from: Date,
    _to: Date,
  ): Promise<OHLCVBar[]> {
    return [];
  }

  /**
   * Fetch daily forecast for a location (up to 16 days ahead).
   */
  async fetchDailyForecast(
    lat: number,
    lon: number,
    forecastDays = 7,
  ): Promise<DailyWeatherData[]> {
    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<OpenMeteoForecastResponse>('', {
        params: {
          latitude: lat,
          longitude: lon,
          daily: DAILY_VARIABLES.join(','),
          forecast_days: forecastDays,
          timezone: 'auto',
        },
      });
    });

    return this.parseDailyResponse(response.data);
  }

  /**
   * Fetch hourly forecast for a location.
   */
  async fetchHourlyForecast(
    lat: number,
    lon: number,
    forecastDays = 3,
  ): Promise<HourlyWeatherData[]> {
    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<OpenMeteoForecastResponse>('', {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: HOURLY_VARIABLES.join(','),
          forecast_days: forecastDays,
          timezone: 'auto',
        },
      });
    });

    return this.parseHourlyResponse(response.data);
  }

  /**
   * Fetch historical daily weather data for a location.
   */
  async fetchHistoricalWeather(
    lat: number,
    lon: number,
    from: Date,
    to: Date,
  ): Promise<DailyWeatherData[]> {
    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.historicalClient.get<OpenMeteoHistoricalResponse>('', {
        params: {
          latitude: lat,
          longitude: lon,
          daily: DAILY_VARIABLES.join(','),
          start_date: from.toISOString().slice(0, 10),
          end_date: to.toISOString().slice(0, 10),
          timezone: 'auto',
        },
      });
    });

    return this.parseDailyResponse(response.data);
  }

  /**
   * Fetch forecast for a named agricultural location.
   */
  async fetchAgriLocationForecast(
    locationKey: string,
    forecastDays = 7,
  ): Promise<DailyWeatherData[]> {
    const loc = AGRICULTURAL_LOCATIONS[locationKey];
    if (!loc) {
      throw new Error(
        `Unknown location: ${locationKey}. Available: ${Object.keys(AGRICULTURAL_LOCATIONS).join(', ')}`,
      );
    }
    return this.fetchDailyForecast(loc.lat, loc.lon, forecastDays);
  }

  /**
   * Produce an agricultural weather impact assessment for a location.
   */
  async fetchAgriWeatherAssessment(
    locationKey: string,
    forecastDays = 7,
  ): Promise<AgriWeatherAssessment> {
    const loc = AGRICULTURAL_LOCATIONS[locationKey];
    if (!loc) {
      throw new Error(`Unknown location: ${locationKey}`);
    }

    const forecast = await this.fetchDailyForecast(loc.lat, loc.lon, forecastDays);

    const temps = forecast
      .map((d) => d.temperatureMean)
      .filter((v): v is number => v !== null);
    const precip = forecast
      .map((d) => d.precipitationSum)
      .filter((v): v is number => v !== null);
    const et0 = forecast
      .map((d) => d.et0Evapotranspiration)
      .filter((v): v is number => v !== null);
    const minTemps = forecast
      .map((d) => d.temperatureMin)
      .filter((v): v is number => v !== null);
    const maxTemps = forecast
      .map((d) => d.temperatureMax)
      .filter((v): v is number => v !== null);

    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    const totalPrecip = precip.length > 0 ? precip.reduce((a, b) => a + b, 0) : null;
    const totalET0 = et0.length > 0 ? et0.reduce((a, b) => a + b, 0) : null;

    // Simple drought risk assessment
    let droughtRisk: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (totalPrecip !== null && totalET0 !== null && totalET0 > 0) {
      const ratio = totalPrecip / totalET0;
      if (ratio < 0.2) droughtRisk = 'severe';
      else if (ratio < 0.5) droughtRisk = 'high';
      else if (ratio < 0.8) droughtRisk = 'moderate';
    }

    const frostRisk = minTemps.some((t) => t <= 0);
    const heatStressRisk = maxTemps.some((t) => t >= 35);

    return {
      location: locationKey,
      locationName: loc.name,
      period: `${forecastDays}-day forecast`,
      avgTemperature: avgTemp,
      totalPrecipitation: totalPrecip,
      totalEvapotranspiration: totalET0,
      droughtRisk,
      frostRisk,
      heatStressRisk,
    };
  }

  private parseDailyResponse(
    data: OpenMeteoForecastResponse | OpenMeteoHistoricalResponse,
  ): DailyWeatherData[] {
    const daily = data.daily;
    if (!daily?.time) return [];

    const result: DailyWeatherData[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      result.push({
        date: daily.time[i],
        temperatureMax: this.getVal(daily, 'temperature_2m_max', i),
        temperatureMin: this.getVal(daily, 'temperature_2m_min', i),
        temperatureMean: this.getVal(daily, 'temperature_2m_mean', i),
        precipitationSum: this.getVal(daily, 'precipitation_sum', i),
        rainSum: this.getVal(daily, 'rain_sum', i),
        et0Evapotranspiration: this.getVal(daily, 'et0_fao_evapotranspiration', i),
        windSpeedMax: this.getVal(daily, 'wind_speed_10m_max', i),
        precipitationHours: this.getVal(daily, 'precipitation_hours', i),
        sunshineDuration: this.getVal(daily, 'sunshine_duration', i),
      });
    }
    return result;
  }

  private parseHourlyResponse(data: OpenMeteoForecastResponse): HourlyWeatherData[] {
    const hourly = data.hourly;
    if (!hourly?.time) return [];

    const result: HourlyWeatherData[] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      result.push({
        time: hourly.time[i],
        temperature: this.getVal(hourly, 'temperature_2m', i),
        humidity: this.getVal(hourly, 'relative_humidity_2m', i),
        precipitation: this.getVal(hourly, 'precipitation', i),
        soilTemperature: this.getVal(hourly, 'soil_temperature_0cm', i),
        soilMoisture: this.getVal(hourly, 'soil_moisture_0_to_1cm', i),
        evapotranspiration: this.getVal(hourly, 'et0_fao_evapotranspiration', i),
        windSpeed: this.getVal(hourly, 'wind_speed_10m', i),
        cloudCover: this.getVal(hourly, 'cloud_cover', i),
      });
    }
    return result;
  }

  private getVal(
    obj: Record<string, (number | null)[]> & { time: string[] },
    key: string,
    index: number,
  ): number | null {
    const arr = obj[key] as (number | null)[] | undefined;
    if (!arr || index >= arr.length) return null;
    return arr[index];
  }

  getSupportedSymbols(): string[] {
    return Object.keys(AGRICULTURAL_LOCATIONS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Open-Meteo free weather API. Provides forecasts and historical weather data for agricultural regions relevant to commodity markets.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'temperatureMax', type: 'number', description: 'Maximum temperature (C)' },
        { name: 'temperatureMin', type: 'number', description: 'Minimum temperature (C)' },
        { name: 'precipitationSum', type: 'number', description: 'Total precipitation (mm)' },
        { name: 'et0Evapotranspiration', type: 'number', description: 'FAO ET0 evapotranspiration (mm)' },
        { name: 'windSpeedMax', type: 'number', description: 'Maximum wind speed (km/h)' },
        { name: 'sunshineDuration', type: 'number', description: 'Sunshine duration (seconds)' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 3_600_000, // hourly
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<OpenMeteoForecastResponse>('', {
        params: {
          latitude: 41.88,
          longitude: -93.10,
          daily: 'temperature_2m_max',
          forecast_days: 1,
          timezone: 'auto',
        },
      });
      return (response.data.daily?.time?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

export default new OpenMeteoConnector();
