import { TrendingUp } from 'lucide-react';

export function MSPTracker() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[300px] gap-4">
      <TrendingUp className="h-12 w-12 text-emerald-400/60" />
      <h2 className="text-lg font-semibold text-white">MSP vs Market Price</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Comparison of Minimum Support Prices with actual mandi market prices across key crops. Coming soon.
      </p>
    </div>
  );
}
