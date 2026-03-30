import type { NewsItem, SentimentScore } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[news-collector]';

// Commodity topics to fetch news for via GDELT
const NEWS_TOPICS = [
  'CRUDE_OIL', 'NATURAL_GAS', 'GOLD', 'SILVER', 'COPPER',
  'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE',
  'COTTON', 'IRON_ORE', 'PALM_OIL', 'COCOA',
];

async function writeToQuestDB(items: NewsItem[]): Promise<void> {
  if (items.length === 0) return;

  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const item of items) {
      sender
        .table('news_items')
        .symbol('source', item.source)
        .symbol('language', item.language)
        .symbol('sentiment_label', item.sentiment.label)
        .stringColumn('id', item.id)
        .stringColumn('title', item.title)
        .stringColumn('summary', item.summary ?? '')
        .stringColumn('url', item.url)
        .floatColumn('sentiment_score', item.sentiment.score)
        .floatColumn('sentiment_confidence', item.sentiment.confidence)
        .stringColumn('commodities', item.commodities.join(','))
        .stringColumn('countries', item.countries.join(','))
        .stringColumn('image_url', item.imageUrl ?? '')
        .at(BigInt(item.publishedAt) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Wrote ${items.length} news items to QuestDB`);
  } finally {
    await sender.close();
  }
}

function toneToSentiment(tone: number): SentimentScore {
  // GDELT tone ranges roughly from -25 to +25
  const normalized = Math.max(-1, Math.min(1, tone / 15));
  let label: 'positive' | 'negative' | 'neutral';
  if (normalized > 0.15) label = 'positive';
  else if (normalized < -0.15) label = 'negative';
  else label = 'neutral';

  return {
    score: normalized,
    label,
    confidence: Math.min(1, Math.abs(tone) / 20),
  };
}

/**
 * Fetches commodity news from the GDELT connector and writes
 * articles to the QuestDB news_items table.
 * Scheduled to run every 15 minutes.
 */
export async function collectNews(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting news collection...`);

  try {
    // In production, this would use the real GDELT connector:
    //   import gdelt from '@commodity-monitor/data-connectors/connectors/gdelt';
    //   const articles = await gdelt.fetchCommodityNews(topic, { timespan: '1h' });
    //
    // Stub: simulate news articles
    const allItems: NewsItem[] = [];

    for (const topic of NEWS_TOPICS) {
      const stubArticles = Array.from({ length: 3 }, (_, i) => {
        const tone = (Math.random() - 0.5) * 20;
        const sentiment = toneToSentiment(tone);

        const item: NewsItem = {
          id: `${topic}-${Date.now()}-${i}`,
          title: `${topic.replace(/_/g, ' ')} market update #${i + 1}`,
          summary: `Latest developments in the ${topic.replace(/_/g, ' ').toLowerCase()} market.`,
          source: 'gdelt-stub',
          url: `https://example.com/news/${topic.toLowerCase()}-${i}`,
          publishedAt: Date.now() - Math.floor(Math.random() * 3_600_000),
          sentiment,
          commodities: [topic],
          countries: ['US', 'IN'],
          language: 'en',
          imageUrl: undefined,
        };
        return item;
      });

      allItems.push(...stubArticles);
    }

    console.log(`${PREFIX} Fetched ${allItems.length} news items across ${NEWS_TOPICS.length} topics`);

    // Write to QuestDB
    try {
      await writeToQuestDB(allItems);
    } catch (err) {
      console.error(`${PREFIX} QuestDB write failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} News collection complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} News collection failed:`, err);
    throw err;
  }
}
