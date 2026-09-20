import { DiagnosisCase } from '../models/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CASES_KEY = 'krishi_marga_cases';

export const CaseStorage = {
  async saveCase(diagnosisCase: DiagnosisCase): Promise<void> {
    try {
      const existing = await CaseStorage.getCases();
      const updated = [diagnosisCase, ...existing.filter(c => c.caseId !== diagnosisCase.caseId)];
      await AsyncStorage.setItem(CASES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving case locally:', e);
    }
  },

  async getCases(): Promise<DiagnosisCase[]> {
    try {
      const data = await AsyncStorage.getItem(CASES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching cases:', e);
      return [];
    }
  },

  async deleteCase(caseId: string): Promise<void> {
    try {
      const existing = await CaseStorage.getCases();
      const filtered = existing.filter(c => c.caseId !== caseId);
      await AsyncStorage.setItem(CASES_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting case:', e);
    }
  }
};