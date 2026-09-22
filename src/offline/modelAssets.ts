import * as FileSystem from 'expo-file-system/legacy';

/**
 * KRISHI MARGA — ONNX MODEL ASSET RESOLUTION
 * ------------------------------------------------------------------
 * ONNX weight files (`assets/models/<crop>/disease.onnx`) are large binaries.
 * A React Native bundler cannot `require()` an arbitrary path built at runtime,
 * and `.onnx` is not a bundler asset type by default, so the weights are
 * resolved from the filesystem of the installed application instead.
 *
 * Two supported layouts, checked in order:
 *   1. Models copied into the app's document directory at first run
 *      (documentDirectory + "models/<crop>/disease.onnx"). This is the layout
 *      used when models are downloaded or side-loaded after install.
 *   2. Models shipped inside the Android APK assets and exposed at
 *      bundleDirectory + "assets/models/<crop>/disease.onnx".
 *
 * IMPORTANT: this source archive does not contain the .onnx binaries — see
 * MODEL_ASSETS_MANIFEST.md. Until the weight files are present on the device,
 * `resolveModelPath` returns null and the app falls back to clearly-labelled
 * knowledge-base information rather than pretending to run a model.
 *
 * To make `.onnx` bundler-resolvable instead, add to metro.config.js:
 *   config.resolver.assetExts.push('onnx');
 * and register explicit `require()` calls per crop.
 */

const documentDirectory: string | null = (FileSystem as any).documentDirectory || null;
const bundleDirectory: string | null = (FileSystem as any).bundleDirectory || null;

const resolvedCache = new Map<string, string | null>();

function candidatePaths(cropId: string): string[] {
  const paths: string[] = [];
  if (documentDirectory) {
    paths.push(`${documentDirectory}models/${cropId}/disease.onnx`);
  }
  if (bundleDirectory) {
    paths.push(`${bundleDirectory}assets/models/${cropId}/disease.onnx`);
  }
  return paths;
}

export const ModelAssets = {
  /**
   * Returns the on-device file path of the crop model, or null when the weight
   * file is not present. Results are cached per crop.
   */
  async resolveModelPath(cropId: string): Promise<string | null> {
    if (resolvedCache.has(cropId)) return resolvedCache.get(cropId) ?? null;

    let found: string | null = null;
    for (const candidate of candidatePaths(cropId)) {
      try {
        const info = await FileSystem.getInfoAsync(candidate);
        if (info.exists && !info.isDirectory) {
          found = candidate;
          break;
        }
      } catch {
        // Unreadable candidate path is simply skipped.
      }
    }

    resolvedCache.set(cropId, found);
    return found;
  },

  /** Clears the resolution cache (used by the diagnostics screen). */
  clearCache(): void {
    resolvedCache.clear();
  },

  /** Paths that were searched — useful for the diagnostics screen. */
  describeSearchPaths(cropId: string): string[] {
    return candidatePaths(cropId);
  },
};
