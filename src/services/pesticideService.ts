import { Config, NetworkBudget, BackendNotConfiguredError } from './config';
import { PesticideDatabaseService, PesticideRecord } from './pesticideDatabaseService';
import { ImageOptimizer } from './imageOptimizer';
import { ApiError, HttpClient, UploadHandle } from './httpClient';

export interface PesticideScanRequest {
  imageUris: string[];
  language: string;
  crop?: string;
  apiUrl?: string;
  onUploadProgress?: (fraction: number) => void;
  registerHandle?: (handle: UploadHandle) => void;
}

export interface CropCompatibilityInfo {
  is_suitable: boolean;
  note: string;
}

export interface PesticideScanResult {
  scan_type: 'pesticide';
  identified: boolean;
  confidence: number;
  unidentified_reason?: string | null;
  product_name: string | null;
  active_ingredient: string | null;
  formulation: string | null;
  category: string | null;
  manufacturer: string | null;
  cibrc_registered: boolean;
  is_banned: boolean;
  what_it_is: string;
  general_use: string;
  why_farmers_use_it: string;
  target_pests: string[];
  suitable_crops: string[];
  safety_guidance: string[];
  dosage_notice: string;
  crop_compatibility?: CropCompatibilityInfo | null;
  user_message: string;
  guidance: string[];
  localRecord?: PesticideRecord | null;
  /** Where each field came from, so the UI never implies verified data it does not have. */
  data_source?: 'ai_label_reading' | 'ai_plus_local_database' | 'local_database';
}

export type PesticideErrorCase =
  | 'NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'EMPTY_RESPONSE'
  | 'SERVER_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE'
  | 'NO_IMAGES';

export class PesticideScanError extends Error {
  caseType: PesticideErrorCase;
  httpStatus?: number;
  retryable: boolean;

  constructor(caseType: PesticideErrorCase, message: string, httpStatus?: number, retryable = true) {
    super(message);
    this.name = 'PesticideScanError';
    this.caseType = caseType;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
  }
}

function toPesticideError(err: any): PesticideScanError {
  if (err instanceof PesticideScanError) return err;
  if (err instanceof BackendNotConfiguredError) {
    return new PesticideScanError('NOT_CONFIGURED', err.message, undefined, false);
  }
  if (err instanceof ApiError) {
    return new PesticideScanError(err.kind, err.message, err.httpStatus, err.retryable);
  }
  return new PesticideScanError('NETWORK_ERROR', err?.message || 'Label scan failed.');
}

/**
 * Label photographs are OCR targets, so they keep more resolution and a higher
 * JPEG quality than leaf photos: small printed text is destroyed by aggressive
 * compression. The image count is capped at 3 (front / back / dosage panel) to
 * bound the server-side Base64 payload.
 */
const PESTICIDE_MAX_IMAGES = 3;
const PESTICIDE_MAX_DIMENSION = 1600;
const PESTICIDE_JPEG_QUALITY = 0.85;

export const PesticideService = {
  /** Offline directory lookup. Returns only what the bundled CIBRC data contains. */
  lookupOffline(query: string, crop?: string): PesticideScanResult | null {
    const record = PesticideDatabaseService.findBestMatch(query);
    if (!record) return null;

    const compat = crop ? PesticideDatabaseService.checkCropCompatibility(record, crop) : null;

    return {
      scan_type: 'pesticide',
      identified: true,
      confidence: 0,
      unidentified_reason: null,
      product_name: record.canonical_name,
      active_ingredient: record.active_ingredient,
      formulation: `${record.formulation} (${record.formulation_desc})`,
      category: record.category,
      manufacturer: null,
      cibrc_registered: !record.is_banned,
      is_banned: record.is_banned,
      what_it_is: record.farmer_explanation,
      general_use: '',
      why_farmers_use_it: record.why_farmers_use_it,
      target_pests: record.target_pests,
      suitable_crops: record.suitable_crops,
      safety_guidance: record.safety_precautions,
      dosage_notice: record.dosage_guidance,
      crop_compatibility: compat ? { is_suitable: compat.isCompatible, note: compat.message } : null,
      user_message: '',
      guidance: [],
      localRecord: record,
      data_source: 'local_database',
    };
  },

  /**
   * Scans a pesticide label using the online vision pipeline.
   * Uses the dedicated pesticide webhook path so the request is routed to the
   * label-reading branch of the workflow rather than the crop-disease branch.
   */
  async scanPesticideLabel(params: PesticideScanRequest): Promise<PesticideScanResult> {
    if (!params.imageUris || params.imageUris.length === 0) {
      throw new PesticideScanError('NO_IMAGES', 'Please take a photo of the pesticide label first.', undefined, false);
    }

    let targetUrl: string;
    try {
      targetUrl = params.apiUrl || Config.getEndpointUrl('pesticide');
    } catch (e) {
      throw toPesticideError(e);
    }

    const optimized = await ImageOptimizer.optimizeBatchDetailed(
      params.imageUris.slice(0, PESTICIDE_MAX_IMAGES),
      PESTICIDE_MAX_DIMENSION,
      PESTICIDE_JPEG_QUALITY
    );

    if (optimized.length === 0) {
      throw new PesticideScanError(
        'NO_IMAGES',
        'The label photo could not be prepared for upload. Please retake it.',
        undefined,
        false
      );
    }

    const formData = new FormData();
    formData.append('scan_type', 'pesticide');
    formData.append('language', params.language || 'en');
    formData.append('imageCount', String(optimized.length));
    if (params.crop && params.crop.trim()) {
      formData.append('crop', params.crop.trim());
    }

    optimized.forEach((img, i) => {
      const filename = img.uri.split('/').pop() || `pesticide_label_${i + 1}.jpg`;
      formData.append('images', { uri: img.uri, name: filename, type: 'image/jpeg' } as any);
    });

    if (__DEV__) {
      console.log('[PESTICIDE_SCAN] url=%s images=%d crop=%s', targetUrl, optimized.length, params.crop || 'none');
    }

    let raw: any;
    try {
      raw = await HttpClient.upload({
        url: targetUrl,
        formData,
        timeoutMs: NetworkBudget.pesticideTimeoutMs,
        dedupeKey: ['pesticide', params.language, params.crop || '', params.imageUris.join('|')].join('::'),
        onUploadProgress: params.onUploadProgress,
        registerHandle: params.registerHandle,
        label: 'pesticide',
      });
    } catch (e) {
      throw toPesticideError(e);
    }

    return PesticideService.normalizeScanResponse(raw, params.crop);
  },

  normalizeScanResponse(raw: any, crop?: string): PesticideScanResult {
    if (!raw || typeof raw !== 'object') {
      throw new PesticideScanError('INVALID_RESPONSE', 'The scanner returned an unreadable result.');
    }

    // A server-reported failure is surfaced rather than rendered as an empty card.
    if (raw.success === false) {
      throw new PesticideScanError(
        'SERVER_ERROR',
        raw.message || raw.errorMessage || 'The label could not be analysed.',
        undefined,
        raw.errorCode !== 'INVALID_FILE_TYPE'
      );
    }

    const res = raw.result || raw;
    if (!res || typeof res !== 'object' || res.identified === undefined) {
      throw new PesticideScanError('INVALID_RESPONSE', 'The scanner result was incomplete. Please try again.');
    }

    const identified = Boolean(res.identified);

    // Cross-reference the bundled CIBRC database for verified metadata.
    let localRec: PesticideRecord | null = null;
    if (identified && (res.product_name || res.active_ingredient)) {
      localRec = PesticideDatabaseService.findBestMatch(
        `${res.product_name || ''} ${res.active_ingredient || ''}`.trim()
      );
    }

    const compat = localRec && crop ? PesticideDatabaseService.checkCropCompatibility(localRec, crop) : null;
    const asArray = (v: any): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : [];

    const aiSafety = asArray(res.safety_guidance);
    const localSafety = localRec ? localRec.safety_precautions : [];

    return {
      scan_type: 'pesticide',
      identified,
      confidence: typeof res.confidence === 'number' ? Math.max(0, Math.min(1, res.confidence)) : 0,
      unidentified_reason: res.unidentified_reason || null,
      product_name: res.product_name || (localRec ? localRec.canonical_name : null),
      active_ingredient: res.active_ingredient || (localRec ? localRec.active_ingredient : null),
      formulation: res.formulation || (localRec ? `${localRec.formulation} (${localRec.formulation_desc})` : null),
      category: res.category || (localRec ? localRec.category : null),
      manufacturer: res.manufacturer || null,
      cibrc_registered: Boolean(res.cibrc_registered || (localRec && !localRec.is_banned)),
      is_banned: Boolean(res.is_banned || (localRec && localRec.is_banned)),
      what_it_is: res.what_it_is || (localRec ? localRec.farmer_explanation : ''),
      general_use: res.general_use || '',
      why_farmers_use_it: res.why_farmers_use_it || (localRec ? localRec.why_farmers_use_it : ''),
      target_pests: asArray(res.target_pests).length ? asArray(res.target_pests) : localRec ? localRec.target_pests : [],
      suitable_crops: asArray(res.suitable_crops).length
        ? asArray(res.suitable_crops)
        : localRec
        ? localRec.suitable_crops
        : [],
      // Safety text is never invented here: it comes from the AI reading of the
      // printed label or from the bundled CIBRC record. When neither is
      // available the farmer is pointed at the physical label instead.
      safety_guidance: aiSafety.length
        ? aiSafety
        : localSafety.length
        ? localSafety
        : ['Read and follow the safety instructions printed on the product label before use.'],
      dosage_notice:
        res.dosage_notice ||
        (localRec ? localRec.dosage_guidance : '') ||
        'Always follow the dosage printed on the package label, or consult your local agriculture officer.',
      crop_compatibility:
        res.crop_compatibility || (compat ? { is_suitable: compat.isCompatible, note: compat.message } : null),
      user_message: res.user_message || '',
      guidance: asArray(res.guidance).length
        ? asArray(res.guidance)
        : [
            'Take a clearer picture of the front or back label',
            'Ensure the active ingredient section is visible',
            'Avoid glare, reflections, or strong shadows',
            'Hold the camera steady in good lighting',
          ],
      localRecord: localRec,
      data_source: localRec ? 'ai_plus_local_database' : 'ai_label_reading',
    };
  },
};
