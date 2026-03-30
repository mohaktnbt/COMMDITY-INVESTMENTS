import type { SentimentScore, SentimentLabel } from '@commodity-monitor/shared';
import { Sender } from '@questdb/nodejs-client';

const PREFIX = '[sentiment-scorer]';

/** Keyword lists for simple sentiment scoring (placeholder for FinBERT) */
const POSITIVE_KEYWORDS = [
  'surge', 'rally', 'gain', 'rise', 'bullish', 'upbeat', 'growth',
  'recovery', 'boom', 'record high', 'strong demand', 'optimism',
  'outperform', 'breakout', 'upgrade', 'positive', 'expansion',
  'stockpile draw', 'supply deficit', 'production cut',
];

const NEGATIVE_KEYWORDS = [
  'plunge', 'crash', 'drop', 'fall', 'bearish', 'decline', 'slump',
  'recession', 'downturn', 'record low', 'weak demand', 'pessimism',
  'underperform', 'breakdown', 'downgrade', 'negative', 'contraction',
  'stockpile build', 'supply glut', 'production increase', 'sanctions',
  'disruption', 'crisis', 'tariff', 'embargo',
];

interface UnscoredNewsRow {
  id: string;
  title: string;
  summary: string;
  source: string;
  commodities: string;
  publishedAt: number;
}

function scoreText(text: string): SentimentScore {
  const lower = text.toLowerCase();

  let positiveHits = 0;
  let negativeHits = 0;

  for (const kw of POSITIVE_KEYWORDS) {
    if (lower.includes(kw)) positiveHits++;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (lower.includes(kw)) negativeHits++;
  }

  const total = positiveHits + negativeHits;
  if (total === 0) {
    return { score: 0, label: 'neutral', confidence: 0.3 };
  }

  // Normalize to -1..1 range
  const rawScore = (positiveHits - negativeHits) / total;

  let label: SentimentLabel;
  if (rawScore > 0.15) label = 'positive';
  else if (rawScore < -0.15) label = 'negative';
  else label = 'neutral';

  // Confidence increases with more keyword matches
  const confidence = Math.min(1.0, 0.3 + total * 0.1);

  return { score: rawScore, label, confidence };
}

async function fetchUnscoredNews(): Promise<UnscoredNewsRow[]> {
  // In production, this would query QuestDB for news items without
  // sentiment scores or with low-confidence auto-scores:
  //   SELECT id, title, summary, source, commodities, publishedAt
  //   FROM news_items
  //   WHERE sentiment_confidence < 0.5
  //   OR sentiment_label = ''
  //   ORDER BY publishedAt DESC
  //   LIMIT 100
  //
  // Stub: simulate unscored news items
  const topics = ['CRUDE_OIL', 'GOLD', 'WHEAT', 'COPPER', 'SUGAR'];

  return Array.from({ length: 20 }, (_, i) => {
    const topic = topics[i % topics.length];
    const headlines = [
      `${topic} prices surge on strong demand outlook`,
      `${topic} market faces bearish decline amid weak demand`,
      `${topic} futures rally to record high on supply deficit`,
      `${topic} drops as recession fears trigger selloff`,
      `${topic} market stable with neutral outlook for Q2`,
      `${topic} production cut boosts prices amid sanctions`,
      `${topic} plunge continues as stockpile build weighs`,
      `Global ${topic} trade disruption raises supply crisis concerns`,
    ];
    const headline = headlines[i % headlines.length];

    return {
      id: `news-unscore-${i}`,
      title: headline,
      summary: `Detailed analysis of ${topic.replace(/_/g, ' ').toLowerCase()} market conditions.`,
      source: 'stub',
      commodities: topic,
      publishedAt: Date.now() - i * 900_000,
    };
  });
}

async function updateSentimentScores(
  scored: Array<{ id: string; sentiment: SentimentScore }>
): Promise<void> {
  if (scored.length === 0) return;

  // In production, this would update QuestDB records.
  // Since QuestDB is append-only, we write to a sentiment_scores table
  // that can be joined with news_items:
  const sender = await Sender.fromConfig(
    process.env.QUESTDB_ILP_URL ?? 'http::addr=localhost:9000;'
  );

  try {
    for (const item of scored) {
      sender
        .table('sentiment_scores')
        .symbol('news_id', item.id)
        .symbol('label', item.sentiment.label)
        .floatColumn('score', item.sentiment.score)
        .floatColumn('confidence', item.sentiment.confidence)
        .stringColumn('model', 'keyword-v1')
        .at(BigInt(Date.now()) * 1_000_000n, 'ns');
    }
    await sender.flush();
    console.log(`${PREFIX} Updated ${scored.length} sentiment scores in QuestDB`);
  } finally {
    await sender.close();
  }
}

/**
 * Batch pipeline that reads unscored news items from QuestDB,
 * scores them using a simple keyword-based sentiment model
 * (placeholder for FinBERT), and writes scores back.
 * Scheduled to run every 30 minutes.
 */
export async function scoreSentiment(): Promise<void> {
  const startTime = Date.now();
  console.log(`${PREFIX} Starting sentiment scoring batch...`);

  try {
    // Fetch unscored news
    const unscoredItems = await fetchUnscoredNews();
    console.log(`${PREFIX} Found ${unscoredItems.length} unscored news items`);

    if (unscoredItems.length === 0) {
      console.log(`${PREFIX} No items to score. Done.`);
      return;
    }

    // Score each item
    const scored = unscoredItems.map((item) => {
      const text = `${item.title} ${item.summary}`;
      const sentiment = scoreText(text);
      return { id: item.id, sentiment };
    });

    // Log distribution
    const positive = scored.filter((s) => s.sentiment.label === 'positive').length;
    const negative = scored.filter((s) => s.sentiment.label === 'negative').length;
    const neutral = scored.filter((s) => s.sentiment.label === 'neutral').length;
    console.log(
      `${PREFIX} Scored ${scored.length} items: ${positive} positive, ${negative} negative, ${neutral} neutral`
    );

    // Write scores back
    try {
      await updateSentimentScores(scored);
    } catch (err) {
      console.error(`${PREFIX} Score update failed (non-fatal):`, err);
    }

    const elapsed = Date.now() - startTime;
    console.log(`${PREFIX} Sentiment scoring complete (${elapsed}ms)`);
  } catch (err) {
    console.error(`${PREFIX} Sentiment scoring failed:`, err);
    throw err;
  }
}
