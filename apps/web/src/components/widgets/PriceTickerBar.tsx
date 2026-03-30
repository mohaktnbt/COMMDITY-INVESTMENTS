import clsx from 'clsx';

interface TickerItem {
  symbol: string;
  price: number;
  changePercent: number;
}

interface PriceTickerBarProps {
  items: TickerItem[];
}

export function PriceTickerBar({ items }: PriceTickerBarProps) {
  // Duplicate items for seamless scroll loop
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="flex animate-ticker whitespace-nowrap py-1.5">
        {doubled.map((item, i) => {
          const isUp = item.changePercent >= 0;
          return (
            <span
              key={`${item.symbol}-${i}`}
              className="inline-flex items-center gap-1.5 px-4 text-xs font-mono"
            >
              <span className="text-[var(--text-secondary)] font-medium">{item.symbol}</span>
              <span className="text-[var(--text-primary)]">
                {item.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={clsx(
                  'font-medium',
                  isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]',
                )}
              >
                {isUp ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker-scroll 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
