import { convertObjFileToDae } from './convertObjToDae';
import { ConversionCancelledError } from './objParser';
import type { ConversionOptions, ConversionProgress, ConversionResult } from './types';

export type WorkerRequestMessage =
  | {
      type: 'CONVERT';
      file: File;
      options: ConversionOptions;
    }
  | {
      type: 'CANCEL';
    };

export type WorkerResponseMessage =
  | {
      type: 'PROGRESS';
      progress: ConversionProgress;
    }
  | {
      type: 'RESULT';
      result: ConversionResult;
    }
  | {
      type: 'CANCELLED';
    }
  | {
      type: 'ERROR';
      message: string;
    };

let cancelled = false;

self.onmessage = async (event: MessageEvent<WorkerRequestMessage>) => {
  const msg = event.data;
  if (msg.type === 'CANCEL') {
    cancelled = true;
    return;
  }

  if (msg.type === 'CONVERT') {
    cancelled = false;
    try {
      const result = await convertObjFileToDae(
        msg.file,
        msg.file.name,
        msg.options,
        (progress) => {
          const response: WorkerResponseMessage = { type: 'PROGRESS', progress };
          self.postMessage(response);
        },
        () => cancelled
      );
      const response: WorkerResponseMessage = { type: 'RESULT', result };
      self.postMessage(response);
    } catch (err) {
      if (err instanceof ConversionCancelledError || (err instanceof Error && err.message === 'Conversion cancelled.')) {
        const response: WorkerResponseMessage = { type: 'CANCELLED' };
        self.postMessage(response);
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred during OBJ to COLLADA conversion.';
        const response: WorkerResponseMessage = { type: 'ERROR', message };
        self.postMessage(response);
      }
    }
  }
};

