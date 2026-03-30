/**
 * AlertService - manages alert rules and evaluates price conditions.
 * Stub implementation with TODO markers.
 */
import type { PriceQuote } from '@commodity-monitor/shared';
import type { AlertRule, AlertEvent, AlertCondition, AlertChannel } from '@commodity-monitor/shared';
import { randomUUID } from 'crypto';

// In-memory store for development
const alertRules: AlertRule[] = [
  {
    id: 'alert-001',
    userId: 'dev-user-001',
    symbol: 'GOLD',
    condition: 'above',
    threshold: 2700,
    channels: ['websocket', 'email'],
    active: true,
    createdAt: Date.now() - 86_400_000,
    message: 'Gold above $2700',
  },
  {
    id: 'alert-002',
    userId: 'dev-user-001',
    symbol: 'WTI_CRUDE',
    condition: 'below',
    threshold: 70,
    channels: ['websocket'],
    active: true,
    createdAt: Date.now() - 172_800_000,
    message: 'WTI below $70',
  },
];

export interface CreateAlertRuleInput {
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  channels: AlertChannel[];
  message?: string;
  expiresAt?: number;
}

export class AlertService {
  /**
   * Evaluate current prices against active alert rules.
   * Returns triggered alert events.
   */
  async evaluate(prices: PriceQuote[]): Promise<AlertEvent[]> {
    // TODO: Fetch active rules from TimescaleDB
    // TODO: Publish triggered alerts to Redis pub/sub

    const events: AlertEvent[] = [];
    const priceMap = new Map(prices.map((p) => [p.symbol, p]));

    for (const rule of alertRules) {
      if (!rule.active) continue;
      const quote = priceMap.get(rule.symbol);
      if (!quote) continue;

      let triggered = false;
      switch (rule.condition) {
        case 'above':
          triggered = quote.price > rule.threshold;
          break;
        case 'below':
          triggered = quote.price < rule.threshold;
          break;
        case 'pct_change':
          triggered = Math.abs(quote.changePercent) > rule.threshold;
          break;
        case 'volume_spike':
          triggered = quote.volume > rule.threshold;
          break;
      }

      if (triggered) {
        events.push({
          id: randomUUID(),
          ruleId: rule.id,
          symbol: rule.symbol,
          condition: rule.condition,
          threshold: rule.threshold,
          actualValue: rule.condition === 'volume_spike' ? quote.volume : quote.price,
          triggeredAt: Date.now(),
          message: rule.message ?? `${rule.symbol} ${rule.condition} ${rule.threshold}`,
          acknowledged: false,
        });
        rule.lastTriggered = Date.now();
      }
    }

    return events;
  }

  /**
   * Create a new alert rule.
   */
  async createRule(userId: string, input: CreateAlertRuleInput): Promise<AlertRule> {
    // TODO: Persist to TimescaleDB
    const rule: AlertRule = {
      id: randomUUID(),
      userId,
      symbol: input.symbol,
      condition: input.condition,
      threshold: input.threshold,
      channels: input.channels,
      active: true,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
      message: input.message,
    };

    alertRules.push(rule);
    return rule;
  }

  /**
   * Delete an alert rule by ID.
   */
  async deleteRule(id: string): Promise<boolean> {
    // TODO: Delete from TimescaleDB
    const index = alertRules.findIndex((r) => r.id === id);
    if (index === -1) return false;
    alertRules.splice(index, 1);
    return true;
  }

  /**
   * List all alert rules for a user.
   */
  async listRules(userId: string): Promise<AlertRule[]> {
    // TODO: Query TimescaleDB
    return alertRules.filter((r) => r.userId === userId);
  }
}

export const alertService = new AlertService();
