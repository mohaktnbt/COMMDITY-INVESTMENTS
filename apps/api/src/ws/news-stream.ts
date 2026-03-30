/**
 * WebSocket server for real-time news updates.
 * Path: /ws/news
 *
 * Clients send: {"subscribe": ["GOLD", "CRUDE_OIL"]}  (filter by commodity)
 * Clients send: {"unsubscribe": ["GOLD"]}
 * Server sends: {"type": "news", "data": {...}}
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface NewsClientState {
  subscribedCommodities: Set<string>;
}

const newsClients = new Map<WebSocket, NewsClientState>();

export function setupNewsStream(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws/news') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    newsClients.set(ws, { subscribedCommodities: new Set() });
    console.log('[news-stream] Client connected');

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const state = newsClients.get(ws);
        if (!state) return;

        if (msg.subscribe && Array.isArray(msg.subscribe)) {
          for (const commodity of msg.subscribe) {
            if (typeof commodity === 'string') {
              state.subscribedCommodities.add(commodity);
            }
          }
          ws.send(JSON.stringify({ type: 'subscribed', commodities: [...state.subscribedCommodities] }));
        }

        if (msg.unsubscribe && Array.isArray(msg.unsubscribe)) {
          for (const commodity of msg.unsubscribe) {
            state.subscribedCommodities.delete(commodity);
          }
          ws.send(JSON.stringify({ type: 'unsubscribed', commodities: msg.unsubscribe }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('close', () => {
      newsClients.delete(ws);
      console.log('[news-stream] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[news-stream] WebSocket error:', err);
      newsClients.delete(ws);
    });
  });

  // TODO: Subscribe to Redis pub/sub channel 'news:updates' and broadcast to clients
  // redisSub.subscribe('news:updates');
  // redisSub.on('message', (channel, message) => {
  //   const newsItem = JSON.parse(message);
  //   broadcastNewsUpdate(newsItem);
  // });

  console.log('[news-stream] WebSocket server ready on /ws/news');
}

/**
 * Broadcast a news update to clients subscribed to any of the affected commodities.
 * If a client has no subscriptions, they receive all news.
 */
export function broadcastNewsUpdate(news: Record<string, unknown>): void {
  const commodities = (news.commodities as string[]) ?? [];
  const message = JSON.stringify({ type: 'news', data: news });

  for (const [ws, state] of newsClients) {
    if (ws.readyState !== WebSocket.OPEN) continue;

    // Send to clients with no subscriptions (they get everything)
    // or clients subscribed to at least one related commodity
    const hasMatch = state.subscribedCommodities.size === 0
      || commodities.some((c) => state.subscribedCommodities.has(c));

    if (hasMatch) {
      ws.send(message);
    }
  }
}
