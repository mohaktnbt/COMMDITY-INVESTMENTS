/**
 * News routes - commodity news feed.
 */
import { Router } from 'express';
import { z } from 'zod';
import { newsService } from '../services/news-service.js';

export const newsRouter = Router();

const newsQuerySchema = z.object({
  commodity: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * GET / - News feed.
 * Query params: commodity, sentiment, limit (default 50).
 * TODO: Fetch from QuestDB.
 */
newsRouter.get('/', async (req, res) => {
  try {
    const parsed = newsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query params', details: parsed.error.issues });
      return;
    }

    const { commodity, sentiment, limit } = parsed.data;

    // TODO: Fetch from QuestDB
    const data = await newsService.getLatestNews({
      commodities: commodity ? [commodity] : undefined,
      sentiment,
      limit,
    });

    res.json({ data, count: data.length });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});
