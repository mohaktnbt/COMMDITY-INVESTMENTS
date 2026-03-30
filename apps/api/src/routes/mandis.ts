/**
 * Mandi prices routes - Indian agricultural market prices.
 */
import { Router } from 'express';
import { z } from 'zod';
import { mandiService } from '../services/mandi-service.js';

export const mandisRouter = Router();

const mandisQuerySchema = z.object({
  commodity: z.string().optional(),
  state: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

/**
 * GET / - List mandi prices.
 * Query params: commodity, state, limit (default 50).
 * TODO: Fetch from QuestDB.
 */
mandisRouter.get('/', async (req, res) => {
  try {
    const parsed = mandisQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query params', details: parsed.error.issues });
      return;
    }

    const { commodity, state, limit } = parsed.data;

    // TODO: Fetch from QuestDB
    const data = await mandiService.getMandiPrices({ commodity, state, limit });

    res.json({ data, count: data.length });
  } catch (err) {
    console.error('Error fetching mandi prices:', err);
    res.status(500).json({ error: 'Failed to fetch mandi prices' });
  }
});
