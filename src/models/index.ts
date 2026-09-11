export type AnalysisSource = 'online' | 'offline';
export type HealthStatus = 'Healthy' | 'Diseased' | 'Uncertain';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface NormalizedResult {
  crop: string;
  health_status: HealthStatus;
  disease: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  severity: string;
  symptoms: string[];
  recommendations: string[];
  prevention: string[];
  organic_management?: string[];
  regional_advice?: string;
  user_message?: string;
  analysis_source: AnalysisSource;
  timestamp: string;
  requestId?: string;
  latency_ms?: number;
}

export interface DiagnosisCase {
  caseId: string;
  crop: string;
  imageUris: string[];
  imageCount: number;
  timestamp: string;
  symptoms?: string;
  latitude?: number;
  longitude?: number;
  language: string;
  result: NormalizedResult;
  syncStatus: 'synced' | 'pending';
}

export type ExpertCategory = 'crop_doctor' | 'agricultural_specialist' | 'kvk_support';

export interface ExpertContact {
  id: string;
  name: string;
  category: ExpertCategory;
  roleTitle: string;
  institution: string;
  specialization?: string;
  crops?: string[];
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  hours?: string;
  isVerified: boolean;
  verifiedSource?: string;
  isCached?: boolean;
}
export interface UserProfile {
  isLoggedIn: boolean;
  authProvider?: 'google' | 'phone';
  name?: string;
  phoneOrEmail?: string;
}

export * from '../config/crops';