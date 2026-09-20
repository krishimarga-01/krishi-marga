import { IpdmGuidance, IpdmDataSource, PestReportPayload, PestAlert } from './ipdm.types';

export class IpdmValidation {
  /**
   * Strictly normalizes any raw object from external sources (n8n, SQLite, network)
   * so the UI never receives unexpected nulls, undefineds, missing arrays, or wrong types.
   */
  public static normalizeGuidance(
    raw: any,
    fallbackCrop: string = 'Crop',
    fallbackCondition: string = 'Condition',
    source: IpdmDataSource = 'sqlite_baseline'
  ): IpdmGuidance {
    if (!raw || typeof raw !== 'object') {
      return this.createUnavailableGuidance(
        fallbackCrop,
        fallbackCondition,
        'Offline guidance for this condition is unavailable. Connect to the internet for expanded IPDM guidance.',
        source
      );
    }

    const toStringArray = (val: any): string[] => {
      if (Array.isArray(val)) {
        return val
          .map((item) => (item !== null && item !== undefined ? String(item).trim() : ''))
          .filter((item) => item.length > 0);
      }
      if (typeof val === 'string' && val.trim().length > 0) {
        return [val.trim()];
      }
      return [];
    };

    const conditionTypeRaw = String(raw.conditionType || raw.problem_type || 'DISEASE').toUpperCase();
    const validConditionTypes = ['DISEASE', 'PEST', 'NUTRIENT', 'HEALTHY'];
    const conditionType = validConditionTypes.includes(conditionTypeRaw)
      ? (conditionTypeRaw as 'DISEASE' | 'PEST' | 'NUTRIENT' | 'HEALTHY')
      : 'DISEASE';

    const confidenceNum = Number(raw.confidence);
    const safeConfidence = !isNaN(confidenceNum) ? Math.min(Math.max(confidenceNum, 0), 1) : 0;

    return {
      crop: String(raw.crop || fallbackCrop).trim(),
      condition: String(raw.condition || raw.disease || raw.pest || fallbackCondition).trim(),
      conditionType,
      symptoms: toStringArray(raw.symptoms),
      prevention: toStringArray(raw.prevention),
      biologicalControl: toStringArray(raw.biologicalControl || raw.biological_control || raw.organic_management),
      treatmentGuidance: toStringArray(raw.treatmentGuidance || raw.treatment_guidance || raw.treatment || raw.recommendations),
      precautions: toStringArray(raw.precautions || raw.safety_guidance),
      severity: String(raw.severity || 'Medium').trim(),
      confidence: safeConfidence,
      dataSource: source,
      lastUpdated: String(raw.lastUpdated || raw.last_updated || new Date().toISOString()),
      sourceVersion: String(raw.sourceVersion || raw.source_version || 'ICAR-CIBRC-2026.1'),
      regionalNotes: raw.regionalNotes || raw.regional_advice ? String(raw.regionalNotes || raw.regional_advice) : undefined,
      isFallback: source === 'sqlite_fallback',
      isAvailable: raw.isAvailable !== false,
      unavailableMessage: raw.unavailableMessage,
    };
  }

  /**
   * Produces a clean unavailable state when offline SQLite has no matching guidance.
   * STRICTLY DOES NOT INVENT FAKE AGRICULTURAL CHEMICALS OR BIOLOGICAL ADVICE.
   */
  public static createUnavailableGuidance(
    crop: string,
    condition: string,
    message: string = 'Offline guidance for this condition is unavailable. Connect to the internet for expanded IPDM guidance.',
    source: IpdmDataSource = 'sqlite_baseline'
  ): IpdmGuidance {
    return {
      crop,
      condition,
      conditionType: 'DISEASE',
      prevention: [],
      biologicalControl: [],
      treatmentGuidance: [],
      precautions: [],
      symptoms: [],
      severity: 'Unknown',
      confidence: 0,
      dataSource: source,
      lastUpdated: new Date().toISOString(),
      sourceVersion: 'OFFLINE_UNAVAILABLE',
      isFallback: source === 'sqlite_fallback',
      isAvailable: false,
      unavailableMessage: message,
    };
  }

  /** Validates GPS coordinates for pest reports. Rejects invalid coordinates (NaN, out of range, 0,0) */
  public static validateCoordinates(lat: number, lon: number): boolean {
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (isNaN(lat) || isNaN(lon)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    if (lat === 0 && lon === 0) return false; // Common default/empty GPS
    return true;
  }

  /** Normalizes an incoming pest report */
  public static validatePestReport(payload: any): { isValid: boolean; error?: string; data?: PestReportPayload } {
    if (!payload || typeof payload !== 'object') {
      return { isValid: false, error: 'Empty or invalid report payload' };
    }

    const lat = Number(payload.latitude);
    const lon = Number(payload.longitude);

    if (!this.validateCoordinates(lat, lon)) {
      return { isValid: false, error: 'Invalid GPS coordinates. Accurate latitude/longitude is required for community alerts.' };
    }

    const crop = String(payload.crop || '').trim();
    const pest = String(payload.pest || '').trim();

    if (!crop || !pest) {
      return { isValid: false, error: 'Crop and pest names are required.' };
    }

    const severityRaw = String(payload.severity || 'HIGH').toUpperCase();
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const severity = validSeverities.includes(severityRaw)
      ? (severityRaw as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
      : 'HIGH';

    return {
      isValid: true,
      data: {
        farmerId: String(payload.farmerId || 'anonymous_farmer_' + Date.now()),
        farmerName: payload.farmerName ? String(payload.farmerName).trim() : undefined,
        crop,
        pest,
        severity,
        latitude: lat,
        longitude: lon,
        imageUrl: payload.imageUrl ? String(payload.imageUrl) : undefined,
        confidence: typeof payload.confidence === 'number' ? payload.confidence : undefined,
        notes: payload.notes ? String(payload.notes).trim() : undefined,
      },
    };
  }

  /** Normalizes a list of pest alerts */
  public static normalizeAlerts(rawList: any[]): PestAlert[] {
    if (!Array.isArray(rawList)) return [];

    return rawList
      .map((item, idx) => {
        if (!item || typeof item !== 'object') return null;
        const dist = Number(item.distanceKm ?? item.distance_km ?? item.distance);
        return {
          alertId: String(item.alertId || item.id || ('alert_' + idx + '_' + Date.now())),
          pest: String(item.pest || item.pest_name || 'Unspecified Pest'),
          crop: String(item.crop || item.crop_name || 'Crop'),
          severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(item.severity).toUpperCase())
            ? String(item.severity).toUpperCase()
            : 'HIGH') as any,
          distanceKm: !isNaN(dist) ? Math.round(dist * 10) / 10 : 0,
          reportedAt: String(item.reportedAt || item.created_at || new Date().toISOString()),
          message: String(item.message || 'Pest activity detected nearby. Inspect your fields immediately.'),
          latitude: Number(item.latitude || 0),
          longitude: Number(item.longitude || 0),
          verified: Boolean(item.verified ?? true),
        };
      })
      .filter((a): a is PestAlert => a !== null);
  }
}
