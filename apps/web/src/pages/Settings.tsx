import { Settings as SettingsIcon, Palette, Key, BellRing } from 'lucide-react';

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Settings() {
  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-gray-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure your commodity monitor</p>
      </div>

      {/* Theme section */}
      <SectionCard icon={<Palette className="h-4 w-4 text-cyan-400" />} title="Theme">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Color Scheme</div>
              <div className="text-xs text-gray-500">Choose your preferred theme</div>
            </div>
            <div className="flex gap-2">
              {['Dark', 'Light', 'System'].map((theme) => (
                <button
                  key={theme}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    theme === 'Dark'
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                      : 'border-white/10 bg-gray-800/40 text-gray-500 hover:bg-white/5'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Chart Style</div>
              <div className="text-xs text-gray-500">Default chart appearance</div>
            </div>
            <select className="rounded-lg border border-white/10 bg-gray-800/60 px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50">
              <option>Candlestick</option>
              <option>OHLC Bars</option>
              <option>Line</option>
              <option>Area</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* API Keys section */}
      <SectionCard icon={<Key className="h-4 w-4 text-amber-400" />} title="API Keys">
        <div className="space-y-4">
          {[
            { name: 'Data.gov.in', description: 'India government open data API', configured: false },
            { name: 'OpenWeatherMap', description: 'Weather data overlay', configured: false },
            { name: 'MarineTraffic', description: 'AIS vessel tracking data', configured: false },
            { name: 'Alpha Vantage', description: 'Global commodity prices', configured: false },
          ].map((api) => (
            <div key={api.name} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{api.name}</div>
                <div className="text-xs text-gray-500">{api.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    api.configured
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-gray-800/40 text-gray-600'
                  }`}
                >
                  {api.configured ? 'Configured' : 'Not set'}
                </span>
                <button className="rounded-lg border border-white/10 bg-gray-800/40 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 transition-colors">
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications section */}
      <SectionCard icon={<BellRing className="h-4 w-4 text-emerald-400" />} title="Notifications">
        <div className="space-y-4">
          {[
            { name: 'Price Alerts', description: 'Get notified when prices hit your targets', enabled: true },
            { name: 'Morning Brief', description: 'Daily AI-generated market summary at 06:00 IST', enabled: true },
            { name: 'Breaking News', description: 'Real-time alerts for major market events', enabled: false },
            { name: 'Mandi Updates', description: 'Daily mandi arrival and price updates', enabled: false },
          ].map((notif) => (
            <div key={notif.name} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">{notif.name}</div>
                <div className="text-xs text-gray-500">{notif.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={notif.enabled}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-emerald-500/40 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-emerald-400" />
              </label>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
