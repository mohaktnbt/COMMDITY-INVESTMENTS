import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { commoditiesRouter } from './routes/commodities.js';
import { mandisRouter } from './routes/mandis.js';
import { newsRouter } from './routes/news.js';
import { alertsRouter } from './routes/alerts.js';
import { watchlistsRouter } from './routes/watchlists.js';
import { weatherRouter } from './routes/weather.js';
import { cotRouter } from './routes/cot.js';
import { calendarRouter } from './routes/calendar.js';
import { aiRouter } from './routes/ai.js';
import { setupPriceStream } from './ws/price-stream.js';
import { setupNewsStream } from './ws/news-stream.js';
import { setupAlertStream } from './ws/alert-stream.js';

const app = express();
const port = parseInt(process.env.PORT ?? '3001', 10);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

// API routes
app.use('/api/v1/commodities', commoditiesRouter);
app.use('/api/v1/india/mandis', mandisRouter);
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/watchlists', watchlistsRouter);
app.use('/api/v1/weather', weatherRouter);
app.use('/api/v1/cot', cotRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/ai', aiRouter);

// Create HTTP server for WebSocket upgrade
const server = createServer(app);

// WebSocket streams
setupPriceStream(server);
setupNewsStream(server);
setupAlertStream(server);

server.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export { app, server };
