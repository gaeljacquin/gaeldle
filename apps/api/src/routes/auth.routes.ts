import { Elysia } from 'elysia';
import { auth } from '../lib/auth';

export const authRoutes = new Elysia()
  .all('/api/auth/*', (context) => auth.handler(context.request));
