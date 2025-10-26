import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

// Validate required environment variables
const requiredEnvVars = {
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Google OAuth is optional but warn if incomplete
const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

const authConfig: any = {
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',').map((origin) => origin.trim()),
  user: {
    additionalFields: {
      displayName: {
        type: 'string',
        required: false,
        input: false, // Don't require in input forms
        returned: true, // Include in session/user responses
      },
    },
  },
};

// Only add Google OAuth if both credentials are present
if (hasGoogleClientId && hasGoogleClientSecret) {
  authConfig.socialProviders = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  };
}

export const auth = betterAuth(authConfig);
