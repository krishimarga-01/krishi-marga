import { IpdmGuidance, IpdmRequestPayload } from '../models/ipdm.types';
import { IpdmValidation } from '../models/ipdm.validation';
import { IpdmNetwork } from './ipdm.network';
import { IpdmSqlite } from '../storage/ipdm.sqlite';
import { IpdmN8nApi } from '../api/ipdm.n8n';

/**
 * IPDM SERVICE — LAYER 1 ORCHESTRATOR
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * - This service does NOT detect diseases or pests.
 * - This service is queried ONLY AFTER the existing AI diagnosis system has identified the condition.
 * - SQLite is strictly an OFFLINE IPDM MANAGEMENT STORE.
 * - If no offline guidance is found in SQLite, it returns a safe unavailable message without inventing advice.
 */
export class IpdmService {
  public static async getGuidance(payload: IpdmRequestPayload): Promise<IpdmGuidance> {
    const crop = payload.crop || 'Crop';
    const condition = payload.disease || payload.pest || 'Condition';

    // 1. Check network connectivity
    const online = await IpdmNetwork.isConnected();

    if (online) {
      try {
        const liveExpanded = await IpdmN8nApi.fetchExpandedGuidance(payload);
        if (liveExpanded && liveExpanded.isAvailable !== false) {
          // Cache expanded management guidance into local SQLite for future offline use
          await IpdmSqlite.saveGuidance(liveExpanded);
          return liveExpanded;
        }
      } catch (err) {
        console.warn('[IpdmService] Live n8n fetch failed, falling back to SQLite IPDM:', err);
      }

      // Online failed -> Fallback to SQLite IPDM store
      const fallbackRecord = await IpdmSqlite.getGuidance(crop, condition);
      if (fallbackRecord) {
        fallbackRecord.dataSource = 'sqlite_fallback';
        fallbackRecord.isFallback = true;
        return fallbackRecord;
      }

      // Condition not in SQLite either -> safe unavailable guidance
      return IpdmValidation.createUnavailableGuidance(
        crop,
        condition,
        'Offline guidance for this condition is unavailable. Connect to the internet for expanded IPDM guidance.',
        'sqlite_fallback'
      );
    }

    // 2. OFFLINE BEHAVIOR:
    // Query SQLite IPDM management store for this already-identified crop and condition
    const localBaseline = await IpdmSqlite.getGuidance(crop, condition);
    if (localBaseline) {
      localBaseline.dataSource = 'sqlite_baseline';
      localBaseline.isFallback = false;
      return localBaseline;
    }

    // If condition is not in SQLite:
    // Return safe message without inventing missing agricultural information
    return IpdmValidation.createUnavailableGuidance(
      crop,
      condition,
      'Offline guidance for this condition is unavailable. Connect to the internet for expanded IPDM guidance.',
      'sqlite_baseline'
    );
  }
}
