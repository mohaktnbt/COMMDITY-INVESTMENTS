import type { PriceQuote } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';
import Redis from 'ioredis';

const PREFIX = '[price-collector]';

// Symbols to track -- in production this would come from config/DB
const TRACKED_SYMBOLS = [
  'GC=F',   // Gold
  'SI=F',   // Silver
  'CL=F',   // Crude Oil WTI
  'BZ=F',   // Brent Crude
  'NG=F',   // Natural Gas
  'HG=F',   // Copper
  'ZW=F',   // Wheat
  'ZC=F',   // Corn
  'ZS=F',   // Soybeans
  'SB=F',   // Sugar
  'KC=F',   // Coffee
  'CT=F',   // Cotton
];

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

async function writeToQuestDB(quotes: PriceQuote[]): Promise<void> {
  if (quotes.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const q of quotes) {
      sender
        .table('prices')
        .symbol('symbol', q.symbol)
        .symbol('exchange', q.exchange)
        .symbol('source', q.source)
        .floatColumn('price', q.price)
        .floatColumn('change', q.change)
        .floatColumn('change_pct', q.changePercent)
        .floatColumn('high', q.high)
        .floatColumn('low', q.low)
        .floatColumn('open', q.open)
        .floatColumn('previous_close', q.previousClose)
        .floatColumn('volume', q.volume)
        .stringColumn('currency', q.currency)
        .stringColumn('unit', q.unit)
        .at(BigInt(q.timestamp) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${quotes.length} quotes to QuestDB`);
  } finally {
    await sender.close();
  }
}

async function publishToRedis(quotes: PriceQuote[]): Promise<void> {
  if (quotes.length === 0) return;

  const client = getRedis();

  const pipeline = client.pipeline();
  for (const q of quotes) {
    pipeline.xadd(
      'prices:updates',
      '*',
      'symbol', q.symbol,
      'price', String(q.price),
      'change', String(q.change),
      'changePct', String(q.changePercent),
      'volume', String(q.volume),
      'timestamp', String(q.timestamp),
      'source', q.source,
    );
  }
  await pipeline.exec();
  console.log(`${PREFIX} Published ${quotes.length} quotes to Redis stream`);
}

/**
 * Fetches latest prices from the ConnectorRegistry, writes to QuestDB
 * via ILP, and publishes updates to the Redis Stream 'prices:updates'.
 * Scheduled to run every 30 seconds.
 */
export async function collectPrices(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting price collection...`);

  try {
    // In production, this would use the real ConnectorRegistry:
    //   import { registry } from '@commodity-monitor/data-connectors';
    //   const quotes = await registry.fetchLatestPrices(TRACKED_SYMBOLS);
    //
    // Stub: simulate fetching prices
    const quotes: PriceQuote[] = TRACKED_SYMBOLS.map((symbol) => ({
      symbol,
      exchange: 'STUB',
      price: 100 + Math.random() * 50,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 3,
      high: 110 + Math.random() * 40,
      low: 90 + Math.random() * 20,
      open: 100 + Math.random() * 30,
      previousClose: 100 + Math.random() * 30,
      volume: Math.floor(Math.random() * 100_000),
      currency: 'USD' as const,
      unit: 'oz' as const,
      timestamp: Date.now(),
      source: 'stub',
    }));

    console.log(`${PREFIX} Fetched ${quotes.length} price quotes`);

    // Write to QuestDB
    try {
      await writeToQuestDB(quotes);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    // Publish to Redis stream
    try {
      await publishToRedis(quotes);
    } catch (err) {
      console.error(`${PREFIX} Redis publish failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} Price collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} Price collection failed:`, err);
    throw err;
  }
}
