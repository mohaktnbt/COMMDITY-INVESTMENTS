/**
 * MandiService - fetches Indian agricultural mandi prices.
 * Returns sample data for now.
 */
import type { MandiPrice } from '@commodity-monitor/shared';

// Sample mandi price data
// TODO: Fetch from QuestDB
const SAMPLE_MANDI_PRICES: MandiPrice[] = [
  {
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Pune (Gultekdi)',
    commodity: 'Wheat',
    variety: 'Lokwan',
    arrivalDate: '2026-03-29',
    minPrice: 2450,
    maxPrice: 2620,
    modalPrice: 2530,
    unit: 'quintal',
  },
  {
    state: 'Maharashtra',
    district: 'Latur',
    market: 'Latur',
    commodity: 'Soybean',
    variety: 'Yellow',
    arrivalDate: '2026-03-29',
    minPrice: 4200,
    maxPrice: 4480,
    modalPrice: 4350,
    unit: 'quintal',
  },
  {
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore',
    commodity: 'Soybean',
    variety: 'Yellow',
    arrivalDate: '2026-03-29',
    minPrice: 4180,
    maxPrice: 4420,
    modalPrice: 4310,
    unit: 'quintal',
  },
  {
    state: 'Madhya Pradesh',
    district: 'Neemuch',
    market: 'Neemuch',
    commodity: 'Garlic',
    variety: 'Desi',
    arrivalDate: '2026-03-29',
    minPrice: 3500,
    maxPrice: 5200,
    modalPrice: 4200,
    unit: 'quintal',
  },
  {
    state: 'Rajasthan',
    district: 'Jodhpur',
    market: 'Jodhpur',
    commodity: 'Cumin (Jeera)',
    variety: 'Bold',
    arrivalDate: '2026-03-29',
    minPrice: 32000,
    maxPrice: 35500,
    modalPrice: 33800,
    unit: 'quintal',
  },
  {
    state: 'Rajasthan',
    district: 'Kota',
    market: 'Kota',
    commodity: 'Coriander',
    variety: 'Eagle',
    arrivalDate: '2026-03-29',
    minPrice: 7200,
    maxPrice: 8100,
    modalPrice: 7650,
    unit: 'quintal',
  },
  {
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot',
    commodity: 'Groundnut',
    variety: 'Bold',
    arrivalDate: '2026-03-29',
    minPrice: 5800,
    maxPrice: 6300,
    modalPrice: 6050,
    unit: 'quintal',
  },
  {
    state: 'Gujarat',
    district: 'Unjha',
    market: 'Unjha',
    commodity: 'Cumin (Jeera)',
    variety: 'Bold',
    arrivalDate: '2026-03-29',
    minPrice: 31500,
    maxPrice: 35000,
    modalPrice: 33200,
    unit: 'quintal',
  },
  {
    state: 'Karnataka',
    district: 'Davangere',
    market: 'Davangere',
    commodity: 'Maize',
    variety: 'Yellow',
    arrivalDate: '2026-03-29',
    minPrice: 1850,
    maxPrice: 2050,
    modalPrice: 1950,
    unit: 'quintal',
  },
  {
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana',
    commodity: 'Wheat',
    variety: 'PBW-343',
    arrivalDate: '2026-03-29',
    minPrice: 2275,
    maxPrice: 2400,
    modalPrice: 2350,
    unit: 'quintal',
  },
  {
    state: 'Telangana',
    district: 'Nizamabad',
    market: 'Nizamabad',
    commodity: 'Turmeric',
    variety: 'Finger',
    arrivalDate: '2026-03-29',
    minPrice: 12500,
    maxPrice: 14200,
    modalPrice: 13400,
    unit: 'quintal',
  },
  {
    state: 'Tamil Nadu',
    district: 'Erode',
    market: 'Erode',
    commodity: 'Turmeric',
    variety: 'Finger',
    arrivalDate: '2026-03-29',
    minPrice: 12800,
    maxPrice: 14500,
    modalPrice: 13600,
    unit: 'quintal',
  },
];

export interface MandiPriceParams {
  commodity?: string;
  state?: string;
  limit?: number;
}

export class MandiService {
  /**
   * Get mandi prices with optional filtering.
   */
  async getMandiPrices(params: MandiPriceParams = {}): Promise<MandiPrice[]> {
    // TODO: Fetch from QuestDB
    // const conditions: string[] = [];
    // if (params.commodity) conditions.push(`commodity = '${params.commodity}'`);
    // if (params.state) conditions.push(`state = '${params.state}'`);
    // const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    // const sql = `SELECT * FROM mandi_prices ${where} ORDER BY arrival_date DESC LIMIT ${params.limit ?? 50}`;
    // return queryQuestDB(sql);

    let filtered = [...SAMPLE_MANDI_PRICES];

    if (params.commodity) {
      const q = params.commodity.toLowerCase();
      filtered = filtered.filter((m) => m.commodity.toLowerCase().includes(q));
    }

    if (params.state) {
      const q = params.state.toLowerCase();
      filtered = filtered.filter((m) => m.state.toLowerCase().includes(q));
    }

    const limit = params.limit ?? 50;
    return filtered.slice(0, limit);
  }
}

export const mandiService = new MandiService();
