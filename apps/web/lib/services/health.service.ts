const API_BASE_URL = process.env.serverUrl || 'http://localhost:8080';

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
    const response = await fetch(`${API_BASE_URL}/`, { cache: 'no-store' });
    return response.ok
      ? { status: 'up' }
      : { status: 'down', message: `HTTP ${response.status}` };
  } catch {
    return { status: 'down', message: 'API is unreachable' };
  }
}

export async function fetchHealthStatus(): Promise<HealthCheckResult> {
  const [healthResult, apiPing] = await Promise.allSettled([
    fetch(`${API_BASE_URL}/health`, { cache: 'no-store' }).then((r) => r.json() as Promise<HealthCheckResult>),
    pingApi(),
  ]);

  const health: HealthCheckResult =
    healthResult.status === 'fulfilled'
      ? healthResult.value
      : {
          status: 'error',
          info: {},
          error: { database: { status: 'down', message: 'Health endpoint unreachable' } },
          details: { database: { status: 'down', message: 'Health endpoint unreachable' } },
        };

  const apiDetail: HealthIndicatorDetail =
    apiPing.status === 'fulfilled' ? apiPing.value : { status: 'down', message: 'API is unreachable' };

  const overallStatus = health.status === 'error' || apiDetail.status === 'down' ? 'error' : 'ok';

  return {
    status: overallStatus,
    info: apiDetail.status === 'up' ? { ...health.info, api: apiDetail } : health.info,
    error: apiDetail.status === 'down' ? { ...health.error, api: apiDetail } : health.error,
    details: { api: apiDetail, ...health.details },
  };
}
