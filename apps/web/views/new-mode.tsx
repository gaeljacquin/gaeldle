'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewTransition } from 'react';
import {
  IconCirclePlus,
  IconLoader,
  IconCheck,
  IconArrowBackUp,
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
import { cn } from '@workspace/ui/lib/utils';
import { createGameMode } from '@/lib/services/game-mode.service';

type FormValues = {
  slug: string;
  title: string;
  description: string;
  level: 'easy' | 'medium' | 'hard';
  maxAttempts: number;
  isCoverArt: boolean;
};

const defaultFormValues: FormValues = {
  slug: '',
  title: '',
  description: '',
  level: 'easy',
  maxAttempts: 3,
  isCoverArt: false,
};

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

export default function NewModeView() {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues);
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  const mutation = useMutation({
    mutationFn: createGameMode,
    onSuccess: () => {
      toast.success('Game mode created successfully');
      setFormValues(defaultFormValues);
      setUserEditedSlug(false);
      queryClient.invalidateQueries({ queryKey: ['allGameModes'] });
      queryClient.invalidateQueries({ queryKey: ['gameModes'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create game mode');
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormValues((prev) => ({
      ...prev,
      title: val,
      slug: userEditedSlug ? prev.slug : slugify(val),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserEditedSlug(true);
    setFormValues((prev) => ({
      ...prev,
      slug: e.target.value,
    }));
  };

  const setFormValue = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.title.trim() || !formValues.slug.trim()) {
      toast.error('Title and Slug are required');
      return;
    }
    mutation.mutate(formValues);
  };

  const isFormDirty = () => {
    return (
      formValues.title !== defaultFormValues.title ||
      formValues.slug !== defaultFormValues.slug ||
      formValues.description !== defaultFormValues.description ||
      formValues.level !== defaultFormValues.level ||
      formValues.maxAttempts !== defaultFormValues.maxAttempts ||
      formValues.isCoverArt !== defaultFormValues.isCoverArt
    );
  };

  const handleDiscard = () => {
    setFormValues(defaultFormValues);
    setUserEditedSlug(false);
  };

  return (
    <ViewTransition>
      <div className="flex flex-col min-h-full bg-background">
        <DashboardHeader
          title="New Mode"
          icon={IconCirclePlus}
          dashboardBacklinkProps={{
            text: 'Utilities',
            href: '/dashboard/utilities',
          }}
        />

        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="shadow-lg border-border bg-card">
              <form onSubmit={handleSubmit}>
                <CardHeader className="mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {formValues.title || '<insert title>'}
                  </CardTitle>
                  <CardDescription className="text-sm italic">
                    NB: New modes are inactive by default.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold">
                        Title
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        value={formValues.title}
                        onChange={handleTitleChange}
                        placeholder="Title"
                        className="h-10"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="slug" className="text-xs font-semibold">
                        Slug
                      </Label>
                      <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center bg-muted/60 text-muted-foreground border border-input font-mono text-sm select-none">
                          /
                        </div>
                        <Input
                          id="slug"
                          type="text"
                          value={formValues.slug}
                          onChange={handleSlugChange}
                          placeholder="slug"
                          className="h-10 font-mono pl-13 w-full"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="description"
                      className="text-xs font-semibold"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formValues.description}
                      onChange={(e) =>
                        setFormValue('description', e.target.value)
                      }
                      placeholder="Lorem ipsum..."
                      className="min-h-24 resize-y"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label className="text-xs font-semibold">
                        Difficulty Level
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as const).map((lvl) => {
                          const isSelected = formValues.level === lvl;

                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setFormValue('level', lvl)}
                              className={cn(
                                'flex flex-col items-center justify-center p-3 border rounded-xl transition-all capitalize text-xs font-semibold cursor-pointer',
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
                        })}
                      </div>
                    </div>

                    {/* Max Attempts */}
                    <div className="flex flex-col gap-1.5 md:col-span-1">
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
                        value={formValues.maxAttempts}
                        onChange={(e) =>
                          setFormValue(
                            'maxAttempts',
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="h-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border border-border p-4 bg-muted/10 rounded-xl">
                    <div className="flex items-center space-x-3 justify-between">
                      <div className="flex flex-col space-y-1 pr-4">
                        <Label
                          htmlFor="isCoverArt"
                          className="text-sm font-semibold cursor-pointer select-none"
                        >
                          Cover Art
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          Toggle cover art features, layouts and gameplay rules
                          for this mode.
                        </span>
                      </div>
                      <Checkbox
                        id="isCoverArt"
                        checked={formValues.isCoverArt}
                        onCheckedChange={(checked) =>
                          setFormValue('isCoverArt', !!checked)
                        }
                        className="size-5"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex-1 h-11 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {mutation.isPending ? (
                        <>
                          <IconLoader className="animate-spin" size={16} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <IconCheck size={16} />
                          Create
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isFormDirty() || mutation.isPending}
                      onClick={handleDiscard}
                      className="h-11 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <IconArrowBackUp size={16} />
                      Discard
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
