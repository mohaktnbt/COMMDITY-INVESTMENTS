import { Ship } from 'lucide-react';

export function VesselTracker() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[400px] gap-4">
      <Ship className="h-16 w-16 text-cyan-400/60" />
      <h2 className="text-xl font-semibold text-white">Vessel Tracker</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Real-time AIS vessel tracking for commodity tankers and bulk carriers. Coming soon.
      </p>
    </div>
  );
}
