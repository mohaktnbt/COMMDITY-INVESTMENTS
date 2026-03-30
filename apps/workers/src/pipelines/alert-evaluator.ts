import type { AlertRule, AlertEvent } from '@commodity-monitor/shared';
import Redis from 'ioredis';

const PREFIX = '[alert-evaluator]';

/** Consumer group name for the Redis Stream */
const CONSUMER_GROUP = 'alert-evaluators';
const CONSUMER_NAME = `evaluator-${process.pid}`;
const STREAM_KEY = 'prices:updates';

let redis: Redis | null = null;
let running = false;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

async function ensureConsumerGroup(client: Redis): Promise<void> {
  try {
    await client.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM');
    console.log(`${PREFIX} Created consumer group '${CONSUMER_GROUP}'`);
  } catch (err: unknown) {
    // Group already exists -- this is fine
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('BUSYGROUP')) {
      throw err;
    }
  }
}

async function loadActiveAlertRules(): Promise<AlertRule[]> {
  // In production, this would load from the database:
  //   SELECT * FROM alert_rules WHERE active = true AND (expires_at IS NULL OR expires_at > NOW())
  //
  // Stub: simulate active alert rules
  return [
    {
      id: 'alert-1',
      userId: 'user-1',
      symbol: 'GC=F',
      condition: 'above',
      threshold: 2100,
      channels: ['websocket', 'email'],
      active: true,
      createdAt: Date.now() - 86_400_000,
      message: 'Gold above $2100',
    },
    {
      id: 'alert-2',
      userId: 'user-1',
      symbol: 'CL=F',
      condition: 'below',
      threshold: 65,
      channels: ['websocket'],
      active: true,
      createdAt: Date.now() - 86_400_000,
      message: 'WTI Crude below $65',
    },
    {
      id: 'alert-3',
      userId: 'user-2',
      symbol: 'NG=F',
      condition: 'pct_change',
      threshold: 5,
      channels: ['telegram', 'websocket'],
      active: true,
      createdAt: Date.now() - 43_200_000,
      message: 'Natural Gas moved more than 5%',
    },
  ];
}

function evaluateRule(
  rule: AlertRule,
  price: number,
  changePct: number,
): boolean {
  switch (rule.condition) {
    case 'above':
      return price > rule.threshold;
    case 'below':
      return price < rule.threshold;
    case 'pct_change':
      return Math.abs(changePct) > rule.threshold;
    case 'volume_spike':
      // Volume spike evaluation would need volume data
      return false;
    default:
      return false;
  }
}

async function triggerAlert(rule: AlertRule, price: number): Promise<void> {
  const event: AlertEvent = {
    id: `evt-${rule.id}-${Date.now()}`,
    ruleId: rule.id,
    symbol: rule.symbol,
    condition: rule.condition,
    threshold: rule.threshold,
    actualValue: price,
    triggeredAt: Date.now(),
    message: rule.message ?? `Alert triggered: ${rule.symbol} ${rule.condition} ${rule.threshold}`,
    acknowledged: false,
  };

  console.log(
    `${PREFIX} ALERT TRIGGERED: ${event.message} (actual: ${price.toFixed(2)}, threshold: ${rule.threshold})`
  );

  // In production, this would:
  // 1. Store the alert event in the database
  // 2. Send notifications via configured channels (email, Slack, Telegram, push)
  // 3. Publish to WebSocket for real-time UI updates
  //
  // Stub: publish alert event to Redis for downstream consumers
  try {
    const client = getRedis();
    await client.xadd(
      'alerts:triggered',
      '*',
      'eventId', event.id,
      'ruleId', event.ruleId,
      'symbol', event.symbol,
      'condition', event.condition,
      'threshold', String(event.threshold),
      'actualValue', String(event.actualValue),
      'message', event.message,
      'triggeredAt', String(event.triggeredAt),
    );
  } catch (err) {
    console.error(`${PREFIX} Failed to publish alert event:`, err);
  }
}

async function processStreamMessages(client: Redis): Promise<void> {
  // Read new messages from the consumer group
  const results = await client.xreadgroup(
    'GROUP', CONSUMER_GROUP, CONSUMER_NAME,
    'COUNT', '100',
    'BLOCK', '5000',
    'STREAMS', STREAM_KEY, '>'
  );

  if (!results || results.length === 0) return;

  // Load current alert rules (in production, cache with periodic refresh)
  const rules = await loadActiveAlertRules();
  if (rules.length === 0) return;

  const typedResults = results as [string, [string, string[]][]][];
  for (const [, messages] of typedResults) {
    for (const [messageId, fields] of messages) {
      // Parse fields array into a map
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      const symbol = data['symbol'];
      const price = parseFloat(data['price'] ?? '0');
      const changePct = parseFloat(data['changePct'] ?? '0');

      if (!symbol || isNaN(price)) {
        // Acknowledge and skip malformed messages
        await client.xack(STREAM_KEY, CONSUMER_GROUP, messageId);
        continue;
      }

      // Evaluate all rules for this symbol
      const matchingRules = rules.filter((r) => r.symbol === symbol);
      for (const rule of matchingRules) {
        const triggered = evaluateRule(rule, price, changePct);
        if (triggered) {
          await triggerAlert(rule, price);
        }
      }

      // Acknowledge the message
      await client.xack(STREAM_KEY, CONSUMER_GROUP, messageId);
    }
  }
}

/**
 * Starts a continuous pipeline that subscribes to the Redis Stream
 * 'prices:updates', evaluates all active alert rules against incoming
 * price data, and triggers notifications when conditions are met.
 */
export async function startAlertEvaluator(): Promise<void> {
  console.log(`${PREFIX} Starting alert evaluator...`);
  console.log(`${PREFIX} Consumer: ${CONSUMER_NAME}, Group: ${CONSUMER_GROUP}`);

  const client = getRedis();

  try {
    await client.connect();
  } catch {
    // Already connected or lazyConnect will handle it
  }

  try {
    await ensureConsumerGroup(client);
  } catch (err) {
    console.error(`${PREFIX} Failed to create consumer group (non-fatal):`, err);
  }

  running = true;

  // Continuous processing loop
  const loop = async (): Promise<void> => {
    while (running) {
      try {
        await processStreamMessages(client);
      } catch (err) {
        console.error(`${PREFIX} Error processing messages:`, err);
        // Wait before retrying to avoid tight error loop
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
    console.log(`${PREFIX} Alert evaluator stopped.`);
  };

  // Start the loop in the background (non-blocking)
  loop().catch((err) => {
    console.error(`${PREFIX} Alert evaluator loop crashed:`, err);
  });

  console.log(`${PREFIX} Alert evaluator running.`);
}

/**
 * Stops the alert evaluator pipeline.
 */
export function stopAlertEvaluator(): void {
  console.log(`${PREFIX} Stopping alert evaluator...`);
  running = false;
}
