import type { PriceQuote, NewsItem, WeatherData } from '@commodity-monitor/shared';
import axios from 'axios';
import pg from 'pg';

const PREFIX = '[morning-brief]';

/** Key symbols to include in the morning brief */
const BRIEF_SYMBOLS = [
  'GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F',
  'HG=F', 'ZW=F', 'ZC=F', 'ZS=F',
];

interface MorningBrief {
  id: string;
  generatedAt: number;
  marketDate: string;
  summary: string;
  priceChanges: Array<{
    symbol: string;
    price: number;
    change: number;
    changePct: number;
  }>;
  topNews: Array<{
    title: string;
    source: string;
    sentiment: string;
  }>;
  weatherAlerts: Array<{
    region: string;
    condition: string;
    rainfallDeviation: number;
  }>;
}

async function fetchOvernightPriceChanges(): Promise<PriceQuote[]> {
  // In production, this would query QuestDB for the latest prices
  // and compare to the previous day's close:
  //   SELECT symbol, price, change, change_pct
  //   FROM prices
  //   WHERE symbol IN (...) AND timestamp > dateadd('h', -12, now())
  //   LATEST ON timestamp PARTITION BY symbol

  // Stub: simulate overnight price changes
  return BRIEF_SYMBOLS.map((symbol) => ({
    symbol,
    exchange: 'STUB',
    price: 100 + Math.random() * 100,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    high: 110 + Math.random() * 90,
    low: 90 + Math.random() * 20,
    open: 100 + Math.random() * 80,
    previousClose: 100 + Math.random() * 80,
    volume: Math.floor(Math.random() * 100_000),
    currency: 'USD' as const,
    unit: 'oz' as const,
    timestamp: Date.now(),
    source: 'stub',
  }));
}

async function fetchTopNews(): Promise<NewsItem[]> {
  // In production, this would query QuestDB for the top news items
  // from the past 12 hours, ordered by sentiment confidence:
  //   SELECT * FROM news_items
  //   WHERE timestamp > dateadd('h', -12, now())
  //   ORDER BY sentiment_confidence DESC
  //   LIMIT 10

  // Stub: simulate top news
  return Array.from({ length: 5 }, (_, i) => ({
    id: `brief-news-${i}`,
    title: `Commodity market headline #${i + 1}`,
    summary: 'Market developments overnight.',
    source: 'stub-source',
    url: `https://example.com/news/${i}`,
    publishedAt: Date.now() - Math.floor(Math.random() * 12 * 3_600_000),
    sentiment: {
      score: (Math.random() - 0.5) * 2,
      label: (Math.random() > 0.5 ? 'positive' : 'negative') as 'positive' | 'negative',
      confidence: 0.6 + Math.random() * 0.4,
    },
    commodities: ['CRUDE_OIL', 'GOLD'],
    countries: ['US', 'IN'],
    language: 'en',
  }));
}

async function fetchWeatherAlerts(): Promise<WeatherData[]> {
  // In production, this would query QuestDB for weather data
  // with significant rainfall deviation:
  //   SELECT * FROM weather_data
  //   WHERE abs(rainfall_deviation) > 15
  //   AND timestamp > dateadd('h', -12, now())

  // Stub: simulate weather alerts
  return [
    {
      location: { lat: 31.15, lng: 75.34 },
      region: 'INDIA_PUNJAB',
      temperature: 35,
      humidity: 80,
      rainfall: 45,
      rainfallDeviation: 22,
      condition: 'heavy_rain',
      timestamp: Date.now(),
    },
    {
      location: { lat: 38.50, lng: -98.77 },
      region: 'US_KANSAS',
      temperature: 38,
      humidity: 20,
      rainfall: 0,
      rainfallDeviation: -18,
      condition: 'drought',
      timestamp: Date.now(),
    },
  ];
}

async function generateBriefWithClaude(
  prices: PriceQuote[],
  news: NewsItem[],
  weather: WeatherData[],
): Promise<string> {
  const claudeApiKey = process.env.ANTHROPIC_API_KEY;

  if (!claudeApiKey) {
    console.warn(`${PREFIX} ANTHROPIC_API_KEY not set. Using template-based brief.`);
    return generateTemplateBrief(prices, news, weather);
  }

  try {
    const prompt = buildPrompt(prices, news, weather);

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30_000,
      }
    );

    const content = response.data?.content?.[0]?.text;
    if (typeof content === 'string') return content;

    console.warn(`${PREFIX} Unexpected Claude response format. Falling back to template.`);
    return generateTemplateBrief(prices, news, weather);
  } catch (err) {
    console.error(`${PREFIX} Claude API call failed. Using template brief:`, err);
    return generateTemplateBrief(prices, news, weather);
  }
}

function buildPrompt(
  prices: PriceQuote[],
  news: NewsItem[],
  weather: WeatherData[],
): string {
  const priceLines = prices
    .map((p) => `${p.symbol}: $${p.price.toFixed(2)} (${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}%)`)
    .join('\n');

  const newsLines = news
    .map((n) => `- [${n.sentiment.label}] ${n.title} (${n.source})`)
    .join('\n');

  const weatherLines = weather
    .map((w) => `- ${w.region}: ${w.condition}, rainfall deviation ${w.rainfallDeviation > 0 ? '+' : ''}${w.rainfallDeviation.toFixed(0)}%`)
    .join('\n');

  return `You are a commodity market analyst. Generate a concise morning brief for commodity traders.
Focus on actionable insights and key movers.

OVERNIGHT PRICE CHANGES:
${priceLines}

TOP NEWS:
${newsLines}

WEATHER ALERTS:
${weatherLines}

Write a 3-4 paragraph morning brief covering: key movers, news sentiment, and weather impacts on agricultural commodities.`;
}

function generateTemplateBrief(
  prices: PriceQuote[],
  news: NewsItem[],
  weather: WeatherData[],
): string {
  const topMovers = [...prices]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3);

  const bullishNews = news.filter((n) => n.sentiment.label === 'positive').length;
  const bearishNews = news.filter((n) => n.sentiment.label === 'negative').length;

  const lines: string[] = [
    `MORNING COMMODITY BRIEF - ${new Date().toISOString().slice(0, 10)}`,
    '',
    'KEY MOVERS:',
    ...topMovers.map(
      (p) =>
        `  ${p.symbol}: $${p.price.toFixed(2)} (${p.changePercent >= 0 ? '+' : ''}${p.changePercent.toFixed(2)}%)`
    ),
    '',
    `NEWS SENTIMENT: ${bullishNews} bullish, ${bearishNews} bearish out of ${news.length} articles.`,
    '',
    'WEATHER ALERTS:',
    ...weather.map(
      (w) =>
        `  ${w.region}: ${w.condition} (rainfall deviation: ${w.rainfallDeviation > 0 ? '+' : ''}${w.rainfallDeviation.toFixed(0)}%)`
    ),
  ];

  return lines.join('\n');
}

async function storeBrief(brief: MorningBrief): Promise<void> {
  // In production, this would store the brief in TimescaleDB:
  //   INSERT INTO morning_briefs (id, generated_at, market_date, summary, ...)
  //   VALUES ($1, $2, $3, $4, ...)

  const connectionString = process.env.TIMESCALEDB_URL;
  if (!connectionString) {
    console.log(`${PREFIX} TIMESCALEDB_URL not set. Skipping brief storage.`);
    console.log(`${PREFIX} Brief preview:\n${brief.summary.slice(0, 200)}...`);
    return;
  }

  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query(
      `INSERT INTO morning_briefs (id, generated_at, market_date, summary, price_changes, top_news, weather_alerts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET summary = $4`,
      [
        brief.id,
        new Date(brief.generatedAt).toISOString(),
        brief.marketDate,
        brief.summary,
        JSON.stringify(brief.priceChanges),
        JSON.stringify(brief.topNews),
        JSON.stringify(brief.weatherAlerts),
      ]
    );
    console.log(`${PREFIX} Stored morning brief in TimescaleDB (id: ${brief.id})`);
  } finally {
    await client.end();
  }
}

/**
 * Generates a morning brief by collecting overnight price changes,
 * top news, and weather alerts, then using Claude API to summarize.
 * Stores the result in TimescaleDB.
 * Scheduled to run at 5:30 AM IST (00:00 UTC).
 */
export async function generateMorningBrief(): Promise<void> {
  const startTime = Date.now();
  const marketDate = new Date().toISOString().slice(0, 10);
  console.log(`${PREFIX} Generating morning brief for ${marketDate}...`);

  try {
    // Collect data in parallel
    const [prices, news, weather] = await Promise.all([
      fetchOvernightPriceChanges(),
      fetchTopNews(),
      fetchWeatherAlerts(),
    ]);

    console.log(
      `${PREFIX} Collected: ${prices.length} prices, ${news.length} news items, ${weather.length} weather alerts`
    );

    // Generate brief summary
    const summary = await generateBriefWithClaude(prices, news, weather);

    const brief: MorningBrief = {
      id: `brief-${marketDate}`,
      generatedAt: Date.now(),
      marketDate,
      summary,
      priceChanges: prices.map((p) => ({
        symbol: p.symbol,
        price: p.price,
        change: p.change,
        changePct: p.changePercent,
      })),
      topNews: news.map((n) => ({
        title: n.title,
        source: n.source,
        sentiment: n.sentiment.label,
      })),
      weatherAlerts: weather.map((w) => ({
        region: w.region,
        condition: w.condition,
        rainfallDeviation: w.rainfallDeviation,
      })),
    };

    // Store in TimescaleDB
    try {
      await storeBrief(brief);
    } catch (err) {
      console.error(`${PREFIX} Brief storage failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} Morning brief generated (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} Morning brief generation failed:`, err);
    throw err;
  }
}
