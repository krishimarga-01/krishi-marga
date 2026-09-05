import { NormalizedResult, ConfidenceLevel, HealthStatus } from '../models/index';
import localDiseasesData from '../knowledge/localDiseases.json';

export const OnnxEngine = {
  isModelAvailable(): boolean {
    // When onnxruntime-react-native and crop_disease.onnx are compiled and loaded, return true
    return false;
  },

  async runInference(crop: string, imageUris: string[]): Promise<NormalizedResult> {
    if (!OnnxEngine.isModelAvailable()) {
      throw new Error('OFFLINE_MODEL_NOT_INSTALLED');
    }

    // Preparation for onnx multi-image execution (Image 1 -> Tensor -> Run, etc.)
    // Look up verified agronomic local knowledge for the crop
    const cropDiseases = (localDiseasesData.crops as Record<string, any[]>)[crop] || [];
    const match = cropDiseases[0]; // will be selected by ONNX probabilities

    return {
      crop,
      health_status: match ? match.health_status : 'Uncertain',
      disease: match ? match.disease : 'Local Offline Inspection',
      confidence: 0.80,
      confidence_level: 'High' as ConfidenceLevel,
      severity: match ? match.severity : 'Moderate',
      symptoms: match ? match.symptoms : [],
      recommendations: match ? match.recommendations : [],
      prevention: match ? match.prevention : [],
      organic_management: match ? match.organic_management : undefined,
      regional_advice: match ? match.regional_advice : undefined,
      user_message: match ? match.farmer_message : undefined,
      analysis_source: 'offline',
      timestamp: new Date().toISOString(),
    };
  }
};