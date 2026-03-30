import 'dotenv/config';
import cron from 'node-cron';
import { collectPrices } from './collectors/price-collector.js';
import { collectMandiPrices } from './collectors/mandi-collector.js';
import { collectNews } from './collectors/news-collector.js';
import { collectWeather } from './collectors/weather-collector.js';
import { collectCOT } from './collectors/cot-collector.js';
import { collectEIA } from './collectors/eia-collector.js';
import { startVesselTracking } from './collectors/vessel-collector.js';
import { generateMorningBrief } from './pipelines/morning-brief.js';
import { startAlertEvaluator } from './pipelines/alert-evaluator.js';
import { scoreSentiment } from './pipelines/sentiment-scorer.js';

const PREFIX = '[worker-orchestrator]';

async function main(): Promise<void> {
  console.log(`${PREFIX} Starting commodity monitor workers...`);
  console.log(`${PREFIX} Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`${PREFIX} Time: ${new Date().toISOString()}`);

  // --- Cron-scheduled collectors ---

  // Price collector: every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await collectPrices();
    } catch (err) {
      console.error(`${PREFIX} Price collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled price-collector (every 30s)`);

  // Mandi collector: every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      await collectMandiPrices();
    } catch (err) {
      console.error(`${PREFIX} Mandi collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled mandi-collector (every hour)`);

  // News collector: every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await collectNews();
    } catch (err) {
      console.error(`${PREFIX} News collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled news-collector (every 15m)`);

  // Weather collector: every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      await collectWeather();
    } catch (err) {
      console.error(`${PREFIX} Weather collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled weather-collector (every 6h)`);

  // COT collector: Fridays at 6 PM UTC
  cron.schedule('0 18 * * 5', async () => {
    try {
      await collectCOT();
    } catch (err) {
      console.error(`${PREFIX} COT collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled cot-collector (Fridays 18:00 UTC)`);

  // EIA collector: Wednesdays at 4 PM UTC
  cron.schedule('0 16 * * 3', async () => {
    try {
      await collectEIA();
    } catch (err) {
      console.error(`${PREFIX} EIA collector failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled eia-collector (Wednesdays 16:00 UTC)`);

  // Morning brief: 5:30 AM IST = 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    try {
      await generateMorningBrief();
    } catch (err) {
      console.error(`${PREFIX} Morning brief failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled morning-brief (05:30 IST / 00:00 UTC)`);

  // Sentiment scorer: every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await scoreSentiment();
    } catch (err) {
      console.error(`${PREFIX} Sentiment scorer failed:`, err);
    }
  });
  console.log(`${PREFIX} Scheduled sentiment-scorer (every 30m)`);

  // --- Continuous workers ---

  try {
    startVesselTracking();
    console.log(`${PREFIX} Started vessel-tracking (continuous WebSocket)`);
  } catch (err) {
    console.error(`${PREFIX} Failed to start vessel tracking:`, err);
  }

  try {
    await startAlertEvaluator();
    console.log(`${PREFIX} Started alert-evaluator (continuous Redis consumer)`);
  } catch (err) {
    console.error(`${PREFIX} Failed to start alert evaluator:`, err);
  }

  console.log(`${PREFIX} All workers initialized successfully.`);
}

// --- Graceful shutdown ---

function shutdown(signal: string): void {
  console.log(`\n${PREFIX} Received ${signal}. Shutting down gracefully...`);

  // Stop all cron jobs
  const tasks = cron.getTasks();
  for (const [, task] of tasks) {
    task.stop();
  }
  console.log(`${PREFIX} Stopped all cron jobs.`);

  console.log(`${PREFIX} Shutdown complete.`);
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  console.error(`${PREFIX} Fatal error during startup:`, err);
  process.exit(1);
});
