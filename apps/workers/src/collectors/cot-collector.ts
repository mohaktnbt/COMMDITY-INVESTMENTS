import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[cot-collector]';

/** COT commodity codes tracked (mirrors CFTC connector) */
const COT_COMMODITIES: Record<string, string> = {
  CRUDE_OIL: '067651',
  NATURAL_GAS: '023651',
  GOLD: '088691',
  SILVER: '084691',
  COPPER: '085692',
  CORN: '002602',
  WHEAT: '001602',
  SOYBEANS: '005602',
  SUGAR: '080732',
  COFFEE: '083731',
  COCOA: '073732',
  COTTON: '033661',
  LIVE_CATTLE: '057642',
  LEAN_HOGS: '054642',
};

interface COTRecord {
  market: string;
  reportDate: string;
  commodityCode: string;
  openInterest: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialSpreading: number;
  commercialLong: number;
  commercialShort: number;
  nonReportableLong: number;
  nonReportableShort: number;
  netNonCommercial: number;
  netCommercial: number;
  changeInOpenInterest: number;
}

async function writeToQuestDB(records: COTRecord[]): Promise<void> {
  if (records.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const r of records) {
      sender
        .table('cot_reports')
        .symbol('market', r.market)
        .symbol('commodity_code', r.commodityCode)
        .floatColumn('open_interest', r.openInterest)
        .floatColumn('non_commercial_long', r.nonCommercialLong)
        .floatColumn('non_commercial_short', r.nonCommercialShort)
        .floatColumn('non_commercial_spreading', r.nonCommercialSpreading)
        .floatColumn('commercial_long', r.commercialLong)
        .floatColumn('commercial_short', r.commercialShort)
        .floatColumn('non_reportable_long', r.nonReportableLong)
        .floatColumn('non_reportable_short', r.nonReportableShort)
        .floatColumn('net_non_commercial', r.netNonCommercial)
        .floatColumn('net_commercial', r.netCommercial)
        .floatColumn('change_in_open_interest', r.changeInOpenInterest)
        .at(BigInt(new Date(r.reportDate).getTime()) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${records.length} COT records to QuestDB`);
  } finally {
    await sender.close();
  }
}

/**
 * Fetches CFTC Commitments of Traders data for tracked commodities
 * and writes positioning data to QuestDB.
 * Scheduled to run Fridays at 6 PM UTC.
 */
export async function collectCOT(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting COT data collection...`);

  try {
    // In production, this would use the real CFTC COT connector:
    //   import cftcCot from '@commodity-monitor/data-connectors/connectors/cftc-cot';
    //   await cftcCot.connect();
    //   const reports = await cftcCot.fetchLatestReports();
    //
    // Stub: simulate COT report data
    const records: COTRecord[] = Object.entries(COT_COMMODITIES).map(
      ([commodity, code]) => {
        const nonCommLong = Math.floor(100_000 + Math.random() * 200_000);
        const nonCommShort = Math.floor(80_000 + Math.random() * 180_000);
        const commLong = Math.floor(150_000 + Math.random() * 250_000);
        const commShort = Math.floor(140_000 + Math.random() * 240_000);

        return {
          market: `${commodity} - COMMODITY EXCHANGE`,
          reportDate: new Date().toISOString().slice(0, 10),
          commodityCode: code,
          openInterest: Math.floor(400_000 + Math.random() * 300_000),
          nonCommercialLong: nonCommLong,
          nonCommercialShort: nonCommShort,
          nonCommercialSpreading: Math.floor(20_000 + Math.random() * 50_000),
          commercialLong: commLong,
          commercialShort: commShort,
          nonReportableLong: Math.floor(30_000 + Math.random() * 40_000),
          nonReportableShort: Math.floor(25_000 + Math.random() * 35_000),
          netNonCommercial: nonCommLong - nonCommShort,
          netCommercial: commLong - commShort,
          changeInOpenInterest: Math.floor((Math.random() - 0.5) * 20_000),
        };
      }
    );

    console.log(
      `${PREFIX} Fetched COT reports for ${records.length} commodities`
    );

    // Write to QuestDB
    try {
      await writeToQuestDB(records);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} COT collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} COT collection failed:`, err);
    throw err;
  }
}
