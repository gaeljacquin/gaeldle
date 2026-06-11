import { headers } from 'next/headers';
import { fetchHealthStatus } from '@/lib/services/health.service';
import { HealthView } from '@/views/health';

export default async function HealthPage() {
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') ?? 'http';
  const baseClientUrl = `${proto}://${host}`;
  const initialData = await fetchHealthStatus(baseClientUrl);

  return <HealthView initialData={initialData} baseClientUrl={baseClientUrl} />;
}
