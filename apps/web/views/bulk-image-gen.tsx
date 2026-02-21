'use client';

import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@stackframe/stack';
import { DEFAULT_IMAGE_GEN_NUM, DEFAULT_IMAGE_GEN_STYLE, IMAGE_GEN_MIN, IMAGE_GEN_MAX, IMAGE_STYLES } from '@gaeldle/constants';
import type { ImageStyle } from '@gaeldle/api-contract';
import {
  bulkGenerateImages,
  listBulkJobs,
} from '@/lib/services/game.service';
import { useBulkImageJob } from '@/lib/hooks/use-bulk-image-job';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  IconPlayerPlay,
  IconCircleCheck,
  IconCircleX,
  IconRefresh,
  IconLoader,
  IconAlertTriangle,
  IconRobotFace,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

function StatusBadge({ status }: Readonly<{ status: JobStatus | 'idle' }>) {
  const variantMap: Record<JobStatus | 'idle', 'default' | 'secondary' | 'destructive' | 'outline'> = {
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

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
    </Badge>
  );
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
            className={cn('text-primary', jobState.isConnected && 'animate-spin')}
            aria-hidden="true"
          />
          Active Job
        </CardTitle>
        <CardDescription>
          Job ID: <span className="font-mono text-[10px]">{jobId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-4"
          aria-live="polite"
          aria-label="Job progress"
        >
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
                <IconCircleCheck size={14} className="text-green-500" aria-hidden="true" />
                <span className="text-muted-foreground">Succeeded</span>
              </div>
              <span className="font-medium font-mono">{jobState.succeeded}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <IconCircleX size={14} className="text-destructive" aria-hidden="true" />
                <span className="text-muted-foreground">Failed</span>
              </div>
              <span className="font-medium font-mono">{jobState.failed}</span>
            </div>
          </div>

          {/* Latest game (while running) */}
          {jobState.latestGame && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Latest: <span className="font-medium text-foreground">{jobState.latestGame}</span>
            </div>
          )}

          {/* Processed games list (after completion) */}
          {jobState.processedGames.length > 0 && !jobState.latestGame && (
            <details className="text-xs border-t pt-3" open>
              <summary className="cursor-pointer text-muted-foreground mb-2">
                {jobState.processedGames.length} game{jobState.processedGames.length === 1 ? '' : 's'} processed
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
                {jobState.failures.length} failure{jobState.failures.length === 1 ? '' : 's'}
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

interface JobHistoryTableProps {
  jobs: Array<{
    jobId: string;
    status: string;
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    params: {
      numGames: number;
      imageStyle: string;
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
    };
    startedAt: Date | string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
  }>;
}

function JobHistoryTable({ jobs }: Readonly<JobHistoryTableProps>) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No jobs have been run yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Style</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">OK</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Fail</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Started</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const styleLabel =
              IMAGE_STYLES.find((s) => s.value === job.params.imageStyle)?.label ??
              job.params.imageStyle;
            const startedLabel = job.startedAt
              ? new Date(job.startedAt).toLocaleString()
              : '—';
            return (
              <tr key={job.jobId} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2 px-3">
                  <StatusBadge status={job.status as JobStatus} />
                </td>
                <td className="py-2 px-3 max-w-35 truncate" title={styleLabel}>
                  {styleLabel}
                </td>
                <td className="py-2 px-3 text-right font-mono">{job.total}</td>
                <td className="py-2 px-3 text-right font-mono text-green-600">{job.succeeded}</td>
                <td className="py-2 px-3 text-right font-mono text-destructive">{job.failed}</td>
                <td className="py-2 px-3 text-muted-foreground">{startedLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BulkImageGen() {
  const queryClient = useQueryClient();
  const user = useUser({ or: 'redirect' });

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const [numGames, setNumGames] = useState(DEFAULT_IMAGE_GEN_NUM);
  const [imageStyle, setImageStyle] = useState<ImageStyle>(DEFAULT_IMAGE_GEN_STYLE);
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);

  // Fetch access token for SSE
  useEffect(() => {
    let cancelled = false;
    user.getAccessToken().then((token) => {
      if (!cancelled && token) setAccessToken(token);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Job history query
  const { data: jobListData, isPending: isJobListPending, isError: isJobListError } = useQuery({
    queryKey: ['bulk-jobs'],
    queryFn: () => listBulkJobs(10),
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data?.data ?? [];
      return data.some((j) => j.status === 'pending' || j.status === 'running') ? 5000 : false;
    },
  });

  const jobs = useMemo(() => jobListData?.data ?? [], [jobListData]);

  // Derive active job ID from history (for page reloads) — prefer the explicitly set one
  const activeJobIdFromHistory = useMemo(
    () => jobs.find((j) => j.status === 'pending' || j.status === 'running')?.jobId ?? null,
    [jobs],
  );
  const resolvedActiveJobId = activeJobId ?? activeJobIdFromHistory;

  const isJobActive = jobs.some((j) => j.status === 'pending' || j.status === 'running');

  // Start job mutation
  const startMutation = useMutation({
    mutationFn: () =>
      bulkGenerateImages({ numGames, imageStyle, includeStoryline, includeGenres, includeThemes }),
    onSuccess: (result) => {
      setActiveJobId(result.jobId);
      toast.success(`Job started — ${result.gamesQueued} games queued`);
      queryClient.invalidateQueries({ queryKey: ['bulk-jobs'] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to start bulk generation');
    },
  });

  const handleNumGamesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(IMAGE_GEN_MIN, Math.min(IMAGE_GEN_MAX, Number(e.target.value)));
    setNumGames(val);
  };

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <IconRobotFace size={22} className="text-primary" aria-hidden="true" />
                Bulk Image Generation
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate AI images for games that don&apos;t have one yet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 space-y-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Config form + Active job */}
          <div className="space-y-6">
            {/* Configuration form */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Set the parameters for the bulk generation job.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset disabled={startMutation.isPending || isJobActive} className="space-y-5">
                  {/* Number of games */}
                  <div className="space-y-1.5">
                    <Label htmlFor="num-games">
                      Number of games (1–50)
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
                      <SelectTrigger id="image-style-trigger" className="w-full max-w-xs">
                        <SelectValue>
                          {IMAGE_STYLES.find((s) => s.value === imageStyle)?.label}
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
                      <IconLoader size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <IconPlayerPlay size={16} aria-hidden="true" />
                    )}
                    {isJobActive ? 'Job already running' : 'Start Generation'}
                  </Button>

                  {isJobActive && (
                    <p className="text-xs text-muted-foreground">
                      A job is currently active. Wait for it to finish before starting a new one.
                    </p>
                  )}
                </fieldset>
              </CardContent>
            </Card>

            {/* Active job panel */}
            {resolvedActiveJobId && (
              <ActiveJobPanel jobId={resolvedActiveJobId} accessToken={accessToken} />
            )}
          </div>

          {/* Right column: Job history */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
                <CardDescription>Last 10 bulk image generation runs.</CardDescription>
              </CardHeader>
              <CardContent>
                {isJobListPending && (
                  <div
                    className="flex items-center justify-center py-8 text-muted-foreground"
                    aria-live="polite"
                  >
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                )}
                {isJobListError && (
                  <p className="text-sm text-destructive py-4 text-center">
                    Failed to load job history. Check that the API is running.
                  </p>
                )}
                {!isJobListPending && !isJobListError && (
                  <JobHistoryTable jobs={jobs} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
