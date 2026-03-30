import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, AreaSeries, type Time } from 'lightweight-charts';
import clsx from 'clsx';

interface SparklinePoint {
  timestamp: number;
  value: number;
}

interface SparklineCardProps {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  sparklineData: SparklinePoint[];
}

export function SparklineCard({
  name,
  symbol,
  price,
  change,
  changePercent,
  sparklineData,
}: SparklineCardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const isUp = change >= 0;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 40,
      layout: { background: { color: 'transparent' }, textColor: 'transparent' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const lineColor = isUp ? '#10b981' : '#ef4444';

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      bottomColor: 'transparent',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    if (sparklineData.length > 0) {
      series.setData(
        sparklineData.map((d) => ({
          time: (d.timestamp / 1000) as Time,
          value: d.value,
        })),
      );
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [sparklineData, isUp]);

  return (
    <div
      className={clsx(
        'glass-panel p-3 flex flex-col gap-1 border-l-2 transition-colors',
        isUp ? 'border-l-[var(--accent-green)]' : 'border-l-[var(--accent-red)]',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{symbol}</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--text-primary)] font-mono">
            {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p
            className={clsx(
              'text-xs font-mono',
              isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]',
            )}
          >
            {isUp ? '+' : ''}
            {change.toFixed(2)} ({isUp ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[40px]" />
    </div>
  );
}
