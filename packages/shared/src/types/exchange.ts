export enum Exchange {
  MCX = 'MCX',
  NCDEX = 'NCDEX',
  CME = 'CME',
  COMEX = 'COMEX',
  NYMEX = 'NYMEX',
  CBOT = 'CBOT',
  LME = 'LME',
  ICE = 'ICE',
  ICE_EU = 'ICE_EU',
  TOCOM = 'TOCOM',
  SGX = 'SGX',
  DCE = 'DCE',
  SHFE = 'SHFE',
  DGCX = 'DGCX',
  FRED = 'FRED',
  INDEX = 'INDEX',
}

export interface MarketSession {
  exchange: Exchange;
  name: string;
  timezone: string;
  openTime: string;   // HH:mm format
  closeTime: string;  // HH:mm format
  tradingDays: number[];  // 0=Sun, 1=Mon, ..., 6=Sat
  preMarketOpen?: string;
  afterMarketClose?: string;
}

export interface ExchangeMeta {
  code: Exchange;
  name: string;
  fullName: string;
  country: string;
  timezone: string;
  currency: string;
  website: string;
  sessions: MarketSession[];
}
