import * as SQLite from 'expo-sqlite';
import localDiseasesData from '../../knowledge/localDiseases.json';
import { IpdmGuidance } from '../models/ipdm.types';

const DB_NAME = 'krishi_marga_ipdm.db';

/**
 * OFFLINE IPDM MANAGEMENT DATABASE
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * - SQLite is NOT the disease/pest detection engine.
 * - SQLite is NOT an offline AI model.
 * - SQLite is NOT a complete offline disease database.
 * - SQLite does NOT perform image classification, pest identification, or disease discovery.
 *
 * Purpose:
 * Given an already-identified (crop, condition) pair from the AI diagnosis system,
 * retrieve essential management guidelines:
 * - prevention
 * - biological control
 * - treatment guidance
 * - precautions
 */
export class IpdmSqlite {
  private static dbInstance: any = null;
  private static initPromise: Promise<void> | null = null;

  public static async getDb() {
    if (this.dbInstance) return this.dbInstance;
    if (!this.initPromise) {
      this.initPromise = this.initDatabase();
    }
    await this.initPromise;
    return this.dbInstance;
  }

  private static async initDatabase(): Promise<void> {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      this.dbInstance = db;

      // Create IPDM management store table
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS ipdm_records (' +
        '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        '  crop TEXT NOT NULL,' +
        '  condition TEXT NOT NULL,' +
        '  condition_type TEXT NOT NULL,' +
        '  prevention TEXT NOT NULL,' +
        '  biological_control TEXT NOT NULL,' +
        '  treatment_guidance TEXT NOT NULL,' +
        '  precautions TEXT NOT NULL,' +
        '  severity TEXT,' +
        '  last_updated TEXT NOT NULL,' +
        '  source_version TEXT NOT NULL,' +
        '  regional_notes TEXT,' +
        '  UNIQUE(crop, condition) ON CONFLICT REPLACE' +
        ');'
      );

      // Seed initial IPDM management baselines if table is empty
      const countRow: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM ipdm_records');
      if (!countRow || countRow.count === 0) {
        await this.seedBaselineData(db);
      }
    } catch (e) {
      console.warn('[IpdmSqlite] DB initialization issue:', e);
    }
  }

  /**
   * Seeds essential IPDM management guidelines from reference knowledge.
   * Only stores agronomic actions: prevention, biological control, treatment, and precautions.
   * Does NOT store detection or classification weights.
   */
  private static async seedBaselineData(db: any): Promise<void> {
    try {
      const crops = (localDiseasesData as any).crops || {};
      for (const cropName of Object.keys(crops)) {
        const diseaseList = crops[cropName] || [];
        for (const item of diseaseList) {
          const preventionJson = JSON.stringify(item.prevention || []);
          const bioJson = JSON.stringify(item.organic_management || []);
          const treatmentJson = JSON.stringify(item.recommendations || []);
          const precautionsJson = JSON.stringify([
            'Adhere strictly to CIBRC dosage recommendations.',
            'Wear protective gear during application.',
          ]);

          await db.runAsync(
            'INSERT OR REPLACE INTO ipdm_records (' +
            '  crop, condition, condition_type, prevention,' +
            '  biological_control, treatment_guidance, precautions,' +
            '  severity, last_updated, source_version, regional_notes' +
            ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              cropName.toLowerCase().trim(),
              (item.disease || 'Unknown').toLowerCase().trim(),
              item.health_status === 'Healthy' ? 'HEALTHY' : 'DISEASE',
              preventionJson,
              bioJson,
              treatmentJson,
              precautionsJson,
              item.severity || 'Medium',
              new Date().toISOString(),
              'ICAR-NBAIR-2026-BASELINE',
              item.regional_advice || item.farmer_message || null,
            ]
          );
        }
      }
      console.log('[IpdmSqlite] Baseline IPDM management guidelines seeded.');
    } catch (err) {
      console.warn('[IpdmSqlite] Seed failed:', err);
    }
  }

  /**
   * Retrieves offline IPDM management guidelines for an ALREADY IDENTIFIED crop and condition.
   * Returns null if no management information exists locally.
   */
  public static async getGuidance(
    crop: string,
    condition: string
  ): Promise<IpdmGuidance | null> {
    try {
      const db = await this.getDb();
      const normCrop = (crop || '').toLowerCase().trim();
      const normCond = (condition || '').toLowerCase().trim();

      const query =
        'SELECT * FROM ipdm_records ' +
        'WHERE (crop = ? OR crop LIKE ? OR ? LIKE ("%" || crop || "%")) ' +
        '  AND (condition = ? OR condition LIKE ? OR ? LIKE ("%" || condition || "%")) ' +
        'LIMIT 1';

      const row: any = await db.getFirstAsync(
        query,
        [normCrop, '%' + normCrop + '%', normCrop, normCond, '%' + normCond + '%', normCond]
      );

      if (row) {
        return {
          crop: row.crop,
          condition: row.condition,
          conditionType: row.condition_type as any,
          prevention: JSON.parse(row.prevention || '[]'),
          biologicalControl: JSON.parse(row.biological_control || '[]'),
          treatmentGuidance: JSON.parse(row.treatment_guidance || '[]'),
          precautions: JSON.parse(row.precautions || '[]'),
          severity: row.severity || 'Medium',
          confidence: 0.85,
          dataSource: 'sqlite_baseline',
          lastUpdated: row.last_updated,
          sourceVersion: row.source_version,
          regionalNotes: row.regional_notes || undefined,
          isFallback: false,
          isAvailable: true,
        };
      }
      return null;
    } catch (e) {
      console.warn('[IpdmSqlite] Error reading IPDM guidance:', e);
      return null;
    }
  }

  /** Caches or updates live n8n IPDM record into local SQLite for future offline use */
  public static async saveGuidance(guidance: IpdmGuidance): Promise<void> {
    try {
      const db = await this.getDb();
      await db.runAsync(
        'INSERT OR REPLACE INTO ipdm_records (' +
        '  crop, condition, condition_type, prevention,' +
        '  biological_control, treatment_guidance, precautions,' +
        '  severity, last_updated, source_version, regional_notes' +
        ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          guidance.crop.toLowerCase().trim(),
          guidance.condition.toLowerCase().trim(),
          guidance.conditionType,
          JSON.stringify(guidance.prevention || []),
          JSON.stringify(guidance.biologicalControl || []),
          JSON.stringify(guidance.treatmentGuidance || []),
          JSON.stringify(guidance.precautions || []),
          guidance.severity,
          guidance.lastUpdated,
          guidance.sourceVersion,
          guidance.regionalNotes || null,
        ]
      );
    } catch (e) {
      console.warn('[IpdmSqlite] Error saving live guidance:', e);
    }
  }
}
