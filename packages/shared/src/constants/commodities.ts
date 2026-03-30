import type { CommodityMeta } from '../types/commodity.js';

export const COMMODITIES: CommodityMeta[] = [
  // ===== ENERGY =====
  { symbol: 'WTI_CRUDE', name: 'WTI Crude Oil', category: 'energy', subcategory: 'crude_oil', exchange: 'NYMEX', currency: 'USD', unit: 'bbl', yahooSymbol: 'CL=F', fredSeriesId: 'DCOILWTICO' },
  { symbol: 'BRENT_CRUDE', name: 'Brent Crude Oil', category: 'energy', subcategory: 'crude_oil', exchange: 'ICE', currency: 'USD', unit: 'bbl', yahooSymbol: 'BZ=F', fredSeriesId: 'DCOILBRENTEU' },
  { symbol: 'NATURAL_GAS', name: 'Natural Gas', category: 'energy', subcategory: 'natural_gas', exchange: 'NYMEX', currency: 'USD', unit: 'mmbtu', yahooSymbol: 'NG=F' },
  { symbol: 'RBOB_GASOLINE', name: 'RBOB Gasoline', category: 'energy', subcategory: 'refined_products', exchange: 'NYMEX', currency: 'USD', unit: 'gallon', yahooSymbol: 'RB=F' },
  { symbol: 'HEATING_OIL', name: 'Heating Oil', category: 'energy', subcategory: 'refined_products', exchange: 'NYMEX', currency: 'USD', unit: 'gallon', yahooSymbol: 'HO=F' },
  { symbol: 'MCX_CRUDE', name: 'MCX Crude Oil', category: 'energy', subcategory: 'crude_oil', exchange: 'MCX', currency: 'INR', unit: 'bbl' },
  { symbol: 'MCX_NATURAL_GAS', name: 'MCX Natural Gas', category: 'energy', subcategory: 'natural_gas', exchange: 'MCX', currency: 'INR', unit: 'mmbtu' },

  // ===== PRECIOUS METALS =====
  { symbol: 'GOLD', name: 'Gold', category: 'precious_metals', subcategory: 'gold', exchange: 'COMEX', currency: 'USD', unit: 'oz', yahooSymbol: 'GC=F', fredSeriesId: 'GOLDPMGBD228NLBM' },
  { symbol: 'SILVER', name: 'Silver', category: 'precious_metals', subcategory: 'silver', exchange: 'COMEX', currency: 'USD', unit: 'oz', yahooSymbol: 'SI=F', fredSeriesId: 'SLVPRUSD' },
  { symbol: 'PLATINUM', name: 'Platinum', category: 'precious_metals', subcategory: 'platinum_group', exchange: 'NYMEX', currency: 'USD', unit: 'oz', yahooSymbol: 'PL=F' },
  { symbol: 'PALLADIUM', name: 'Palladium', category: 'precious_metals', subcategory: 'platinum_group', exchange: 'NYMEX', currency: 'USD', unit: 'oz', yahooSymbol: 'PA=F' },
  { symbol: 'MCX_GOLD', name: 'MCX Gold', category: 'precious_metals', subcategory: 'gold', exchange: 'MCX', currency: 'INR', unit: 'oz' },
  { symbol: 'MCX_SILVER', name: 'MCX Silver', category: 'precious_metals', subcategory: 'silver', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'MCX_GOLDMINI', name: 'MCX Gold Mini', category: 'precious_metals', subcategory: 'gold', exchange: 'MCX', currency: 'INR', unit: 'oz' },

  // ===== BASE METALS =====
  { symbol: 'COPPER', name: 'Copper', category: 'base_metals', subcategory: 'copper', exchange: 'COMEX', currency: 'USD', unit: 'lb', yahooSymbol: 'HG=F' },
  { symbol: 'ALUMINUM', name: 'Aluminum', category: 'base_metals', subcategory: 'aluminum', exchange: 'LME', currency: 'USD', unit: 'mt' },
  { symbol: 'ZINC', name: 'Zinc', category: 'base_metals', subcategory: 'zinc', exchange: 'LME', currency: 'USD', unit: 'mt' },
  { symbol: 'NICKEL', name: 'Nickel', category: 'base_metals', subcategory: 'nickel', exchange: 'LME', currency: 'USD', unit: 'mt' },
  { symbol: 'LEAD', name: 'Lead', category: 'base_metals', subcategory: 'lead', exchange: 'LME', currency: 'USD', unit: 'mt' },
  { symbol: 'TIN', name: 'Tin', category: 'base_metals', subcategory: 'tin', exchange: 'LME', currency: 'USD', unit: 'mt' },
  { symbol: 'IRON_ORE', name: 'Iron Ore', category: 'base_metals', subcategory: 'iron_ore', exchange: 'SGX', currency: 'USD', unit: 'mt' },
  { symbol: 'STEEL_REBAR', name: 'Steel Rebar', category: 'base_metals', subcategory: 'steel', exchange: 'SHFE', currency: 'CNY', unit: 'mt' },
  { symbol: 'MCX_COPPER', name: 'MCX Copper', category: 'base_metals', subcategory: 'copper', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'MCX_ZINC', name: 'MCX Zinc', category: 'base_metals', subcategory: 'zinc', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'MCX_ALUMINUM', name: 'MCX Aluminum', category: 'base_metals', subcategory: 'aluminum', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'MCX_NICKEL', name: 'MCX Nickel', category: 'base_metals', subcategory: 'nickel', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'MCX_LEAD', name: 'MCX Lead', category: 'base_metals', subcategory: 'lead', exchange: 'MCX', currency: 'INR', unit: 'kg' },

  // ===== GRAINS =====
  { symbol: 'WHEAT', name: 'Wheat', category: 'agriculture', subcategory: 'grains', exchange: 'CBOT', currency: 'USD', unit: 'bushel', yahooSymbol: 'ZW=F' },
  { symbol: 'CORN', name: 'Corn', category: 'agriculture', subcategory: 'grains', exchange: 'CBOT', currency: 'USD', unit: 'bushel', yahooSymbol: 'ZC=F' },
  { symbol: 'RICE', name: 'Rough Rice', category: 'agriculture', subcategory: 'grains', exchange: 'CBOT', currency: 'USD', unit: 'cwt', yahooSymbol: 'ZR=F' },
  { symbol: 'OATS', name: 'Oats', category: 'agriculture', subcategory: 'grains', exchange: 'CBOT', currency: 'USD', unit: 'bushel', yahooSymbol: 'ZO=F' },

  // ===== OILSEEDS =====
  { symbol: 'SOYBEANS', name: 'Soybeans', category: 'agriculture', subcategory: 'oilseeds', exchange: 'CBOT', currency: 'USD', unit: 'bushel', yahooSymbol: 'ZS=F' },
  { symbol: 'SOYBEAN_OIL', name: 'Soybean Oil', category: 'agriculture', subcategory: 'oilseeds', exchange: 'CBOT', currency: 'USD', unit: 'lb', yahooSymbol: 'ZL=F' },
  { symbol: 'SOYBEAN_MEAL', name: 'Soybean Meal', category: 'agriculture', subcategory: 'oilseeds', exchange: 'CBOT', currency: 'USD', unit: 'mt', yahooSymbol: 'ZM=F' },
  { symbol: 'PALM_OIL', name: 'Crude Palm Oil', category: 'agriculture', subcategory: 'edible_oils', exchange: 'DCE', currency: 'USD', unit: 'mt' },
  { symbol: 'RAPESEED', name: 'Rapeseed/Canola', category: 'agriculture', subcategory: 'oilseeds', exchange: 'ICE_EU', currency: 'EUR', unit: 'mt' },
  { symbol: 'MCX_CPO', name: 'MCX Crude Palm Oil', category: 'agriculture', subcategory: 'edible_oils', exchange: 'MCX', currency: 'INR', unit: 'mt' },
  { symbol: 'NCDEX_SOYBEAN', name: 'NCDEX Soybean', category: 'agriculture', subcategory: 'oilseeds', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_MUSTARD_SEED', name: 'NCDEX Mustard Seed', category: 'agriculture', subcategory: 'oilseeds', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_CASTOR_SEED', name: 'NCDEX Castor Seed', category: 'agriculture', subcategory: 'oilseeds', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },

  // ===== SOFTS =====
  { symbol: 'COFFEE', name: 'Coffee (Arabica)', category: 'softs', subcategory: 'coffee', exchange: 'ICE', currency: 'USD', unit: 'lb', yahooSymbol: 'KC=F' },
  { symbol: 'COFFEE_ROBUSTA', name: 'Coffee (Robusta)', category: 'softs', subcategory: 'coffee', exchange: 'ICE_EU', currency: 'USD', unit: 'mt' },
  { symbol: 'SUGAR', name: 'Sugar #11', category: 'softs', subcategory: 'sugar', exchange: 'ICE', currency: 'USD', unit: 'lb', yahooSymbol: 'SB=F' },
  { symbol: 'COCOA', name: 'Cocoa', category: 'softs', subcategory: 'cocoa', exchange: 'ICE', currency: 'USD', unit: 'mt', yahooSymbol: 'CC=F' },
  { symbol: 'COTTON', name: 'Cotton #2', category: 'softs', subcategory: 'fibers', exchange: 'ICE', currency: 'USD', unit: 'lb', yahooSymbol: 'CT=F' },
  { symbol: 'ORANGE_JUICE', name: 'Orange Juice', category: 'softs', subcategory: 'sugar', exchange: 'ICE', currency: 'USD', unit: 'lb', yahooSymbol: 'OJ=F' },
  { symbol: 'RUBBER', name: 'Rubber', category: 'softs', subcategory: 'fibers', exchange: 'TOCOM', currency: 'JPY', unit: 'kg' },
  { symbol: 'MCX_COTTON', name: 'MCX Cotton', category: 'softs', subcategory: 'fibers', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'NCDEX_COTTON', name: 'NCDEX Cotton', category: 'softs', subcategory: 'fibers', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },

  // ===== SPICES (India-specific) =====
  { symbol: 'NCDEX_TURMERIC', name: 'NCDEX Turmeric', category: 'agriculture', subcategory: 'spices', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_JEERA', name: 'NCDEX Jeera (Cumin)', category: 'agriculture', subcategory: 'spices', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_CORIANDER', name: 'NCDEX Coriander', category: 'agriculture', subcategory: 'spices', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'MCX_MENTHA_OIL', name: 'MCX Mentha Oil', category: 'agriculture', subcategory: 'spices', exchange: 'MCX', currency: 'INR', unit: 'kg' },
  { symbol: 'NCDEX_PEPPER', name: 'NCDEX Pepper', category: 'agriculture', subcategory: 'spices', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_CARDAMOM', name: 'NCDEX Cardamom', category: 'agriculture', subcategory: 'spices', exchange: 'NCDEX', currency: 'INR', unit: 'kg' },

  // ===== PULSES (India-specific) =====
  { symbol: 'NCDEX_CHANA', name: 'NCDEX Chana (Gram)', category: 'agriculture', subcategory: 'pulses', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_MOONG', name: 'NCDEX Moong', category: 'agriculture', subcategory: 'pulses', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_MASOOR', name: 'NCDEX Masoor (Lentil)', category: 'agriculture', subcategory: 'pulses', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },

  // ===== INDIAN AGRICULTURE =====
  { symbol: 'NCDEX_WHEAT', name: 'NCDEX Wheat', category: 'agriculture', subcategory: 'grains', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_BARLEY', name: 'NCDEX Barley', category: 'agriculture', subcategory: 'grains', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_MAIZE', name: 'NCDEX Maize', category: 'agriculture', subcategory: 'grains', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_GUAR_SEED', name: 'NCDEX Guar Seed', category: 'agriculture', subcategory: 'oilseeds', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },
  { symbol: 'NCDEX_GUAR_GUM', name: 'NCDEX Guar Gum', category: 'agriculture', subcategory: 'oilseeds', exchange: 'NCDEX', currency: 'INR', unit: 'quintal' },

  // ===== LIVESTOCK =====
  { symbol: 'LIVE_CATTLE', name: 'Live Cattle', category: 'livestock', subcategory: 'cattle', exchange: 'CME', currency: 'USD', unit: 'cwt', yahooSymbol: 'LE=F' },
  { symbol: 'FEEDER_CATTLE', name: 'Feeder Cattle', category: 'livestock', subcategory: 'cattle', exchange: 'CME', currency: 'USD', unit: 'cwt', yahooSymbol: 'GF=F' },
  { symbol: 'LEAN_HOGS', name: 'Lean Hogs', category: 'livestock', subcategory: 'hogs', exchange: 'CME', currency: 'USD', unit: 'cwt', yahooSymbol: 'HE=F' },

  // ===== ETFs =====
  { symbol: 'GLD', name: 'SPDR Gold Trust', category: 'precious_metals', subcategory: 'gold', exchange: 'INDEX', currency: 'USD', unit: 'index', yahooSymbol: 'GLD' },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'precious_metals', subcategory: 'silver', exchange: 'INDEX', currency: 'USD', unit: 'index', yahooSymbol: 'SLV' },
  { symbol: 'USO', name: 'United States Oil Fund', category: 'energy', subcategory: 'crude_oil', exchange: 'INDEX', currency: 'USD', unit: 'index', yahooSymbol: 'USO' },
  { symbol: 'DBA', name: 'Invesco DB Agriculture Fund', category: 'agriculture', subcategory: 'grains', exchange: 'INDEX', currency: 'USD', unit: 'index', yahooSymbol: 'DBA' },
  { symbol: 'DBC', name: 'Invesco DB Commodity Index', category: 'indices', subcategory: 'grains', exchange: 'INDEX', currency: 'USD', unit: 'index', yahooSymbol: 'DBC' },

  // ===== INDICES =====
  { symbol: 'GSCI', name: 'S&P GSCI', category: 'indices', subcategory: 'grains', exchange: 'INDEX', currency: 'USD', unit: 'index' },
  { symbol: 'BCOM', name: 'Bloomberg Commodity Index', category: 'indices', subcategory: 'grains', exchange: 'INDEX', currency: 'USD', unit: 'index' },
  { symbol: 'CRB', name: 'CRB Commodity Index', category: 'indices', subcategory: 'grains', exchange: 'INDEX', currency: 'USD', unit: 'index' },
];

export const COMMODITY_BY_SYMBOL = new Map(COMMODITIES.map(c => [c.symbol, c]));

export const COMMODITIES_BY_CATEGORY = COMMODITIES.reduce((acc, c) => {
  if (!acc[c.category]) acc[c.category] = [];
  acc[c.category].push(c);
  return acc;
}, {} as Record<string, CommodityMeta[]>);

export const YAHOO_FUTURES_SYMBOLS = COMMODITIES
  .filter(c => c.yahooSymbol)
  .map(c => ({ symbol: c.symbol, yahooSymbol: c.yahooSymbol! }));
