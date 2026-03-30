import type { DeepPartial, ChartOptions, CandlestickStyleOptions, SeriesOptionsCommon } from 'lightweight-charts';

export const darkChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: 'transparent' },
    textColor: '#94a3b8',
    fontSize: 12,
  },
  grid: {
    vertLines: { color: 'rgba(42, 50, 85, 0.3)' },
    horzLines: { color: 'rgba(42, 50, 85, 0.3)' },
  },
  crosshair: {
    vertLine: {
      color: '#22d3ee',
      width: 1,
      style: 2,
      labelBackgroundColor: '#22d3ee',
    },
    horzLine: {
      color: '#22d3ee',
      width: 1,
      style: 2,
      labelBackgroundColor: '#22d3ee',
    },
  },
  timeScale: {
    borderColor: '#2a3255',
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: {
    borderColor: '#2a3255',
  },
};

export const candlestickColors: DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> = {
  upColor: '#10b981',
  downColor: '#ef4444',
  borderUpColor: '#10b981',
  borderDownColor: '#ef4444',
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
};

export const volumeColors = {
  up: 'rgba(16, 185, 129, 0.3)',
  down: 'rgba(239, 68, 68, 0.3)',
};
