import * as ImageManipulator from 'expo-image-manipulator';
import { getJpegDecoder } from './onnxRuntimeStatus';

/**
 * KRISHI MARGA — ONNX INPUT PREPROCESSING
 * ------------------------------------------------------------------
 * Produces the exact tensor the bundled classifiers expect:
 *
 *   shape  : [1, 3, 224, 224]   (NCHW)
 *   dtype  : float32
 *   colour : RGB, alpha discarded
 *   value  : (pixel/255 - mean[c]) / std[c]
 *            mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225]
 *
 * Aspect ratio is preserved with letterbox padding (neutral 114/255) rather
 * than stretching, because non-uniform stretching distorts lesion shape — the
 * feature the classifier depends on.
 *
 * This requires a JavaScript JPEG decoder (`jpeg-js`). When it is unavailable
 * the function returns null and the caller must NOT claim inference happened.
 */

export const TENSOR_SPEC = {
  width: 224,
  height: 224,
  channels: 3,
  layout: 'NCHW' as const,
  dtype: 'float32' as const,
  mean: [0.485, 0.456, 0.406] as [number, number, number],
  std: [0.229, 0.224, 0.225] as [number, number, number],
  padValue: 114 / 255,
};

export interface PreprocessedTensor {
  data: Float32Array;
  dims: [number, number, number, number];
}

/** Decodes a base64 JPEG into {width,height,RGBA bytes}, or null if impossible. */
function decodeJpegBase64(base64: string): { width: number; height: number; data: Uint8Array } | null {
  const jpeg = getJpegDecoder();
  if (!jpeg) return null;

  try {
    // React Native provides atob via its polyfills; Buffer exists in some
    // environments. Both are read off globalThis so this file needs no Node types.
    const g: any = globalThis as any;
    let bytes: Uint8Array;

    if (typeof g.atob === 'function') {
      const binary: string = g.atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } else if (g.Buffer && typeof g.Buffer.from === 'function') {
      bytes = new Uint8Array(g.Buffer.from(base64, 'base64'));
    } else {
      console.warn('[Preprocess] No base64 decoder available in this runtime.');
      return null;
    }

    // useTArray keeps the result as a typed array instead of a Node Buffer.
    const raw = jpeg.decode(bytes, { useTArray: true });
    if (!raw || !raw.data || !raw.width || !raw.height) return null;
    return { width: raw.width, height: raw.height, data: raw.data as Uint8Array };
  } catch (e) {
    console.warn('[Preprocess] JPEG decode failed:', e);
    return null;
  }
}

/**
 * Resizes an image so its longest side is 224px, keeping aspect ratio, and
 * returns the decoded RGBA buffer plus the scaled dimensions.
 */
async function loadScaledRgba(
  uri: string
): Promise<{ width: number; height: number; data: Uint8Array } | null> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: TENSOR_SPEC.width } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    const base64 = manipulated.base64;
    if (!base64) return null;

    const decoded = decodeJpegBase64(base64);
    if (!decoded) return null;

    // If the height still exceeds the target, redo the resize constrained by height.
    if (decoded.height > TENSOR_SPEC.height) {
      const second = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { height: TENSOR_SPEC.height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (second.base64) {
        const redone = decodeJpegBase64(second.base64);
        if (redone) return redone;
      }
    }

    return decoded;
  } catch (e) {
    console.warn('[Preprocess] Image load/resize failed:', e);
    return null;
  }
}

export const Preprocessor = {
  /**
   * Builds the [1,3,224,224] float32 NCHW tensor for one image.
   * Returns null when the image cannot be decoded (no decoder installed, or a
   * malformed/corrupt file). Callers must treat null as "no inference possible".
   */
  async toTensor(uri: string): Promise<PreprocessedTensor | null> {
    const rgba = await loadScaledRgba(uri);
    if (!rgba) return null;

    const { width: W, height: H, data } = rgba;
    if (W <= 0 || H <= 0 || data.length < W * H * 4) return null;

    const { width: TW, height: TH, mean, std, padValue } = TENSOR_SPEC;
    const planeSize = TW * TH;
    const out = new Float32Array(3 * planeSize);

    // Pre-fill with normalized neutral padding so letterbox borders are correct.
    for (let c = 0; c < 3; c++) {
      const padNorm = (padValue - mean[c]) / std[c];
      out.fill(padNorm, c * planeSize, (c + 1) * planeSize);
    }

    // Centre the scaled image inside the 224x224 canvas.
    const offsetX = Math.floor((TW - Math.min(W, TW)) / 2);
    const offsetY = Math.floor((TH - Math.min(H, TH)) / 2);
    const copyW = Math.min(W, TW);
    const copyH = Math.min(H, TH);

    for (let y = 0; y < copyH; y++) {
      for (let x = 0; x < copyW; x++) {
        const srcIdx = (y * W + x) * 4; // RGBA
        const dstIdx = (y + offsetY) * TW + (x + offsetX);

        const r = data[srcIdx] / 255;
        const g = data[srcIdx + 1] / 255;
        const b = data[srcIdx + 2] / 255;

        out[dstIdx] = (r - mean[0]) / std[0];
        out[planeSize + dstIdx] = (g - mean[1]) / std[1];
        out[2 * planeSize + dstIdx] = (b - mean[2]) / std[2];
      }
    }

    return { data: out, dims: [1, 3, TH, TW] };
  },

  /** Numerically stable softmax over raw logits. */
  softmax(logits: Float32Array | number[]): number[] {
    const arr = Array.from(logits);
    if (arr.length === 0) return [];
    const max = Math.max(...arr);
    const exps = arr.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    return exps.map((e) => e / sum);
  },

  /**
   * Averages per-image class probabilities into one distribution.
   * Every image carries equal weight; no synthetic confidence bonus is added.
   */
  averageProbabilities(all: number[][]): number[] {
    if (all.length === 0) return [];
    const n = all[0].length;
    const acc = new Array(n).fill(0);
    for (const probs of all) {
      for (let i = 0; i < n && i < probs.length; i++) acc[i] += probs[i];
    }
    return acc.map((v) => v / all.length);
  },
};
