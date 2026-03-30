import type { VesselPosition } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';
import WebSocket from 'ws';

const PREFIX = '[vessel-collector]';

/** Key chokepoints and trade route bounding boxes */
const MONITORING_ZONES: Record<string, { name: string; bbox: [number, number, number, number] }> = {
  STRAIT_HORMUZ: { name: 'Strait of Hormuz', bbox: [25.0, 55.0, 27.5, 57.5] },
  SUEZ_CANAL: { name: 'Suez Canal', bbox: [29.5, 32.0, 31.5, 33.5] },
  MALACCA_STRAIT: { name: 'Strait of Malacca', bbox: [0.5, 100.0, 4.5, 104.5] },
  PANAMA_CANAL: { name: 'Panama Canal', bbox: [8.5, -80.5, 9.5, -79.0] },
  US_GULF: { name: 'US Gulf Coast', bbox: [25.0, -97.0, 30.5, -87.0] },
};

const WS_URL = 'wss://stream.aisstream.io/v0/stream';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldReconnect = false;
let positionCount = 0;

async function writePositionToQuestDB(vessel: VesselPosition): Promise<void> {
  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    sender
      .table('vessel_positions')
      .symbol('mmsi', vessel.mmsi)
      .symbol('vessel_type', vessel.vesselType)
      .stringColumn('name', vessel.name)
      .floatColumn('lat', vessel.lat)
      .floatColumn('lng', vessel.lng)
      .floatColumn('course', vessel.course)
      .floatColumn('speed', vessel.speed)
      .stringColumn('destination', vessel.destination ?? '')
      .stringColumn('cargo', vessel.cargo ?? '')
      .at(BigInt(vessel.timestamp) * 1_000_000n, 'ns');
    await sender.flush();
  } finally {
    await sender.close();
  }
}

function handleVesselPosition(vessel: VesselPosition): void {
  positionCount++;

  // Log periodically to avoid flooding
  if (positionCount % 100 === 0) {
    console.log(
      `${PREFIX} Processed ${positionCount} vessel positions (latest: ${vessel.name} at ${vessel.lat.toFixed(2)}, ${vessel.lng.toFixed(2)})`
    );
  }

  // Write to QuestDB (fire-and-forget with error logging)
  writePositionToQuestDB(vessel).catch((err) => {
    console.error(`${PREFIX} QuestDB write failed for vessel ${vessel.mmsi}:`, err);
  });
}

function connectWebSocket(): void {
  const apiKey = process.env.AISSTREAM_API_KEY;

  if (!apiKey) {
    console.warn(
      `${PREFIX} AISSTREAM_API_KEY not set. Running in stub mode -- no live vessel data.`
    );
    console.log(`${PREFIX} Stub: would connect to AISStream WebSocket at ${WS_URL}`);
    console.log(
      `${PREFIX} Stub: monitoring zones: ${Object.values(MONITORING_ZONES).map((z) => z.name).join(', ')}`
    );
    return;
  }

  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log(`${PREFIX} WebSocket connected to AISStream`);

    const subscribeMessage = {
      APIKey: apiKey,
      BoundingBoxes: Object.values(MONITORING_ZONES).map((z) => [
        [z.bbox[0], z.bbox[1]],
        [z.bbox[2], z.bbox[3]],
      ]),
      FilterMessageTypes: ['PositionReport'],
    };

    ws?.send(JSON.stringify(subscribeMessage));
    console.log(
      `${PREFIX} Subscribed to ${Object.keys(MONITORING_ZONES).length} monitoring zones`
    );
  });

  ws.on('message', (raw: WebSocket.Data) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg.MetaData || !msg.Message?.PositionReport) return;

      const pos = msg.Message.PositionReport;
      const meta = msg.MetaData;

      const vessel: VesselPosition = {
        mmsi: meta.MMSI_String,
        name: (meta.ShipName ?? '').trim(),
        lat: meta.Latitude,
        lng: meta.Longitude,
        course: pos.Cog,
        speed: pos.Sog,
        vesselType: 'unknown',
        destination: msg.Message.ShipStaticData?.Destination,
        timestamp: new Date(meta.time_utc).getTime(),
      };

      handleVesselPosition(vessel);
    } catch {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    console.log(`${PREFIX} WebSocket disconnected`);
    if (shouldReconnect) {
      console.log(`${PREFIX} Reconnecting in 5 seconds...`);
      reconnectTimer = setTimeout(() => {
        connectWebSocket();
      }, 5_000);
    }
  });

  ws.on('error', (err) => {
    console.error(`${PREFIX} WebSocket error:`, err);
    ws?.close();
  });
}

/**
 * Starts a continuous WebSocket connection to AISStream for
 * real-time vessel position tracking at key commodity chokepoints.
 * Automatically reconnects on disconnection.
 */
export function startVesselTracking(): void {
  console.log(`${PREFIX} Starting vessel tracking...`);
  console.log(
    `${PREFIX} Monitoring zones: ${Object.entries(MONITORING_ZONES)
      .map(([key, z]) => `${key} (${z.name})`)
      .join(', ')}`
  );

  shouldReconnect = true;
  positionCount = 0;
  connectWebSocket();
}

/**
 * Stops the vessel tracking WebSocket connection.
 */
export function stopVesselTracking(): void {
  console.log(`${PREFIX} Stopping vessel tracking...`);
  shouldReconnect = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws) {
    ws.removeAllListeners();
    ws.close();
    ws = null;
  }

  console.log(`${PREFIX} Vessel tracking stopped. Total positions processed: ${positionCount}`);
}
