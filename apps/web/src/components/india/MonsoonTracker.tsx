import { CloudRain } from 'lucide-react';

export function MonsoonTracker() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[300px] gap-4">
      <CloudRain className="h-12 w-12 text-sky-400/60" />
      <h2 className="text-lg font-semibold text-white">Monsoon Progress Tracker</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        IMD monsoon onset and withdrawal tracking with rainfall deviation maps. Coming soon.
      </p>
    </div>
  );
}
