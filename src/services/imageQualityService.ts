import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export interface ImageQualityResult {
  uri: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  status: 'OPTIMAL' | 'LOW_QUALITY' | 'UNUSABLE';
  reasons: string[];
  userNotice?: string;
}

export interface BatchQualityAssessment {
  allUsable: boolean;
  hasLowQualityWarning: boolean;
  unusableCount: number;
  lowQualityCount: number;
  results: ImageQualityResult[];
  summaryNotice?: string;
}

export interface PreprocessedImage {
  uri: string;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  originalSizeBytes: number;
  processedSizeBytes: number;
  filename: string;
  mimeType: string;
}

// Resolution & Quality Constraints
export const QUALITY_THRESHOLDS = {
  MIN_USABLE_DIMENSION: 120,    // Below 120x120 is considered unusable/corrupt
  MIN_USABLE_BYTES: 4000,       // Below 4KB cannot contain diagnostic botanical details
  LOW_QUALITY_DIMENSION: 320,   // 120px - 320px: low quality (e.g. 240p thumbnail), but usable
  LOW_QUALITY_BYTES: 15000,     // Below 15KB: heavily compressed WhatsApp or thumbnail
  MAX_TARGET_DIMENSION: 1280,   // Optimal mobile upload dimension preserving leaf lesions
  ONNX_TARGET_DIMENSION: 224,   // Standard botanical ONNX classification input size
};

export const ImageQualityService = {
  /**
   * Safe asynchronous inspection of image dimensions
   * Supports file://, content://, and data URIs across Android/iOS
   */
  getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      Image.getSize(
        uri,
        (width, height) => {
          resolve({ width: width || 0, height: height || 0 });
        },
        () => {
          // If native decoder cannot inspect directly, return fallback safe minimums
          resolve({ width: 0, height: 0 });
        }
      );
    });
  },

  /**
   * Safe retrieval of file size in bytes
   */
  async getFileSize(uri: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof info.size === 'number') {
        return info.size;
      }
      return 0;
    } catch {
      return 0;
    }
  },

  /**
   * Inspect a single photo against farmer photography requirements
   */
  async inspectImage(uri: string): Promise<ImageQualityResult> {
    const [{ width, height }, fileSizeBytes] = await Promise.all([
      this.getImageDimensions(uri),
      this.getFileSize(uri),
    ]);

    const reasons: string[] = [];
    let status: 'OPTIMAL' | 'LOW_QUALITY' | 'UNUSABLE' = 'OPTIMAL';

    // 1. Check Unusable Bounds
    if (fileSizeBytes > 0 && fileSizeBytes < QUALITY_THRESHOLDS.MIN_USABLE_BYTES) {
      status = 'UNUSABLE';
      reasons.push('File size is too small to contain visible plant features (< 4KB).');
    }

    if (width > 0 && height > 0) {
      if (width < QUALITY_THRESHOLDS.MIN_USABLE_DIMENSION || height < QUALITY_THRESHOLDS.MIN_USABLE_DIMENSION) {
        status = 'UNUSABLE';
        reasons.push(`Image resolution (${width}x${height}) is below usable threshold (< 120px).`);
      } else if (width < QUALITY_THRESHOLDS.LOW_QUALITY_DIMENSION || height < QUALITY_THRESHOLDS.LOW_QUALITY_DIMENSION) {
        if (status !== 'UNUSABLE') {
          status = 'LOW_QUALITY';
          reasons.push(`Low resolution photo (${width}x${height} ~240p/320p).`);
        }
      }
    }

    // 2. Check Low-Quality WhatsApp / High-Compression Bounds
    if (status === 'OPTIMAL' && fileSizeBytes > 0 && fileSizeBytes < QUALITY_THRESHOLDS.LOW_QUALITY_BYTES) {
      status = 'LOW_QUALITY';
      reasons.push('High compression detected (under 15KB).');
    }

    let userNotice: string | undefined;
    if (status === 'UNUSABLE') {
      userNotice = 'Please choose a clearer photo of the crop.';
    } else if (status === 'LOW_QUALITY') {
      userNotice = 'Photo quality is low. Try taking the photo closer to the affected part if possible.';
    }

    return {
      uri,
      width,
      height,
      fileSizeBytes,
      status,
      reasons,
      userNotice,
    };
  },

  /**
   * Evaluate a full batch of 1 to 10 crop leaf images
   */
  async inspectBatch(uris: string[]): Promise<BatchQualityAssessment> {
    const results = await Promise.all(uris.map((u) => this.inspectImage(u)));

    const unusableCount = results.filter((r) => r.status === 'UNUSABLE').length;
    const lowQualityCount = results.filter((r) => r.status === 'LOW_QUALITY').length;

    const allUsable = unusableCount === 0;
    const hasLowQualityWarning = lowQualityCount > 0;

    let summaryNotice: string | undefined;
    if (!allUsable) {
      summaryNotice = 'Please choose a clearer photo of the crop.';
    } else if (hasLowQualityWarning) {
      summaryNotice = 'Photo quality is low. Try taking the photo closer to the affected part if possible.';
    }

    return {
      allUsable,
      hasLowQualityWarning,
      unusableCount,
      lowQualityCount,
      results,
      summaryNotice,
    };
  },

  /**
   * Sanitize image filenames and MIME types from camera, gallery, WhatsApp, or screenshots
   */
  sanitizeMetadata(uri: string, index: number): { filename: string; mimeType: string } {
    let cleanUri = uri.split('?')[0].split('#')[0];
    let filename = cleanUri.split('/').pop() || `leaf_${index + 1}.jpg`;

    // Ensure valid extension
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

    if (ext === 'jpeg') ext = 'jpg';
    if (!['jpg', 'png', 'webp'].includes(ext)) {
      ext = 'jpg';
      filename = `leaf_${index + 1}.jpg`;
    }

    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };

    return {
      filename,
      mimeType: mimeMap[ext] || 'image/jpeg',
    };
  },

  /**
   * Prepare an image for Offline ONNX runtime
   * Preserves standard input tensor specs (224x224, Normalized Mean/Std)
   */
  getOnnxPreprocessingConfig() {
    return {
      targetDimension: QUALITY_THRESHOLDS.ONNX_TARGET_DIMENSION, // 224x224
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      channels: 3,
      format: 'NCHW' as const,
    };
  },
};
