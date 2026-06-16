'use client';

import { useState, useEffect, ChangeEvent, ViewTransition } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useUser } from '@hexclave/next';
import {
  DEFAULT_IMAGE_GEN_NUM,
  IMAGE_GEN_MIN,
  IMAGE_GEN_MAX,
} from '@workspace/shared';
import {
  activeImageGenStatus,
  imageGenStatusPlus,
  type ArtStyle,
  type ImageGenStatusPlus,
} from '@workspace/api-contract';
import {
  artStyleDefault,
  artStylesQueryOptions,
} from '@/lib/services/art-style.service';
import { generateImages } from '@/lib/services/game.service';
import { useImageGen } from '@/lib/hooks/use-image-gen';
import { Button } from '@workspace/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@workspace/ui/dropdown-menu';
import { Input } from '@workspace/ui/input';
import { Label } from '@workspace/ui/label';
import { Checkbox } from '@workspace/ui/checkbox';
import { Badge } from '@workspace/ui/badge';
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
  IconChevronDown,
} from '@tabler/icons-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard-header';

function StatusBadge({ status }: { status: ImageGenStatusPlus }) {
  const { label, variant } = imageGenStatusPlus[status];

  return <Badge variant={variant}>{label}</Badge>;
}

interface ActiveImageGenPanelProps {
  imageGenId: string;
  accessToken: string | null;
}

function ActiveImageGenPanel({
  imageGenId,
  accessToken,
}: ActiveImageGenPanelProps) {
  const imageGenState = useImageGen({ imageGenId, enabled: true, accessToken });

  const progressPct =
    imageGenState.total > 0
      ? Math.round((imageGenState.processed / imageGenState.total) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconRefresh
            size={16}
            className={cn(
              'text-primary',
              imageGenState.isConnected && 'animate-spin',
            )}
            aria-hidden="true"
          />
          Active Image Generation
        </CardTitle>
        <CardDescription>
          Generation ID:{' '}
          <span className="font-mono text-[10px]">{imageGenId}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-4"
          aria-live="polite"
          aria-label="Generation progress"
        >
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={imageGenState.status} />
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {imageGenState.processed} / {imageGenState.total} ({progressPct}
                %)
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
                {imageGenState.succeeded}
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
              <span className="font-medium font-mono">
                {imageGenState.failed}
              </span>
            </div>
          </div>

          {/* Latest game (while running) */}
          {imageGenState.latestGame && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Latest:{' '}
              <span className="font-medium text-foreground">
                {imageGenState.latestGame}
              </span>
            </div>
          )}

          {/* Processed games list (after completion) */}
          {imageGenState.processedGames.length > 0 &&
            !imageGenState.latestGame && (
              <details className="text-xs border-t pt-3" open>
                <summary className="cursor-pointer text-muted-foreground mb-2">
                  {imageGenState.processedGames.length} game
                  {imageGenState.processedGames.length === 1 ? '' : 's'}{' '}
                  processed
                </summary>
                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                  {imageGenState.processedGames.map((name, i) => (
                    <li key={i + 1} className="text-foreground py-0.5">
                      {name}
                    </li>
                  ))}
                </ul>
              </details>
            )}

          {/* Failures list */}
          {imageGenState.failures.length > 0 && (
            <details className="text-xs border-t pt-3">
              <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
                <IconAlertTriangle size={12} aria-hidden="true" />
                {imageGenState.failures.length} failure
                {imageGenState.failures.length === 1 ? '' : 's'}
              </summary>
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {imageGenState.failures.map((f) => (
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

export default function ImageGenAdmin() {
  const user = useUser();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeImageGenId, setActiveImageGenId] = useState<string | null>(null);
  const [numGames, setNumGames] = useState(DEFAULT_IMAGE_GEN_NUM);
  const [artStyle, setArtStyle] = useState<ArtStyle>(artStyleDefault);
  const [includeStoryline, setIncludeStoryline] = useState(false);
  const [includeGenres, setIncludeGenres] = useState(false);
  const [includeThemes, setIncludeThemes] = useState(false);

  const { data: artStyles } = useSuspenseQuery(artStylesQueryOptions);

  // Fetch access token for SSE
  useEffect(() => {
    let cancelled = false;

    user?.getAccessToken().then((token) => {
      if (!cancelled && token) setAccessToken(token);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const imageGenState = useImageGen({
    imageGenId: activeImageGenId,
    enabled: !!activeImageGenId,
    accessToken,
  });
  const isImageGenActive =
    activeImageGenId !== null && imageGenState.status in activeImageGenStatus;

  const startMutation = useMutation({
    mutationFn: () =>
      generateImages({
        numGames,
        artStyle: artStyle?.value,
        includeStoryline,
        includeGenres,
        includeThemes,
      }),
    onSuccess: (result) => {
      setActiveImageGenId(result.imageGenId);
      toast.success(
        `Image generation started — ${result.gamesQueued} games queued`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to start image generation');
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
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader title="Image Generation" icon={IconRobotFace} />

        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-lg space-y-6">
            {/* Configuration form */}
            <Card>
              <CardContent>
                <fieldset
                  disabled={startMutation.isPending || isImageGenActive}
                  className="space-y-5"
                >
                  {/* Number of games */}
                  <div className="space-y-1.5">
                    <Label htmlFor="num-games" className="text-sm">
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

                  {/* Art style */}
                  <div className="space-y-1.5">
                    <Label htmlFor="art-style-trigger" className="text-sm">
                      Art style
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            id="art-style-trigger"
                            variant="outline"
                            className="w-80 justify-between font-normal"
                          >
                            <span className="truncate">
                              {
                                artStyles.find(
                                  (s) => s.value === artStyle?.value,
                                )?.label
                              }
                            </span>
                            <IconChevronDown
                              size={16}
                              className="ml-2 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </Button>
                        }
                      />
                      <DropdownMenuContent className="w-80 p-1 bg-muted">
                        <DropdownMenuRadioGroup
                          value={artStyle}
                          onValueChange={(val) => setArtStyle(val as ArtStyle)}
                        >
                          {artStyles.map((style) => (
                            <DropdownMenuRadioItem
                              key={style.value}
                              value={style.value}
                              className="pl-3 data-unchecked:focus:bg-accent data-unchecked:focus:text-accent-foreground"
                            >
                              {style.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <Label className="text-sm">Prompt extras</Label>
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
                    disabled={startMutation.isPending || isImageGenActive}
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
                    {isImageGenActive
                      ? 'Generation already running'
                      : 'Start Generation'}
                  </Button>

                  {isImageGenActive && (
                    <p className="text-xs text-muted-foreground">
                      An image generation is currently active. Wait for it to
                      finish before starting a new one.
                    </p>
                  )}
                </fieldset>
              </CardContent>
            </Card>

            {/* Active generation panel */}
            {activeImageGenId && (
              <ActiveImageGenPanel
                imageGenId={activeImageGenId}
                accessToken={accessToken}
              />
            )}
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
