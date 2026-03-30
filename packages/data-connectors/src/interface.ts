import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';

export interface ConnectorRateLimit {
  requests: number;
  windowMs: number;
}

export interface ConnectorField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description: string;
}

export interface ConnectorSchema {
  name: string;
  source: string;
  description: string;
  supportedSymbols: string[];
  fields: ConnectorField[];
  supportsStreaming: boolean;
  supportsHistorical: boolean;
  refreshInterval: number;
}

export interface IDataConnector {
  readonly name: string;
  readonly source: string;
  readonly rateLimit: ConnectorRateLimit;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Pull-based
  fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]>;
  fetchOHLCV(symbol: string, interval: string, from: Date, to: Date): Promise<OHLCVBar[]>;
  fetchHistorical?(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]>;

  // Push-based (optional — for WebSocket sources)
  subscribe?(symbols: string[], callback: (quote: PriceQuote) => void): void;
  unsubscribe?(symbols: string[]): void;

  // Metadata
  getSupportedSymbols(): string[];
  getSchema(): ConnectorSchema;
  healthCheck(): Promise<boolean>;
}

export abstract class BaseConnector implements IDataConnector {
  abstract readonly name: string;
  abstract readonly source: string;
  abstract readonly rateLimit: ConnectorRateLimit;

  protected connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  abstract fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]>;
  abstract fetchOHLCV(symbol: string, interval: string, from: Date, to: Date): Promise<OHLCVBar[]>;
  abstract getSupportedSymbols(): string[];
  abstract getSchema(): ConnectorSchema;

  async healthCheck(): Promise<boolean> {
    try {
      const symbols = this.getSupportedSymbols();
      if (symbols.length === 0) return false;
      const result = await this.fetchLatestPrices([symbols[0]]);
      return result.length > 0;
    } catch {
      return false;
    }
  }
}
