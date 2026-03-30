import axios, { type AxiosInstance } from 'axios';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://www.ncdc.noaa.gov/cdo-web/api/v2';

/** Common NOAA dataset IDs */
const DATASETS = {
  GHCND: 'GHCND',     // Daily summaries
  GSOM: 'GSOM',       // Monthly summaries
  GSOY: 'GSOY',       // Annual summaries
  NORMAL_DLY: 'NORMAL_DLY', // Climate normals
} as const;

/** Common data type IDs for agricultural weather monitoring */
const DATA_TYPES = {
  TMAX: 'TMAX',   // Maximum temperature
  TMIN: 'TMIN',   // Minimum temperature
  TAVG: 'TAVG',   // Average temperature
  PRCP: 'PRCP',   // Precipitation
  SNOW: 'SNOW',   // Snowfall
  AWND: 'AWND',   // Average wind speed
  EVAP: 'EVAP',   // Evaporation
  PSUN: 'PSUN',   // Percent of possible sunshine
} as const;

/** Key agricultural region station IDs */
const AGRICULTURAL_STATIONS: Record<string, { name: string; stationId: string }> = {
  US_CORN_BELT: { name: 'US Corn Belt (Des Moines)', stationId: 'GHCND:USW00014933' },
  US_WHEAT_BELT: { name: 'US Wheat Belt (Dodge City)', stationId: 'GHCND:USW00013985' },
  US_GULF_COAST: { name: 'US Gulf Coast (Houston)', stationId: 'GHCND:USW00012960' },
  BRAZIL_SAO_PAULO: { name: 'Brazil (Sao Paulo)', stationId: 'GHCND:BR000083780' },
  INDIA_DELHI: { name: 'India (Delhi)', stationId: 'GHCND:IN022021600' },
  AUSTRALIA_SYDNEY: { name: 'Australia (Sydney)', stationId: 'GHCND:ASN00066062' },
};

interface NOAAResultSet {
  offset: number;
  count: number;
  limit: number;
}

interface NOAADataRecord {
  date: string;
  datatype: string;
  station: string;
  attributes: string;
  value: number;
}

interface NOAADataResponse {
  metadata: { resultset: NOAAResultSet };
  results: NOAADataRecord[];
}

interface NOAAStationRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  elevationUnit: string;
  mindate: string;
  maxdate: string;
}

interface NOAAStationResponse {
  metadata: { resultset: NOAAResultSet };
  results: NOAAStationRecord[];
}

/** Parsed weather observation */
export interface WeatherObservation {
  station: string;
  date: string;
  dataType: string;
  value: number;
  attributes: string;
}

/** Aggregated weather summary */
export interface WeatherSummary {
  station: string;
  stationName: string;
  from: string;
  to: string;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  totalPrecipitation: number | null;
  observationCount: number;
}

class NoaaWeatherConnector extends BaseConnector {
  readonly name = 'noaa-weather';
  readonly source = 'NOAA Climate Data Online';
  readonly rateLimit: ConnectorRateLimit = { requests: 5, windowMs: 1_000 };

  private readonly apiKey: string;
  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(5, 5); // 5 req/sec

  constructor() {
    super();
    this.apiKey = process.env.NOAA_CDO_TOKEN ?? '';
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
      headers: { token: this.apiKey },
    });
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('NOAA_CDO_TOKEN environment variable is not set');
    }
    await super.connect();
  }

  /**
   * Weather data is not price data -- returns empty array.
   * Use fetchWeatherData() or fetchStationSummary() instead.
   */
  async fetchLatestPrices(_symbols: string[]): Promise<PriceQuote[]> {
    return [];
  }

  /**
   * Weather data is not OHLCV -- returns empty array.
   * Use fetchWeatherData() for time-series weather observations.
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
   * Fetch weather data for a station within a date range.
   */
  async fetchWeatherData(
    stationId: string,
    dataTypes: string[],
    from: Date,
    to: Date,
    options: { dataset?: string; limit?: number; offset?: number } = {},
  ): Promise<WeatherObservation[]> {
    await this.limiter.acquire();

    const response = await withRetry(async () => {
      return this.client.get<NOAADataResponse>('/data', {
        params: {
          datasetid: options.dataset ?? DATASETS.GHCND,
          stationid: stationId,
          datatypeid: dataTypes.join(','),
          startdate: from.toISOString().slice(0, 10),
          enddate: to.toISOString().slice(0, 10),
          limit: options.limit ?? 1000,
          offset: options.offset ?? 1,
          units: 'metric',
        },
      });
    });

    if (!response.data.results) return [];

    return response.data.results.map((r) => ({
      station: r.station,
      date: r.date,
      dataType: r.datatype,
      value: r.value,
      attributes: r.attributes,
    }));
  }

  /**
   * Fetch a weather summary for a known agricultural region.
   */
  async fetchStationSummary(
    stationKey: string,
    from: Date,
    to: Date,
  ): Promise<WeatherSummary | null> {
    const station = AGRICULTURAL_STATIONS[stationKey];
    if (!station) return null;

    const data = await this.fetchWeatherData(
      station.stationId,
      [DATA_TYPES.TMAX, DATA_TYPES.TMIN, DATA_TYPES.TAVG, DATA_TYPES.PRCP],
      from,
      to,
    );

    if (data.length === 0) return null;

    const temps = data.filter((d) => d.dataType === DATA_TYPES.TAVG).map((d) => d.value);
    const maxTemps = data.filter((d) => d.dataType === DATA_TYPES.TMAX).map((d) => d.value);
    const minTemps = data.filter((d) => d.dataType === DATA_TYPES.TMIN).map((d) => d.value);
    const precip = data.filter((d) => d.dataType === DATA_TYPES.PRCP).map((d) => d.value);

    return {
      station: station.stationId,
      stationName: station.name,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      avgTemp: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
      maxTemp: maxTemps.length > 0 ? Math.max(...maxTemps) : null,
      minTemp: minTemps.length > 0 ? Math.min(...minTemps) : null,
      totalPrecipitation: precip.length > 0 ? precip.reduce((a, b) => a + b, 0) : null,
      observationCount: data.length,
    };
  }

  /**
   * Search for weather stations near a geographic location.
   */
  async findStations(
    options: {
      extent?: { north: number; south: number; east: number; west: number };
      dataset?: string;
      limit?: number;
    } = {},
  ): Promise<NOAAStationRecord[]> {
    await this.limiter.acquire();

    const params: Record<string, string | number> = {
      datasetid: options.dataset ?? DATASETS.GHCND,
      limit: options.limit ?? 25,
    };

    if (options.extent) {
      params['extent'] =
        `${options.extent.south},${options.extent.west},${options.extent.north},${options.extent.east}`;
    }

    const response = await withRetry(async () => {
      return this.client.get<NOAAStationResponse>('/stations', { params });
    });

    return response.data.results ?? [];
  }

  getSupportedSymbols(): string[] {
    return Object.keys(AGRICULTURAL_STATIONS);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'NOAA Climate Data Online (CDO) API. Provides historical weather observations for agricultural weather monitoring and commodity impact analysis.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'date', type: 'date', description: 'Observation date' },
        { name: 'dataType', type: 'string', description: 'Weather data type (TMAX, TMIN, PRCP, etc.)' },
        { name: 'value', type: 'number', description: 'Observation value' },
        { name: 'station', type: 'string', description: 'Weather station ID' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 86_400_000, // daily
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.limiter.acquire();
      const response = await this.client.get<{ metadata: { resultset: NOAAResultSet } }>(
        '/datasets',
        { params: { limit: 1 } },
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export default new NoaaWeatherConnector();
