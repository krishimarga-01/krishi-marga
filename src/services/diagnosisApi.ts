import { NormalizedResult, ConfidenceLevel, HealthStatus } from '../models/index';
import * as FileSystem from 'expo-file-system';

// Configurable backend endpoint (dev default, can be overridden via config or settings)
export const DEFAULT_N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/detect-disease';

export interface DiagnosisRequestParams {
  crop: string;
  imageUris: string[];
  language: string;
  symptoms?: string;
  latitude?: number;
  longitude?: number;
  apiUrl?: string;
}

export const DiagnosisApi = {
  async detectDiseaseOnline(params: DiagnosisRequestParams): Promise<NormalizedResult> {
    const targetUrl = params.apiUrl || DEFAULT_N8N_WEBHOOK_URL;
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
      const filename = uri.split('/').pop() || ('leaf_' + i + '.jpg');
      formData.append('images', {
        uri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error('Server returned status ' + response.status + ': ' + errorBody);
    }

    const raw = await response.json();
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
    };
  }
};