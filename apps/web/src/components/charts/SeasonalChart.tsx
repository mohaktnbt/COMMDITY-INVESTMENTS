import { CalendarDays } from 'lucide-react';

export function SeasonalChart() {
  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)] cursor-move">
        <CalendarDays className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">Seasonal Patterns</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Coming soon</p>
      </div>
    </div>
  );
}
