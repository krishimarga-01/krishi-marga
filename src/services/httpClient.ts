import { NetworkBudget } from './config';

/**
 * KRISHI MARGA — SHARED UPLOAD CLIENT
 * ------------------------------------------------------------------
 * A single place where every image upload to the n8n backend is performed, so
 * that timeout handling, cancellation, duplicate suppression and bounded retry
 * behave identically for the disease scanner and the pesticide scanner.
 *
 * Design rules:
 *  - Every request has a hard timeout. Nothing can hang forever.
 *  - A request can always be aborted (e.g. the user leaves the screen).
 *  - Identical requests fired within a short window share one in-flight call
 *    instead of uploading the same photos twice.
 *  - Retries happen ONLY for transient transport failures, at most
 *    NetworkBudget.maxTransientRetries times. There is no unbounded retry loop.
 *  - Genuine server errors (4xx/5xx and server-reported failures) are surfaced,
 *    never swallowed or disguised as network problems.
 */

export type ApiErrorKind =
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'EMPTY_RESPONSE'
  | 'SERVER_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE';

export class ApiError extends Error {
  kind: ApiErrorKind;
  httpStatus?: number;
  /** True when retrying the same request could plausibly succeed. */
  retryable: boolean;

  constructor(kind: ApiErrorKind, message: string, httpStatus?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.httpStatus = httpStatus;
    this.retryable =
      kind === 'NETWORK_ERROR' ||
      kind === 'TIMEOUT' ||
      kind === 'EMPTY_RESPONSE' ||
      (kind === 'SERVER_ERROR' && (httpStatus === undefined || httpStatus >= 500));
  }
}

/** Handle returned to callers so an in-flight upload can be cancelled. */
export interface UploadHandle {
  cancel(): void;
}

export interface UploadOptions {
  url: string;
  formData: FormData;
  timeoutMs: number;
  /** Stable signature used for duplicate suppression. */
  dedupeKey?: string;
  /** Receives 0..1 upload progress; used only for UI feedback. */
  onUploadProgress?: (fraction: number) => void;
  /** Registers the cancel handle before the request starts. */
  registerHandle?: (handle: UploadHandle) => void;
  /** Overrides the default transient-retry count (never unbounded). */
  maxRetries?: number;
  label?: string;
}

interface InFlightEntry {
  promise: Promise<any>;
  startedAt: number;
}

const inFlight = new Map<string, InFlightEntry>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function performSingleAttempt(options: UploadOptions): Promise<any> {
  const { url, formData, timeoutMs, onUploadProgress, registerHandle, label } = options;

  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let aborted = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    if (registerHandle) {
      registerHandle({
        cancel: () => {
          aborted = true;
          try {
            xhr.abort();
          } catch {
            // aborting an already-finished request is harmless
          }
        },
      });
    }

    xhr.open('POST', url);
    xhr.timeout = timeoutMs;

    if (xhr.upload && onUploadProgress) {
      xhr.upload.onprogress = (event: any) => {
        if (event && event.lengthComputable && event.total > 0) {
          onUploadProgress(Math.min(1, event.loaded / event.total));
        }
      };
    }

    xhr.onload = () => {
      const responseText = xhr.responseText || '';

      if (__DEV__) {
        console.log(
          `[HTTP:${label || 'upload'}] status=${xhr.status} length=${responseText.length}`
        );
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (!responseText.trim()) {
          finish(() =>
            reject(
              new ApiError(
                'EMPTY_RESPONSE',
                'The server accepted the request but returned no result.',
                xhr.status
              )
            )
          );
          return;
        }
        try {
          const json = JSON.parse(responseText);
          finish(() => resolve(json));
        } catch {
          finish(() =>
            reject(
              new ApiError(
                'INVALID_JSON',
                'The server response could not be read. Please try again.',
                xhr.status
              )
            )
          );
        }
        return;
      }

      // Genuine server-side failure — reported as-is, not masked as a network error.
      finish(() =>
        reject(
          new ApiError(
            'SERVER_ERROR',
            `The diagnosis server reported an error (HTTP ${xhr.status}).`,
            xhr.status
          )
        )
      );
    };

    xhr.onerror = () => {
      finish(() =>
        reject(
          aborted
            ? new ApiError('ABORTED', 'The request was cancelled.')
            : new ApiError(
                'NETWORK_ERROR',
                'Could not reach the diagnosis server. Please check your internet connection.'
              )
        )
      );
    };

    xhr.onabort = () => {
      finish(() => reject(new ApiError('ABORTED', 'The request was cancelled.')));
    };

    xhr.ontimeout = () => {
      finish(() =>
        reject(
          new ApiError(
            'TIMEOUT',
            'The server took too long to respond. Please try again in a moment.'
          )
        )
      );
    };

    try {
      xhr.send(formData);
    } catch (e: any) {
      finish(() =>
        reject(new ApiError('NETWORK_ERROR', e?.message || 'The upload could not be started.'))
      );
    }
  });
}

export const HttpClient = {
  /**
   * Uploads multipart form data with timeout, cancellation, duplicate
   * suppression and a strictly bounded transient retry.
   */
  async upload(options: UploadOptions): Promise<any> {
    const key = options.dedupeKey;

    if (key) {
      const existing = inFlight.get(key);
      if (existing && Date.now() - existing.startedAt < NetworkBudget.duplicateWindowMs + options.timeoutMs) {
        if (__DEV__) {
          console.log(`[HTTP:${options.label || 'upload'}] duplicate suppressed, reusing in-flight request`);
        }
        return existing.promise;
      }
    }

    const maxRetries = Math.max(
      0,
      options.maxRetries ?? NetworkBudget.maxTransientRetries
    );

    const run = (async () => {
      let lastError: ApiError | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await performSingleAttempt(options);
        } catch (err: any) {
          const apiErr =
            err instanceof ApiError
              ? err
              : new ApiError('NETWORK_ERROR', err?.message || 'Upload failed.');
          lastError = apiErr;

          // Never retry a cancellation, a genuine 4xx, or a malformed response.
          const isTransient = apiErr.kind === 'NETWORK_ERROR';
          if (!isTransient || attempt === maxRetries) {
            throw apiErr;
          }

          if (__DEV__) {
            console.log(
              `[HTTP:${options.label || 'upload'}] transient failure, retry ${attempt + 1}/${maxRetries}`
            );
          }
          await sleep(NetworkBudget.retryBackoffMs);
        }
      }

      throw lastError || new ApiError('NETWORK_ERROR', 'Upload failed.');
    })();

    if (key) {
      inFlight.set(key, { promise: run, startedAt: Date.now() });
      run.catch(() => undefined).then(() => {
        const current = inFlight.get(key);
        if (current && current.promise === run) inFlight.delete(key);
      });
    }

    return run;
  },

  /** Clears duplicate-suppression state (used on screen teardown). */
  clearInFlight(key?: string): void {
    if (key) inFlight.delete(key);
    else inFlight.clear();
  },
};
