/**
 * Calendar routes - economic events calendar.
 */
import { Router } from 'express';
import { z } from 'zod';

export const calendarRouter = Router();

interface EconomicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  country: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  commoditiesAffected: string[];
}

// Sample economic events
// TODO: Fetch from TimescaleDB
const SAMPLE_EVENTS: EconomicEvent[] = [
  {
    id: 'evt-001',
    title: 'USDA WASDE Report',
    description: 'World Agricultural Supply and Demand Estimates report release.',
    date: '2026-04-10',
    time: '12:00',
    country: 'US',
    impact: 'high',
    category: 'agriculture',
    forecast: 'Corn yield: 181.0 bu/acre',
    previous: 'Corn yield: 179.3 bu/acre',
    commoditiesAffected: ['CORN', 'WHEAT', 'SOYBEANS'],
  },
  {
    id: 'evt-002',
    title: 'OPEC+ Monthly Meeting',
    description: 'OPEC+ Joint Ministerial Monitoring Committee meeting on production quotas.',
    date: '2026-04-05',
    time: '10:00',
    country: 'AT',
    impact: 'high',
    category: 'energy',
    commoditiesAffected: ['WTI_CRUDE', 'BRENT_CRUDE'],
  },
  {
    id: 'evt-003',
    title: 'EIA Weekly Petroleum Status Report',
    description: 'US crude oil inventories, production, and imports data.',
    date: '2026-04-02',
    time: '10:30',
    country: 'US',
    impact: 'medium',
    category: 'energy',
    forecast: '-1.2M bbl',
    previous: '-2.5M bbl',
    commoditiesAffected: ['WTI_CRUDE', 'BRENT_CRUDE', 'NATURAL_GAS'],
  },
  {
    id: 'evt-004',
    title: 'India RBI Monetary Policy Decision',
    description: 'Reserve Bank of India interest rate decision and monetary policy statement.',
    date: '2026-04-09',
    time: '10:00',
    country: 'IN',
    impact: 'high',
    category: 'monetary',
    forecast: '6.25%',
    previous: '6.50%',
    commoditiesAffected: ['MCX_GOLD', 'MCX_SILVER', 'MCX_CRUDE'],
  },
  {
    id: 'evt-005',
    title: 'LME Inventory Report',
    description: 'London Metal Exchange warehouse inventory levels for base metals.',
    date: '2026-04-01',
    time: '09:00',
    country: 'GB',
    impact: 'medium',
    category: 'metals',
    commoditiesAffected: ['COPPER', 'ALUMINUM', 'ZINC', 'NICKEL'],
  },
  {
    id: 'evt-006',
    title: 'EIA Natural Gas Storage Report',
    description: 'Weekly natural gas storage change.',
    date: '2026-04-03',
    time: '10:30',
    country: 'US',
    impact: 'medium',
    category: 'energy',
    forecast: '-28 Bcf',
    previous: '-36 Bcf',
    commoditiesAffected: ['NATURAL_GAS'],
  },
  {
    id: 'evt-007',
    title: 'CFTC COT Report',
    description: 'Commitments of Traders weekly positioning data.',
    date: '2026-04-04',
    time: '15:30',
    country: 'US',
    impact: 'medium',
    category: 'positioning',
    commoditiesAffected: ['GOLD', 'WTI_CRUDE', 'COPPER', 'CORN'],
  },
  {
    id: 'evt-008',
    title: 'India CPI Inflation',
    description: 'Consumer Price Index data release for India.',
    date: '2026-04-14',
    time: '17:30',
    country: 'IN',
    impact: 'high',
    category: 'economic',
    forecast: '4.8%',
    previous: '5.1%',
    commoditiesAffected: ['MCX_GOLD', 'MCX_SILVER'],
  },
];

const eventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

/**
 * GET /events - Economic events.
 * Query params: from, to.
 * TODO: Fetch from TimescaleDB.
 */
calendarRouter.get('/events', async (req, res) => {
  try {
    const parsed = eventsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query params', details: parsed.error.issues });
      return;
    }

    // TODO: Fetch from TimescaleDB
    // const result = await query(
    //   'SELECT * FROM economic_events WHERE date BETWEEN $1 AND $2 ORDER BY date ASC',
    //   [parsed.data.from, parsed.data.to],
    // );
    let events = [...SAMPLE_EVENTS];

    if (parsed.data.from) {
      events = events.filter((e) => e.date >= parsed.data.from!);
    }
    if (parsed.data.to) {
      events = events.filter((e) => e.date <= parsed.data.to!);
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    res.json({ data: events, count: events.length });
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});
