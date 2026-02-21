'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHealthStatus } from '@/lib/services/health.service';
import type { HealthCheckResult, HealthIndicatorDetail } from '@/lib/services/health.service';
import { IconCircleCheck, IconCircleX, IconRefresh, IconHeartbeat } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function StatusIcon({ status }: Readonly<{ status: HealthIndicatorDetail['status'] }>) {
  if (status === 'up') {
    return (
      <IconCircleCheck
        size={20}
        className="text-primary shrink-0"
        aria-hidden="true"
      />
    );
  }
  return (
    <IconCircleX
      size={20}
      className="text-destructive shrink-0"
      aria-hidden="true"
    />
  );
}

function OverallStatusBadge({ status }: Readonly<{ status: HealthCheckResult['status'] }>) {
  const isOk = status === 'ok';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium font-mono border',
        isOk
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-destructive/10 text-destructive border-destructive/30'
      )}
      aria-live="polite"
    >
      {isOk ? (
        <IconCircleCheck size={14} aria-hidden="true" />
      ) : (
        <IconCircleX size={14} aria-hidden="true" />
      )}
      {isOk ? 'Operational' : 'Degraded'}
    </span>
  );
}

function ServiceRow({
  name,
  detail,
}: Readonly<{
  name: string;
  detail: HealthIndicatorDetail;
}>) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <StatusIcon status={detail.status} />
        <div className="min-w-0">
          <p className="text-sm font-medium capitalize">{name}</p>
          {detail.message && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5 wrap-break-word">
              {detail.message}
            </p>
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-xs font-mono shrink-0 px-1.5 py-0.5 border',
          detail.status === 'up'
            ? 'text-primary border-primary/30 bg-primary/5'
            : 'text-destructive border-destructive/30 bg-destructive/5'
        )}
      >
        {detail.status}
      </span>
    </div>
  );
}

export default function HealthView() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealthStatus,
    refetchInterval: 30_000,
  });

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const serviceEntries = data
    ? Object.entries(data.details)
    : [];

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <IconHeartbeat size={20} className="text-primary" aria-hidden="true" />
                <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Live status of API services and infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastChecked && (
                <p className="text-xs text-muted-foreground font-mono">
                  Last checked: {lastChecked}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5 cursor-pointer"
                aria-label="Refresh health status"
              >
                <IconRefresh
                  size={14}
                  className={cn(isFetching && 'animate-spin')}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1 max-w-2xl">
        {isLoading && !data ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm font-medium">Checking service health...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Overall Status
              </h2>
              {data && <OverallStatusBadge status={data.status} />}
            </div>

            <div className="border border-border bg-card">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Services
                </h3>
              </div>
              <div className="px-4">
                {serviceEntries.length > 0 ? (
                  serviceEntries.map(([name, detail]) => (
                    <ServiceRow key={name} name={name} detail={detail} />
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No service data available.
                  </div>
                )}
              </div>
            </div>

            {data?.status === 'error' && Object.keys(data.error).length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">
                  Errors
                </p>
                <ul className="space-y-1" aria-live="polite">
                  {Object.entries(data.error).map(([name, detail]) => (
                    <li key={name} className="text-sm text-destructive font-mono">
                      <span className="font-semibold capitalize">{name}</span>
                      {detail.message && (
                        <span className="text-destructive/70"> — {detail.message}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
