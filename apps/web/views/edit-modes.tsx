'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewTransition } from 'react';
import { motion } from 'motion/react';
import {
  IconPlayerPlay,
  IconLoader,
  IconCheck,
  IconAlertCircle,
  IconArrowBackUp,
  IconPencil,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@workspace/ui/card';
import { Button } from '@workspace/ui/button';
import { Input } from '@workspace/ui/input';
import { Label } from '@workspace/ui/label';
import { Textarea } from '@workspace/ui/textarea';
import { Checkbox } from '@workspace/ui/checkbox';
import { Badge } from '@workspace/ui/badge';
import { Item } from '@workspace/ui/item';
import { cn } from '@workspace/ui/lib/utils';
import {
  allGameModesQueryOptions,
  updateGameMode,
  updateGameModesOrder,
} from '@/lib/services/game-mode.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/alert-dialog';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GameModePlus } from '@workspace/api/db';

type EditFormValues = {
  slug: string;
  title: string;
  description: string;
  level: 'easy' | 'medium' | 'hard';
  maxAttempts: number;
  gradient: string;
  isActive: boolean;
  isCoverArt: boolean;
};

function hslToHex(h: number, s: number, l: number): string {
  const light = l / 100;
  const a = (s * Math.min(light, 1 - light)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function parseColorToHex(color: string): string {
  if (!color) return '#000000';
  const c = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }

  const hslMatch = c.match(
    /hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/,
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    return hslToHex(h, s, l);
  }

  const rgbMatch = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return '#000000';
}

function parseGradientParts(gradientStr: string) {
  if (!gradientStr || !gradientStr.includes('(')) {
    return { angle: '135deg', startColor: '', endColor: '' };
  }

  const content = gradientStr.substring(
    gradientStr.indexOf('(') + 1,
    gradientStr.lastIndexOf(')'),
  );

  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  let angle = '135deg';
  let colorStops = parts;

  if (parts.length > 0) {
    const first = parts[0].toLowerCase();
    if (
      first.includes('deg') ||
      first.includes('to ') ||
      first.includes('turn') ||
      first.includes('rad')
    ) {
      angle = parts[0];
      colorStops = parts.slice(1);
    }
  }

  const cleanStop = (stop: string) => stop.replace(/\s+\d+%\s*$/, '').trim();

  const startColor = colorStops.length > 0 ? cleanStop(colorStops[0]) : '';
  const endColor =
    colorStops.length > 1
      ? cleanStop(colorStops[colorStops.length - 1])
      : startColor;

  return { angle, startColor, endColor };
}

interface SortableGameModeItemProps {
  mode: GameModePlus & { id: number };
  isSelected: boolean;
  hasEdits: boolean;
  isReorderMode: boolean;
  isOrderConflict: boolean;
  currentGradient?: string;
  onClick: () => void;
}

function SortableGameModeItem({
  mode,
  isSelected,
  hasEdits,
  isReorderMode,
  isOrderConflict,
  currentGradient,
  onClick,
}: SortableGameModeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mode.id, disabled: !isReorderMode || isOrderConflict });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: currentGradient || mode.gradient,
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      layout={!isReorderMode}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      {...attributes}
      {...(isReorderMode && !isOrderConflict ? listeners : {})}
      type="button"
      onClick={isReorderMode ? undefined : onClick}
      className={cn(
        'flex flex-col w-full text-left p-4 rounded-xl border transition-[opacity,border-color,background-color,box-shadow] duration-200 relative overflow-hidden group touch-none',
        isReorderMode
          ? isOrderConflict
            ? 'border-white/10 opacity-60 cursor-not-allowed'
            : 'border-white/10 opacity-100 cursor-grab active:cursor-grabbing'
          : isSelected
            ? 'border-white/10 shadow-lg opacity-100 cursor-pointer'
            : 'border-white/10 hover:border-white/30 hover:shadow-md opacity-80 hover:opacity-100 cursor-pointer',
        isDragging && 'opacity-30',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          (isSelected || isDragging || isReorderMode) && 'opacity-100',
        )}
        style={{ background: 'var(--gradient-card-overlay)' }}
      />

      <div className="flex items-center justify-between w-full relative z-10">
        <span className="font-bold text-sm text-white flex items-center gap-2">
          {isReorderMode && (
            <svg
              className="w-4 h-4 text-white/60 select-none shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8h16M4 16h16"
              />
            </svg>
          )}
          {mode.title}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground uppercase">
            {mode.level}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between w-full mt-2.5 h-5 relative z-10">
        <span className="text-[11px] font-mono text-white">/{mode.slug}</span>

        {!isReorderMode && hasEdits && (
          <Badge
            variant="default"
            className="bg-amber-500 hover:bg-amber-500 text-black border-amber-500 text-[11px] h-5 px-2 py-0.5 font-bold"
          >
            Unsaved
          </Badge>
        )}
      </div>
    </motion.button>
  );
}

function EditModesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-background">
      <DashboardHeader
        title="Edit Modes"
        icon={IconPlayerPlay}
        dashboardBacklinkProps={{
          text: 'Utilities',
          href: '/dashboard/utilities',
        }}
      />
      {children}
    </div>
  );
}

export default function EditModesView() {
  const queryClient = useQueryClient();
  const reorderModeUpdateToastId = 'reorder-mode-update';
  const formModeUpdateToastId = 'form-mode-update';
  const formModeReorderToastId = 'form-mode-reorder-update';
  const [selectedModeSlug, setSelectedModeSlug] = useState<string | null>(null);
  const [formEdits, setFormEdits] = useState<Record<string, EditFormValues>>(
    {},
  );
  const [isSlugEditable, setIsSlugEditable] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedIds, setOrderedIds] = useState<number[] | null>(null);
  const [isOrderConflict, setIsOrderConflict] = useState(false);
  const hasActiveEdits = Object.keys(formEdits).length > 0;

  const {
    data: allGameModes,
    isLoading,
    error,
  } = useQuery({
    ...allGameModesQueryOptions,
    refetchInterval: hasActiveEdits ? false : 5000,
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const lastGameModesRef = useRef<typeof allGameModes | null>(null);
  const justSavedOrderRef = useRef<boolean>(false);
  const justSavedFormRef = useRef<boolean>(false);

  useEffect(() => {
    if (!allGameModes) {
      return;
    }

    if (isReorderMode && !orderedIds) {
      setTimeout(() => {
        setOrderedIds(allGameModes.map((m) => m.id));
      }, 0);
    }

    if (lastGameModesRef.current) {
      // 1. Check order/presence changes
      const currentIds = allGameModes.map((m) => m.id);
      const prevIds = lastGameModesRef.current.map((m) => m.id);

      const isOrderDifferent =
        currentIds.length !== prevIds.length ||
        currentIds.some((id, index) => id !== prevIds[index]);

      if (isOrderDifferent) {
        if (justSavedOrderRef.current) {
          justSavedOrderRef.current = false;
          setTimeout(() => {
            setOrderedIds(allGameModes.map((m) => m.id));
          }, 0);
        } else if (isReorderMode) {
          setTimeout(() => {
            setIsOrderConflict(true);
            toast.info(
              'Someone else already changed the order, refresh first',
              {
                id: reorderModeUpdateToastId,
                duration: Infinity,
                action: {
                  label: 'Refresh',
                  onClick: () => {
                    setIsOrderConflict(false);
                    setOrderedIds(null);
                    queryClient.invalidateQueries({
                      queryKey: ['allGameModes'],
                    });
                    queryClient.invalidateQueries({ queryKey: ['gameModes'] });
                    toast.dismiss(reorderModeUpdateToastId);
                  },
                },
              },
            );
          }, 0);
        } else {
          toast.info('Another user reordered the modes', {
            id: formModeReorderToastId,
          });
        }
      }

      // 2. Check property changes (form updates)
      const updatedModes: string[] = [];
      for (const mode of allGameModes) {
        const prevMode = lastGameModesRef.current.find((m) => m.id === mode.id);

        if (prevMode) {
          const fieldsMatch =
            mode.slug === prevMode.slug &&
            mode.title === prevMode.title &&
            mode.description === prevMode.description &&
            mode.level === prevMode.level &&
            mode.maxAttempts === prevMode.maxAttempts &&
            mode.gradient === prevMode.gradient &&
            mode.isActive === prevMode.isActive &&
            mode.isCoverArt === prevMode.isCoverArt;

          if (!fieldsMatch) {
            updatedModes.push(mode.title);
          }
        }
      }

      if (updatedModes.length > 0) {
        if (justSavedFormRef.current) {
          justSavedFormRef.current = false;
        } else {
          const message =
            updatedModes.length === 1
              ? `Another user updated the "${updatedModes[0]}" mode`
              : `Another user updated the following modes: ${updatedModes.join(', ')}`;
          toast.info(message, { id: formModeUpdateToastId });
        }
      }
    }

    lastGameModesRef.current = allGameModes;
  }, [allGameModes, isReorderMode, queryClient, orderedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const currentOrderedModes = useMemo(() => {
    if (!allGameModes) {
      return [];
    }

    if (!orderedIds) {
      return allGameModes;
    }

    const map = new Map(allGameModes.map((m) => [m.id, m]));
    const ordered = orderedIds
      .map((id) => map.get(id))
      .filter(Boolean) as typeof allGameModes;
    const remaining = allGameModes.filter((m) => !orderedIds.includes(m.id));

    return [...ordered, ...remaining];
  }, [allGameModes, orderedIds]);

  const isOrderChanged = useMemo(() => {
    if (!allGameModes || !orderedIds) {
      return false;
    }

    if (allGameModes.length !== orderedIds.length) {
      return true;
    }

    return allGameModes.some((mode, index) => mode.id !== orderedIds[index]);
  }, [allGameModes, orderedIds]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedIds((prev) => {
        const currentIds = prev || allGameModes?.map((m) => m.id) || [];
        const oldIndex = currentIds.indexOf(Number(active.id));
        const newIndex = currentIds.indexOf(Number(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(currentIds, oldIndex, newIndex);
        }

        return currentIds;
      });
    }
    setActiveId(null);
  };

  const orderMutation = useMutation({
    mutationFn: async (newOrder: (GameModePlus & { id: number })[]) => {
      if (!allGameModes) {
        throw new Error('No game modes loaded');
      }

      const orders = newOrder.map((mode, index) => ({
        id: mode.id,
        ordinal: index + 1,
      }));
      const expected = allGameModes.map((mode) => ({
        id: mode.id,
        ordinal: mode.ordinal,
      }));

      await updateGameModesOrder(orders, expected);
    },
    onSuccess: () => {
      toast.success('Game mode order saved');
      setIsOrderConflict(false);
      justSavedOrderRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['allGameModes'] });
      queryClient.invalidateQueries({ queryKey: ['gameModes'] });
    },
    onError: (err) => {
      const errorWithStatus = err as Error & { status?: number };

      if (errorWithStatus.status === 409) {
        setIsOrderConflict(true);
        toast.info('Someone else already changed the order, refresh first', {
          id: reorderModeUpdateToastId,
          duration: Infinity,
          action: {
            label: 'Refresh',
            onClick: () => {
              setIsOrderConflict(false);
              setOrderedIds(null);
              queryClient.invalidateQueries({ queryKey: ['allGameModes'] });
              queryClient.invalidateQueries({ queryKey: ['gameModes'] });
              toast.dismiss(reorderModeUpdateToastId);
            },
          },
        });
      } else {
        toast.error(err.message || 'Failed to save game mode order');
      }
    },
  });

  const handleSwitchMode = () => {
    if (isReorderMode) {
      if (isOrderChanged && !isOrderConflict) {
        setIsConfirmOpen(true);
      } else {
        setIsReorderMode(false);
        setIsOrderConflict(false);
        setOrderedIds(null);
        toast.dismiss(reorderModeUpdateToastId);
        toast.dismiss(formModeReorderToastId);
      }
    } else {
      setIsReorderMode(true);
      setIsOrderConflict(false);
      toast.dismiss(formModeReorderToastId);
    }
  };

  const handleConfirmSwitch = () => {
    setIsConfirmOpen(false);
    setIsReorderMode(false);
    setOrderedIds(null);
    setIsOrderConflict(false);
    toast.dismiss(reorderModeUpdateToastId);
    toast.dismiss(formModeReorderToastId);
  };

  const defaultModeSlug = allGameModes?.[0]?.slug ?? null;
  const currentSlug = selectedModeSlug ?? defaultModeSlug;
  const selectedMode = allGameModes?.find((m) => m.slug === currentSlug);
  const activeMode = currentOrderedModes.find((m) => m.id === activeId);

  const getFormValue = <K extends keyof EditFormValues>(
    key: K,
  ): EditFormValues[K] => {
    if (currentSlug && formEdits[currentSlug]?.[key] !== undefined) {
      return formEdits[currentSlug][key];
    }
    if (!selectedMode) {
      const defaults: EditFormValues = {
        slug: '',
        title: '',
        description: '',
        level: 'easy',
        maxAttempts: 3,
        gradient: '',
        isActive: false,
        isCoverArt: false,
      };
      return defaults[key];
    }
    const val = selectedMode[key as keyof typeof selectedMode];
    if (key === 'isActive' || key === 'isCoverArt') {
      return (val === 1) as unknown as EditFormValues[K];
    }
    return (val ?? '') as unknown as EditFormValues[K];
  };

  const setFormValue = <K extends keyof EditFormValues>(
    key: K,
    value: EditFormValues[K],
  ) => {
    if (!currentSlug || !selectedMode) {
      return;
    }

    setFormEdits((prev) => {
      const currentEdits = prev[currentSlug] || {
        title: selectedMode.title,
        slug: selectedMode.slug,
        description: selectedMode.description,
        level: selectedMode.level as 'easy' | 'medium' | 'hard',
        maxAttempts: selectedMode.maxAttempts,
        gradient: selectedMode.gradient,
        isActive: selectedMode.isActive === 1,
        isCoverArt: selectedMode.isCoverArt === 1,
      };

      return {
        ...prev,
        [currentSlug]: {
          ...currentEdits,
          [key]: value,
        },
      };
    });
  };

  const isEdited = (slug: string | null) => {
    if (!slug) {
      return false;
    }

    const mode = allGameModes?.find((m) => m.slug === slug);

    if (!mode) {
      return false;
    }

    const edits = formEdits[slug];

    if (!edits) {
      return false;
    }

    return (
      edits.title !== mode.title ||
      edits.slug !== mode.slug ||
      edits.description !== mode.description ||
      edits.level !== mode.level ||
      edits.maxAttempts !== mode.maxAttempts ||
      edits.gradient !== mode.gradient ||
      edits.isActive !== (mode.isActive === 1) ||
      edits.isCoverArt !== (mode.isCoverArt === 1)
    );
  };

  const mutation = useMutation({
    mutationFn: async (slug: string) => {
      const mode = allGameModes?.find((m) => m.slug === slug);

      if (!mode) {
        throw new Error('Mode not found');
      }

      const edits = formEdits[slug];

      if (!edits) {
        return;
      }

      await updateGameMode({
        id: mode.id,
        slug: edits.slug,
        title: edits.title,
        description: edits.description,
        level: edits.level,
        maxAttempts: edits.maxAttempts,
        gradient: edits.gradient,
        isActive: edits.isActive ? 1 : 0,
        isCoverArt: edits.isCoverArt ? 1 : 0,
      });
    },
    onSuccess: (_, oldSlug) => {
      toast.success('Game mode updated');
      justSavedFormRef.current = true;

      const edits = formEdits[oldSlug];
      if (edits && edits.slug !== oldSlug) {
        setSelectedModeSlug(edits.slug);
      }

      setFormEdits((prev) => {
        const next = { ...prev };
        delete next[oldSlug];

        return next;
      });

      setIsSlugEditable(false);

      queryClient.invalidateQueries({ queryKey: ['allGameModes'] });
      queryClient.invalidateQueries({ queryKey: ['gameModes'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update game mode');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReorderMode) {
      orderMutation.mutate(currentOrderedModes);
      return;
    }

    if (!currentSlug) {
      return;
    }

    mutation.mutate(currentSlug);
  };

  if (isLoading) {
    return (
      <EditModesShell>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-muted animate-pulse rounded-xl"
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 h-96 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </EditModesShell>
    );
  }

  if (error) {
    return (
      <EditModesShell>
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center h-96 text-destructive gap-3">
          <IconAlertCircle size={40} />
          <h2 className="text-lg font-bold">Failed to load game modes</h2>
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
        </div>
      </EditModesShell>
    );
  }

  return (
    <>
      <ViewTransition>
        <EditModesShell>
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragCancel={handleDragCancel}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentOrderedModes.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                      {currentOrderedModes.map((mode) => {
                        const isSelected = mode.slug === currentSlug;
                        const hasEdits = isEdited(mode.slug);

                        return (
                          <SortableGameModeItem
                            key={mode.id}
                            mode={mode}
                            isSelected={isSelected}
                            hasEdits={hasEdits}
                            isReorderMode={isReorderMode}
                            isOrderConflict={isOrderConflict}
                            currentGradient={
                              isSelected ? getFormValue('gradient') : undefined
                            }
                            onClick={() => {
                              setSelectedModeSlug(mode.slug);
                              setIsSlugEditable(false);
                            }}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                  <DragOverlay adjustScale={false}>
                    {activeMode ? (
                      <div
                        style={{
                          background: activeMode.gradient,
                        }}
                        className="flex flex-col w-full text-left p-4 rounded-xl border border-primary ring-2 ring-primary opacity-90 relative overflow-hidden group touch-none cursor-grabbing select-none"
                      >
                        <div
                          className="absolute inset-0 opacity-100"
                          style={{ background: 'var(--gradient-card-overlay)' }}
                        />

                        <div className="flex items-center justify-between w-full relative z-10">
                          <span className="font-bold text-sm text-white flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-white/60 select-none shrink-0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 8h16M4 16h16"
                              />
                            </svg>
                            {activeMode.title}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground uppercase">
                              {activeMode.level}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full mt-2.5 h-5 relative z-10">
                          <span className="text-[11px] font-mono text-white">
                            /{activeMode.slug}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <div className="flex-1 min-w-0 w-full space-y-4">
                {selectedMode ? (
                  <>
                    <Card className="shadow-lg border-border bg-card w-full">
                      <form onSubmit={handleSubmit} className="w-full">
                        <div className="relative">
                          {isReorderMode && (
                            <Item
                              variant="muted"
                              className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-xs text-sm font-semibold rounded-t-xl"
                            >
                              Form is disabled in reorder mode
                            </Item>
                          )}
                          <CardHeader className="-space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {selectedMode.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Ordinal {selectedMode.ordinal}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-6 mt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <Label
                                  htmlFor="title"
                                  className="text-xs font-semibold"
                                >
                                  Title
                                </Label>
                                <Input
                                  id="title"
                                  type="text"
                                  value={getFormValue('title')}
                                  onChange={(e) =>
                                    setFormValue('title', e.target.value)
                                  }
                                  placeholder="Game Mode Title"
                                  className="h-10"
                                  required
                                  disabled={isReorderMode}
                                />
                              </div>

                              <div className="flex flex-col gap-1.5 min-w-0">
                                <Label
                                  htmlFor="slug"
                                  className="text-xs font-semibold"
                                >
                                  Slug
                                </Label>
                                <div className="relative flex items-center">
                                  <Input
                                    id="slug"
                                    type="text"
                                    value={getFormValue('slug')}
                                    onChange={(e) =>
                                      setFormValue('slug', e.target.value)
                                    }
                                    disabled={isReorderMode || !isSlugEditable}
                                    placeholder="game-mode-slug"
                                    className="h-10 font-mono pr-10 w-full"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIsSlugEditable(!isSlugEditable)
                                    }
                                    disabled={isReorderMode}
                                    className="absolute right-3 p-1 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={
                                      isSlugEditable
                                        ? 'Disable editing slug'
                                        : 'Enable editing slug'
                                    }
                                  >
                                    <IconPencil
                                      size={16}
                                      className={cn(
                                        isSlugEditable && 'text-primary',
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 min-w-0">
                              <Label
                                htmlFor="description"
                                className="text-xs font-semibold"
                              >
                                Description
                              </Label>
                              <Textarea
                                id="description"
                                value={getFormValue('description')}
                                onChange={(e) =>
                                  setFormValue('description', e.target.value)
                                }
                                placeholder="Provide a description of the game mode..."
                                className="min-h-24 resize-y w-full"
                                required
                                disabled={isReorderMode}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="flex flex-col gap-2 md:col-span-2 min-w-0">
                                <Label className="text-xs font-semibold">
                                  Difficulty Level
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['easy', 'medium', 'hard'] as const).map(
                                    (lvl) => {
                                      const isSelected =
                                        getFormValue('level') === lvl;

                                      return (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={() =>
                                            setFormValue('level', lvl)
                                          }
                                          disabled={isReorderMode}
                                          className={cn(
                                            'flex flex-col items-center justify-center p-3 border rounded-xl transition-all capitalize text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                            isSelected
                                              ? lvl === 'easy'
                                                ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 ring-1 ring-green-500 shadow-sm'
                                                : lvl === 'medium'
                                                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500 shadow-sm'
                                                  : 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-1 ring-red-500 shadow-sm'
                                              : 'bg-card border-border hover:bg-muted/50 text-muted-foreground',
                                          )}
                                        >
                                          {lvl}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>

                              {/* Max Attempts */}
                              <div className="flex flex-col gap-1.5 md:col-span-1 min-w-0">
                                <Label
                                  htmlFor="maxAttempts"
                                  className="text-xs font-semibold"
                                >
                                  Max Attempts
                                </Label>
                                <Input
                                  id="maxAttempts"
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={getFormValue('maxAttempts')}
                                  onChange={(e) =>
                                    setFormValue(
                                      'maxAttempts',
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                  className="h-10 w-full"
                                  required
                                  disabled={isReorderMode}
                                />
                              </div>
                            </div>

                            {/* Gradient Color Picker */}
                            <div className="flex flex-col gap-3 min-w-0">
                              <Label
                                htmlFor="gradient"
                                className="text-xs font-semibold"
                              >
                                Gradient
                              </Label>
                              <div
                                className="h-10 w-full rounded-xl border border-border shadow-xs relative overflow-hidden flex items-center justify-between px-3 transition-all"
                                style={{
                                  background:
                                    getFormValue('gradient') || 'transparent',
                                }}
                              >
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    background: 'var(--gradient-card-overlay)',
                                  }}
                                />
                                <span className="relative z-10 text-[11px] font-mono font-medium text-white drop-shadow-sm truncate min-w-0 flex-1 pr-2">
                                  {getFormValue('gradient')}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Start color */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  <Label className="text-xs text-muted-foreground font-medium">
                                    Start Color
                                  </Label>
                                  <div className="flex items-center gap-2 min-w-0 w-full">
                                    <div className="relative size-10 rounded-lg border border-border overflow-hidden shrink-0 shadow-xs">
                                      <input
                                        type="color"
                                        value={parseColorToHex(
                                          parseGradientParts(
                                            getFormValue('gradient'),
                                          ).startColor,
                                        )}
                                        disabled={isReorderMode}
                                        onChange={(e) => {
                                          const currentGrad =
                                            getFormValue('gradient');
                                          const { endColor, angle } =
                                            parseGradientParts(currentGrad);
                                          setFormValue(
                                            'gradient',
                                            `linear-gradient(${angle}, ${e.target.value} 0%, ${endColor || e.target.value} 100%)`,
                                          );
                                        }}
                                        className="absolute -inset-2 size-14 cursor-pointer disabled:cursor-not-allowed opacity-0 z-10"
                                      />
                                      <div
                                        className="size-full"
                                        style={{
                                          backgroundColor: parseColorToHex(
                                            parseGradientParts(
                                              getFormValue('gradient'),
                                            ).startColor,
                                          ),
                                        }}
                                      />
                                    </div>
                                    <Input
                                      type="text"
                                      value={
                                        parseGradientParts(
                                          getFormValue('gradient'),
                                        ).startColor
                                      }
                                      disabled={isReorderMode}
                                      onChange={(e) => {
                                        const currentGrad =
                                          getFormValue('gradient');
                                        const { endColor, angle } =
                                          parseGradientParts(currentGrad);
                                        setFormValue(
                                          'gradient',
                                          `linear-gradient(${angle}, ${e.target.value} 0%, ${endColor || e.target.value} 100%)`,
                                        );
                                      }}
                                      className="h-10 font-mono text-xs flex-1 min-w-0 w-full"
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>

                                {/* End color */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  <Label className="text-xs text-muted-foreground font-medium">
                                    End Color
                                  </Label>
                                  <div className="flex items-center gap-2 min-w-0 w-full">
                                    <div className="relative size-10 rounded-lg border border-border overflow-hidden shrink-0 shadow-xs">
                                      <input
                                        type="color"
                                        value={parseColorToHex(
                                          parseGradientParts(
                                            getFormValue('gradient'),
                                          ).endColor,
                                        )}
                                        disabled={isReorderMode}
                                        onChange={(e) => {
                                          const currentGrad =
                                            getFormValue('gradient');
                                          const { startColor, angle } =
                                            parseGradientParts(currentGrad);
                                          setFormValue(
                                            'gradient',
                                            `linear-gradient(${angle}, ${startColor || e.target.value} 0%, ${e.target.value} 100%)`,
                                          );
                                        }}
                                        className="absolute -inset-2 size-14 cursor-pointer disabled:cursor-not-allowed opacity-0 z-10"
                                      />
                                      <div
                                        className="size-full"
                                        style={{
                                          backgroundColor: parseColorToHex(
                                            parseGradientParts(
                                              getFormValue('gradient'),
                                            ).endColor,
                                          ),
                                        }}
                                      />
                                    </div>
                                    <Input
                                      type="text"
                                      value={
                                        parseGradientParts(
                                          getFormValue('gradient'),
                                        ).endColor
                                      }
                                      disabled={isReorderMode}
                                      onChange={(e) => {
                                        const currentGrad =
                                          getFormValue('gradient');
                                        const { startColor, angle } =
                                          parseGradientParts(currentGrad);
                                        setFormValue(
                                          'gradient',
                                          `linear-gradient(${angle}, ${startColor || e.target.value} 0%, ${e.target.value} 100%)`,
                                        );
                                      }}
                                      className="h-10 font-mono text-xs flex-1 min-w-0 w-full"
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Full CSS Gradient Input */}
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <Label
                                  htmlFor="gradient"
                                  className="text-xs text-muted-foreground font-medium"
                                >
                                  CSS Gradient
                                </Label>
                                <Input
                                  id="gradient"
                                  type="text"
                                  value={getFormValue('gradient')}
                                  disabled={isReorderMode}
                                  onChange={(e) =>
                                    setFormValue('gradient', e.target.value)
                                  }
                                  className="h-10 font-mono text-xs w-full min-w-0"
                                  placeholder="linear-gradient(135deg, ...)"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 border border-border p-4 bg-muted/10 rounded-xl">
                              <div className="flex items-center space-x-3 justify-between">
                                <div className="flex flex-col space-y-1 pr-4">
                                  <Label
                                    htmlFor="isActive"
                                    className="text-sm font-semibold cursor-pointer select-none"
                                  >
                                    Active
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Show this mode in navigation lists and
                                    selection grids.
                                  </span>
                                </div>
                                <Checkbox
                                  id="isActive"
                                  checked={getFormValue('isActive')}
                                  onCheckedChange={(checked) =>
                                    setFormValue('isActive', !!checked)
                                  }
                                  className="size-5"
                                  disabled={isReorderMode}
                                />
                              </div>

                              <div className="h-px bg-border w-full" />

                              <div className="flex items-center space-x-3 justify-between">
                                <div className="flex flex-col space-y-1 pr-4">
                                  <Label
                                    htmlFor="isCoverArt"
                                    className="text-sm font-semibold cursor-pointer select-none"
                                  >
                                    Cover Art
                                  </Label>
                                  <span className="text-xs text-muted-foreground">
                                    Toggle cover art features, layouts and
                                    gameplay rules for this mode.
                                  </span>
                                </div>
                                <Checkbox
                                  id="isCoverArt"
                                  checked={getFormValue('isCoverArt')}
                                  onCheckedChange={(checked) =>
                                    setFormValue('isCoverArt', !!checked)
                                  }
                                  className="size-5"
                                  disabled={isReorderMode}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </div>

                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              type="submit"
                              disabled={
                                isReorderMode
                                  ? !isOrderChanged ||
                                    orderMutation.isPending ||
                                    isOrderConflict
                                  : !isEdited(currentSlug) ||
                                    isSlugEditable ||
                                    mutation.isPending
                              }
                              className="flex-1 h-11 flex items-center justify-center gap-2 cursor-pointer transition-all"
                            >
                              {isReorderMode ? (
                                orderMutation.isPending ? (
                                  <>
                                    <IconLoader
                                      className="animate-spin"
                                      size={16}
                                    />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <IconCheck size={16} />
                                    Save
                                  </>
                                )
                              ) : mutation.isPending ? (
                                <>
                                  <IconLoader
                                    className="animate-spin"
                                    size={16}
                                  />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <IconCheck size={16} />
                                  Save
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              disabled={
                                isReorderMode
                                  ? (!isOrderChanged && !isOrderConflict) ||
                                    orderMutation.isPending
                                  : !isEdited(currentSlug) || mutation.isPending
                              }
                              onClick={() => {
                                if (isReorderMode) {
                                  setOrderedIds(null);
                                  setIsOrderConflict(false);
                                  toast.dismiss(reorderModeUpdateToastId);
                                  toast.dismiss(formModeReorderToastId);
                                  return;
                                }

                                if (!currentSlug) {
                                  return;
                                }

                                setFormEdits((prev) => {
                                  const next = { ...prev };
                                  delete next[currentSlug];
                                  return next;
                                });
                              }}
                              className="h-11 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <IconArrowBackUp size={16} />
                              Discard
                            </Button>
                          </div>
                        </CardContent>
                      </form>
                    </Card>

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={handleSwitchMode}
                        className="cursor-pointer w-full sm:w-auto font-medium h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white transition-all rounded-xl"
                      >
                        {isReorderMode
                          ? 'Switch to form mode'
                          : 'Switch to reorder mode'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-48 border border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center text-muted-foreground">
                    Select a game mode from the list to configure
                  </div>
                )}
              </div>
            </div>
          </div>
        </EditModesShell>
      </ViewTransition>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to the game mode order. Do you want to
              proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSwitch}
              className="cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Switch without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
