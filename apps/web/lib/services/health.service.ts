const NESTJS_BASE_URL = process.env.serverUrl || 'http://localhost:8080';
const NEXTJS_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

async function pingNestJs(): Promise<HealthIndicatorDetail> {
  try {
    const response = await fetch(`${NESTJS_BASE_URL}/`, { cache: 'no-store' });
    return response.ok
      ? { status: 'up' }
      : { status: 'down', message: `HTTP ${response.status}` };
  } catch {
    return { status: 'down', message: 'Writes API is unreachable' };
  }
}

async function pingNextJs(): Promise<HealthIndicatorDetail> {
  try {
    const response = await fetch(`${NEXTJS_BASE_URL}/api/games?pageSize=1`, { cache: 'no-store' });
    return response.ok
      ? { status: 'up' }
      : { status: 'down', message: `HTTP ${response.status}` };
  } catch {
    return { status: 'down', message: 'Reads API is unreachable' };
  }
}

export async function fetchHealthStatus(): Promise<HealthCheckResult> {
  const [healthResult, nestJsPing, nextJsPing] = await Promise.allSettled([
    fetch(`${NESTJS_BASE_URL}/health`, { cache: 'no-store' }).then((r) => r.json() as Promise<HealthCheckResult>),
    pingNestJs(),
    pingNextJs(),
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

  const nestJsDetail: HealthIndicatorDetail =
    nestJsPing.status === 'fulfilled' ? nestJsPing.value : { status: 'down', message: 'writes api is unreachable' };

  const nextJsDetail: HealthIndicatorDetail =
    nextJsPing.status === 'fulfilled' ? nextJsPing.value : { status: 'down', message: 'reads api is unreachable' };

  const anyDown = health.status === 'error' || nestJsDetail.status === 'down' || nextJsDetail.status === 'down';
  const overallStatus = anyDown ? 'error' : 'ok';

  const infoExtras = {
    ...(nestJsDetail.status === 'up' ? { 'writes api': nestJsDetail } : {}),
    ...(nextJsDetail.status === 'up' ? { 'reads api': nextJsDetail } : {}),
  };

  const errorExtras = {
    ...(nestJsDetail.status === 'down' ? { 'writes api': nestJsDetail } : {}),
    ...(nextJsDetail.status === 'down' ? { 'reads api': nextJsDetail } : {}),
  };

  return {
    status: overallStatus,
    info: { ...infoExtras, ...health.info },
    error: { ...errorExtras, ...health.error },
    details: { 'writes api': nestJsDetail, 'reads api': nextJsDetail, ...health.details },
  };
}
