import pesticideData from '../data/pesticideDatabase.json';

export interface PesticideRecord {
  id: string;
  canonical_name: string;
  common_brands: string[];
  active_ingredient: string;
  concentration: string;
  formulation: string;
  formulation_desc: string;
  chemical_group: string;
  toxicity_triangle: string;
  cibrc_status: string;
  is_banned: boolean;
  suitable_crops: string[];
  target_pests: string[];
  target_diseases: string[];
  category: string;
  farmer_explanation: string;
  why_farmers_use_it: string;
  safety_precautions: string[];
  dosage_guidance: string;
}

const DATABASE: PesticideRecord[] = pesticideData as PesticideRecord[];

export const PesticideDatabaseService = {
  /**
   * Get all verified pesticide records
   */
  getAll(): PesticideRecord[] {
    return DATABASE;
  },

  /**
   * Find record by exact id
   */
  getById(id: string): PesticideRecord | undefined {
    return DATABASE.find((p) => p.id.toLowerCase() === id.toLowerCase());
  },

  /**
   * Search database by brand, active ingredient, crop, or target pest
   */
  search(query: string, categoryFilter?: string): PesticideRecord[] {
    const q = query.toLowerCase().trim();
    return DATABASE.filter((item) => {
      // Category filter
      if (categoryFilter && categoryFilter !== 'ALL') {
        const itemCat = item.category.toUpperCase();
        if (categoryFilter === 'INSECTICIDE' && !itemCat.includes('INSECTICIDE')) return false;
        if (categoryFilter === 'FUNGICIDE' && !itemCat.includes('FUNGICIDE')) return false;
        if (categoryFilter === 'HERBICIDE' && !itemCat.includes('HERBICIDE')) return false;
        if (categoryFilter === 'BIO' && !itemCat.includes('BIO')) return false;
      }

      if (!q) return true;

      // Brand match
      if (item.common_brands.some((b) => b.toLowerCase().includes(q))) return true;
      // Canonical name match
      if (item.canonical_name.toLowerCase().includes(q)) return true;
      // Active ingredient match
      if (item.active_ingredient.toLowerCase().includes(q)) return true;
      // Crop match
      if (item.suitable_crops.some((c) => c.toLowerCase().includes(q))) return true;
      // Pest match
      if (item.target_pests.some((p) => p.toLowerCase().includes(q))) return true;
      // Disease match
      if (item.target_diseases.some((d) => d.toLowerCase().includes(q))) return true;

      return false;
    });
  },

  /**
   * Fuzzy find matching pesticide by text (from OCR/label)
   */
  findBestMatch(labelQuery: string): PesticideRecord | null {
    if (!labelQuery) return null;
    const lower = labelQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

    for (const item of DATABASE) {
      // Check brand names
      for (const brand of item.common_brands) {
        if (lower.includes(brand.toLowerCase())) {
          return item;
        }
      }
      // Check active ingredient
      if (lower.includes(item.active_ingredient.toLowerCase())) {
        return item;
      }
    }
    return null;
  },

  /**
   * Check if pesticide is suitable for a specific crop
   */
  checkCropCompatibility(pesticide: PesticideRecord, cropName: string): {
    isCompatible: boolean;
    badge: 'VERIFIED' | 'UNVERIFIED' | 'BANNED';
    message: string;
  } {
    if (pesticide.is_banned) {
      return {
        isCompatible: false,
        badge: 'BANNED',
        message: `STRICT WARNING: ${pesticide.canonical_name} is banned or strictly prohibited. Do not use.`,
      };
    }

    const normCrop = cropName.toLowerCase().trim();
    const isListed = pesticide.suitable_crops.some(
      (c) => c.toLowerCase().includes(normCrop) || normCrop.includes(c.toLowerCase())
    );

    if (isListed) {
      return {
        isCompatible: true,
        badge: 'VERIFIED',
        message: `Officially registered and approved for ${cropName} by CIBRC.`,
      };
    }

    return {
      isCompatible: false,
      badge: 'UNVERIFIED',
      message: `No verified CIBRC record found for ${cropName}. Consult local RSK or KVK extension officer before applying.`,
    };
  },
};
