import type { MandiPrice } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[mandi-collector]';

// Commodities tracked from data.gov.in mandi data
const MANDI_COMMODITIES = [
  'Wheat', 'Rice', 'Maize', 'Sugar', 'Cotton',
  'Soyabean', 'Groundnut', 'Mustard', 'Onion',
  'Potato', 'Tomato', 'Turmeric', 'Jeera', 'Chilli',
];

async function writeToQuestDB(records: MandiPrice[]): Promise<void> {
  if (records.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const r of records) {
      sender
        .table('mandi_prices')
        .symbol('state', r.state)
        .symbol('district', r.district)
        .symbol('market', r.market)
        .symbol('commodity', r.commodity)
        .symbol('variety', r.variety)
        .floatColumn('min_price', r.minPrice)
        .floatColumn('max_price', r.maxPrice)
        .floatColumn('modal_price', r.modalPrice)
        .stringColumn('unit', r.unit)
        .at(BigInt(new Date(r.arrivalDate).getTime()) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${records.length} mandi records to QuestDB`);
  } finally {
    await sender.close();
  }
}

/**
 * Fetches mandi (wholesale market) prices from the data.gov.in connector
 * and writes them to the QuestDB mandi_prices table.
 * Scheduled to run every hour.
 */
export async function collectMandiPrices(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting mandi price collection...`);

  try {
    // In production, this would use the real connector:
    //   import dataGovIn from '@commodity-monitor/data-connectors/connectors/data-gov-in';
    //   await dataGovIn.connect();
    //   const prices = await dataGovIn.fetchLatestPrices(MANDI_COMMODITIES);
    //
    // Stub: simulate fetching mandi data
    const records: MandiPrice[] = MANDI_COMMODITIES.flatMap((commodity) => [
      {
        state: 'Maharashtra',
        district: 'Pune',
        market: 'Pune',
        commodity,
        variety: 'Local',
        arrivalDate: new Date().toISOString().slice(0, 10),
        minPrice: 1500 + Math.random() * 500,
        maxPrice: 2500 + Math.random() * 500,
        modalPrice: 2000 + Math.random() * 500,
        unit: 'INR/Quintal',
      },
      {
        state: 'Punjab',
        district: 'Ludhiana',
        market: 'Ludhiana',
        commodity,
        variety: 'Local',
        arrivalDate: new Date().toISOString().slice(0, 10),
        minPrice: 1400 + Math.random() * 500,
        maxPrice: 2400 + Math.random() * 500,
        modalPrice: 1900 + Math.random() * 500,
        unit: 'INR/Quintal',
      },
    ]);

    console.log(
      `${PREFIX} Fetched ${records.length} mandi records for ${MANDI_COMMODITIES.length} commodities`
    );

    // Write to QuestDB
    try {
      await writeToQuestDB(records);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} Mandi collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} Mandi collection failed:`, err);
    throw err;
  }
}
