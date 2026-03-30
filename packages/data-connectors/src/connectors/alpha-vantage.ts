import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import axios from 'axios';
import { BaseConnector, type ConnectorSchema, type ConnectorRateLimit } from '../interface.js';
import { normalizePriceQuote, normalizeOHLCV } from '../utils/normalizer.js';
import { withRetry } from '../utils/retry.js';
import { TokenBucketRateLimiter } from '../utils/rate-limiter.js';

const BASE_URL = 'https://www.alphavantage.co/query';

// Commodity currency pairs (from_currency / to_currency)
const CURRENCY_PAIRS: Record<string, { from: string; to: string; name: string }> = {
  'XAU/USD': { from: 'XAU', to: 'USD', name: 'Gold' },
  'XAG/USD': { from: 'XAG', to: 'USD', name: 'Silver' },
  'XPT/USD': { from: 'XPT', to: 'USD', name: 'Platinum' },
  'XPD/USD': { from: 'XPD', to: 'USD', name: 'Palladium' },
  'XCU/USD': { from: 'XCU', to: 'USD', name: 'Copper' },
};

// Equity / ETF symbols for daily time series
const EQUITY_SYMBOLS: Record<string, string> = {
  GLD: 'SPDR Gold Shares',
  SLV: 'iShares Silver Trust',
  USO: 'United States Oil Fund',
  DBA: 'Invesco DB Agriculture Fund',
  DBC: 'Invesco DB Commodity Index',
  PDBC: 'Invesco Optimum Yield Diversified',
};

interface ExchangeRateResponse {
  'Realtime Currency Exchange Rate': {
    '1. From_Currency Code': string;
    '2. From_Currency Name': string;
    '3. To_Currency Code': string;
    '4. To_Currency Name': string;
    '5. Exchange Rate': string;
    '6. Last Refreshed': string;
    '7. Time Zone': string;
    '8. Bid Price': string;
    '9. Ask Price': string;
  };
}

interface TimeSeriesDailyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': Record<
    string,
    {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    }
  >;
}

class AlphaVantageConnector extends BaseConnector {
  readonly name = 'alpha-vantage';
  readonly source = 'Alpha Vantage';
  readonly rateLimit: ConnectorRateLimit = {
    requests: 5,
    windowMs: 60_000,
  };

  private apiKey: string;
  private limiter = new TokenBucketRateLimiter(5, 5 / 60); // 5 req/min

  constructor() {
    super();
    this.apiKey = process.env.ALPHA_VANTAGE_KEY ?? '';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('ALPHA_VANTAGE_KEY environment variable is not set');
    }
    await super.connect();
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const quotes: PriceQuote[] = [];

    for (const symbol of symbols) {
      await this.limiter.acquire();

      const pair = CURRENCY_PAIRS[symbol];
      if (pair) {
        const quote = await this.fetchCurrencyExchangeRate(symbol, pair.from, pair.to);
        if (quote) quotes.push(quote);
      } else if (EQUITY_SYMBOLS[symbol]) {
        const quote = await this.fetchEquityLatest(symbol);
        if (quote) quotes.push(quote);
      }
    }

    return quotes;
  }

  private async fetchCurrencyExchangeRate(
    symbol: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<PriceQuote | null> {
    const data = await withRetry(async () => {
      const response = await axios.get<ExchangeRateResponse>(BASE_URL, {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: fromCurrency,
          to_currency: toCurrency,
          apikey: this.apiKey,
        },
      });
      return response.data;
    });

    const rateData = data['Realtime Currency Exchange Rate'];
    if (!rateData) return null;

    const price = parseFloat(rateData['5. Exchange Rate']);
    const bid = parseFloat(rateData['8. Bid Price']);
    const ask = parseFloat(rateData['9. Ask Price']);

    return normalizePriceQuote({
      symbol,
      exchange: 'AlphaVantage',
      price,
      high: ask || price,
      low: bid || price,
      currency: 'USD',
      timestamp: rateData['6. Last Refreshed']
        ? new Date(rateData['6. Last Refreshed']).getTime()
        : Date.now(),
      source: this.source,
    });
  }

  private async fetchEquityLatest(symbol: string): Promise<PriceQuote | null> {
    const data = await withRetry(async () => {
      const response = await axios.get<TimeSeriesDailyResponse>(BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: 'compact',
          apikey: this.apiKey,
        },
      });
      return response.data;
    });

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return null;

    const dates = Object.keys(timeSeries).sort().reverse();
    if (dates.length === 0) return null;

    const latestDate = dates[0];
    const latest = timeSeries[latestDate];
    const previousDate = dates.length > 1 ? dates[1] : undefined;
    const previous = previousDate ? timeSeries[previousDate] : undefined;

    const close = parseFloat(latest['4. close']);
    const prevClose = previous ? parseFloat(previous['4. close']) : close;

    return normalizePriceQuote({
      symbol,
      exchange: 'AlphaVantage',
      price: close,
      open: parseFloat(latest['1. open']),
      high: parseFloat(latest['2. high']),
      low: parseFloat(latest['3. low']),
      previousClose: prevClose,
      volume: parseInt(latest['5. volume'], 10),
      currency: 'USD',
      timestamp: new Date(latestDate).getTime(),
      source: this.source,
    });
  }

  async fetchOHLCV(
    symbol: string,
    _interval: string,
    from: Date,
    to: Date,
  ): Promise<OHLCVBar[]> {
    // OHLCV only supported for equity symbols via TIME_SERIES_DAILY
    if (!EQUITY_SYMBOLS[symbol] && !CURRENCY_PAIRS[symbol]) return [];

    await this.limiter.acquire();

    if (CURRENCY_PAIRS[symbol]) {
      // Currency pairs don't have OHLCV, return empty
      return [];
    }

    const data = await withRetry(async () => {
      const response = await axios.get<TimeSeriesDailyResponse>(BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: 'full',
          apikey: this.apiKey,
        },
      });
      return response.data;
    });

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) return [];

    const bars: OHLCVBar[] = [];
    for (const [dateStr, values] of Object.entries(timeSeries)) {
      const date = new Date(dateStr);
      if (date < from || date > to) continue;

      bars.push(
        normalizeOHLCV({
          timestamp: dateStr,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'], 10),
        }),
      );
    }

    return bars.sort((a, b) => a.timestamp - b.timestamp);
  }

  async fetchHistorical(symbol: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    return this.fetchOHLCV(symbol, '1d', from, to);
  }

  getSupportedSymbols(): string[] {
    return [...Object.keys(CURRENCY_PAIRS), ...Object.keys(EQUITY_SYMBOLS)];
  }

  getSchema(): ConnectorSchema {
    return {
      name: this.name,
      source: this.source,
      description:
        'Alpha Vantage connector for commodity-related currency exchange rates and ETF daily time series. Supports precious metal spot rates and commodity ETFs.',
      supportedSymbols: this.getSupportedSymbols(),
      fields: [
        { name: 'price', type: 'number', description: 'Current price or exchange rate' },
        { name: 'open', type: 'number', description: 'Opening price' },
        { name: 'high', type: 'number', description: 'High price' },
        { name: 'low', type: 'number', description: 'Low price' },
        { name: 'volume', type: 'number', description: 'Trading volume' },
      ],
      supportsStreaming: false,
      supportsHistorical: true,
      refreshInterval: 60_000,
    };
  }
}

export default new AlphaVantageConnector();
