'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@stackframe/stack';
import {
  DEFAULT_IMAGE_GEN_NUM,
  DEFAULT_IMAGE_GEN_STYLE,
  IMAGE_GEN_MIN,
  IMAGE_GEN_MAX,
  IMAGE_STYLES,
} from '@workspace/constants';
import type { ImageStyle } from '@workspace/api-contract';
import { bulkGenerateImages } from '@/lib/services/game.service';
import { useBulkImageJob } from '@/lib/hooks/use-bulk-image-job';
import { Button } from '@workspace/ui/button';
import { Input } from '@workspace/ui/input';
import { Label } from '@workspace/ui/label';
import { Checkbox } from '@workspace/ui/checkbox';
import { Badge } from '@workspace/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/card';
import {
  IconPlayerPlay,
  IconCircleCheck,
  IconCircleX,
  IconRefresh,
  IconLoader,
  IconAlertTriangle,
  IconRobotFace,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardPageHeader } from '@/components/dashboard-header';

type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

function StatusBadge({ status }: Readonly<{ status: JobStatus | 'idle' }>) {
  const variantMap: Record<
    JobStatus | 'idle',
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    idle: 'outline',
    pending: 'secondary',
    running: 'default',
    completed: 'default',
    failed: 'destructive',
  };

  const labelMap: Record<JobStatus | 'idle', string> = {
    idle: 'Idle',
    pending: 'Pending',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

interface ActiveJobPanelProps {
  jobId: string;
  accessToken: string | null;
}

function ActiveJobPanel({ jobId, accessToken }: Readonly<ActiveJobPanelProps>) {
  const jobState = useBulkImageJob({ jobId, enabled: true, accessToken });

  const progressPct =
    jobState.total > 0
      ? Math.round((jobState.processed / jobState.total) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconRefresh
            size={16}
            className={cn(
              'text-primary',
              jobState.isConnected && 'animate-spin',
            )}
            aria-hidden="true"
          />
          Active Job
        </CardTitle>
        <CardDescription>
          Job ID: <span className="font-mono text-[10px]">{jobId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" aria-live="polite" aria-label="Job progress">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={jobState.status} />
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {jobState.processed} / {jobState.total} ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <IconCircleCheck
                  size={14}
                  className="text-green-500"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">Succeeded</span>
              </div>
              <span className="font-medium font-mono">
                {jobState.succeeded}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <IconCircleX
                  size={14}
                  className="text-destructive"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">Failed</span>
              </div>
              <span className="font-medium font-mono">{jobState.failed}</span>
            </div>
          </div>

          {/* Latest game (while running) */}
          {jobState.latestGame && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Latest:{' '}
              <span className="font-medium text-foreground">
                {jobState.latestGame}
              </span>
            </div>
          )}

          {/* Processed games list (after completion) */}
          {jobState.processedGames.length > 0 && !jobState.latestGame && (
            <details className="text-xs border-t pt-3" open>
              <summary className="cursor-pointer text-muted-foreground mb-2">
                {jobState.processedGames.length} game
                {jobState.processedGames.length === 1 ? '' : 's'} processed
              </summary>
              <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                {jobState.processedGames.map((name, i) => (
                  <li key={i + 1} className="text-foreground py-0.5">
                    {name}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Failures list */}
          {jobState.failures.length > 0 && (
            <details className="text-xs border-t pt-3">
              <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
                <IconAlertTriangle size={12} aria-hidden="true" />
                {jobState.failures.length} failure
                {jobState.failures.length === 1 ? '' : 's'}
              </summary>
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {jobState.failures.map((f) => (
                  <li key={f.igdbId} className="text-destructive">
                    <span className="font-medium">{f.gameName}</span>: {f.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BulkImageGen() {
  const user = useUser({ or: 'redirect' });

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const [numGames, setNumGames] = useState(DEFAULT_IMAGE_GEN_NUM);
  const [imageStyle, setImageStyle] = useState<ImageStyle>(
    DEFAULT_IMAGE_GEN_STYLE,
  );
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);

  // Fetch access token for SSE
  useEffect(() => {
    let cancelled = false;
    user.getAccessToken().then((token) => {
      if (!cancelled && token) setAccessToken(token);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const jobState = useBulkImageJob({
    jobId: activeJobId,
    enabled: !!activeJobId,
    accessToken,
  });
  const isJobActive =
    activeJobId !== null &&
    (jobState.status === 'pending' ||
      jobState.status === 'running' ||
      jobState.status === 'idle');

  const startMutation = useMutation({
    mutationFn: () =>
      bulkGenerateImages({
        numGames,
        imageStyle,
        includeStoryline,
        includeGenres,
        includeThemes,
      }),
    onSuccess: (result) => {
      setActiveJobId(result.jobId);
      toast.success(`Job started — ${result.gamesQueued} games queued`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to start bulk generation');
    },
  });

  const handleNumGamesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      IMAGE_GEN_MIN,
      Math.min(IMAGE_GEN_MAX, Number(e.target.value)),
    );
    setNumGames(val);
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <DashboardPageHeader
            title="Bulk Image Generation"
            description="Generate AI images for games that don't have one yet."
            icon={IconRobotFace}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-lg space-y-6">
          {/* Configuration form */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Set the parameters for the bulk generation job.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset
                disabled={startMutation.isPending || isJobActive}
                className="space-y-5"
              >
                {/* Number of games */}
                <div className="space-y-1.5">
                  <Label htmlFor="num-games">
                    Number of games ({IMAGE_GEN_MIN}–{IMAGE_GEN_MAX})
                  </Label>
                  <Input
                    id="num-games"
                    type="number"
                    min={IMAGE_GEN_MIN}
                    max={IMAGE_GEN_MAX}
                    value={numGames}
                    onChange={handleNumGamesChange}
                    className="w-28"
                  />
                </div>

                {/* Image style */}
                <div className="space-y-1.5">
                  <Label htmlFor="image-style-trigger">Image style</Label>
                  <Select
                    value={imageStyle}
                    onValueChange={(val) => setImageStyle(val as ImageStyle)}
                  >
                    <SelectTrigger
                      id="image-style-trigger"
                      className="w-full max-w-xs"
                    >
                      <SelectValue>
                        {
                          IMAGE_STYLES.find((s) => s.value === imageStyle)
                            ?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <Label>Prompt extras</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <Checkbox
                        checked={includeStoryline}
                        onCheckedChange={(checked) =>
                          setIncludeStoryline(checked === true)
                        }
                      />
                      Include storyline
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <Checkbox
                        checked={includeGenres}
                        onCheckedChange={(checked) =>
                          setIncludeGenres(checked === true)
                        }
                      />
                      Include genres
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <Checkbox
                        checked={includeThemes}
                        onCheckedChange={(checked) =>
                          setIncludeThemes(checked === true)
                        }
                      />
                      Include themes
                    </label>
                  </div>
                </div>

                {/* Start button */}
                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending || isJobActive}
                  className="cursor-pointer flex items-center gap-2"
                >
                  {startMutation.isPending ? (
                    <IconLoader
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <IconPlayerPlay size={16} aria-hidden="true" />
                  )}
                  {isJobActive ? 'Job already running' : 'Start Generation'}
                </Button>

                {isJobActive && (
                  <p className="text-xs text-muted-foreground">
                    A job is currently active. Wait for it to finish before
                    starting a new one.
                  </p>
                )}
              </fieldset>
            </CardContent>
          </Card>

          {/* Active job panel */}
          {activeJobId && (
            <ActiveJobPanel jobId={activeJobId} accessToken={accessToken} />
          )}
        </div>
      </div>
    </div>
  );
}
