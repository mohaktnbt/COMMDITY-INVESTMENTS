import { IndiaMandiMap } from '../components/maps/IndiaMandiMap';
import { MapLayerPanel } from '../components/maps/MapLayerPanel';

export function GlobalMap() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-screen map area */}
      <div className="h-full w-full">
        <IndiaMandiMap />
      </div>

      {/* Layer panel overlay */}
      <div className="absolute top-4 right-4 z-10">
        <MapLayerPanel />
      </div>
    </div>
  );
}
