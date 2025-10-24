import { auth } from './auth';
import type { Context } from 'elysia';

export interface AuthenticatedContext extends Context {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Middleware to verify authentication using better-auth
 * Extracts and validates the session from request headers
 */
export async function requireAuth(context: Context): Promise<AuthenticatedContext | Response> {
  try {
    // Get the session from the request using better-auth's API
    const session = await auth.api.getSession({ headers: context.request.headers });

    if (!session || !session.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attach user info to context
    return {
      ...context,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    } as AuthenticatedContext;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired session' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
