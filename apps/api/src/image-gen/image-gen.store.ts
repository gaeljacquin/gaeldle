import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export type ImageGenProgressEvent = {
  type: 'progress';
  data: {
    processed: number;
    succeeded: number;
    failed: number;
    total: number;
    latestGame: string;
  };
};

export type ImageGenCompletedEvent = {
  type: 'completed';
  data: {
    succeeded: number;
    failed: number;
    failures: Array<{ igdbId: number; gameName: string; error: string }>;
  };
};

export type ImageGenErrorEvent = {
  type: 'error';
  data: { message: string };
};

export type ImageGenEvent =
  ImageGenProgressEvent | ImageGenCompletedEvent | ImageGenErrorEvent;

@Injectable()
export class ImageGenStore {
  private readonly emitters = new Map<string, EventEmitter>();
  private readonly progress = new Map<
    string,
    {
      processed: number;
      succeeded: number;
      failed: number;
      failures: Array<{ igdbId: number; gameName: string; error: string }>;
    }
  >();

  getOrCreate(imageGenId: string): EventEmitter {
    const existing = this.emitters.get(imageGenId);

    if (existing) {
      return existing;
    }

    const emitter = new EventEmitter();
    emitter.setMaxListeners(20);
    this.emitters.set(imageGenId, emitter);

    return emitter;
  }

  emit(imageGenId: string, event: ImageGenEvent): void {
    const emitter = this.emitters.get(imageGenId);

    if (emitter) {
      emitter.emit('event', event);
    }
  }

  subscribe(
    imageGenId: string,
    listener: (event: ImageGenEvent) => void,
  ): () => void {
    const emitter = this.getOrCreate(imageGenId);
    emitter.on('event', listener);

    return () => {
      emitter.off('event', listener);

      if (emitter.listenerCount('event') === 0) {
        this.emitters.delete(imageGenId);
      }
    };
  }

  setProgress(
    imageGenId: string,
    data: {
      processed: number;
      succeeded: number;
      failed: number;
      failures: Array<{ igdbId: number; gameName: string; error: string }>;
    },
  ): void {
    this.progress.set(imageGenId, data);
  }

  getProgress(imageGenId: string) {
    return this.progress.get(imageGenId);
  }

  destroy(imageGenId: string): void {
    const emitter = this.emitters.get(imageGenId);

    if (emitter) {
      emitter.removeAllListeners();
      this.emitters.delete(imageGenId);
    }

    this.progress.delete(imageGenId);
  }
}
