import { create } from 'zustand';

export type MapLayer =
  | 'mandis'
  | 'ports'
  | 'mines'
  | 'pipelines'
  | 'vessels'
  | 'weather'
  | 'tradeFlows';

interface MapState {
  visibleLayers: Set<MapLayer>;
  mapCenter: [number, number];
  zoom: number;

  toggleLayer: (layer: MapLayer) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

const DEFAULT_LAYERS: MapLayer[] = ['mandis', 'ports', 'mines'];

export const useMapStore = create<MapState>()((set) => ({
  visibleLayers: new Set<MapLayer>(DEFAULT_LAYERS),
  mapCenter: [20.5937, 78.9629] as [number, number], // India center
  zoom: 5,

  toggleLayer: (layer: MapLayer) =>
    set((state) => {
      const next = new Set(state.visibleLayers);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return { visibleLayers: next };
    }),

  setCenter: (center: [number, number]) => set({ mapCenter: center }),

  setZoom: (zoom: number) => set({ zoom }),
}));
