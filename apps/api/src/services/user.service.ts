import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface UpdateProfileInput {
  name?: string;
  displayName?: string;
  email?: string;
  image?: string;
}

/**
 * Get user profile (name, email, display name, image)
 */
export async function getUserProfile(userId: string) {
  const result = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      image: user.image,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!result[0]) {
    throw new Error('User not found');
  }

  return result[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  profile: UpdateProfileInput
) {
  // Check if email is being changed and if it's already taken
  if (profile.email) {
    const emailExists = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, profile.email))
      .limit(1);

    if (emailExists[0] && emailExists[0].id !== userId) {
      throw new Error('Email already in use');
    }
  }

  const result = await db
    .update(user)
    .set({
      ...profile,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
      image: user.image,
    });

  if (!result[0]) {
    throw new Error('User not found');
  }

  return result[0];
}
