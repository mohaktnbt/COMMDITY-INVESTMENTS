import { Activity, Bell, Database, Clock } from 'lucide-react';

interface MonitoringSidebarProps {
  totalCommodities?: number;
  activeAlerts?: number;
  dataSourcesOnline?: number;
  uptimePercent?: number;
}

interface StatRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

function StatRow({ icon: Icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <span className="text-sm font-semibold font-mono text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export function MonitoringSidebar({
  totalCommodities = 0,
  activeAlerts = 0,
  dataSourcesOnline = 0,
  uptimePercent = 0,
}: MonitoringSidebarProps) {
  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="drag-handle flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)] cursor-move">
        <Activity className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">Quick Stats</span>
      </div>
      <div className="flex-1 divide-y divide-[var(--border-color)]">
        <StatRow icon={Activity} label="Commodities Tracked" value={totalCommodities} />
        <StatRow icon={Bell} label="Active Alerts" value={activeAlerts} />
        <StatRow icon={Database} label="Sources Online" value={dataSourcesOnline} />
        <StatRow icon={Clock} label="Uptime" value={`${uptimePercent.toFixed(1)}%`} />
      </div>
    </div>
  );
}
