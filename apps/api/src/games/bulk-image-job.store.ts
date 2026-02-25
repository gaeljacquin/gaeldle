import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export type BulkJobProgressEvent = {
  type: 'progress';
  data: {
    processed: number;
    succeeded: number;
    failed: number;
    total: number;
    latestGame: string;
  };
};

export type BulkJobCompletedEvent = {
  type: 'completed';
  data: {
    succeeded: number;
    failed: number;
    failures: Array<{ igdbId: number; gameName: string; error: string }>;
  };
};

export type BulkJobErrorEvent = {
  type: 'error';
  data: { message: string };
};

export type BulkJobEvent =
  | BulkJobProgressEvent
  | BulkJobCompletedEvent
  | BulkJobErrorEvent;

@Injectable()
export class BulkImageJobStore {
  private readonly emitters = new Map<string, EventEmitter>();

  getOrCreate(jobId: string): EventEmitter {
    const existing = this.emitters.get(jobId);
    if (existing) return existing;

    const emitter = new EventEmitter();
    emitter.setMaxListeners(20);
    this.emitters.set(jobId, emitter);
    return emitter;
  }

  emit(jobId: string, event: BulkJobEvent): void {
    const emitter = this.emitters.get(jobId);
    if (emitter) {
      emitter.emit('event', event);
    }
  }

  subscribe(
    jobId: string,
    listener: (event: BulkJobEvent) => void,
  ): () => void {
    const emitter = this.getOrCreate(jobId);
    emitter.on('event', listener);
    return () => {
      emitter.off('event', listener);
      if (emitter.listenerCount('event') === 0) {
        this.emitters.delete(jobId);
      }
    };
  }

  destroy(jobId: string): void {
    const emitter = this.emitters.get(jobId);
    if (emitter) {
      emitter.removeAllListeners();
      this.emitters.delete(jobId);
    }
  }
}
