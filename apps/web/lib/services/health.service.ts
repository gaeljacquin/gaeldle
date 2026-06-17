export type HealthStatus = 'up' | 'down';

export interface HealthIndicatorDetail {
  status: HealthStatus;
  message?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'error';
  info: Record<string, HealthIndicatorDetail>;
  error: Record<string, HealthIndicatorDetail>;
  details: Record<string, HealthIndicatorDetail>;
}

async function pingApi(): Promise<HealthIndicatorDetail> {
  try {
    const response = await fetch(`${process.env.apiUrl}/`, {
      cache: 'no-store',
    });

    return response.ok
      ? { status: 'up' }
      : { status: 'down', message: `HTTP ${response.status}` };
  } catch {
    return { status: 'down', message: 'Writes API is unreachable' };
  }
}

async function pingClient(
  baseClientUrl: string,
): Promise<HealthIndicatorDetail> {
  try {
    const response = await fetch(`${baseClientUrl}/api/games?pageSize=1`, {
      cache: 'no-store',
    });

    return response.ok
      ? { status: 'up' }
      : { status: 'down', message: `HTTP ${response.status}` };
  } catch {
    return { status: 'down', message: 'Reads API is unreachable' };
  }
}

export async function fetchHealthStatus(
  baseClientUrl: string,
): Promise<HealthCheckResult> {
  const [healthResult, apiPing, clientPing] = await Promise.allSettled([
    fetch(`${process.env.apiUrl}/health`, { cache: 'no-store' }).then(
      (r) => r.json() as Promise<HealthCheckResult>,
    ),
    pingApi(),
    pingClient(baseClientUrl),
  ]);

  const health: HealthCheckResult =
    healthResult.status === 'fulfilled'
      ? healthResult.value
      : {
          status: 'error',
          info: {},
          error: {
            database: {
              status: 'down',
              message: 'Health endpoint unreachable',
            },
          },
          details: {
            database: {
              status: 'down',
              message: 'Health endpoint unreachable',
            },
          },
        };

  const apiDetail: HealthIndicatorDetail =
    apiPing.status === 'fulfilled'
      ? apiPing.value
      : { status: 'down', message: 'writes api is unreachable' };

  const clientDetail: HealthIndicatorDetail =
    clientPing.status === 'fulfilled'
      ? clientPing.value
      : { status: 'down', message: 'reads api is unreachable' };

  const anyDown =
    health.status === 'error' ||
    apiDetail.status === 'down' ||
    clientDetail.status === 'down';
  const overallStatus = anyDown ? 'error' : 'ok';

  const infoExtras = {
    ...(apiDetail.status === 'up' ? { 'writes api': apiDetail } : {}),
    ...(clientDetail.status === 'up' ? { 'reads api': clientDetail } : {}),
  };

  const errorExtras = {
    ...(apiDetail.status === 'down' ? { 'writes api': apiDetail } : {}),
    ...(clientDetail.status === 'down' ? { 'reads api': clientDetail } : {}),
  };

  return {
    status: overallStatus,
    info: { ...infoExtras, ...health.info },
    error: { ...errorExtras, ...health.error },
    details: {
      'writes api': apiDetail,
      'reads api': clientDetail,
      ...health.details,
    },
  };
}
