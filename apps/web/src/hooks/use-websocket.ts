import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage: (data: unknown) => void;
  /** Maximum number of reconnect attempts (default 10) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default 1000) */
  baseDelay?: number;
}

interface UseWebSocketReturn {
  connected: boolean;
  send: (data: unknown) => void;
  disconnect: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  maxRetries = 10,
  baseDelay = 1000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalCloseRef = useRef(false);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref current without triggering reconnects
  onMessageRef.current = onMessage;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        onMessageRef.current(data);
      } catch {
        onMessageRef.current(event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      if (!intentionalCloseRef.current && retriesRef.current < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, retriesRef.current),
          30_000,
        );
        retriesRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, maxRetries, baseDelay, cleanup]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    cleanup();
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, [cleanup]);

  useEffect(() => {
    intentionalCloseRef.current = false;
    connect();
    return () => {
      intentionalCloseRef.current = true;
      cleanup();
      wsRef.current?.close();
    };
  }, [connect, cleanup]);

  return { connected, send, disconnect };
}
