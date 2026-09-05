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

export interface ExpertContact {
  id: string;
  name: string;
  type: string;
  phone?: string;
  address: string;
  hours: string;
  isMockData: boolean;
}
export interface UserProfile {
  isLoggedIn: boolean;
  authProvider?: 'google' | 'phone';
  name?: string;
  phoneOrEmail?: string;
}