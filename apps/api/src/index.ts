import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config, getCorsOrigins } from './config/env';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { gameRoutes } from './routes/game.routes';

const app = new Elysia()
  // CORS middleware
  .use(cors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }))
  // Mount routes
  .use(authRoutes)
  .use(userRoutes)
  .use(gameRoutes)
  .listen(config.port);

console.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
