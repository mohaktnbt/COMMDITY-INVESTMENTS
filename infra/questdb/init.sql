CREATE TABLE IF NOT EXISTS commodity_prices (
    symbol SYMBOL capacity 512 CACHE,
    exchange SYMBOL capacity 32 CACHE,
    timestamp TIMESTAMP,
    open DOUBLE,
    high DOUBLE,
    low DOUBLE,
    close DOUBLE,
    volume LONG,
    open_interest LONG,
    currency SYMBOL capacity 16 CACHE,
    unit SYMBOL capacity 32 CACHE
) timestamp(timestamp) PARTITION BY DAY WAL
DEDUP UPSERT KEYS(symbol, exchange, timestamp);

CREATE TABLE IF NOT EXISTS mandi_prices (
    state SYMBOL capacity 64 CACHE,
    district SYMBOL capacity 256 CACHE,
    market SYMBOL capacity 512 CACHE,
    commodity SYMBOL capacity 256 CACHE,
    variety SYMBOL capacity 256 CACHE,
    arrival_date TIMESTAMP,
    min_price DOUBLE,
    max_price DOUBLE,
    modal_price DOUBLE,
    unit SYMBOL capacity 16 CACHE
) timestamp(arrival_date) PARTITION BY MONTH WAL;

CREATE TABLE IF NOT EXISTS news_items (
    id SYMBOL capacity 4096 CACHE,
    title STRING,
    source SYMBOL capacity 128 CACHE,
    url STRING,
    published_at TIMESTAMP,
    sentiment_score DOUBLE,
    sentiment_label SYMBOL capacity 16 CACHE,
    commodities STRING,
    country SYMBOL capacity 64 CACHE,
    language SYMBOL capacity 8 CACHE
) timestamp(published_at) PARTITION BY MONTH WAL;

CREATE TABLE IF NOT EXISTS cot_reports (
    symbol SYMBOL capacity 256 CACHE,
    report_date TIMESTAMP,
    commercial_long LONG,
    commercial_short LONG,
    non_commercial_long LONG,
    non_commercial_short LONG,
    non_reportable_long LONG,
    non_reportable_short LONG,
    open_interest LONG,
    change_commercial_net LONG,
    change_non_commercial_net LONG
) timestamp(report_date) PARTITION BY MONTH WAL;
