import {
  NormalizedResult,
  ConfidenceLevel,
  HealthStatus,
  PestAssessment,
  NutrientAssessment,
  CropProtectionAdvisory,
  FertilizerAdvisory,
} from '../models/index';
import localDiseasesData from '../knowledge/localDiseases.json';
import localPestsData from '../knowledge/localPests.json';
import localNutrientsData from '../knowledge/localNutrients.json';
import modelRegistryData from '../models/model_registry.json';
import { ModelAssets } from './modelAssets';
import { Preprocessor, TENSOR_SPEC } from './preprocess';
import { OfflineCapability, getOrt, probeRuntime } from './onnxRuntimeStatus';

/**
 * KRISHI MARGA — OFFLINE ENGINE
 * ------------------------------------------------------------------
 * Two clearly separated behaviours, never blended:
 *
 *   1. MODEL INFERENCE — a real ONNX session runs over the farmer's photos and
 *      produces a class distribution. Results are marked analysis_source
 *      'offline' with is_diagnosis: true and the model's own confidence.
 *
 *   2. KNOWLEDGE LOOKUP — when inference is not possible (no native runtime,
 *      no decoder, or no weight file for the crop), the app shows reference
 *      information from the bundled agricultural knowledge base. Results are
 *      marked analysis_source 'offline_knowledge' with is_diagnosis: false and
 *      confidence 0. No diagnosis is invented, and no confidence is fabricated.
 *
 * The previous implementation returned knowledge-base text while claiming a
 * calibrated 78-94% "offline diagnosis". That behaviour has been removed.
 */

const LOCALIZED_FALLBACK: Record<string, string> = {
  en: 'Information unavailable',
  kn: 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',
  ta: 'தகவல் கிடைக்கவில்லை',
  ml: 'വിവരങ്ങൾ ലഭ്യമല്ല',
  hi: 'जानकारी उपलब्ध नहीं है',
  te: 'సమాచారం అందుబాటులో లేదు',
};

const KNOWLEDGE_NOTE: Record<string, string> = {
  en: 'Reference information from the offline crop knowledge base. This is not an AI diagnosis — connect to the internet for an image-based diagnosis.',
  kn: 'ಆಫ್‌ಲೈನ್ ಬೆಳೆ ಜ್ಞಾನಕೋಶದಿಂದ ಮಾಹಿತಿ. ಇದು AI ರೋಗನಿರ್ಣಯವಲ್ಲ — ಚಿತ್ರ ಆಧಾರಿತ ರೋಗನಿರ್ಣಯಕ್ಕೆ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕಿಸಿ.',
  ta: 'ஆஃப்லைன் பயிர் தகவல் தொகுப்பிலிருந்து குறிப்புத் தகவல். இது AI நோயறிதல் அல்ல — படம் சார்ந்த நோயறிதலுக்கு இணையத்தை இணைக்கவும்.',
  ml: 'ഓഫ്‌ലൈൻ വിള വിജ്ഞാനശേഖരത്തിൽ നിന്നുള്ള വിവരം. ഇത് AI രോഗനിർണയമല്ല — ചിത്രാധിഷ്ഠിത രോഗനിർണയത്തിന് ഇന്റർനെറ്റ് ബന്ധിപ്പിക്കുക.',
  hi: 'ऑफ़लाइन फसल ज्ञानकोश से संदर्भ जानकारी। यह AI निदान नहीं है — चित्र आधारित निदान के लिए इंटरनेट से जुड़ें।',
  te: 'ఆఫ్‌లైన్ పంట విజ్ఞాన నిధి నుండి సమాచారం. ఇది AI నిర్ధారణ కాదు — చిత్రం ఆధారిత నిర్ధారణ కోసం ఇంటర్నెట్‌కు కనెక్ట్ అవ్వండి.',
};

export interface OnnxTensorContract {
  inputName: string;
  shape: [number, number, number, number];
  layout: 'NCHW';
  dataType: 'float32';
  mean: [number, number, number];
  std: [number, number, number];
}

export const ONNX_CONFIG: OnnxTensorContract = {
  inputName: 'input',
  shape: [1, 3, 224, 224],
  layout: 'NCHW',
  dataType: 'float32',
  mean: TENSOR_SPEC.mean,
  std: TENSOR_SPEC.std,
};

export interface CropModelMetadata {
  crop_id: string;
  model_path: string;
  classes: string[];
  num_classes: number;
  input_shape: number[];
  mean: number[];
  std: number[];
  runtime: string;
  status: string;
}

export interface OfflineCapabilityReport {
  capability: OfflineCapability;
  cropId: string | null;
  hasRegistryEntry: boolean;
  hasKnowledgeEntry: boolean;
  modelPath: string | null;
  details: string;
}

// Active session cache — only ONE crop model is held in memory at a time.
let activeCropId: string | null = null;
let activeSession: any = null;

const CROP_MODEL_ALIASES: Record<string, string> = {
  paddy: 'rice_leaf',
  rice: 'rice_leaf',
  maize: 'corn',
  corn: 'corn',
  banana: 'banana_leaf',
  capsicum: 'pepper_bell',
  tapioca: 'cassava',
  sweet_potato: 'potato',
  citrus_lime: 'lemon',
  lime: 'lemon',
  lemon: 'lemon',
  grapes: 'grape',
  grape: 'grape',
};

function normalizeCropKey(crop: string): string {
  const raw = (crop || '').toLowerCase().trim().replace(/ /g, '_');
  return CROP_MODEL_ALIASES[raw] || raw;
}

function findKnowledgeEntries(crop: string): any[] {
  const cropsDict = (localDiseasesData as any).crops as Record<string, any[]>;
  const cropTitle = (crop || '').replace(/_/g, ' ').trim().toLowerCase();
  for (const key of Object.keys(cropsDict || {})) {
    if (key.toLowerCase() === cropTitle || key.toLowerCase() === (crop || '').toLowerCase()) {
      return cropsDict[key] || [];
    }
  }
  return [];
}

export const OnnxEngine = {
  /**
   * True when the app has SOMETHING useful offline for this crop — either a
   * model or knowledge-base content. Callers should use getCapability() when
   * they need to know which of the two it is.
   */
  isModelAvailable(crop?: string): boolean {
    if (!crop) return false;
    const norm = normalizeCropKey(crop);
    const registry = modelRegistryData as unknown as Record<string, CropModelMetadata>;
    if (registry[norm]) return true;
    const match = Object.keys(registry).find((k) => k === norm || norm.includes(k) || k.includes(norm));
    return !!match || findKnowledgeEntries(crop).length > 0;
  },

  getModelMetadata(crop: string): CropModelMetadata | null {
    const norm = normalizeCropKey(crop);
    const registry = modelRegistryData as unknown as Record<string, CropModelMetadata>;
    if (registry[norm]) return registry[norm];
    const matchKey = Object.keys(registry).find((k) => k === norm || norm.includes(k) || k.includes(norm));
    return matchKey ? registry[matchKey] : null;
  },

  /**
   * Reports precisely what offline capability exists for a crop right now.
   * Used by the analysing screen and by the diagnostics screen so the app can
   * tell the farmer the truth about what it is doing.
   */
  async getCapability(crop: string): Promise<OfflineCapabilityReport> {
    const meta = OnnxEngine.getModelMetadata(crop);
    const knowledge = findKnowledgeEntries(crop);
    const probe = probeRuntime();

    const base = {
      cropId: meta?.crop_id || null,
      hasRegistryEntry: !!meta,
      hasKnowledgeEntry: knowledge.length > 0,
      modelPath: null as string | null,
    };

    if (!probe.ortAvailable) {
      return {
        ...base,
        capability: knowledge.length > 0 ? 'RUNTIME_MISSING' : 'KNOWLEDGE_ONLY',
        details: probe.details,
      };
    }

    if (!probe.decoderAvailable) {
      return { ...base, capability: 'DECODER_MISSING', details: probe.details };
    }

    if (!meta) {
      return { ...base, capability: 'KNOWLEDGE_ONLY', details: 'No model registry entry for this crop.' };
    }

    const modelPath = await ModelAssets.resolveModelPath(meta.crop_id);
    if (!modelPath) {
      return {
        ...base,
        capability: 'MODEL_FILE_MISSING',
        details: `disease.onnx not found. Searched: ${ModelAssets.describeSearchPaths(meta.crop_id).join(', ')}`,
      };
    }

    return {
      ...base,
      modelPath,
      capability: 'MODEL_INFERENCE',
      details: 'Native runtime, decoder and model weights are all present.',
    };
  },

  /**
   * Loads ONLY the selected crop's model, releasing any previously loaded one
   * so memory stays bounded to a single session. Returns null when a real
   * session cannot be created — it never returns a stand-in object.
   */
  async loadCropModel(crop: string): Promise<any | null> {
    const norm = normalizeCropKey(crop);
    if (activeCropId === norm && activeSession) return activeSession;

    await OnnxEngine.releaseSession();

    const ort = getOrt();
    if (!ort) return null;

    const meta = OnnxEngine.getModelMetadata(crop);
    if (!meta) return null;

    const modelPath = await ModelAssets.resolveModelPath(meta.crop_id);
    if (!modelPath) {
      console.log(`[ONNX] Weights not present on device for ${meta.crop_id}`);
      return null;
    }

    try {
      const session = await ort.InferenceSession.create(modelPath);
      activeSession = session;
      activeCropId = norm;
      console.log(`[ONNX] Session created for ${meta.crop_id} (${meta.num_classes} classes)`);
      return session;
    } catch (err) {
      console.warn('[ONNX] Session creation failed:', err);
      activeSession = null;
      activeCropId = null;
      return null;
    }
  },

  /** Releases the active session and frees its memory. */
  async releaseSession(): Promise<void> {
    if (activeSession && typeof activeSession.release === 'function') {
      try {
        await activeSession.release();
      } catch (e) {
        console.warn('[ONNX] Failed to release previous session:', e);
      }
    }
    activeSession = null;
    activeCropId = null;
  },

  getPreprocessingSpec() {
    return {
      targetWidth: TENSOR_SPEC.width,
      targetHeight: TENSOR_SPEC.height,
      layout: TENSOR_SPEC.layout,
      channels: TENSOR_SPEC.channels,
      resampleMethod: 'Aspect-ratio preserving resize with neutral letterbox padding',
      normalization: { mean: TENSOR_SPEC.mean, std: TENSOR_SPEC.std },
    };
  },

  /**
   * Runs the offline path for a crop.
   *
   * Attempts genuine ONNX inference first. If any required piece is missing it
   * falls back to a clearly-labelled knowledge-base lookup. The two outcomes
   * are distinguishable by `analysis_source` and `is_diagnosis`.
   */
  async runInference(crop: string, imageUris: string[], language: string = 'en'): Promise<NormalizedResult> {
    if (!imageUris || imageUris.length === 0) {
      throw new Error('NO_IMAGES_PROVIDED_FOR_OFFLINE_INFERENCE');
    }

    const capability = await OnnxEngine.getCapability(crop);

    if (capability.capability === 'MODEL_INFERENCE') {
      const inferred = await OnnxEngine.runModelInference(crop, imageUris, language);
      if (inferred) return inferred;
      // Inference was possible in principle but failed at runtime; fall through
      // to the knowledge base rather than returning a fabricated result.
    }

    return OnnxEngine.buildKnowledgeResult(crop, language, capability);
  },

  /**
   * Genuine multi-image ONNX inference.
   * Each photo is preprocessed and run separately; softmax probabilities are
   * averaged across photos, and the top class becomes the result. The reported
   * confidence is the model's own averaged probability — it is not adjusted,
   * boosted by image count, or floored to a minimum value.
   * Returns null if the session, tensors, or outputs are unusable.
   */
  async runModelInference(
    crop: string,
    imageUris: string[],
    language: string = 'en'
  ): Promise<NormalizedResult | null> {
    const ort = getOrt();
    const meta = OnnxEngine.getModelMetadata(crop);
    if (!ort || !meta) return null;

    const session = await OnnxEngine.loadCropModel(crop);
    if (!session) return null;

    const perImageProbabilities: number[][] = [];
    // Bounded to 10 images and processed one at a time so peak memory stays at
    // roughly one decoded image plus one tensor.
    const uris = imageUris.slice(0, 10);

    for (const uri of uris) {
      try {
        const tensorData = await Preprocessor.toTensor(uri);
        if (!tensorData) continue;

        const inputName = session.inputNames?.[0] || ONNX_CONFIG.inputName;
        const feeds: Record<string, any> = {
          [inputName]: new ort.Tensor('float32', tensorData.data, tensorData.dims),
        };

        const output = await session.run(feeds);
        const outputName = session.outputNames?.[0] || Object.keys(output)[0];
        const raw = output[outputName]?.data;
        if (!raw || raw.length === 0) continue;

        perImageProbabilities.push(Preprocessor.softmax(raw as Float32Array));
      } catch (e) {
        console.warn('[ONNX] Inference failed for one image:', e);
      }
    }

    if (perImageProbabilities.length === 0) return null;

    const averaged = Preprocessor.averageProbabilities(perImageProbabilities);
    let topIndex = 0;
    for (let i = 1; i < averaged.length; i++) {
      if (averaged[i] > averaged[topIndex]) topIndex = i;
    }

    const classes = meta.classes || [];
    const predictedClass = classes[topIndex];
    if (!predictedClass) return null;

    const confidence = averaged[topIndex];
    let confidenceLevel: ConfidenceLevel = 'High';
    if (confidence < 0.5) confidenceLevel = 'Low';
    else if (confidence < 0.75) confidenceLevel = 'Medium';

    const lang = (language || 'en').toLowerCase();
    const isHealthy = /healthy|fresh/i.test(predictedClass);
    const health: HealthStatus = isHealthy ? 'Healthy' : confidence < 0.5 ? 'Uncertain' : 'Diseased';

    // Enrich the predicted class with verified agronomic text where the
    // knowledge base has a matching entry. The prediction itself comes only
    // from the model.
    const knowledge = findKnowledgeEntries(crop);
    const matched = knowledge.find(
      (d: any) =>
        d.disease &&
        (d.disease.toLowerCase() === predictedClass.toLowerCase() ||
          d.disease.toLowerCase().includes(predictedClass.toLowerCase()) ||
          predictedClass.toLowerCase().includes(d.disease.toLowerCase()))
    );
    const trans = matched?.translations?.[lang] || (lang === 'en' ? matched : null);

    return {
      crop,
      health_status: health,
      disease: trans?.disease || matched?.disease || predictedClass,
      confidence,
      confidence_level: confidenceLevel,
      severity: matched?.severity || (isHealthy ? 'None' : 'Moderate'),
      problem_type: isHealthy ? 'HEALTHY' : health === 'Uncertain' ? 'UNKNOWN' : 'DISEASE',
      symptoms: trans?.symptoms || matched?.symptoms || [],
      recommendations: trans?.recommendations || matched?.recommendations || [],
      prevention: trans?.prevention || matched?.prevention || [],
      organic_management: trans?.organic_management || matched?.organic_management,
      regional_advice: trans?.regional_advice || matched?.regional_advice,
      user_message: trans?.farmer_message || matched?.farmer_message,
      pest_assessment: OnnxEngine.getPestReference(crop),
      nutrient_assessment: OnnxEngine.getNutrientReference(crop),
      crop_protection: OnnxEngine.getCropProtectionReference(matched),
      fertilizer_advisory: OnnxEngine.getFertilizerReference(crop),
      analysis_source: 'offline',
      is_diagnosis: true,
      source_note: `On-device model inference (${meta.crop_id}, ${uris.length} image(s) analysed).`,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Knowledge-base lookup. This is explicitly NOT a diagnosis:
   *  - confidence is 0 and confidence_level is 'Low'
   *  - health_status is 'Uncertain'
   *  - is_diagnosis is false and source_note explains the limitation
   *  - reference_conditions lists the conditions known for this crop
   */
  buildKnowledgeResult(
    crop: string,
    language: string,
    capability: OfflineCapabilityReport
  ): NormalizedResult {
    const lang = (language || 'en').toLowerCase();
    const note = KNOWLEDGE_NOTE[lang] || KNOWLEDGE_NOTE.en;
    const unavailable = LOCALIZED_FALLBACK[lang] || LOCALIZED_FALLBACK.en;

    const knowledge = findKnowledgeEntries(crop);
    const conditions = knowledge
      .map((d: any) => {
        const t = d?.translations?.[lang];
        return t?.disease || d?.disease;
      })
      .filter(Boolean);

    const primary = knowledge.length > 0 ? knowledge[0] : null;
    const trans = primary?.translations?.[lang] || (lang === 'en' ? primary : null);

    return {
      crop,
      health_status: 'Uncertain',
      disease: conditions.length > 0 ? conditions[0] : unavailable,
      confidence: 0,
      confidence_level: 'Low',
      severity: 'None',
      problem_type: 'UNKNOWN',
      symptoms: trans?.symptoms || primary?.symptoms || [],
      recommendations: trans?.recommendations || primary?.recommendations || [],
      prevention: trans?.prevention || primary?.prevention || [],
      organic_management: trans?.organic_management || primary?.organic_management,
      regional_advice: trans?.regional_advice || primary?.regional_advice,
      user_message: note,
      reference_conditions: conditions,
      pest_assessment: OnnxEngine.getPestReference(crop),
      nutrient_assessment: OnnxEngine.getNutrientReference(crop),
      crop_protection: OnnxEngine.getCropProtectionReference(primary),
      fertilizer_advisory: OnnxEngine.getFertilizerReference(crop),
      analysis_source: 'offline_knowledge',
      is_diagnosis: false,
      source_note: `${note} (offline capability: ${capability.capability})`,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Pest reference information from the bundled dataset.
   * Status is KNOWLEDGE_AVAILABLE — this is a lookup of pests common to the
   * crop, not a detection, so no confidence score is attached.
   */
  getPestReference(crop: string): PestAssessment {
    const cropKey = (crop || '').toLowerCase().trim().replace(/ /g, '_');
    const allPests = (localPestsData as any).pests || {};
    const records: any[] = allPests[cropKey] || allPests[(crop || '').toLowerCase().trim()] || [];

    if (!records.length) {
      return {
        status: 'NEEDS_MORE_DATA',
        management: ['Regular scouting recommended. Contact your local KVK about emerging pests.'],
        prevention: ['Install yellow and blue sticky traps (10-12 per acre) for early monitoring.'],
        source_verification: 'ICAR-NBAIR / Regional Agriculture University',
      };
    }

    const record = records[0];
    const isVector = Boolean(
      record.is_disease_vector ||
        (record.cause_relationship && String(record.cause_relationship).toLowerCase().includes('vector'))
    );

    return {
      status: 'KNOWLEDGE_AVAILABLE',
      pest_detected: record.pest,
      scientific_name: record.scientific_name,
      pest_type: record.pest_type,
      damage_symptoms: record.damage_symptoms ? [record.damage_symptoms] : [],
      associated_disease: record.affected_diseases || undefined,
      is_disease_vector: isVector,
      vector_explanation: isVector
        ? `${record.pest} is a known vector of ${record.affected_diseases}. Controlling it helps stop transmission.`
        : undefined,
      management: record.management ? [record.management] : [],
      prevention: record.prevention ? [record.prevention] : [],
      source_verification: record.source || 'ICAR-NBAIR / CIBRC',
    };
  },

  /** Nutrient reference information from the bundled dataset (lookup, not detection). */
  getNutrientReference(crop: string): NutrientAssessment {
    const cropKey = (crop || '').toLowerCase().trim().replace(/ /g, '_');
    const allNutrients = (localNutrientsData as any).nutrients || {};
    const records: any[] = allNutrients[cropKey] || allNutrients[(crop || '').toLowerCase().trim()] || [];

    if (!records.length) {
      return {
        status: 'NEEDS_MORE_DATA',
        soil_relationship: 'Perform routine soil testing (pH and electrical conductivity) every 2 years.',
        management: ['Apply a balanced basal dose of NPK as recommended by the package of practices.'],
        source_verification: 'ICAR-IISS / ICAR PoP',
      };
    }

    const primary = records[0];
    return {
      status: 'KNOWLEDGE_AVAILABLE',
      deficiency_detected: primary.deficiency_name,
      nutrient_name: primary.nutrient,
      visual_symptoms: primary.visual_symptoms ? [primary.visual_symptoms] : [],
      affected_plant_part: primary.affected_plant_part,
      soil_relationship: primary.soil_relationship
        ? `${primary.soil_relationship}. Possible causes: ${primary.possible_causes}.`
        : undefined,
      management: [
        `Confirm with a soil test before correcting ${primary.nutrient}.`,
        'Maintain soil moisture and a pH of 6.0-7.5 for nutrient uptake.',
      ],
      source_verification: primary.source || 'ICAR-IISS Bhopal / TNAU Agri Portal',
    };
  },

  /**
   * Crop protection advisory.
   * Active ingredients are listed ONLY when the bundled CIBRC-sourced dataset
   * has them for the matched condition. Nothing is invented.
   */
  getCropProtectionReference(matched: any): CropProtectionAdvisory {
    const ingredients: string[] = Array.isArray(matched?.cibrc_pesticides) ? matched.cibrc_pesticides : [];
    return {
      active_ingredients: ingredients,
      application_guidance: ingredients.length
        ? 'Apply during cool evening hours with uniform coverage and full protective equipment. Follow the dose printed on the product label.'
        : 'No verified chemical recommendation is available offline for this crop. Consult your RSK or KVK officer before applying any product.',
      cibrc_status: 'REGISTERED',
      safety_interval_days: ingredients.length ? 7 : undefined,
    };
  },

  /** General soil/fertility guidance from the bundled dataset. */
  getFertilizerReference(crop: string): FertilizerAdvisory {
    const nutrient = OnnxEngine.getNutrientReference(crop);
    return {
      soil_link:
        nutrient.soil_relationship ||
        `Maintain organic matter (FYM 10-12 t/ha) and test soil pH annually for ${crop}.`,
      deficiency_correction: nutrient.management || [
        'Apply well-decomposed farmyard manure before sowing.',
        'Confirm any micronutrient spray with a soil or leaf test first.',
      ],
    };
  },
};
