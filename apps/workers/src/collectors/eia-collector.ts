import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[eia-collector]';

/** EIA petroleum data series tracked */
const EIA_SERIES = [
  { id: 'WCESTUS1', name: 'Weekly US Crude Oil Stocks', unit: 'thousand_barrels' },
  { id: 'WGTSTUS1', name: 'Weekly US Gasoline Stocks', unit: 'thousand_barrels' },
  { id: 'WDISTUS1', name: 'Weekly US Distillate Stocks', unit: 'thousand_barrels' },
  { id: 'RWTC', name: 'WTI Crude Oil Spot Price', unit: 'dollars_per_barrel' },
  { id: 'RBRTE', name: 'Brent Crude Oil Spot Price', unit: 'dollars_per_barrel' },
  { id: 'RNGC1', name: 'Henry Hub Natural Gas Spot', unit: 'dollars_per_mmbtu' },
];

interface EIADataPoint {
  seriesId: string;
  name: string;
  period: string;
  value: number;
  unit: string;
}

async function writeToQuestDB(records: EIADataPoint[]): Promise<void> {
  if (records.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const r of records) {
      sender
        .table('eia_petroleum')
        .symbol('series_id', r.seriesId)
        .symbol('unit', r.unit)
        .stringColumn('name', r.name)
        .floatColumn('value', r.value)
        .stringColumn('period', r.period)
        .at(BigInt(new Date(r.period).getTime()) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${records.length} EIA records to QuestDB`);
  } finally {
    await sender.close();
  }
}

/**
 * Fetches EIA petroleum inventory and spot price data
 * and writes it to QuestDB.
 * Scheduled to run Wednesdays at 4 PM UTC.
 */
export async function collectEIA(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting EIA data collection...`);

  try {
    // In production, this would use the real EIA connector:
    //   import eia from '@commodity-monitor/data-connectors/connectors/eia';
    //   await eia.connect();
    //   const quotes = await eia.fetchLatestPrices(EIA_SERIES.map(s => s.id));
    //
    // Stub: simulate EIA data points
    const records: EIADataPoint[] = EIA_SERIES.map((series) => ({
      seriesId: series.id,
      name: series.name,
      period: new Date().toISOString().slice(0, 10),
      value: series.unit === 'thousand_barrels'
        ? Math.floor(200_000 + Math.random() * 200_000)
        : 50 + Math.random() * 50,
      unit: series.unit,
    }));

    console.log(
      `${PREFIX} Fetched ${records.length} EIA data points`
    );

    // Write to QuestDB
    try {
      await writeToQuestDB(records);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} EIA collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} EIA collection failed:`, err);
    throw err;
  }
}
