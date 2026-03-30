/**
 * Web Worker for parsing CSV data off the main thread.
 *
 * Usage from main thread:
 *   const worker = new Worker(new URL('./csv-worker.ts', import.meta.url), { type: 'module' });
 *   worker.postMessage({ csv: '...', hasHeader: true });
 *   worker.onmessage = (e) => console.log(e.data);
 */

export interface CSVParseRequest {
  csv: string;
  hasHeader?: boolean;
  delimiter?: string;
}

export interface CSVParseResponse {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  error?: string;
}

function parseCSV(csv: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          // Escaped quote
          field += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        current.push(field.trim());
        field = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        current.push(field.trim());
        if (current.some((f) => f.length > 0)) {
          rows.push(current);
        }
        current = [];
        field = '';
        if (char === '\r') i++; // skip \n in \r\n
      } else {
        field += char;
      }
    }
  }

  // Last field / row
  if (field.length > 0 || current.length > 0) {
    current.push(field.trim());
    if (current.some((f) => f.length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

self.onmessage = (event: MessageEvent<CSVParseRequest>) => {
  const { csv, hasHeader = true, delimiter = ',' } = event.data;

  try {
    const parsed = parseCSV(csv, delimiter);

    if (parsed.length === 0) {
      self.postMessage({
        headers: [],
        rows: [],
        rowCount: 0,
      } satisfies CSVParseResponse);
      return;
    }

    let headers: string[];
    let dataRows: string[][];

    if (hasHeader) {
      headers = parsed[0];
      dataRows = parsed.slice(1);
    } else {
      headers = parsed[0].map((_, i) => `col_${i}`);
      dataRows = parsed;
    }

    const rows: Record<string, string>[] = dataRows.map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });
      return record;
    });

    self.postMessage({
      headers,
      rows,
      rowCount: rows.length,
    } satisfies CSVParseResponse);
  } catch (err) {
    self.postMessage({
      headers: [],
      rows: [],
      rowCount: 0,
      error: err instanceof Error ? err.message : 'CSV parse error',
    } satisfies CSVParseResponse);
  }
};
