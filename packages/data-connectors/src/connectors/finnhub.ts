import axios, { type AxiosInstance } from 'axios';
import WebSocket from 'ws';
import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

interface FinnhubQuoteResponse {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

interface FinnhubCandleResponse {
  c: number[]; // close
  h: number[]; // high
  l: number[]; // low
  o: number[]; // open
  v: number[]; // volume
  t: number[]; // timestamps (unix seconds)
  s: string;   // status: "ok" | "no_data"
}

interface FinnhubTradeMessage {
  type: string;
  data: Array<{
    p: number; // price
    s: string; // symbol
    t: number; // timestamp (ms)
    v: number; // volume
  }>;
}

const FINNHUB_RESOLUTION_MAP: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  '1w': 'W',
  '1M': 'M',
};

const SUPPORTED_SYMBOLS = [
  'OANDA:XAU_USD', // Gold
  'OANDA:XAG_USD', // Silver
  'OANDA:BCO_USD', // Brent Crude
  'OANDA:WTICO_USD', // WTI Crude
  'OANDA:NATGAS_USD', // Natural Gas
  'OANDA:XCU_USD', // Copper
  'OANDA:WHEAT_USD', // Wheat
  'OANDA:CORN_USD', // Corn
  'OANDA:SOYBN_USD', // Soybeans
  'OANDA:SUGAR_USD', // Sugar
  'OANDA:XPT_USD', // Platinum
  'OANDA:XPD_USD', // Palladium
];

class FinnhubConnector extends BaseConnector {
  readonly name = 'finnhub';
  readonly source = 'finnhub.io';
  readonly rateLimit: ConnectorRateLimit = { requests: 60, windowMs: 60_000 };

  private readonly apiKey: string;
  private readonly client: AxiosInstance;
  private readonly limiter = new TokenBucketRateLimiter(60, 1); // 60 req/min = 1/sec
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, (quote: PriceQuote) => void>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.apiKey = process.env.FINNHUB_API_KEY ?? '';
    this.client = axios.create({
      baseURL: 'https://finnhub.io/api/v1',
      params: { token: this.apiKey },
      timeout: 10_000,
    });
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('FINNHUB_API_KEY environment variable is not set');
    }
    await super.connect();
  }

  async disconnect(): Promise<void> {
    this.closeWebSocket();
    await super.disconnect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      await this.limiter.acquire();
      const quote = await withRetry(async () => {
        const response = await this.client.get<FinnhubQuoteResponse>('/quote', {
          params: { symbol },
        });
        return response.data;
      });

      if (quote.c > 0) {
        quotes.push(
          normalizePriceQuote({
            symbol,
            exchange: symbol.split(':')[0] ?? 'UNKNOWN',
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            high: quote.h,
            low: quote.l,
            open: quote.o,
            previousClose: quote.pc,
            timestamp: quote.t * 1000,
            source: this.source,
          }),
        );
      }
    }

    return quotes;
  }

  async fetchOHLCV(
    symbol: string,
    interval: string,
    from: Date,
    to: Date,
  ): Promise<OHLCVBar[]> {
    const resolution = FINNHUB_RESOLUTION_MAP[interval];
    if (!resolution) {
      throw new Error(`Unsupported interval: ${interval}`);
    }

    await this.limiter.acquire();
    const response = await withRetry(async () => {
      return this.client.get<FinnhubCandleResponse>('/stock/candle', {
        params: {
          symbol,
          resolution,
          from: Math.floor(from.getTime() / 1000),
          to: Math.floor(to.getTime() / 1000),
        },
      });
    });

    const data = response.data;
    if (data.s !== 'ok' || !data.t) {
      return [];
    }

    return data.t.map((timestamp, i) =>
      normalizeOHLCV({
        timestamp: timestamp * 1000,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      }),
    );
  }

  subscribe(symbols: string[], callback: (quote: PriceQuote) => void): void {
    for (const symbol of symbols) {
      this.subscriptions.set(symbol, callback);
    }
    this.ensureWebSocket(symbols);
  }

  unsubscribe(symbols: string[]): void {
    for (const symbol of symbols) {
      this.subscriptions.delete(symbol);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      }
    }
    if (this.subscriptions.size === 0) {
      this.closeWebSocket();
    }
  }

  private ensureWebSocket(symbols: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      for (const symbol of symbols) {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
      return;
    }

    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

    this.ws.on('open', () => {
      for (const symbol of this.subscriptions.keys()) {
        this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    });

    this.ws.on('message', (raw: WebSocket.Data) => {
      const msg = JSON.parse(raw.toString()) as FinnhubTradeMessage;
      if (msg.type !== 'trade' || !msg.data) return;

      for (const trade of msg.data) {
        const cb = this.subscriptions.get(trade.s);
        if (cb) {
          cb(
            normalizePriceQuote({
              symbol: trade.s,
              exchange: trade.s.split(':')[0] ?? 'UNKNOWN',
              price: trade.p,
              volume: trade.v,
              timestamp: trade.t,
              source: this.source,
            }),
          );
        }
      }
    });

    this.ws.on('close', () => {
      if (this.subscriptions.size > 0) {
        this.reconnectTimer = setTimeout(() => {
          this.ensureWebSocket([...this.subscriptions.keys()]);
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
    this.subscriptions.clear();
  }

  getSupportedSymbols(): string[] {
    return [...SUPPORTED_SYMBOLS];
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description: 'Finnhub.io real-time and historical commodity quotes via REST and WebSocket',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'price', type: 'number', description: 'Current price' },
        { name: 'change', type: 'number', description: 'Price change' },
        { name: 'changePercent', type: 'number', description: 'Percent change' },
        { name: 'high', type: 'number', description: 'Day high' },
        { name: 'low', type: 'number', description: 'Day low' },
        { name: 'open', type: 'number', description: 'Day open' },
        { name: 'volume', type: 'number', description: 'Trading volume' },
      ],
      supportsStreaming: true,
      supportsHistorical: true,
      refreshInterval: 1_000,
    };
  }
}

export default new FinnhubConnector();
