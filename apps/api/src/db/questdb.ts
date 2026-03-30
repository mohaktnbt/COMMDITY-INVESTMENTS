/**
 * QuestDB client for time-series queries and ILP ingestion.
 */

const QUESTDB_REST_URL = process.env.QUESTDB_REST_URL ?? 'http://localhost:9000';
const QUESTDB_ILP_HOST = process.env.QUESTDB_ILP_HOST ?? 'localhost';
const QUESTDB_ILP_PORT = parseInt(process.env.QUESTDB_ILP_PORT ?? '9009', 10);

export interface QuestDBQueryResult<T = Record<string, unknown>> {
  columns: { name: string; type: string }[];
  dataset: unknown[][];
  count: number;
  query: string;
  timings: { compiler: number; execute: number; count: number };
  parsed: T[];
}

/**
 * Execute a SQL query against QuestDB's REST API.
 */
export async function queryQuestDB<T = Record<string, unknown>>(
  sql: string,
): Promise<QuestDBQueryResult<T>> {
  const url = new URL('/exec', QUESTDB_REST_URL);
  url.searchParams.set('query', sql);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QuestDB query failed (${response.status}): ${text}`);
  }

  const data = await response.json() as {
    columns: { name: string; type: string }[];
    dataset: unknown[][];
    count: number;
    query: string;
    timings: { compiler: number; execute: number; count: number };
  };

  // Convert row arrays into objects keyed by column name
  const parsed = data.dataset.map((row) => {
    const obj: Record<string, unknown> = {};
    data.columns.forEach((col, i) => {
      obj[col.name] = row[i];
    });
    return obj as T;
  });

  return { ...data, parsed };
}

/**
 * Get an ILP (InfluxDB Line Protocol) sender for high-performance writes.
 * TODO: Use @questdb/nodejs-client Sender for production.
 */
export async function getILPSender(): Promise<{
  host: string;
  port: number;
  // TODO: Return actual Sender instance from @questdb/nodejs-client
}> {
  // TODO: Implement actual ILP sender
  // import { Sender } from '@questdb/nodejs-client';
  // const sender = Sender.fromConfig(`http::addr=${QUESTDB_ILP_HOST}:${QUESTDB_ILP_PORT}`);
  // await sender.connect();
  // return sender;

  return { host: QUESTDB_ILP_HOST, port: QUESTDB_ILP_PORT };
}
