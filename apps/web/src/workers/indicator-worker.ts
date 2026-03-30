/**
 * Web Worker for computing technical indicators off the main thread.
 * Supports: SMA, EMA, RSI, MACD
 *
 * Usage from main thread:
 *   const worker = new Worker(new URL('./indicator-worker.ts', import.meta.url), { type: 'module' });
 *   worker.postMessage({ type: 'SMA', prices: [...], period: 20 });
 *   worker.onmessage = (e) => console.log(e.data);
 */

export interface IndicatorRequest {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD';
  prices: number[];
  period?: number;
  // MACD-specific params
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
}

export interface IndicatorResponse {
  type: string;
  values: number[];
  signal?: number[];     // MACD signal line
  histogram?: number[];  // MACD histogram
  error?: string;
}

function computeSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

function computeEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      // Seed with SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[j];
      }
      result.push(sum / period);
    } else {
      const prev = result[i - 1];
      result.push(prices[i] * k + prev * (1 - k));
    }
  }
  return result;
}

function computeRSI(prices: number[], period: number): number[] {
  const result: number[] = [];
  if (prices.length < period + 1) {
    return prices.map(() => NaN);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  // Fill NaN for insufficient data
  for (let i = 0; i <= period; i++) {
    result.push(NaN);
  }

  // First RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs);

  // Subsequent values using smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const currentRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + currentRS));
  }

  return result;
}

function computeMACD(
  prices: number[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): { values: number[]; signal: number[]; histogram: number[] } {
  const fastEMA = computeEMA(prices, fastPeriod);
  const slowEMA = computeEMA(prices, slowPeriod);

  // MACD line = fast EMA - slow EMA
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // Signal line = EMA of MACD line
  const validMACD = macdLine.filter((v) => !isNaN(v));
  const signalFromValid = computeEMA(validMACD, signalPeriod);

  const signal: number[] = [];
  let validIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      signal.push(NaN);
    } else {
      signal.push(signalFromValid[validIdx] ?? NaN);
      validIdx++;
    }
  }

  // Histogram = MACD - Signal
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signal[i]);
    }
  }

  return { values: macdLine, signal, histogram };
}

self.onmessage = (event: MessageEvent<IndicatorRequest>) => {
  const { type, prices, period = 14, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } =
    event.data;

  try {
    let response: IndicatorResponse;

    switch (type) {
      case 'SMA':
        response = { type, values: computeSMA(prices, period) };
        break;

      case 'EMA':
        response = { type, values: computeEMA(prices, period) };
        break;

      case 'RSI':
        response = { type, values: computeRSI(prices, period) };
        break;

      case 'MACD': {
        const macd = computeMACD(prices, fastPeriod, slowPeriod, signalPeriod);
        response = {
          type,
          values: macd.values,
          signal: macd.signal,
          histogram: macd.histogram,
        };
        break;
      }

      default:
        response = { type, values: [], error: `Unknown indicator type: ${type}` };
    }

    self.postMessage(response);
  } catch (err) {
    self.postMessage({
      type,
      values: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    } satisfies IndicatorResponse);
  }
};
