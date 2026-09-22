import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  /** False when optimization failed and the original file is being used. */
  optimized: boolean;
}

/**
 * Upload budget.
 *
 * The server converts every uploaded image to Base64 and holds the whole set in
 * memory for the Gemini multimodal request, so the TOTAL upload size — not just
 * the per-image size — is what puts the backend at risk. Larger batches
 * therefore get smaller per-image dimensions. This keeps a 10-image request in
 * roughly the same memory envelope as a 2-image request while preserving the
 * lesion detail the model relies on.
 */
export const UploadBudget = {
  /** Hard ceiling on images per request, mirroring the server-side limit. */
  maxImages: 10,
  /** Target total payload for one request (bytes, before Base64 expansion). */
  targetTotalBytes: 2000000,

  /** Chooses a max dimension based on how many images are in the batch. */
  dimensionForBatch(count: number): number {
    if (count <= 2) return 1280;
    if (count <= 4) return 1100;
    if (count <= 7) return 960;
    return 820;
  },

  /** Chooses JPEG quality based on how many images are in the batch. */
  qualityForBatch(count: number): number {
    if (count <= 4) return 0.8;
    if (count <= 7) return 0.72;
    return 0.66;
  },
};

export const ImageOptimizer = {
  /**
   * Resizes an image to a maximum dimension and compresses it as JPEG.
   * Reduces modern 12MP-48MP camera files (4-10MB) to a few hundred KB without
   * losing the botanical lesion detail needed for diagnosis.
   * If manipulation fails (invalid URI, corrupt file, platform glitch) the
   * original URI is returned with `optimized: false`, so callers can decide
   * whether the file is still safe to upload.
   */
  async optimizeImage(
    uri: string,
    maxDimension: number = 1280,
    quality: number = 0.8
  ): Promise<OptimizedImageResult> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxDimension } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      let sizeBytes = 0;
      try {
        const info = await FileSystem.getInfoAsync(manipResult.uri);
        if (info.exists && typeof info.size === 'number') {
          sizeBytes = info.size;
        }
      } catch {
        // size lookup failure is non-fatal
      }

      return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        sizeBytes,
        optimized: true,
      };
    } catch (error) {
      console.warn('[ImageOptimizer] Optimization failed, falling back to original image:', error);
      return { uri, width: 0, height: 0, sizeBytes: 0, optimized: false };
    }
  },

  /**
   * Optimizes a batch of images.
   *
   * Processing is sequential rather than concurrent on purpose: decoding ten
   * full-resolution camera photos simultaneously is a common cause of
   * out-of-memory crashes on low-end Android handsets. Sequential processing
   * keeps peak memory to roughly one decoded image.
   */
  async optimizeBatch(
    uris: string[],
    maxDimension?: number,
    quality?: number
  ): Promise<string[]> {
    const detailed = await this.optimizeBatchDetailed(uris, maxDimension, quality);
    return detailed.map((r) => r.uri);
  },

  /** Batch optimization that preserves per-image metadata. */
  async optimizeBatchDetailed(
    uris: string[],
    maxDimension?: number,
    quality?: number
  ): Promise<OptimizedImageResult[]> {
    const capped = (uris || []).slice(0, UploadBudget.maxImages);
    const dimension = maxDimension ?? UploadBudget.dimensionForBatch(capped.length);
    const jpegQuality = quality ?? UploadBudget.qualityForBatch(capped.length);

    const results: OptimizedImageResult[] = [];
    let totalBytes = 0;

    for (const uri of capped) {
      // Step down further if the batch is already large, so a set of very
      // detailed photos cannot blow past the payload budget.
      const overBudget = totalBytes > UploadBudget.targetTotalBytes;
      const effectiveDimension = overBudget ? Math.round(dimension * 0.75) : dimension;
      const effectiveQuality = overBudget ? Math.max(0.6, jpegQuality - 0.08) : jpegQuality;

      const result = await this.optimizeImage(uri, effectiveDimension, effectiveQuality);
      totalBytes += result.sizeBytes;
      results.push(result);
    }

    if (__DEV__) {
      console.log(
        `[ImageOptimizer] Prepared ${results.length} image(s), ~${Math.round(totalBytes / 1024)}KB total`
      );
    }

    return results;
  },
};
