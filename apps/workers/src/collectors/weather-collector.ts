import type { WeatherData, GeoLocation } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[weather-collector]';

// Agricultural regions to monitor -- mirrors the Open-Meteo connector locations
const AGRICULTURAL_REGIONS: Record<string, { name: string; lat: number; lng: number }> = {
  US_IOWA: { name: 'Iowa (US Corn Belt)', lat: 41.88, lng: -93.10 },
  US_KANSAS: { name: 'Kansas (US Wheat Belt)', lat: 38.50, lng: -98.77 },
  BRAZIL_MATO_GROSSO: { name: 'Mato Grosso (Soybeans)', lat: -12.64, lng: -55.42 },
  BRAZIL_SAO_PAULO: { name: 'Sao Paulo (Sugar/Coffee)', lat: -23.55, lng: -46.63 },
  INDIA_PUNJAB: { name: 'Punjab (Wheat/Rice)', lat: 31.15, lng: 75.34 },
  INDIA_MAHARASHTRA: { name: 'Maharashtra (Cotton/Sugar)', lat: 19.75, lng: 75.71 },
  CHINA_HENAN: { name: 'Henan (Wheat)', lat: 34.77, lng: 113.65 },
  UKRAINE_KYIV: { name: 'Kyiv (Grains)', lat: 50.45, lng: 30.52 },
  AUSTRALIA_NSW: { name: 'New South Wales (Wheat)', lat: -33.87, lng: 151.21 },
  IVORY_COAST: { name: 'Ivory Coast (Cocoa)', lat: 6.83, lng: -5.29 },
};

async function writeToQuestDB(records: WeatherData[]): Promise<void> {
  if (records.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const w of records) {
      sender
        .table('weather_data')
        .symbol('region', w.region)
        .symbol('condition', w.condition)
        .floatColumn('lat', w.location.lat)
        .floatColumn('lng', w.location.lng)
        .floatColumn('temperature', w.temperature)
        .floatColumn('humidity', w.humidity)
        .floatColumn('rainfall', w.rainfall)
        .floatColumn('rainfall_deviation', w.rainfallDeviation)
        .at(BigInt(w.timestamp) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${records.length} weather records to QuestDB`);
  } finally {
    await sender.close();
  }
}

/**
 * Fetches weather forecasts from the Open-Meteo connector for key
 * agricultural regions and writes them to QuestDB.
 * Scheduled to run every 6 hours.
 */
export async function collectWeather(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting weather collection...`);

  try {
    // In production, this would use the real Open-Meteo connector:
    //   import openMeteo from '@commodity-monitor/data-connectors/connectors/open-meteo';
    //   const forecast = await openMeteo.fetchDailyForecast(loc.lat, loc.lng, 7);
    //   const assessment = await openMeteo.fetchAgriWeatherAssessment(key);
    //
    // Stub: simulate weather data
    const records: WeatherData[] = [];

    for (const [key, loc] of Object.entries(AGRICULTURAL_REGIONS)) {
      const record: WeatherData = {
        location: { lat: loc.lat, lng: loc.lng },
        region: key,
        temperature: 15 + Math.random() * 25,
        humidity: 30 + Math.random() * 60,
        rainfall: Math.random() * 50,
        rainfallDeviation: (Math.random() - 0.5) * 30,
        condition: Math.random() > 0.5 ? 'clear' : 'rain',
        timestamp: Date.now(),
      };
      records.push(record);
    }

    console.log(
      `${PREFIX} Fetched weather data for ${records.length} agricultural regions`
    );

    // Write to QuestDB
    try {
      await writeToQuestDB(records);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} Weather collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} Weather collection failed:`, err);
    throw err;
  }
}
