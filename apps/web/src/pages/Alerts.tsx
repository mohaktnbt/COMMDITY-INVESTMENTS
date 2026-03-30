import { useState } from 'react';
import { Bell, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface AlertItem {
  id: string;
  name: string;
  commodity: string;
  condition: string;
  value: string;
  active: boolean;
}

const SAMPLE_ALERTS: AlertItem[] = [
  {
    id: '1',
    name: 'Gold above $2,400',
    commodity: 'GOLD',
    condition: 'Price above',
    value: '$2,400.00',
    active: true,
  },
  {
    id: '2',
    name: 'Crude below $70',
    commodity: 'CRUDE',
    condition: 'Price below',
    value: '$70.00',
    active: true,
  },
  {
    id: '3',
    name: 'Wheat RSI oversold',
    commodity: 'WHEAT',
    condition: 'RSI below 30',
    value: '30',
    active: false,
  },
];

export function Alerts() {
  const [alerts] = useState<AlertItem[]>(SAMPLE_ALERTS);

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage price alerts and monitoring rules
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors">
          <Plus className="h-4 w-4" />
          Create Alert
        </button>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-lg p-2 ${
                  alert.active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gray-800/40 text-gray-600'
                }`}
              >
                {alert.condition.includes('above') ? (
                  <TrendingUp className="h-5 w-5" />
                ) : alert.condition.includes('below') ? (
                  <TrendingDown className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{alert.name}</div>
                <div className="text-xs text-gray-500">
                  {alert.commodity} &middot; {alert.condition} {alert.value}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  alert.active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-gray-800/40 text-gray-600'
                }`}
              >
                {alert.active ? 'Active' : 'Paused'}
              </span>
              <Bell className={`h-4 w-4 ${alert.active ? 'text-emerald-400' : 'text-gray-600'}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="rounded-xl border border-dashed border-white/10 bg-gray-900/30 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          Alert notifications via WebSocket and email coming soon
        </p>
      </div>
    </div>
  );
}
