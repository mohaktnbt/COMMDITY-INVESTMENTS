import { Newspaper } from 'lucide-react';
import clsx from 'clsx';

type Sentiment = 'positive' | 'negative' | 'neutral';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  sentiment: Sentiment;
}

interface NewsFeedProps {
  items: NewsItem[];
}

const sentimentStyles: Record<Sentiment, string> = {
  positive: 'bg-[var(--accent-green)]/15 text-[var(--accent-green)]',
  negative: 'bg-[var(--accent-red)]/15 text-[var(--accent-red)]',
  neutral: 'bg-[var(--text-muted)]/15 text-[var(--text-muted)]',
};

const sentimentLabels: Record<Sentiment, string> = {
  positive: 'Bullish',
  negative: 'Bearish',
  neutral: 'Neutral',
};

export function NewsFeed({ items }: NewsFeedProps) {
  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)] cursor-move">
        <Newspaper className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">News Feed</span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)]">No news available</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {items.map((item) => (
              <li
                key={item.id}
                className="px-3 py-2.5 hover:bg-[var(--bg-panel-hover)] transition-colors cursor-pointer"
              >
                <p className="text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-[var(--text-muted)]">{item.source}</span>
                  <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                  <span className="text-xs text-[var(--text-muted)]">{item.timeAgo}</span>
                  <span
                    className={clsx(
                      'ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                      sentimentStyles[item.sentiment],
                    )}
                  >
                    {sentimentLabels[item.sentiment]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
