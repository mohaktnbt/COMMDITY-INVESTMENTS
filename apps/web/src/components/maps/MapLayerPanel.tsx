import {
  MapPin,
  Anchor,
  Mountain,
  PipetteIcon,
  Ship,
  CloudRain,
  ArrowRightLeft,
} from 'lucide-react';
import { useMapStore, type MapLayer } from '../../stores/map-store';

interface LayerToggle {
  layer: MapLayer;
  label: string;
  icon: React.ReactNode;
}

const LAYERS: LayerToggle[] = [
  { layer: 'mandis', label: 'Mandis', icon: <MapPin className="h-4 w-4" /> },
  { layer: 'ports', label: 'Ports', icon: <Anchor className="h-4 w-4" /> },
  { layer: 'mines', label: 'Mines', icon: <Mountain className="h-4 w-4" /> },
  { layer: 'pipelines', label: 'Pipelines', icon: <PipetteIcon className="h-4 w-4" /> },
  { layer: 'vessels', label: 'Vessels', icon: <Ship className="h-4 w-4" /> },
  { layer: 'weather', label: 'Weather', icon: <CloudRain className="h-4 w-4" /> },
  { layer: 'tradeFlows', label: 'Trade Flows', icon: <ArrowRightLeft className="h-4 w-4" /> },
];

export function MapLayerPanel() {
  const { visibleLayers, toggleLayer } = useMapStore();

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/80 backdrop-blur-md p-4 w-64">
      <h3 className="text-sm font-semibold text-white mb-3">Map Layers</h3>
      <div className="flex flex-col gap-2">
        {LAYERS.map(({ layer, label, icon }) => {
          const active = visibleLayers.has(layer);
          return (
            <label
              key={layer}
              className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleLayer(layer)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
              />
              <span className={active ? 'text-white' : 'text-gray-500'}>{icon}</span>
              <span className={`text-sm ${active ? 'text-white' : 'text-gray-500'}`}>
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
