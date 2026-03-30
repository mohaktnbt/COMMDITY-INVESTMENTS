import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchResult {
  symbol: string;
  name: string;
  category: string;
}

interface CommoditySearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  results?: SearchResult[];
  onQueryChange?: (query: string) => void;
}

export function CommoditySearch({
  open,
  onClose,
  onSelect,
  results = [],
  onQueryChange,
}: CommoditySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to ensure the DOM is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Global Cmd+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSelectedIndex(0);
      onQueryChange?.(value);
    },
    [onQueryChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        onSelect(results[selectedIndex].symbol);
        onClose();
      }
    },
    [onClose, onSelect, results, selectedIndex],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 glass-panel border border-[var(--glass-border)] shadow-2xl rounded-lg overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commodities..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-panel-hover)] text-[var(--text-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {query ? 'No results found' : 'Type to search commodities'}
            </div>
          ) : (
            <ul>
              {results.map((result, i) => (
                <li key={result.symbol}>
                  <button
                    onClick={() => {
                      onSelect(result.symbol);
                      onClose();
                    }}
                    className={clsx(
                      'flex items-center justify-between w-full px-4 py-2.5 text-left transition-colors',
                      i === selectedIndex
                        ? 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-panel-hover)]',
                    )}
                  >
                    <div>
                      <span className="text-sm font-medium">{result.symbol}</span>
                      <span className="ml-2 text-xs text-[var(--text-muted)]">{result.name}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] capitalize">
                      {result.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--glass-border)] text-[10px] text-[var(--text-muted)]">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">&uarr;&darr;</kbd>{' '}
            Navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">Enter</kbd>{' '}
            Select
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">Esc</kbd>{' '}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
