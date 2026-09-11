import { NormalizedResult, ConfidenceLevel, HealthStatus } from '../models/index';

// Configurable backend endpoint (dev default, can be overridden via config or settings)
import { Config } from './config';

export const DEFAULT_N8N_WEBHOOK_URL = Config.getBackendUrl();

export interface DiagnosisRequestParams {
  crop: string;
  imageUris: string[];
  language: string;
  symptoms?: string;
  latitude?: number;
  longitude?: number;
  apiUrl?: string;
}

export class DiagnosisApiError extends Error {
  caseType: 'NETWORK_ERROR' | 'EMPTY_RESPONSE' | 'SERVER_ERROR' | 'INVALID_JSON';
  httpStatus?: number;

  constructor(
    caseType: 'NETWORK_ERROR' | 'EMPTY_RESPONSE' | 'SERVER_ERROR' | 'INVALID_JSON',
    message: string,
    httpStatus?: number
  ) {
    super(message);
    this.name = 'DiagnosisApiError';
    this.caseType = caseType;
    this.httpStatus = httpStatus;
  }
}

export const DiagnosisApi = {
  async detectDiseaseOnline(params: DiagnosisRequestParams): Promise<NormalizedResult> {
    const targetUrl = params.apiUrl || Config.getBackendUrl();
    const formData = new FormData();

    formData.append('crop', params.crop);
    formData.append('language', params.language);
    formData.append('imageCount', String(params.imageUris.length));

    if (params.symptoms && params.symptoms.trim()) {
      formData.append('symptoms', params.symptoms.trim());
    }
    if (params.latitude !== undefined && params.longitude !== undefined) {
      formData.append('latitude', String(params.latitude));
      formData.append('longitude', String(params.longitude));
    }

    for (let i = 0; i < params.imageUris.length; i++) {
      const uri = params.imageUris[i];
      const filename = uri.split('/').pop() || `leaf_${i + 1}.jpg`;
      formData.append('images', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    }

    if (__DEV__) {
      console.log('[DIAGNOSIS_REQUEST] UPLOAD TRANSPORT: XMLHttpRequest');
      console.log('[DIAGNOSIS_REQUEST] Target URL:', targetUrl);
      console.log('[DIAGNOSIS_REQUEST] Crop:', params.crop);
      console.log('[DIAGNOSIS_REQUEST] Language:', params.language);
      console.log('[DIAGNOSIS_REQUEST] Number of images:', params.imageUris.length);
      for (let i = 0; i < params.imageUris.length; i++) {
        const uri = params.imageUris[i];
        const filename = uri.split('/').pop() || `leaf_${i + 1}.jpg`;
        const scheme = uri.includes('://') ? uri.split('://')[0] + '://' : 'unknown';
        console.log(`[DIAGNOSIS_REQUEST] Image [${i}]: scheme=${scheme}, filename=${filename}, mimeType=image/jpeg`);
      }
    }

    const raw = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', targetUrl);
      xhr.timeout = 60000; // 60s timeout for multi-image Gemini diagnosis

      xhr.onload = () => {
        const contentType = xhr.getResponseHeader('content-type') || '';
        const responseText = xhr.responseText || '';
        const responseLength = responseText.length;

        if (__DEV__) {
          console.log('[DIAGNOSIS_RESPONSE] HTTP Status:', xhr.status, xhr.statusText);
          console.log('[DIAGNOSIS_RESPONSE] Content-Type:', contentType);
          console.log('[DIAGNOSIS_RESPONSE] Response Length:', responseLength);
          console.log('[DIAGNOSIS_RESPONSE] Response Body:', responseText);
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (!responseText || !responseText.trim()) {
            // CASE B: HTTP 200 but response body is empty
            reject(new DiagnosisApiError('EMPTY_RESPONSE', 'Diagnosis server returned an empty response.', xhr.status));
            return;
          }
          try {
            const json = JSON.parse(responseText);
            if (json.success === false) {
              // Server-controlled error JSON (CASE C)
              reject(new DiagnosisApiError('SERVER_ERROR', json.message || json.error?.message || 'Online diagnosis could not be completed.', xhr.status));
              return;
            }
            resolve(json);
          } catch (jsonErr) {
            reject(new DiagnosisApiError('INVALID_JSON', `Invalid JSON response from server: ${responseText}`, xhr.status));
          }
        } else {
          // CASE C: HTTP 4xx/5xx
          reject(new DiagnosisApiError('SERVER_ERROR', 'Online diagnosis could not be completed.', xhr.status));
        }
      };

      xhr.onerror = (e) => {
        if (__DEV__) {
          console.log('[DIAGNOSIS_NETWORK_ERROR] Network request failed connecting to', targetUrl, e);
        }
        // CASE A: Fails before receiving HTTP status
        reject(new DiagnosisApiError('NETWORK_ERROR', 'Cannot reach the diagnosis server. Please ensure your phone is connected to the same network as your server.'));
      };

      xhr.ontimeout = () => {
        if (__DEV__) {
          console.log('[DIAGNOSIS_TIMEOUT] Request timed out connecting to', targetUrl);
        }
        // CASE A: Timeout before receiving HTTP status
        reject(new DiagnosisApiError('NETWORK_ERROR', 'Cannot reach the diagnosis server. Please ensure your phone is connected to the same network as your server.'));
      };

      if (__DEV__) {
        console.log('[DIAGNOSIS_REQUEST] Calling xhr.send(formData)...');
      }
      xhr.send(formData);
    });

    return DiagnosisApi.normalizeBackendResponse(raw, params.crop);
  },

  normalizeBackendResponse(raw: any, fallbackCrop: string): NormalizedResult {
    const res = raw.result || raw;
    const confidenceScore = typeof res.confidence === 'number' ? res.confidence : 0.85;
    let level: ConfidenceLevel = 'High';
    if (confidenceScore < 0.5) level = 'Low';
    else if (confidenceScore < 0.75) level = 'Medium';

    const health: HealthStatus = (res.health_status === 'Healthy' || res.disease?.toLowerCase().includes('healthy'))
      ? 'Healthy' : 'Diseased';

    return {
      crop: raw.crop_selected || res.crop || fallbackCrop,
      health_status: health,
      disease: res.disease || (health === 'Healthy' ? 'Healthy Crop' : 'Detected Problem'),
      confidence: confidenceScore,
      confidence_level: level,
      severity: res.severity || (health === 'Healthy' ? 'None' : 'Moderate'),
      symptoms: Array.isArray(res.symptoms) ? res.symptoms : (res.symptoms ? [res.symptoms] : []),
      recommendations: Array.isArray(res.recommendations) ? res.recommendations : (res.recommendations ? [res.recommendations] : []),
      prevention: Array.isArray(res.prevention) ? res.prevention : (res.prevention ? [res.prevention] : []),
      organic_management: Array.isArray(res.organic_management) ? res.organic_management : undefined,
      regional_advice: res.regional_advice,
      user_message: res.user_message || res.farmer_message,
      analysis_source: 'online',
      timestamp: raw.timestamp || new Date().toISOString(),
      requestId: raw.requestId || res.requestId,
      latency_ms: raw.latency_ms || res.latency_ms,
    };
  }
};