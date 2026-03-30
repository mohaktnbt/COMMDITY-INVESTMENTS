export type AlertCondition = 'above' | 'below' | 'pct_change' | 'volume_spike';
export type AlertChannel = 'email' | 'slack' | 'telegram' | 'push' | 'websocket';
export type AlertStatus = 'active' | 'triggered' | 'paused' | 'expired';

export interface AlertRule {
  id: string;
  userId: string;
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  channels: AlertChannel[];
  active: boolean;
  lastTriggered?: number;
  createdAt: number;
  expiresAt?: number;
  message?: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  actualValue: number;
  triggeredAt: number;
  message: string;
  acknowledged: boolean;
}
