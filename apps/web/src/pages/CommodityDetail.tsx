import { useParams } from 'react-router-dom';
import { BarChart3, Newspaper, TrendingUp, ArrowLeft } from 'lucide-react';

const COMMODITY_NAMES: Record<string, string> = {
  GOLD: 'Gold',
  CRUDE: 'Crude Oil',
  SILVER: 'Silver',
  COPPER: 'Copper',
  WHEAT: 'Wheat',
  COTTON: 'Cotton',
  NATURALGAS: 'Natural Gas',
  ALUMINUM: 'Aluminum',
};

export function CommodityDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const name = (symbol && COMMODITY_NAMES[symbol.toUpperCase()]) || symbol || 'Unknown';

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="rounded-lg border border-white/10 bg-gray-800/40 p-2 hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-400" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <span className="text-sm text-gray-500 font-mono uppercase">{symbol}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main chart area */}
        <div className="col-span-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[500px] gap-3">
            <BarChart3 className="h-16 w-16 text-emerald-400/40" />
            <h3 className="text-white font-semibold text-lg">Candlestick Chart</h3>
            <p className="text-sm text-gray-500">
              Full price chart for <span className="text-emerald-400">{name}</span> will render here
            </p>
            <div className="flex gap-2 mt-2">
              {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((range) => (
                <button
                  key={range}
                  className="px-3 py-1 rounded text-xs font-medium text-gray-500 border border-white/10 bg-gray-800/40 hover:bg-white/5 transition-colors"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="col-span-4 space-y-4">
          {/* Stats panel */}
          <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Key Statistics</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Open', value: '--' },
                { label: 'High', value: '--' },
                { label: 'Low', value: '--' },
                { label: 'Close', value: '--' },
                { label: 'Volume', value: '--' },
                { label: '52W High', value: '--' },
                { label: '52W Low', value: '--' },
                { label: 'Avg Volume', value: '--' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{stat.label}</span>
                  <span className="text-xs text-gray-300 font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* News panel */}
          <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Related News</h3>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-gray-500">No news available for {name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
