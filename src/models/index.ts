/**
 * Where a result came from.
 *  - 'online'            : AI diagnosis produced by the server pipeline.
 *  - 'offline'           : genuine on-device ONNX model inference.
 *  - 'offline_knowledge' : reference information looked up in the bundled
 *                          agricultural knowledge base. This is NOT a diagnosis
 *                          and must never be presented as one.
 */
export type AnalysisSource = 'online' | 'offline' | 'offline_knowledge';
export type HealthStatus = 'Healthy' | 'Diseased' | 'Uncertain';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface PestAssessment {
  status: 'AI_AVAILABLE' | 'KNOWLEDGE_AVAILABLE' | 'NOT_AVAILABLE' | 'NEEDS_MORE_DATA';
  pest_detected?: string;
  scientific_name?: string;
  pest_type?: string;
  confidence?: number;
  damage_symptoms?: string[];
  associated_disease?: string;
  is_disease_vector?: boolean;
  vector_explanation?: string;
  management?: string[];
  prevention?: string[];
  source_verification?: string;
}

export interface NutrientAssessment {
  status: 'AI_AVAILABLE' | 'KNOWLEDGE_AVAILABLE' | 'NOT_AVAILABLE' | 'NEEDS_MORE_DATA';
  deficiency_detected?: string;
  nutrient_name?: string;
  confidence?: number;
  visual_symptoms?: string[];
  affected_plant_part?: string;
  soil_relationship?: string;
  management?: string[];
  source_verification?: string;
}

export interface CropProtectionAdvisory {
  active_ingredients: string[];
  application_guidance: string;
  cibrc_status: 'REGISTERED' | 'ORGANIC_SAFE';
  safety_interval_days?: number;
}

export interface FertilizerAdvisory {
  soil_link: string;
  recommended_npk_ratio?: string;
  deficiency_correction: string[];
}

export interface NormalizedResult {
  crop: string;
  health_status: HealthStatus;
  disease: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  severity: string;
  problem_type?: 'DISEASE' | 'PEST' | 'NUTRIENT_DEFICIENCY' | 'HEALTHY' | 'UNKNOWN';
  symptoms: string[];
  recommendations: string[];
  prevention: string[];
  organic_management?: string[];
  regional_advice?: string;
  user_message?: string;
  pest_assessment?: PestAssessment;
  nutrient_assessment?: NutrientAssessment;
  crop_protection?: CropProtectionAdvisory;
  fertilizer_advisory?: FertilizerAdvisory;
  analysis_source: AnalysisSource;
  /**
   * True only when the result is an actual model/AI diagnosis. False for
   * knowledge-base reference lookups so the UI can label them honestly.
   */
  is_diagnosis?: boolean;
  /** Human-readable note about where the information came from. */
  source_note?: string;
  /** Candidate conditions listed for reference (knowledge-base results). */
  reference_conditions?: string[];
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