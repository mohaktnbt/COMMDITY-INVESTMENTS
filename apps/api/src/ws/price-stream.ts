/**
 * WebSocket server for real-time price updates.
 * Path: /ws/prices
 *
 * Clients send: {"subscribe": ["GOLD", "CRUDE_OIL"]}
 * Clients send: {"unsubscribe": ["GOLD"]}
 * Server sends: {"type": "price", "symbol": "GOLD", "data": {...}}
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface ClientState {
  subscribedSymbols: Set<string>;
}

const clients = new Map<WebSocket, ClientState>();

export function setupPriceStream(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/prices') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    clients.set(ws, { subscribedSymbols: new Set() });
    console.log('[price-stream] Client connected');

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const state = clients.get(ws);
        if (!state) return;

        if (msg.subscribe && Array.isArray(msg.subscribe)) {
          for (const symbol of msg.subscribe) {
            if (typeof symbol === 'string') {
              state.subscribedSymbols.add(symbol);
            }
          }
          ws.send(JSON.stringify({ type: 'subscribed', symbols: [...state.subscribedSymbols] }));
        }

        if (msg.unsubscribe && Array.isArray(msg.unsubscribe)) {
          for (const symbol of msg.unsubscribe) {
            state.subscribedSymbols.delete(symbol);
          }
          ws.send(JSON.stringify({ type: 'unsubscribed', symbols: msg.unsubscribe }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[price-stream] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[price-stream] WebSocket error:', err);
      clients.delete(ws);
    });
  });

  // TODO: Subscribe to Redis pub/sub channel 'prices:updates' and broadcast to clients
  // redisSub.subscribe('prices:updates');
  // redisSub.on('message', (channel, message) => {
  //   const update = JSON.parse(message);
  //   broadcastPriceUpdate(update.symbol, update);
  // });

  // Demo: broadcast sample price ticks every 2 seconds
  const demoInterval = setInterval(() => {
    const symbols = ['GOLD', 'SILVER', 'WTI_CRUDE', 'BRENT_CRUDE', 'NATURAL_GAS', 'COPPER'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const basePrice = symbol === 'GOLD' ? 2650 : symbol === 'SILVER' ? 31.5
      : symbol === 'WTI_CRUDE' ? 78.5 : symbol === 'BRENT_CRUDE' ? 82.1
      : symbol === 'NATURAL_GAS' ? 3.42 : 4.28;
    const price = parseFloat((basePrice + (Math.random() - 0.5) * basePrice * 0.005).toFixed(2));

    broadcastPriceUpdate(symbol, {
      price,
      change: parseFloat((price - basePrice).toFixed(2)),
      changePercent: parseFloat((((price - basePrice) / basePrice) * 100).toFixed(3)),
      volume: Math.floor(Math.random() * 1000) + 100,
      timestamp: Date.now(),
    });
  }, 2000);

  if (demoInterval.unref) demoInterval.unref();

  console.log('[price-stream] WebSocket server ready on /ws/prices');
}

/**
 * Broadcast a price update to all clients subscribed to the given symbol.
 */
export function broadcastPriceUpdate(symbol: string, data: Record<string, unknown>): void {
  const message = JSON.stringify({ type: 'price', symbol, data });
  for (const [ws, state] of clients) {
    if (ws.readyState === WebSocket.OPEN && state.subscribedSymbols.has(symbol)) {
      ws.send(message);
    }
  }
}
