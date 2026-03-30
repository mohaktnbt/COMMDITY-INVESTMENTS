import WebSocket from 'ws';
import type { PriceQuote, OHLCVBar, VesselPosition } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const WS_URL = 'wss://stream.aisstream.io/v0/stream';

/** Ship types relevant to commodity tracking */
const VESSEL_TYPES = {
  TANKER: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
  BULK_CARRIER: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  LNG_LPG: [82, 83, 84],
  CONTAINER: [70, 71, 72],
} as const;

/** Geographic bounding boxes for key commodity chokepoints / regions */
const MONITORING_ZONES: Record<string, { name: string; bbox: [number, number, number, number] }> = {
  STRAIT_HORMUZ: { name: 'Strait of Hormuz', bbox: [25.0, 55.0, 27.5, 57.5] },
  SUEZ_CANAL: { name: 'Suez Canal', bbox: [29.5, 32.0, 31.5, 33.5] },
  MALACCA_STRAIT: { name: 'Strait of Malacca', bbox: [0.5, 100.0, 4.5, 104.5] },
  PANAMA_CANAL: { name: 'Panama Canal', bbox: [8.5, -80.5, 9.5, -79.0] },
  BOSPHORUS: { name: 'Bosphorus Strait', bbox: [40.9, 28.8, 41.3, 29.3] },
  US_GULF: { name: 'US Gulf Coast', bbox: [25.0, -97.0, 30.5, -87.0] },
  PERSIAN_GULF: { name: 'Persian Gulf', bbox: [23.0, 47.0, 30.5, 57.0] },
  SANTOS_BRAZIL: { name: 'Santos Port, Brazil', bbox: [-24.5, -47.0, -23.5, -45.5] },
};

/** AIS position report message from the stream */
interface AISPositionReport {
  Cog: number;
  CommunicationState: number;
  Latitude: number;
  Longitude: number;
  MessageID: number;
  NavigationalStatus: number;
  PositionAccuracy: boolean;
  Raim: boolean;
  RateOfTurn: number;
  RepeatIndicator: number;
  Sog: number;
  Spare: number;
  SpecialManoeuvreIndicator: number;
  Timestamp: number;
  TrueHeading: number;
  UserID: number;
  Valid: boolean;
}

interface AISShipStaticData {
  AisVersion: number;
  CallSign: string;
  Destination: string;
  Dimension: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  Draught: number;
  Eta: {
    Day: number;
    Hour: number;
    Minute: number;
    Month: number;
  };
  ImoNumber: number;
  MaximumStaticDraught: number;
  Name: string;
  Type: number;
  UserID: number;
  Valid: boolean;
}

interface AISStreamMessage {
  MessageType: string;
  MetaData: {
    MMSI: number;
    MMSI_String: string;
    ShipName: string;
    Latitude: number;
    Longitude: number;
    time_utc: string;
  };
  Message: {
    PositionReport?: AISPositionReport;
    ShipStaticData?: AISShipStaticData;
  };
}

/** Callback type for vessel position updates */
type VesselUpdateCallback = (vessel: VesselPosition) => void;

/** Subscription filter for AIS streaming */
export interface AISStreamFilter {
  boundingBoxes: Array<[number, number, number, number]>; // [lat_min, lon_min, lat_max, lon_max]
  shipTypes?: number[];
}

class AisStreamConnector extends BaseConnector {
  readonly name = 'aisstream';
  readonly source = 'AISStream.io';
  readonly rateLimit: ConnectorRateLimit = { requests: 1, windowMs: 1_000 };

  private readonly apiKey: string;
  private readonly limiter = new TokenBucketRateLimiter(1, 1);
  private ws: WebSocket | null = null;
  private callbacks: VesselUpdateCallback[] = [];
  private currentFilter: AISStreamFilter | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor() {
    super();
    this.apiKey = process.env.AISSTREAM_API_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('AISSTREAM_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.closeWebSocket();
    this.callbacks = [];
    this.currentFilter = null;
    await super.disconnect();
  }

  /**
   * AISStream provides vessel tracking, not price data -- returns empty array.
   * Use startStreaming() for real-time vessel position updates.
   */
  async fetchLatestPrices(_symbols: string[]): Promise<PriceQuote[]> {
    return [];
  }

  /**
   * AISStream provides vessel tracking, not OHLCV -- returns empty array.
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
   * Start streaming AIS data for vessels within specified bounding boxes.
   */
  startStreaming(
    filter: AISStreamFilter,
    callback: VesselUpdateCallback,
  ): void {
    this.callbacks.push(callback);
    this.currentFilter = filter;
    this.shouldReconnect = true;
    this.connectWebSocket(filter);
  }

  /**
   * Start streaming for a known monitoring zone.
   */
  startMonitoringZone(
    zoneKey: string,
    callback: VesselUpdateCallback,
    shipTypes?: number[],
  ): void {
    const zone = MONITORING_ZONES[zoneKey];
    if (!zone) {
      throw new Error(`Unknown zone: ${zoneKey}. Available: ${Object.keys(MONITORING_ZONES).join(', ')}`);
    }

    this.startStreaming(
      {
        boundingBoxes: [zone.bbox],
        shipTypes,
      },
      callback,
    );
  }

  /**
   * Stop streaming AIS data.
   */
  stopStreaming(): void {
    this.shouldReconnect = false;
    this.closeWebSocket();
    this.callbacks = [];
    this.currentFilter = null;
  }

  /**
   * Get the list of available monitoring zones.
   */
  getMonitoringZones(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, zone] of Object.entries(MONITORING_ZONES)) {
      result[key] = zone.name;
    }
    return result;
  }

  /**
   * Get vessel type constants for filtering.
   */
  getVesselTypes(): Record<string, readonly number[]> {
    return { ...VESSEL_TYPES };
  }

  private connectWebSocket(filter: AISStreamFilter): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.on('open', () => {
      const subscribeMessage = {
        APIKey: this.apiKey,
        BoundingBoxes: filter.boundingBoxes.map((bb) => [
          [bb[0], bb[1]],
          [bb[2], bb[3]],
        ]),
        FilterMessageTypes: ['PositionReport'],
        ...(filter.shipTypes ? { FiltersShipMMSI: undefined } : {}),
      };

      this.ws?.send(JSON.stringify(subscribeMessage));
    });

    this.ws.on('message', (raw: WebSocket.Data) => {
      try {
        const msg = JSON.parse(raw.toString()) as AISStreamMessage;
        if (!msg.MetaData || !msg.Message?.PositionReport) return;

        const pos = msg.Message.PositionReport;
        const meta = msg.MetaData;

        // Filter by ship type if specified
        if (
          this.currentFilter?.shipTypes &&
          msg.Message.PositionReport
        ) {
          // Ship type filtering requires static data messages; skip if unavailable
        }

        const vessel: VesselPosition = {
          mmsi: meta.MMSI_String,
          name: meta.ShipName.trim(),
          lat: meta.Latitude,
          lng: meta.Longitude,
          course: pos.Cog,
          speed: pos.Sog,
          vesselType: this.classifyVesselType(pos.UserID),
          destination: msg.Message.ShipStaticData?.Destination,
          timestamp: new Date(meta.time_utc).getTime(),
        };

        for (const cb of this.callbacks) {
          cb(vessel);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    this.ws.on('close', () => {
      if (this.shouldReconnect && this.currentFilter) {
        this.reconnectTimer = setTimeout(() => {
          if (this.currentFilter) {
            this.connectWebSocket(this.currentFilter);
          }
        }, 5_000);
      }
    });

    this.ws.on('error', () => {
      this.ws?.close();
    });
  }

  private closeWebSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  private classifyVesselType(_userId: number): string {
    // In a real implementation, we would look up the MMSI in a vessel database
    // or wait for a ShipStaticData message to determine the vessel type.
    return 'unknown';
  }

  getSupportedSymbols(): string[] {
    return Object.keys(MONITORING_ZONES);
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'AISStream real-time vessel tracking via AIS data. Monitors commodity shipping through key chokepoints and trade routes.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'mmsi', type: 'string', description: 'Maritime Mobile Service Identity' },
        { name: 'name', type: 'string', description: 'Vessel name' },
        { name: 'lat', type: 'number', description: 'Latitude' },
        { name: 'lng', type: 'number', description: 'Longitude' },
        { name: 'course', type: 'number', description: 'Course over ground (degrees)' },
        { name: 'speed', type: 'number', description: 'Speed over ground (knots)' },
        { name: 'vesselType', type: 'string', description: 'Vessel classification' },
      ],
      supportsStreaming: true,
      supportsHistorical: false,
      refreshInterval: 0, // continuous streaming
    };
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    // Cannot easily health-check a WebSocket-only service without connecting
    return this.connected;
  }
}

export default new AisStreamConnector();
