/**
 * Alerts routes - manage price alert rules.
 */
import { Router } from 'express';
import { z } from 'zod';
import { alertService } from '../services/alert-service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const alertsRouter = Router();

const createAlertSchema = z.object({
  symbol: z.string().min(1),
  condition: z.enum(['above', 'below', 'pct_change', 'volume_spike']),
  threshold: z.number(),
  channels: z.array(z.enum(['email', 'slack', 'telegram', 'push', 'websocket'])).min(1),
  message: z.string().optional(),
  expiresAt: z.number().optional(),
});

/**
 * GET / - List user alerts.
 * TODO: Fetch from TimescaleDB.
 */
alertsRouter.get('/', async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId ?? 'dev-user-001';

    // TODO: Fetch from TimescaleDB
    const rules = await alertService.listRules(userId);

    res.json({ data: rules, count: rules.length });
  } catch (err) {
    console.error('Error listing alerts:', err);
    res.status(500).json({ error: 'Failed to list alerts' });
  }
});

/**
 * POST / - Create alert rule.
 * Body: { symbol, condition, threshold, channels }.
 */
alertsRouter.post('/', async (req, res) => {
  try {
    const parsed = createAlertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId ?? 'dev-user-001';

    const rule = await alertService.createRule(userId, parsed.data);

    res.status(201).json({ data: rule });
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

/**
 * DELETE /:id - Delete alert rule.
 */
alertsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await alertService.deleteRule(id);

    if (!deleted) {
      res.status(404).json({ error: `Alert rule '${id}' not found` });
      return;
    }

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('Error deleting alert:', err);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});
