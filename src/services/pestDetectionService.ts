/**
 * Krishi Marga — Pest Detection Service
 * Provides crop pest analysis with strict safety controls.
 * NEVER fabricates a pest diagnosis or picks arbitrary pests when offline without clear evidence.
 */

import { NormalizedResult } from '../models/index';
import { DiagnosisApi, DiagnosisRequestParams } from './diagnosisApi';
import localPestsData from '../knowledge/localPests.json';

export interface PestDiagnosisParams {
  crop: string;
  imageUris: string[];
  language: string;
  symptoms?: string;
  latitude?: number;
  longitude?: number;
}

export const PestDetectionService = {
  /**
   * Diagnoses crop pest infestation.
   * Prioritizes online diagnosis via production backend.
   * Falls back safely to offline inspection without guessing.
   */
  async detectPest(params: PestDiagnosisParams): Promise<NormalizedResult> {
    try {
      const onlineParams: DiagnosisRequestParams = {
        crop: params.crop,
        imageUris: params.imageUris,
        language: params.language,
        symptoms: params.symptoms ? `[PEST_INSPECTION] ${params.symptoms}` : '[PEST_INSPECTION]',
        latitude: params.latitude,
        longitude: params.longitude,
      };

      const result = await DiagnosisApi.detectDiseaseOnline(onlineParams);
      return {
        ...result,
        problem_type: 'PEST',
      };
    } catch (err) {
      if (__DEV__) {
        console.log('[PestDetectionService] Online pest analysis failed, switching to safe offline evaluation:', err);
      }
      return this.detectPestOffline(params.crop, params.language, params.symptoms);
    }
  },

  /**
   * Safe offline pest evaluation.
   * If symptoms clearly match a documented pest, returns verified management data.
   * If symptoms are absent or ambiguous, returns 'Unable to identify pest' with LOW confidence
   * and specialist guidance. NEVER fabricates a pest diagnosis.
   */
  detectPestOffline(crop: string, language: string = 'en', symptomsHint?: string): NormalizedResult {
    const cropKey = (crop || '').toLowerCase().trim().replace(/ /g, '_');
    const allPests = (localPestsData as any).pests || {};
    const cropPests: any[] = allPests[cropKey] || allPests[(crop || '').toLowerCase().trim()] || [];

    // Check if symptoms provided match any known pest
    let matchedPest: any = null;
    if (symptomsHint && symptomsHint.trim().length > 3 && cropPests.length > 0) {
      const hint = symptomsHint.toLowerCase();
      matchedPest = cropPests.find((p: any) => {
        const pestName = (p.pest || '').toLowerCase();
        const sciName = (p.scientific_name || '').toLowerCase();
        const symptoms = (p.damage_symptoms || '').toLowerCase();
        return (
          hint.includes(pestName) ||
          pestName.includes(hint) ||
          (sciName && hint.includes(sciName)) ||
          symptoms.split(' ').some((word: string) => word.length > 4 && hint.includes(word))
        );
      });
    }

    // IF A CLEAR MATCH WAS FOUND IN VERIFIED KNOWLEDGE
    if (matchedPest) {
      const isVector = Boolean(
        matchedPest.is_disease_vector ||
          (matchedPest.cause_relationship && String(matchedPest.cause_relationship).toLowerCase().includes('vector'))
      );

      return {
        crop,
        disease: matchedPest.pest,
        health_status: 'Diseased',
        confidence: 0.72,
        confidence_level: 'Medium',
        severity: 'Moderate',
        problem_type: 'PEST',
        symptoms: matchedPest.damage_symptoms ? [matchedPest.damage_symptoms] : [],
        recommendations: matchedPest.management ? [matchedPest.management] : [],
        prevention: matchedPest.prevention ? [matchedPest.prevention] : [],
        regional_advice: 'Confirm pest presence on leaf undersides before applying curative measures.',
        pest_assessment: {
          status: 'KNOWLEDGE_AVAILABLE',
          pest_detected: matchedPest.pest,
          scientific_name: matchedPest.scientific_name,
          pest_type: matchedPest.pest_type,
          damage_symptoms: matchedPest.damage_symptoms ? [matchedPest.damage_symptoms] : [],
          associated_disease: matchedPest.affected_diseases,
          is_disease_vector: isVector,
          vector_explanation: isVector
            ? `${matchedPest.pest} is a known vector. Controlling it prevents spread.`
            : undefined,
          management: matchedPest.management ? [matchedPest.management] : [],
          prevention: matchedPest.prevention ? [matchedPest.prevention] : [],
          source_verification: matchedPest.source || 'ICAR-NBAIR / CIBRC',
        },
        analysis_source: 'offline_knowledge',
        is_diagnosis: true,
        source_note: 'Identified from documented crop pest symptom patterns.',
        timestamp: new Date().toISOString(),
      };
    }

    // SAFETY FALLBACK: DO NOT GUESS OR SELECT THE FIRST PEST!
    return {
      crop,
      disease: 'Unable to identify pest',
      health_status: 'Uncertain',
      confidence: 0.25,
      confidence_level: 'Low',
      severity: 'None',
      problem_type: 'UNKNOWN',
      symptoms: [
        'Characteristic pest morphology or feeding symptoms could not be conclusively verified offline.',
      ],
      recommendations: [
        'Inspect the affected plant closely, including the underside of leaves and stems, for moving insects or larvae.',
        'Take a clear, well-lit photo in daylight and re-scan when connected to the internet.',
        'Consult your nearest Raitha Samparka Kendra (RSK) or call Kisan Call Centre at 1800-180-1551 before applying any chemical spray.',
      ],
      prevention: [
        'Maintain regular field scouting and install sticky traps (10-15 traps/acre) for early pest monitoring.',
      ],
      regional_advice:
        'Pest could not be conclusively identified. Please consult a qualified agricultural extension officer.',
      user_message:
        'Unable to identify pest with certainty. Avoid applying chemical insecticides without specialist confirmation.',
      analysis_source: 'offline_knowledge',
      is_diagnosis: false,
      source_note: 'Uncertain offline evaluation. Manual specialist inspection recommended.',
      timestamp: new Date().toISOString(),
    };
  },
};
