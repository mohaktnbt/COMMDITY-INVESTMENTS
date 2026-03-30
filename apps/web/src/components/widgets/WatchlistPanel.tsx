import { Eye, Plus, X } from 'lucide-react';
import clsx from 'clsx';

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistPanelProps {
  items: WatchlistItem[];
  onAddSymbol?: () => void;
  onRemoveSymbol?: (symbol: string) => void;
}

export function WatchlistPanel({ items, onAddSymbol, onRemoveSymbol }: WatchlistPanelProps) {
  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-[var(--glass-border)] cursor-move">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Watchlist</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{items.length} items</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)]">No symbols added</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {items.map((item) => {
              const isUp = item.change >= 0;
              return (
                <li
                  key={item.symbol}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-panel-hover)] transition-colors group"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {item.symbol}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-mono text-[var(--text-primary)]">
                        {item.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={clsx(
                          'text-xs font-mono',
                          isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]',
                        )}
                      >
                        {isUp ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </p>
                    </div>
                    {onRemoveSymbol && (
                      <button
                        onClick={() => onRemoveSymbol(item.symbol)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--accent-red)]/20 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {onAddSymbol && (
        <div className="px-3 py-2 border-t border-[var(--glass-border)]">
          <button
            onClick={onAddSymbol}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-panel-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add symbol
          </button>
        </div>
      )}
    </div>
  );
}
