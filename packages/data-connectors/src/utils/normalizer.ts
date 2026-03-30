import type { PriceQuote, OHLCVBar, Currency, PriceUnit } from '@commodity-monitor/shared';

export function normalizePriceQuote(partial: {
  symbol: string;
  exchange: string;
  price: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  openInterest?: number;
  currency?: Currency;
  unit?: PriceUnit;
  timestamp?: number;
  source: string;
}): PriceQuote {
  const previousClose = partial.previousClose ?? partial.price;
  const change = partial.change ?? (partial.price - previousClose);
  const changePercent = partial.changePercent ?? (previousClose !== 0 ? (change / previousClose) * 100 : 0);

  return {
    symbol: partial.symbol,
    exchange: partial.exchange,
    price: partial.price,
    change,
    changePercent,
    high: partial.high ?? partial.price,
    low: partial.low ?? partial.price,
    open: partial.open ?? partial.price,
    previousClose,
    volume: partial.volume ?? 0,
    openInterest: partial.openInterest,
    currency: partial.currency ?? 'USD',
    unit: partial.unit ?? 'index',
    timestamp: partial.timestamp ?? Date.now(),
    source: partial.source,
  };
}

export function normalizeOHLCV(partial: {
  timestamp: number | string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  openInterest?: number;
}): OHLCVBar {
  let timestamp: number;
  if (typeof partial.timestamp === 'number') {
    timestamp = partial.timestamp;
  } else if (typeof partial.timestamp === 'string') {
    timestamp = new Date(partial.timestamp).getTime();
  } else {
    timestamp = partial.timestamp.getTime();
  }

  return {
    timestamp,
    open: partial.open,
    high: partial.high,
    low: partial.low,
    close: partial.close,
    volume: partial.volume ?? 0,
    openInterest: partial.openInterest,
  };
}
