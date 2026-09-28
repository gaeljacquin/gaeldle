import { create } from 'zustand';

export type ImageGenerationJob = {
  jobId: string;
  igdbId: number;
  gameName: string;
};

type ImageGenerationJobsStore = {
  jobs: ImageGenerationJob[];
  addJob: (job: ImageGenerationJob) => void;
  removeJob: (jobId: string) => void;
};

export const imageGenerationToastId = (jobId: string) =>
  `image-generation-${jobId}`;

export const useImageGenerationJobsStore = create<ImageGenerationJobsStore>(
  (set) => ({
    jobs: [],
    addJob: (job) =>
      set((state) => ({
        jobs: [...state.jobs.filter((item) => item.jobId !== job.jobId), job],
      })),
    removeJob: (jobId) =>
      set((state) => ({
        jobs: state.jobs.filter((job) => job.jobId !== jobId),
      })),
  }),
);
