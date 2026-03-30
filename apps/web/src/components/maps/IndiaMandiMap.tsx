import { MapPin } from 'lucide-react';

export function IndiaMandiMap() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[500px] gap-4">
      <MapPin className="h-16 w-16 text-amber-400/60" />
      <h2 className="text-xl font-semibold text-white">India Mandi Price Map</h2>
      <p className="text-sm text-gray-400 text-center max-w-sm">
        Interactive mandi price visualization with{' '}
        <code className="text-amber-400/80 bg-gray-800 px-1.5 py-0.5 rounded text-xs">deck.gl</code>{' '}
        integration coming soon. Will display real-time prices across 7,000+ mandis.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Mandis', value: '7,000+' },
          { label: 'States', value: '28' },
          { label: 'Commodities', value: '300+' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/5 bg-gray-800/40 px-4 py-2">
            <div className="text-lg font-bold text-amber-400">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
