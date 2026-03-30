export type CommodityCategory =
  | 'energy'
  | 'precious_metals'
  | 'base_metals'
  | 'agriculture'
  | 'livestock'
  | 'softs'
  | 'indices';

export type CommoditySubcategory =
  | 'crude_oil'
  | 'natural_gas'
  | 'refined_products'
  | 'coal'
  | 'gold'
  | 'silver'
  | 'platinum_group'
  | 'copper'
  | 'aluminum'
  | 'zinc'
  | 'nickel'
  | 'lead'
  | 'tin'
  | 'iron_ore'
  | 'steel'
  | 'grains'
  | 'oilseeds'
  | 'fibers'
  | 'sugar'
  | 'coffee'
  | 'cocoa'
  | 'spices'
  | 'pulses'
  | 'edible_oils'
  | 'cattle'
  | 'hogs'
  | 'poultry';

export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'CNY';

export type PriceUnit =
  | 'oz'       // troy ounce (precious metals)
  | 'bbl'      // barrel (crude oil)
  | 'mt'       // metric tonne
  | 'bushel'   // grains
  | 'lb'       // pound
  | 'cwt'      // hundredweight (livestock)
  | 'quintal'  // Indian unit (100 kg)
  | 'mmbtu'    // natural gas
  | 'gallon'   // refined products
  | 'kg'       // generic
  | 'liter'    // liquid
  | 'index';   // index points

export interface CommodityMeta {
  symbol: string;
  name: string;
  category: CommodityCategory;
  subcategory: CommoditySubcategory;
  exchange: string;
  currency: Currency;
  unit: PriceUnit;
  yahooSymbol?: string;
  fredSeriesId?: string;
  description?: string;
  contractSize?: number;
  tickSize?: number;
}

export interface PriceQuote {
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  openInterest?: number;
  currency: Currency;
  unit: PriceUnit;
  timestamp: number;
  source: string;
}

export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  openInterest?: number;
}

export type TimeInterval =
  | '1m' | '5m' | '15m' | '30m'
  | '1h' | '4h'
  | '1d' | '1w' | '1M';

export interface PriceAlert {
  symbol: string;
  condition: 'above' | 'below' | 'pct_change' | 'volume_spike';
  threshold: number;
  currentPrice: number;
  triggeredAt: number;
}

export interface CommoditySearchResult {
  symbol: string;
  name: string;
  category: CommodityCategory;
  exchange: string;
  latestPrice?: number;
  change?: number;
}
