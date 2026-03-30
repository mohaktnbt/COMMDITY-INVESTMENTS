import { MandiPriceTable } from '../components/india/MandiPriceTable';
import { MSPTracker } from '../components/india/MSPTracker';
import { MonsoonTracker } from '../components/india/MonsoonTracker';
import { WPIIndicator } from '../components/india/WPIIndicator';
import { IndiaTradeBalance } from '../components/india/IndiaTradeBalance';
import type { MandiPrice } from '@commodity-monitor/shared';

const SAMPLE_MANDI_DATA: MandiPrice[] = [
  {
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Pune',
    commodity: 'Wheat',
    variety: 'Lokwan',
    arrivalDate: '2026-03-28',
    minPrice: 2250,
    maxPrice: 2450,
    modalPrice: 2350,
    unit: 'Quintal',
  },
  {
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore',
    commodity: 'Soybean',
    variety: 'Yellow',
    arrivalDate: '2026-03-28',
    minPrice: 4100,
    maxPrice: 4350,
    modalPrice: 4200,
    unit: 'Quintal',
  },
  {
    state: 'Rajasthan',
    district: 'Jodhpur',
    market: 'Jodhpur',
    commodity: 'Cumin',
    variety: 'Cumin Seed',
    arrivalDate: '2026-03-28',
    minPrice: 32000,
    maxPrice: 34500,
    modalPrice: 33200,
    unit: 'Quintal',
  },
  {
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot',
    commodity: 'Cotton',
    variety: 'Shankar-6',
    arrivalDate: '2026-03-28',
    minPrice: 6800,
    maxPrice: 7200,
    modalPrice: 7000,
    unit: 'Quintal',
  },
  {
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana',
    commodity: 'Rice',
    variety: 'Basmati 1121',
    arrivalDate: '2026-03-28',
    minPrice: 3800,
    maxPrice: 4100,
    modalPrice: 3950,
    unit: 'Quintal',
  },
  {
    state: 'Karnataka',
    district: 'Hassan',
    market: 'Hassan',
    commodity: 'Coffee',
    variety: 'Arabica Plantation A',
    arrivalDate: '2026-03-28',
    minPrice: 9500,
    maxPrice: 10200,
    modalPrice: 9850,
    unit: 'Quintal',
  },
];

export function IndiaHub() {
  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">India Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Agricultural markets, monsoon tracking, and macro indicators
        </p>
      </div>

      {/* Mandi price table */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Mandi Prices</h2>
        <MandiPriceTable data={SAMPLE_MANDI_DATA} />
      </section>

      {/* Grid of indicator panels */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MSPTracker />
        <MonsoonTracker />
        <WPIIndicator />
      </section>

      {/* Trade balance - full width */}
      <section>
        <IndiaTradeBalance />
      </section>
    </div>
  );
}
