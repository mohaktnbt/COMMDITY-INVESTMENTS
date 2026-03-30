import { Search, Bell, Activity } from 'lucide-react';
import clsx from 'clsx';

interface TopBarProps {
  notificationCount?: number;
  onSearchClick?: () => void;
}

export function TopBar({ notificationCount = 0, onSearchClick }: TopBarProps) {
  return (
    <header className="glass-panel flex items-center justify-between px-4 py-2.5 border-b border-[var(--glass-border)] rounded-none">
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <Activity className="w-5 h-5 text-[var(--accent-cyan)]" />
        <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-wide">
          Commodity Monitor
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
            'bg-[var(--bg-panel)] border border-[var(--border-color)]',
            'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/40',
            'transition-colors',
          )}
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] border border-[var(--border-color)]">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--accent-red)] text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
