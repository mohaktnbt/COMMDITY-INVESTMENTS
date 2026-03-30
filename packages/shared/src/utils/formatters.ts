import type { Currency, PriceUnit } from '../types/commodity.js';

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
  EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
  GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
  JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
  CNY: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
};

export function formatPrice(value: number, currency: Currency, decimals = 2): string {
  return currencyFormatters[currency].format(Number(value.toFixed(decimals)));
}

export function formatChange(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

export function formatChangePercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

const UNIT_LABELS: Record<PriceUnit, string> = {
  oz: 'troy oz',
  bbl: 'barrel',
  mt: 'metric tonne',
  bushel: 'bushel',
  lb: 'pound',
  cwt: 'cwt',
  quintal: 'quintal',
  mmbtu: 'MMBtu',
  gallon: 'gallon',
  kg: 'kg',
  liter: 'liter',
  index: 'pts',
};

export function formatUnit(unit: PriceUnit): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function formatPriceWithUnit(value: number, currency: Currency, unit: PriceUnit): string {
  return `${formatPrice(value, currency)}/${formatUnit(unit)}`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}
