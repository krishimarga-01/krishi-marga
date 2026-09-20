export type IpdmLanguage = 'en' | 'hi' | 'kn' | 'te' | 'ta' | string;

/**
 * Source of the IPDM data:
 * - 'sqlite_baseline': Local SQLite IPDM management store (offline guidance).
 * - 'n8n_expanded': Expanded live agronomic response from n8n backend.
 * - 'sqlite_fallback': Online attempt failed or timed out; served from SQLite management store.
 */
export type IpdmDataSource = 'sqlite_baseline' | 'n8n_expanded' | 'sqlite_fallback';

export interface IpdmGuidance {
  crop: string;
  condition: string;
  conditionType: 'DISEASE' | 'PEST' | 'NUTRIENT' | 'HEALTHY';
  prevention: string[];
  biologicalControl: string[];
  treatmentGuidance: string[];
  precautions: string[];
  symptoms?: string[];
  severity: string;
  confidence: number;
  dataSource: IpdmDataSource;
  lastUpdated: string;
  sourceVersion: string;
  regionalNotes?: string;
  isFallback: boolean;
  isAvailable?: boolean;
  unavailableMessage?: string;
}

export interface IpdmRequestPayload {
  crop: string;
  disease?: string;
  pest?: string;
  confidence?: number;
  language?: IpdmLanguage;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PestReportPayload {
  farmerId: string;
  farmerName?: string;
  crop: string;
  pest: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  imageUrl?: string;
  confidence?: number;
  notes?: string;
}

export interface PestAlert {
  alertId: string;
  pest: string;
  crop: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  distanceKm: number;
  reportedAt: string;
  message: string;
  latitude: number;
  longitude: number;
  verified: boolean;
}
