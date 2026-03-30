/**
 * WebSocket server for real-time alert notifications.
 * Path: /ws/alerts
 *
 * Clients send: {"subscribe": ["GOLD", "CRUDE_OIL"]}  (filter by commodity)
 * Clients send: {"unsubscribe": ["GOLD"]}
 * Server sends: {"type": "alert", "data": {...}}
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface AlertClientState {
  subscribedSymbols: Set<string>;
}

const alertClients = new Map<WebSocket, AlertClientState>();

export function setupAlertStream(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/alerts') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    alertClients.set(ws, { subscribedSymbols: new Set() });
    console.log('[alert-stream] Client connected');

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const state = alertClients.get(ws);
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
      alertClients.delete(ws);
      console.log('[alert-stream] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[alert-stream] WebSocket error:', err);
      alertClients.delete(ws);
    });
  });

  // TODO: Subscribe to Redis pub/sub channel 'alerts:triggered' and broadcast to clients
  // redisSub.subscribe('alerts:triggered');
  // redisSub.on('message', (channel, message) => {
  //   const alertEvent = JSON.parse(message);
  //   broadcastAlert(alertEvent);
  // });

  console.log('[alert-stream] WebSocket server ready on /ws/alerts');
}

/**
 * Broadcast an alert event to clients subscribed to the alert's symbol.
 * Clients with no subscriptions receive all alerts.
 */
export function broadcastAlert(alert: Record<string, unknown>): void {
  const symbol = alert.symbol as string | undefined;
  const message = JSON.stringify({ type: 'alert', data: alert });

  for (const [ws, state] of alertClients) {
    if (ws.readyState !== WebSocket.OPEN) continue;

    // Send to clients with no subscriptions (they get everything)
    // or clients subscribed to the specific symbol
    const hasMatch = state.subscribedSymbols.size === 0
      || (symbol && state.subscribedSymbols.has(symbol));

    if (hasMatch) {
      ws.send(message);
    }
  }
}
