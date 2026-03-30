import type { PriceQuote, OHLCVBar } from '@commodity-monitor/shared';
import type { IDataConnector, ConnectorSchema } from './interface.js';

interface ConnectorEntry {
  connector: IDataConnector;
  priority: number;
  healthy: boolean;
  lastHealthCheck: number;
  symbols: Set<string>;
}

export class ConnectorRegistry {
  private connectors = new Map<string, ConnectorEntry>();
  private symbolIndex = new Map<string, string[]>(); // symbol -> connector names (priority order)
  private healthCheckInterval = 60_000; // 1 minute

  register(connector: IDataConnector, priority = 50): void {
    const symbols = new Set(connector.getSupportedSymbols());
    this.connectors.set(connector.name, {
      connector,
      priority,
      healthy: true,
      lastHealthCheck: Date.now(),
      symbols,
    });
    this.rebuildSymbolIndex();
  }

  unregister(name: string): void {
    this.connectors.delete(name);
    this.rebuildSymbolIndex();
  }

  private rebuildSymbolIndex(): void {
    this.symbolIndex.clear();
    const entries = [...this.connectors.entries()]
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [name, entry] of entries) {
      for (const symbol of entry.symbols) {
        if (!this.symbolIndex.has(symbol)) {
          this.symbolIndex.set(symbol, []);
        }
        this.symbolIndex.get(symbol)!.push(name);
      }
    }
  }

  getConnectorsForSymbol(symbol: string): IDataConnector[] {
    const names = this.symbolIndex.get(symbol) ?? [];
    return names
      .map(n => this.connectors.get(n))
      .filter((e): e is ConnectorEntry => e !== undefined && e.healthy)
      .map(e => e.connector);
  }

  async fetchLatestPrice(symbol: string): Promise<PriceQuote | null> {
    const connectors = this.getConnectorsForSymbol(symbol);
    for (const connector of connectors) {
      try {
        const quotes = await connector.fetchLatestPrices([symbol]);
        if (quotes.length > 0) return quotes[0];
      } catch {
        this.markUnhealthy(connector.name);
      }
    }
    return null;
  }

  async fetchLatestPrices(symbols: string[]): Promise<PriceQuote[]> {
    const results: PriceQuote[] = [];
    const remaining = new Set(symbols);

    // Group symbols by best connector
    const connectorSymbols = new Map<string, string[]>();
    for (const symbol of symbols) {
      const connectors = this.getConnectorsForSymbol(symbol);
      if (connectors.length > 0) {
        const name = connectors[0].name;
        if (!connectorSymbols.has(name)) connectorSymbols.set(name, []);
        connectorSymbols.get(name)!.push(symbol);
      }
    }

    // Fetch in parallel from each connector
    const fetches = [...connectorSymbols.entries()].map(async ([name, syms]) => {
      const entry = this.connectors.get(name);
      if (!entry) return;
      try {
        const quotes = await entry.connector.fetchLatestPrices(syms);
        for (const quote of quotes) {
          if (remaining.has(quote.symbol)) {
            results.push(quote);
            remaining.delete(quote.symbol);
          }
        }
      } catch {
        this.markUnhealthy(name);
      }
    });

    await Promise.allSettled(fetches);

    // Retry remaining with fallback connectors
    for (const symbol of remaining) {
      const quote = await this.fetchLatestPrice(symbol);
      if (quote) results.push(quote);
    }

    return results;
  }

  async fetchOHLCV(symbol: string, interval: string, from: Date, to: Date): Promise<OHLCVBar[]> {
    const connectors = this.getConnectorsForSymbol(symbol);
    for (const connector of connectors) {
      try {
        return await connector.fetchOHLCV(symbol, interval, from, to);
      } catch {
        this.markUnhealthy(connector.name);
      }
    }
    return [];
  }

  private markUnhealthy(name: string): void {
    const entry = this.connectors.get(name);
    if (entry) {
      entry.healthy = false;
      entry.lastHealthCheck = Date.now();
    }
  }

  async runHealthChecks(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const checks = [...this.connectors.entries()].map(async ([name, entry]) => {
      try {
        const healthy = await entry.connector.healthCheck();
        entry.healthy = healthy;
        entry.lastHealthCheck = Date.now();
        results.set(name, healthy);
      } catch {
        entry.healthy = false;
        results.set(name, false);
      }
    });
    await Promise.allSettled(checks);
    return results;
  }

  getAllSchemas(): ConnectorSchema[] {
    return [...this.connectors.values()].map(e => e.connector.getSchema());
  }

  getAllSymbols(): string[] {
    return [...this.symbolIndex.keys()];
  }

  getStatus(): Record<string, { healthy: boolean; symbols: number; lastCheck: number }> {
    const status: Record<string, { healthy: boolean; symbols: number; lastCheck: number }> = {};
    for (const [name, entry] of this.connectors) {
      status[name] = {
        healthy: entry.healthy,
        symbols: entry.symbols.size,
        lastCheck: entry.lastHealthCheck,
      };
    }
    return status;
  }
}

export const registry = new ConnectorRegistry();
