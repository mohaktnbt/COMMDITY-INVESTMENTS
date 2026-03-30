/**
 * PriceService - fetches and manages commodity price data.
 * Uses ConnectorRegistry for live data; returns sample data for now.
 */
import type { PriceQuote, OHLCVBar, TimeInterval } from '@commodity-monitor/shared';
import { COMMODITIES, COMMODITY_BY_SYMBOL } from '@commodity-monitor/shared';

// TODO: Import and use ConnectorRegistry for live data
// import { registry } from '@commodity-monitor/data-connectors';

function samplePrice(symbol: string): PriceQuote {
  const meta = COMMODITY_BY_SYMBOL.get(symbol);
  const basePrice = symbol.includes('GOLD') ? 2650.30
    : symbol.includes('SILVER') ? 31.45
    : symbol.includes('CRUDE') || symbol === 'WTI_CRUDE' ? 78.52
    : symbol === 'BRENT_CRUDE' ? 82.10
    : symbol === 'NATURAL_GAS' ? 3.42
    : symbol === 'COPPER' ? 4.28
    : symbol === 'WHEAT' ? 612.50
    : symbol === 'CORN' ? 485.25
    : symbol === 'SOYBEANS' ? 1342.75
    : symbol === 'COFFEE' ? 192.30
    : symbol === 'SUGAR' ? 22.15
    : symbol === 'COTTON' ? 82.40
    : 100.00;

  const change = (Math.random() - 0.5) * basePrice * 0.03;

  return {
    symbol,
    exchange: meta?.exchange ?? 'UNKNOWN',
    price: parseFloat((basePrice + change).toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
    high: parseFloat((basePrice + Math.abs(change) * 1.5).toFixed(2)),
    low: parseFloat((basePrice - Math.abs(change) * 1.5).toFixed(2)),
    open: parseFloat((basePrice - change * 0.3).toFixed(2)),
    previousClose: basePrice,
    volume: Math.floor(Math.random() * 100_000) + 10_000,
    currency: meta?.currency ?? 'USD',
    unit: meta?.unit ?? 'oz',
    timestamp: Date.now(),
    source: 'sample',
  };
}

function generateSampleOHLCV(
  symbol: string,
  interval: TimeInterval,
  from: Date,
  to: Date,
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  const intervalMs: Record<string, number> = {
    '1m': 60_000,
    '5m': 300_000,
    '15m': 900_000,
    '30m': 1_800_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    '1d': 86_400_000,
    '1w': 604_800_000,
    '1M': 2_592_000_000,
  };

  const step = intervalMs[interval] ?? 86_400_000;
  let basePrice = symbol.includes('GOLD') ? 2650 : symbol.includes('CRUDE') ? 78 : 100;
  let ts = from.getTime();

  while (ts <= to.getTime() && bars.length < 500) {
    const drift = (Math.random() - 0.48) * basePrice * 0.015;
    const open = basePrice;
    const close = parseFloat((basePrice + drift).toFixed(2));
    const high = parseFloat((Math.max(open, close) + Math.random() * basePrice * 0.008).toFixed(2));
    const low = parseFloat((Math.min(open, close) - Math.random() * basePrice * 0.008).toFixed(2));

    bars.push({
      timestamp: ts,
      open: parseFloat(open.toFixed(2)),
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 50_000) + 5_000,
    });

    basePrice = close;
    ts += step;
  }

  return bars;
}

export class PriceService {
  /**
   * Get the latest price quote for a single symbol.
   */
  async getLatestPrice(symbol: string): Promise<PriceQuote | null> {
    // TODO: Use ConnectorRegistry for live data
    // return registry.fetchLatestPrice(symbol);

    if (!COMMODITY_BY_SYMBOL.has(symbol)) return null;
    return samplePrice(symbol);
  }

  /**
   * Get OHLCV bars for a symbol.
   */
  async getOHLCV(
    symbol: string,
    interval: TimeInterval = '1d',
    from: Date = new Date(Date.now() - 30 * 86_400_000),
    to: Date = new Date(),
  ): Promise<OHLCVBar[]> {
    // TODO: Fetch from QuestDB or ConnectorRegistry
    // return registry.fetchOHLCV(symbol, interval, from, to);

    return generateSampleOHLCV(symbol, interval, from, to);
  }

  /**
   * Get latest prices for all tracked commodities.
   */
  async getAllLatestPrices(): Promise<PriceQuote[]> {
    // TODO: Use ConnectorRegistry or Redis cache for live data
    // return registry.fetchLatestPrices(COMMODITIES.map(c => c.symbol));

    return COMMODITIES.slice(0, 20).map((c) => samplePrice(c.symbol));
  }
}

export const priceService = new PriceService();
