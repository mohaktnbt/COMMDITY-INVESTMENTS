import { Globe } from 'lucide-react';

export function CommodityGlobe() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[400px] gap-4">
      <Globe className="h-16 w-16 text-emerald-400/60" />
      <h2 className="text-xl font-semibold text-white">3D Commodity Globe</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Requires <code className="text-emerald-400/80 bg-gray-800 px-1.5 py-0.5 rounded text-xs">globe.gl</code> — Coming soon
      </p>
      <div className="mt-2 flex gap-2">
        {['Trade Routes', 'Supply Hubs', 'Price Heatmap'].map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/10 bg-gray-800/50 px-3 py-1 text-xs text-gray-500"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
