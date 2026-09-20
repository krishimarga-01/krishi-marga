import { NormalizedResult, ConfidenceLevel, HealthStatus } from '../models/index';
import { Config, NetworkBudget, BackendNotConfiguredError } from './config';
import { ImageOptimizer, UploadBudget } from './imageOptimizer';
import { ApiError, HttpClient, UploadHandle } from './httpClient';

/**
 * Backwards-compatible export. Resolved lazily so that an unconfigured build
 * does not crash at module-import time (the old eager call did).
 */
export function getDefaultWebhookUrl(): string {
  return Config.describeBackend();
}

export interface DiagnosisRequestParams {
  crop: string;
  imageUris: string[];
  language: string;
  symptoms?: string;
  latitude?: number;
  longitude?: number;
  apiUrl?: string;
  /** Receives 0..1 upload progress for the loading UI. */
  onUploadProgress?: (fraction: number) => void;
  /** Receives a cancel handle so the caller can abort on unmount. */
  registerHandle?: (handle: UploadHandle) => void;
}

export type DiagnosisErrorCase =
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'EMPTY_RESPONSE'
  | 'SERVER_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE'
  | 'NO_IMAGES';

export class DiagnosisApiError extends Error {
  caseType: DiagnosisErrorCase;
  httpStatus?: number;
  retryable: boolean;

  constructor(caseType: DiagnosisErrorCase, message: string, httpStatus?: number, retryable = true) {
    super(message);
    this.name = 'DiagnosisApiError';
    this.caseType = caseType;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
  }
}

function toDiagnosisError(err: any): DiagnosisApiError {
  if (err instanceof DiagnosisApiError) return err;
  if (err instanceof BackendNotConfiguredError) {
    return new DiagnosisApiError('NOT_CONFIGURED', err.message, undefined, false);
  }
  if (err instanceof ApiError) {
    return new DiagnosisApiError(err.kind, err.message, err.httpStatus, err.retryable);
  }
  return new DiagnosisApiError('NETWORK_ERROR', err?.message || 'Diagnosis request failed.');
}

/** Stable signature used to suppress accidental duplicate submissions. */
function buildDedupeKey(params: DiagnosisRequestParams): string {
  return [
    'disease',
    params.crop,
    params.language,
    params.imageUris.length,
    params.imageUris.join('|'),
    (params.symptoms || '').trim(),
  ].join('::');
}

export const DiagnosisApi = {
  async detectDiseaseOnline(params: DiagnosisRequestParams): Promise<NormalizedResult> {
    if (!params.imageUris || params.imageUris.length === 0) {
      throw new DiagnosisApiError('NO_IMAGES', 'Please add at least one photo before analysing.', undefined, false);
    }

    let targetUrl: string;
    try {
      targetUrl = params.apiUrl || Config.getEndpointUrl('diagnosis');
    } catch (e) {
      throw toDiagnosisError(e);
    }

    // Client-side optimization: sequential resize/compress, batch-size aware, so
    // large multi-image requests cannot overwhelm the device or the server.
    const optimized = await ImageOptimizer.optimizeBatchDetailed(
      params.imageUris.slice(0, UploadBudget.maxImages)
    );

    const usable = optimized.filter((img) => img.optimized || img.sizeBytes > 0 || !!img.uri);
    if (usable.length === 0) {
      throw new DiagnosisApiError(
        'NO_IMAGES',
        'The selected photos could not be prepared for upload. Please retake them.',
        undefined,
        false
      );
    }

    const formData = new FormData();
    formData.append('scan_type', 'disease');
    formData.append('crop', params.crop);
    formData.append('language', params.language);
    formData.append('imageCount', String(usable.length));

    if (params.symptoms && params.symptoms.trim()) {
      formData.append('symptoms', params.symptoms.trim());
    }
    if (params.latitude !== undefined && params.longitude !== undefined) {
      formData.append('latitude', String(params.latitude));
      formData.append('longitude', String(params.longitude));
    }

    usable.forEach((img, i) => {
      const filename = img.uri.split('/').pop() || `leaf_${i + 1}.jpg`;
      formData.append('images', { uri: img.uri, name: filename, type: 'image/jpeg' } as any);
    });

    if (__DEV__) {
      console.log('[DIAGNOSIS_REQUEST] url=%s crop=%s images=%d', targetUrl, params.crop, usable.length);
    }

    let raw: any;
    try {
      raw = await HttpClient.upload({
        url: targetUrl,
        formData,
        timeoutMs: NetworkBudget.diagnosisTimeoutMs,
        dedupeKey: buildDedupeKey(params),
        onUploadProgress: params.onUploadProgress,
        registerHandle: params.registerHandle,
        label: 'diagnosis',
      });
    } catch (e) {
      throw toDiagnosisError(e);
    }

    return DiagnosisApi.parseAndNormalize(raw, params.crop);
  },

  /**
   * Validates the server envelope before normalizing. A structurally wrong or
   * server-rejected response fails in a controlled way instead of producing a
   * confident-looking but empty diagnosis card.
   */
  parseAndNormalize(raw: any, fallbackCrop: string): NormalizedResult {
    if (!raw || typeof raw !== 'object') {
      throw new DiagnosisApiError('INVALID_RESPONSE', 'The server returned an unreadable result.');
    }

    if (raw.success === false) {
      throw new DiagnosisApiError(
        'SERVER_ERROR',
        raw.message || raw.error?.message || 'The diagnosis could not be completed.',
        undefined,
        raw.errorCode !== 'UNSUPPORTED_CROP' && raw.errorCode !== 'INVALID_CROP'
      );
    }

    const res = raw.result || raw;
    const hasAnyDiagnosisField =
      res &&
      typeof res === 'object' &&
      (res.health_status !== undefined ||
        res.disease !== undefined ||
        res.problem_type !== undefined);

    if (!hasAnyDiagnosisField) {
      throw new DiagnosisApiError('INVALID_RESPONSE', 'The server result was incomplete. Please try again.');
    }

    return DiagnosisApi.normalizeBackendResponse(raw, fallbackCrop);
  },

  normalizeBackendResponse(raw: any, fallbackCrop: string): NormalizedResult {
    const res = raw.result || raw;

    // Confidence is only trusted when the server actually supplied a number.
    // A missing confidence is treated as unknown rather than silently assumed high.
    const rawConfidence = typeof res.confidence === 'number' ? res.confidence : Number(res.confidence);
    const hasConfidence = Number.isFinite(rawConfidence);
    const confidenceScore = hasConfidence ? Math.max(0, Math.min(1, rawConfidence)) : 0;

    let level: ConfidenceLevel = 'High';
    if (!hasConfidence || confidenceScore < 0.5) level = 'Low';
    else if (confidenceScore < 0.75) level = 'Medium';

    const health: HealthStatus =
      res.health_status === 'Healthy' || res.disease?.toLowerCase?.().includes('healthy')
        ? 'Healthy'
        : res.health_status === 'Uncertain' || res.disease?.toLowerCase?.() === 'unknown' || !hasConfidence
        ? 'Uncertain'
        : 'Diseased';

    const asArray = (v: any): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : v ? [String(v)] : [];

    return {
      crop: raw.crop_selected || res.crop || fallbackCrop,
      health_status: health,
      disease:
        res.disease ||
        (health === 'Healthy' ? 'Healthy Crop' : health === 'Uncertain' ? 'Unknown' : 'Detected Problem'),
      confidence: confidenceScore,
      confidence_level: level,
      severity: res.severity || (health === 'Healthy' ? 'None' : 'Moderate'),
      problem_type:
        res.problem_type || (health === 'Healthy' ? 'HEALTHY' : health === 'Uncertain' ? 'UNKNOWN' : 'DISEASE'),
      symptoms: asArray(res.symptoms),
      recommendations: asArray(res.recommendations),
      prevention: asArray(res.prevention),
      organic_management: Array.isArray(res.organic_management) ? res.organic_management : undefined,
      regional_advice: res.regional_advice,
      user_message: res.user_message || res.farmer_message,
      analysis_source: 'online',
      is_diagnosis: true,
      timestamp: raw.timestamp || new Date().toISOString(),
      requestId: raw.requestId || res.requestId,
      latency_ms: raw.latency_ms || res.latency_ms,
    };
  },
};
