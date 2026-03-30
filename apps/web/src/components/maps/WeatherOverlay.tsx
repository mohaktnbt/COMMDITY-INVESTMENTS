import { CloudRain } from 'lucide-react';

export function WeatherOverlay() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[400px] gap-4">
      <CloudRain className="h-16 w-16 text-sky-400/60" />
      <h2 className="text-xl font-semibold text-white">Weather Overlay</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Precipitation, temperature, and drought index overlays for agricultural regions. Coming soon.
      </p>
    </div>
  );
}
