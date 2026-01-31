import { config } from 'src/config/env';

const STACK_USER_ENDPOINT = 'https://api.stack-auth.com/api/v1/users/me';

export async function verifyStackAccessToken(accessToken: string | null): Promise<boolean> {
  if (!accessToken || !config.stackProjectId || !config.stackSecretServerKey) {
    return false;
  }

  try {
    const response = await fetch(STACK_USER_ENDPOINT, {
      headers: {
        'x-stack-access-type': 'server',
        'x-stack-project-id': config.stackProjectId,
        'x-stack-secret-server-key': config.stackSecretServerKey,
        'x-stack-access-token': accessToken,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
