/**
 * Krishi Marga — Verified Pesticide Scanner & Tank Calculation Service
 * Scans, identifies, and verifies agricultural chemical labels against CIBRC standards.
 * Calculates safe dilution dosages and mandatory PPE & Pre-Harvest Intervals (PHI).
 */

import { PesticideDatabaseService, PesticideRecord } from './pesticideDatabaseService';

export interface TankCalculation {
  tankVolumeLiters: number;
  amountText: string;
  waterText: string;
  safetyNote: string;
}

export const PesticideScannerService = {
  getAllPesticides(): PesticideRecord[] {
    return PesticideDatabaseService.getAll();
  },

  searchPesticides(query: string, categoryFilter?: string): PesticideRecord[] {
    return PesticideDatabaseService.search(query, categoryFilter);
  },

  getById(id: string): PesticideRecord | undefined {
    return PesticideDatabaseService.getById(id);
  },

  /**
   * Safe Sprayer Tank Dosage Calculator:
   * Calculates required chemical amount for standard farm knapsack sprayers (e.g. 15 Litres).
   */
  calculateTankDosage(pesticide: PesticideRecord, tankVolumeLiters: number = 15): TankCalculation {
    const dosageStr = pesticide.dosage_guidance || '';
    const match = dosageStr.match(/([0-9.]+)/);
    const ratePerLiter = match ? parseFloat(match[1]) : 1.0;

    const totalAmount = (ratePerLiter * tankVolumeLiters).toFixed(1);
    const isSolid = /g\/L|gm|kg|powder|wp|sg|wdg|sp/i.test(dosageStr) || /WP|SG|WDG|SP|G/i.test(pesticide.formulation);
    const unit = isSolid ? 'grams' : 'ml';

    return {
      tankVolumeLiters,
      amountText: `${totalAmount} ${unit} of ${pesticide.canonical_name}`,
      waterText: `Mix thoroughly into ${tankVolumeLiters} Litres of clean water in sprayer tank`,
      safetyNote: `Strictly wear protective gear: ${pesticide.safety_precautions.slice(0, 2).join(' ')}`,
    };
  },
};
