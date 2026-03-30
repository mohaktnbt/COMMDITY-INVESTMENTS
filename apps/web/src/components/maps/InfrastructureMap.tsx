import { Factory } from 'lucide-react';

export function InfrastructureMap() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-8 min-h-[400px] gap-4">
      <Factory className="h-16 w-16 text-purple-400/60" />
      <h2 className="text-xl font-semibold text-white">Infrastructure Map</h2>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Ports, pipelines, mines, and refineries overlaid on a global map. Coming soon.
      </p>
    </div>
  );
}
