import { BarChart3, Eye, Newspaper, Bell } from 'lucide-react';

function PriceTickerBar() {
  const tickers = [
    { symbol: 'GOLD', price: '2,341.50', change: '+0.82%', up: true },
    { symbol: 'CRUDE', price: '78.23', change: '-1.14%', up: false },
    { symbol: 'SILVER', price: '29.45', change: '+1.23%', up: true },
    { symbol: 'COPPER', price: '4.12', change: '+0.34%', up: true },
    { symbol: 'WHEAT', price: '612.75', change: '-0.56%', up: false },
    { symbol: 'COTTON', price: '82.10', change: '+0.91%', up: true },
  ];

  return (
    <div className="col-span-full rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md px-4 py-3 overflow-hidden">
      <div className="flex gap-6 overflow-x-auto scrollbar-none">
        {tickers.map((t) => (
          <div key={t.symbol} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-semibold text-white">{t.symbol}</span>
            <span className="text-sm text-gray-300 font-mono">{t.price}</span>
            <span className={`text-xs font-mono ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4 min-h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Watchlist</h3>
      </div>
      <div className="space-y-2">
        {['GOLD', 'CRUDE OIL', 'SILVER', 'NATURAL GAS', 'WHEAT'].map((sym) => (
          <div
            key={sym}
            className="flex items-center justify-between rounded-lg bg-gray-800/40 px-3 py-2 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="text-sm text-white">{sym}</span>
            <span className="text-xs text-gray-500">--</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandlestickChartPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[400px] gap-3">
      <BarChart3 className="h-12 w-12 text-emerald-400/40" />
      <h3 className="text-white font-semibold">Candlestick Chart</h3>
      <p className="text-xs text-gray-500">Select a commodity to display price chart</p>
    </div>
  );
}

function NewsFeed() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4 min-h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">News Feed</h3>
      </div>
      <div className="space-y-3">
        {[
          'OPEC+ discusses output adjustments...',
          'India wheat procurement gains momentum...',
          'Gold hits new highs on rate cut hopes...',
        ].map((headline, i) => (
          <div
            key={i}
            className="rounded-lg bg-gray-800/40 px-3 py-2 text-xs text-gray-400 hover:bg-white/5 transition-colors cursor-pointer"
          >
            {headline}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitoringSidebar() {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-4 min-h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Monitoring</h3>
      </div>
      <div className="space-y-3">
        <div className="text-xs text-gray-500">No active alerts</div>
        <button className="w-full rounded-lg border border-white/10 bg-gray-800/40 px-3 py-2 text-xs text-gray-400 hover:bg-white/5 transition-colors">
          + Create Alert
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-12 gap-4">
        <PriceTickerBar />
        <div className="col-span-2">
          <WatchlistPanel />
        </div>
        <div className="col-span-5">
          <CandlestickChartPlaceholder />
        </div>
        <div className="col-span-3">
          <NewsFeed />
        </div>
        <div className="col-span-2">
          <MonitoringSidebar />
        </div>
      </div>
    </div>
  );
}
