# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for authentication in Gaeldle.

## Prerequisites

- A Google Cloud Platform account
- Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Gaeldle")
5. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Gaeldle
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Save and Continue" (default scopes are fine)
7. On Test users page, add your email for testing
8. Click "Save and Continue"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Configure the OAuth client:
   - **Name**: Gaeldle Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:8080` (development)
     - `https://your-api-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:8080/api/auth/callback/google` (development)
     - `https://your-api-domain.com/api/auth/callback/google` (production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

### API Environment Variables (`apps/api/.env`)

Add the following to your API's `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Better Auth (if not already set)
BETTER_AUTH_SECRET=your-random-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:8080  # or your production API URL
```

### Web Environment Variables (`apps/web/.env.local`)

The web app already uses `NEXT_PUBLIC_SERVER_URL` to connect to the API, so no additional variables are needed for OAuth.

## Step 6: Generate Better Auth Secret

If you don't have a `BETTER_AUTH_SECRET`, generate one:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it as your `BETTER_AUTH_SECRET`.

## Step 7: Test the OAuth Flow

1. Start your API server:
   ```bash
   cd apps/api
   bun run dev
   ```

2. Start your web app:
   ```bash
   cd apps/web
   pnpm dev
   ```

3. Navigate to `http://localhost:3000/sign-in`
4. Click "Continue with Google"
5. You should be redirected to Google's sign-in page
6. After signing in, you should be redirected back to `/dashboard`

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Make sure the redirect URI in your Google Cloud Console exactly matches:
- `http://localhost:8080/api/auth/callback/google` (for development)

### Error: "invalid_client"

**Solution**:
- Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Make sure there are no extra spaces or quotes in your `.env` file

### Error: "Access blocked: This app's request is invalid"

**Solution**:
- Make sure you've added yourself as a test user in the OAuth consent screen
- Ensure the Google+ API is enabled for your project

## Production Deployment

When deploying to production:

1. Update your Google OAuth client with production URLs
2. Add your production domain to:
   - Authorized JavaScript origins
   - Authorized redirect URIs (use your production API URL + `/api/auth/callback/google`)
3. Update environment variables in your production environment
4. Consider publishing your OAuth consent screen if you want it available to all users

## Security Best Practices

- **Never commit** `.env` files to version control
- Use different OAuth clients for development and production
- Regularly rotate your `BETTER_AUTH_SECRET`
- Monitor OAuth usage in Google Cloud Console
- Set up proper CORS policies on your API

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
