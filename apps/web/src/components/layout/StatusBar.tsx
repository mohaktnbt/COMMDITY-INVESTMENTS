import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database, Clock } from 'lucide-react';
import clsx from 'clsx';

interface StatusBarProps {
  wsConnected?: boolean;
  lastUpdateTimestamp?: number;
  activeDataSources?: number;
}

function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 5) return 'just now';
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  return `${Math.floor(diffM / 60)}h ago`;
}

function useCurrentTimeIST(): string {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST',
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export function StatusBar({
  wsConnected = false,
  lastUpdateTimestamp = 0,
  activeDataSources = 0,
}: StatusBarProps) {
  const istTime = useCurrentTimeIST();
  const [, setTick] = useState(0);

  // Re-render every 5s so "last update" stays fresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
      {/* Left group */}
      <div className="flex items-center gap-4">
        {/* WS status */}
        <div className="flex items-center gap-1.5">
          {wsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] shadow-[0_0_6px_var(--accent-green)]" />
              <Wifi className="w-3.5 h-3.5 text-[var(--accent-green)]" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />
              <WifiOff className="w-3.5 h-3.5 text-[var(--accent-red)]" />
              <span>Disconnected</span>
            </>
          )}
        </div>

        {/* Last update */}
        <div className={clsx('flex items-center gap-1.5', !lastUpdateTimestamp && 'opacity-50')}>
          <span>Last update:</span>
          <span className="text-[var(--text-secondary)]">
            {lastUpdateTimestamp ? formatTimeAgo(lastUpdateTimestamp) : '--'}
          </span>
        </div>

        {/* Data sources */}
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>
            {activeDataSources} source{activeDataSources !== 1 && 's'}
          </span>
        </div>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-mono text-[var(--text-secondary)]">{istTime}</span>
      </div>
    </footer>
  );
}
