import type { TimeInterval } from '../types/commodity.js';

const VALID_INTERVALS: TimeInterval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];

export function isValidInterval(interval: string): interval is TimeInterval {
  return VALID_INTERVALS.includes(interval as TimeInterval);
}

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9_]{1,31}$/.test(symbol);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDateRange(from: Date, to: Date): boolean {
  return from < to && to <= new Date();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

export function sanitizeString(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}
