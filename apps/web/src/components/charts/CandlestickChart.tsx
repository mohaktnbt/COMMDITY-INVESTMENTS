import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';
import clsx from 'clsx';
import { darkChartOptions, candlestickColors, volumeColors } from '../../styles/chart-theme';
import type { OHLCVBar, TimeInterval } from '@commodity-monitor/shared';

const intervals: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];

interface CandlestickChartProps {
  symbol: string;
  data: OHLCVBar[];
  activeInterval?: TimeInterval;
  onIntervalChange?: (interval: TimeInterval) => void;
}

function toChartTime(ts: number): Time {
  return (ts / 1000) as Time;
}

export function CandlestickChart({
  symbol,
  data,
  activeInterval = '1d',
  onIntervalChange,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      ...darkChartOptions,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      ...candlestickColors,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Update data when it changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const candleData: CandlestickData[] = data.map((bar) => ({
      time: toChartTime(bar.timestamp),
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    const volumeData: HistogramData[] = data.map((bar) => ({
      time: toChartTime(bar.timestamp),
      value: bar.volume,
      color: bar.close >= bar.open ? volumeColors.up : volumeColors.down,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--glass-border)]">
        <span className="drag-handle cursor-move text-sm font-semibold text-[var(--text-primary)]">
          {symbol}
        </span>
        <div className="flex items-center gap-1">
          {intervals.map((iv) => (
            <button
              key={iv}
              onClick={() => onIntervalChange?.(iv)}
              className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                iv === activeInterval
                  ? 'bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)]',
              )}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
