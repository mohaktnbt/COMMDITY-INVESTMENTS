/**
 * Watchlists routes - manage user watchlists.
 */
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const watchlistsRouter = Router();

// In-memory store for development
// TODO: Replace with TimescaleDB persistence
interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
  createdAt: number;
  updatedAt: number;
}

const watchlists: Watchlist[] = [
  {
    id: 'wl-001',
    userId: 'dev-user-001',
    name: 'Energy',
    symbols: ['WTI_CRUDE', 'BRENT_CRUDE', 'NATURAL_GAS'],
    createdAt: Date.now() - 86_400_000 * 7,
    updatedAt: Date.now() - 86_400_000,
  },
  {
    id: 'wl-002',
    userId: 'dev-user-001',
    name: 'Precious Metals',
    symbols: ['GOLD', 'SILVER', 'PLATINUM'],
    createdAt: Date.now() - 86_400_000 * 14,
    updatedAt: Date.now() - 86_400_000 * 3,
  },
];

const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  symbols: z.array(z.string().min(1)).min(1),
});

const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbols: z.array(z.string().min(1)).min(1).optional(),
});

/**
 * GET / - List user watchlists.
 * TODO: Fetch from TimescaleDB.
 */
watchlistsRouter.get('/', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId ?? 'dev-user-001';

    // TODO: Fetch from TimescaleDB
    // const result = await query('SELECT * FROM watchlists WHERE user_id = $1', [userId]);
    const userWatchlists = watchlists.filter((w) => w.userId === userId);

    res.json({ data: userWatchlists, count: userWatchlists.length });
  } catch (err) {
    console.error('Error listing watchlists:', err);
    res.status(500).json({ error: 'Failed to list watchlists' });
  }
});

/**
 * POST / - Create watchlist.
 * Body: { name, symbols }.
 */
watchlistsRouter.post('/', async (req, res) => {
  try {
    const parsed = createWatchlistSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId ?? 'dev-user-001';

    // TODO: Persist to TimescaleDB
    const watchlist: Watchlist = {
      id: randomUUID(),
      userId,
      name: parsed.data.name,
      symbols: parsed.data.symbols,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    watchlists.push(watchlist);

    res.status(201).json({ data: watchlist });
  } catch (err) {
    console.error('Error creating watchlist:', err);
    res.status(500).json({ error: 'Failed to create watchlist' });
  }
});

/**
 * PUT /:id - Update watchlist.
 */
watchlistsRouter.put('/:id', async (req, res) => {
  try {
    const parsed = updateWatchlistSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
      return;
    }

    const { id } = req.params;
    const watchlist = watchlists.find((w) => w.id === id);

    if (!watchlist) {
      res.status(404).json({ error: `Watchlist '${id}' not found` });
      return;
    }

    // TODO: Update in TimescaleDB
    if (parsed.data.name) watchlist.name = parsed.data.name;
    if (parsed.data.symbols) watchlist.symbols = parsed.data.symbols;
    watchlist.updatedAt = Date.now();

    res.json({ data: watchlist });
  } catch (err) {
    console.error('Error updating watchlist:', err);
    res.status(500).json({ error: 'Failed to update watchlist' });
  }
});

/**
 * DELETE /:id - Delete watchlist.
 */
watchlistsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const index = watchlists.findIndex((w) => w.id === id);

    if (index === -1) {
      res.status(404).json({ error: `Watchlist '${id}' not found` });
      return;
    }

    // TODO: Delete from TimescaleDB
    watchlists.splice(index, 1);

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting watchlist:', err);
    res.status(500).json({ error: 'Failed to delete watchlist' });
  }
});
