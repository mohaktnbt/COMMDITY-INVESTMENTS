export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface MandiLocation extends GeoLocation {
  state: string;
  district: string;
  market: string;
  code: string;
}

export interface PortLocation extends GeoLocation {
  name: string;
  country: string;
  portCode: string;
  type: 'seaport' | 'river_port' | 'dry_port';
  commodities: string[];
}

export interface MineLocation extends GeoLocation {
  name: string;
  country: string;
  commodity: string;
  operator?: string;
  status: 'active' | 'planned' | 'suspended' | 'closed';
  annualCapacity?: number;
  capacityUnit?: string;
}

export interface PipelineSegment {
  from: GeoLocation;
  to: GeoLocation;
  name: string;
  commodity: 'crude_oil' | 'natural_gas' | 'refined_products';
  capacityBpd?: number;
  operator?: string;
  status: 'active' | 'planned' | 'under_construction';
}

export interface TradeFlow {
  from: GeoLocation;
  to: GeoLocation;
  fromCountry: string;
  toCountry: string;
  commodity: string;
  volumeMt: number;
  valueMuSD: number;
  year: number;
}

export interface VesselPosition {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  course: number;
  speed: number;
  vesselType: string;
  destination?: string;
  cargo?: string;
  timestamp: number;
}

export interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrivalDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
}

export interface WeatherData {
  location: GeoLocation;
  region: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  rainfallDeviation: number;
  condition: string;
  timestamp: number;
}
