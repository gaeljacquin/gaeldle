// IMPORTANT: Load environment variables FIRST before any other imports
// This ensures DATABASE_URL and other env vars are available when modules initialize
import 'src/config/load-env';

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config, getCorsOrigins } from 'src/config/env';
import { node } from "@elysiajs/node";

// Import routes
import { homeRoutes } from 'src/routes/home.routes';
import { gameRoutes } from 'src/routes/game.routes';

new Elysia({ adapter: node() })
  // CORS middleware
  .use(cors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }))
  // Mount routes
  .use(homeRoutes)
  .use(gameRoutes)
  .listen(config.port);

console.info(`🦊 Elysia is running at http://localhost:${config.port}`);
