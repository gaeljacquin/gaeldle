'use client';

import { useEffect, useRef } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSingleImageGenStatus } from '@/lib/services/game.service';
import {
  imageGenerationToastId,
  useImageGenerationJobsStore,
} from '@/lib/stores/image-generation-jobs-store';

export function useImageGenerationNotifications() {
  const jobs = useImageGenerationJobsStore((state) => state.jobs);
  const removeJob = useImageGenerationJobsStore((state) => state.removeJob);
  const queryClient = useQueryClient();
  const handledJobIds = useRef(new Set<string>());

  const results = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ['single-image-generation', job.jobId],
      queryFn: () => getSingleImageGenStatus(job.jobId),
      refetchInterval: 2000,
    })),
  });

  useEffect(() => {
    for (const [index, job] of jobs.entries()) {
      const status = results[index]?.data;

      if (
        !status ||
        handledJobIds.current.has(job.jobId) ||
        (status.status !== 'completed' && status.status !== 'failed')
      ) {
        continue;
      }

      handledJobIds.current.add(job.jobId);
      removeJob(job.jobId);

      if (status.status === 'completed') {
        toast.success(`Image generated successfully for ${job.gameName}!`, {
          id: imageGenerationToastId(job.jobId),
          duration: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ['game'] });
        queryClient.invalidateQueries({ queryKey: ['games'] });
      } else {
        toast.error(
          status.error ?? `Image generation failed for ${job.gameName}.`,
          { id: imageGenerationToastId(job.jobId), duration: 5000 },
        );
      }
    }
  }, [jobs, queryClient, removeJob, results]);

  useEffect(() => {
    const activeJobIds = new Set(jobs.map((job) => job.jobId));

    for (const jobId of handledJobIds.current) {
      if (!activeJobIds.has(jobId)) {
        handledJobIds.current.delete(jobId);
      }
    }
  }, [jobs]);
}
