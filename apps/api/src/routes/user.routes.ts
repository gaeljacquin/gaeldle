import { Elysia, t } from 'elysia';
import { auth } from '../lib/auth';
import {
  getUserProfile,
  updateUserProfile,
} from '../services/user.service';

/**
 * Helper to get user from session
 */
async function getUserFromRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session.user;
}

export const userRoutes = new Elysia({ prefix: '/api/user' })
  // Get user profile
  .get('/profile', async ({ request }) => {
    try {
      const user = await getUserFromRequest(request);
      const profile = await getUserProfile(user.id);

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
      };
    }
  })

  // Update user profile
  .patch(
    '/profile',
    async ({ request, body }) => {
      try {
        const user = await getUserFromRequest(request);
        const profile = await updateUserProfile(user.id, body);

        return {
          success: true,
          data: profile,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update profile',
        };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        displayName: t.Optional(t.String()),
        email: t.Optional(t.String()),
        image: t.Optional(t.String()),
      }),
    }
  )
