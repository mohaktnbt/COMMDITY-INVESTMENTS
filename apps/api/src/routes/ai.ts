/**
 * AI routes - morning briefs and AI-powered analysis.
 */
import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai-service.js';

export const aiRouter = Router();

const analyzeSchema = z.object({
  commodity: z.string().min(1),
  question: z.string().min(1).max(2000),
});

/**
 * GET /brief/latest - Latest morning brief.
 * TODO: Fetch from TimescaleDB.
 */
aiRouter.get('/brief/latest', async (_req, res) => {
  try {
    // TODO: Fetch latest cached brief from TimescaleDB
    // const result = await query('SELECT * FROM ai_briefs ORDER BY generated_at DESC LIMIT 1');
    const brief = await aiService.generateBrief();

    res.json({ data: brief });
  } catch (err) {
    console.error('Error fetching brief:', err);
    res.status(500).json({ error: 'Failed to fetch morning brief' });
  }
});

/**
 * POST /analyze - AI analysis.
 * Body: { commodity, question }.
 * TODO: Call Claude API.
 */
aiRouter.post('/analyze', async (req, res) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
      return;
    }

    const { commodity, question } = parsed.data;

    // TODO: Call Claude API for real analysis
    const analysis = await aiService.analyzeQuestion(commodity, question);

    res.json({ data: analysis });
  } catch (err) {
    console.error('Error running AI analysis:', err);
    res.status(500).json({ error: 'Failed to run AI analysis' });
  }
});
