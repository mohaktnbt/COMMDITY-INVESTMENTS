import { BarChart3 } from 'lucide-react';

export function WPIIndicator() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[300px] gap-4">
      <BarChart3 className="h-12 w-12 text-orange-400/60" />
      <h2 className="text-lg font-semibold text-white">Wholesale Price Index</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        WPI trends for primary articles, fuel, and manufactured products. Coming soon.
      </p>
    </div>
  );
}
