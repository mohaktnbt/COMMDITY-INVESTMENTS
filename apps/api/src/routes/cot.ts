/**
 * COT (Commitments of Traders) routes.
 */
import { Router } from 'express';
import { COMMODITY_BY_SYMBOL } from '@commodity-monitor/shared';

export const cotRouter = Router();

interface COTReport {
  symbol: string;
  reportDate: string;
  commercialLong: number;
  commercialShort: number;
  commercialNet: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  nonReportableLong: number;
  nonReportableShort: number;
  openInterest: number;
  changeInOI: number;
}

// Sample COT data generator
// TODO: Fetch from QuestDB
function generateSampleCOT(symbol: string): COTReport[] {
  const reports: COTReport[] = [];
  const now = Date.now();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now - i * 7 * 86_400_000);
    const oi = 300_000 + Math.floor(Math.random() * 200_000);
    const commLong = Math.floor(oi * (0.3 + Math.random() * 0.15));
    const commShort = Math.floor(oi * (0.25 + Math.random() * 0.15));
    const nonCommLong = Math.floor(oi * (0.2 + Math.random() * 0.1));
    const nonCommShort = Math.floor(oi * (0.15 + Math.random() * 0.1));
    const nonRepLong = Math.floor(oi * (0.05 + Math.random() * 0.05));
    const nonRepShort = Math.floor(oi * (0.04 + Math.random() * 0.05));

    reports.push({
      symbol,
      reportDate: date.toISOString().split('T')[0],
      commercialLong: commLong,
      commercialShort: commShort,
      commercialNet: commLong - commShort,
      nonCommercialLong: nonCommLong,
      nonCommercialShort: nonCommShort,
      nonCommercialNet: nonCommLong - nonCommShort,
      nonReportableLong: nonRepLong,
      nonReportableShort: nonRepShort,
      openInterest: oi,
      changeInOI: Math.floor((Math.random() - 0.5) * 20_000),
    });
  }

  return reports;
}

/**
 * GET /:symbol - COT data for commodity.
 * TODO: Fetch from QuestDB.
 */
cotRouter.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!COMMODITY_BY_SYMBOL.has(symbol)) {
      res.status(404).json({ error: `Commodity '${symbol}' not found` });
      return;
    }

    // TODO: Fetch from QuestDB
    // const sql = `SELECT * FROM cot_reports WHERE symbol = '${symbol}' ORDER BY report_date DESC LIMIT 12`;
    // const result = await queryQuestDB(sql);
    const data = generateSampleCOT(symbol);

    res.json({ symbol, data, count: data.length });
  } catch (err) {
    console.error('Error fetching COT data:', err);
    res.status(500).json({ error: 'Failed to fetch COT data' });
  }
});
