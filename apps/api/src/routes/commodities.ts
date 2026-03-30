/**
 * Commodities routes - list commodities and fetch price data.
 */
import { Router } from 'express';
import { z } from 'zod';
import { COMMODITIES, COMMODITY_BY_SYMBOL } from '@commodity-monitor/shared';
import { priceService } from '../services/price-service.js';

export const commoditiesRouter = Router();

/**
 * GET / - List all commodities with latest prices.
 */
commoditiesRouter.get('/', async (_req, res) => {
  try {
    const prices = await priceService.getAllLatestPrices();
    const priceMap = new Map(prices.map((p) => [p.symbol, p]));

    const result = COMMODITIES.map((c) => ({
      ...c,
      latestPrice: priceMap.get(c.symbol) ?? null,
    }));

    res.json({ data: result, count: result.length });
  } catch (err) {
    console.error('Error listing commodities:', err);
    res.status(500).json({ error: 'Failed to list commodities' });
  }
});

const pricesQuerySchema = z.object({
  interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']).default('1d'),
  from: z.string().optional(),
  to: z.string().optional(),
});

/**
 * GET /:symbol/prices - OHLCV history for a commodity.
 * Query params: interval (default '1d'), from, to.
 * TODO: Fetch from QuestDB.
 */
commoditiesRouter.get('/:symbol/prices', async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!COMMODITY_BY_SYMBOL.has(symbol)) {
      res.status(404).json({ error: `Commodity '${symbol}' not found` });
      return;
    }

    const parsed = pricesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query params', details: parsed.error.issues });
      return;
    }

    const { interval, from, to } = parsed.data;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
    const toDate = to ? new Date(to) : new Date();

    // TODO: Fetch from QuestDB instead of sample data
    const bars = await priceService.getOHLCV(symbol, interval, fromDate, toDate);

    res.json({ symbol, interval, from: fromDate.toISOString(), to: toDate.toISOString(), data: bars, count: bars.length });
  } catch (err) {
    console.error('Error fetching prices:', err);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

/**
 * GET /:symbol/quote - Latest price quote.
 * TODO: Fetch from Redis cache.
 */
commoditiesRouter.get('/:symbol/quote', async (req, res) => {
  try {
    const { symbol } = req.params;

    // TODO: Fetch from Redis cache for low-latency access
    const quote = await priceService.getLatestPrice(symbol);
    if (!quote) {
      res.status(404).json({ error: `Commodity '${symbol}' not found` });
      return;
    }

    res.json({ data: quote });
  } catch (err) {
    console.error('Error fetching quote:', err);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});
