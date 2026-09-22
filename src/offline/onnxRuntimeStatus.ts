/**
 * KRISHI MARGA — OFFLINE RUNTIME CAPABILITY DETECTION
 * ------------------------------------------------------------------
 * The app must never claim that on-device model inference is running when the
 * pieces required for it are not actually present. This module reports, at
 * runtime, exactly which pieces exist.
 *
 * Genuine ONNX inference on this project requires ALL of the following:
 *
 *   1. `onnxruntime-react-native` linked into a native build.
 *      It contains native code, so it cannot run inside Expo Go — an Android
 *      development build / EAS build is required.
 *   2. A JPEG decoder available in JavaScript (`jpeg-js`) so a camera photo can
 *      be turned into a raw RGB pixel buffer for the tensor.
 *   3. The `disease.onnx` weight file for the selected crop bundled under
 *      assets/models/<crop>/.
 *
 * Installation for a development build:
 *   npx expo install onnxruntime-react-native
 *   npm install jpeg-js
 *   npx expo prebuild && npx expo run:android
 *
 * Neither package is added to package.json by default, because adding native
 * ONNX would break the current Expo Go workflow this project uses today.
 */

export type OfflineCapability =
  | 'MODEL_INFERENCE'        // real ONNX inference is possible
  | 'RUNTIME_MISSING'        // onnxruntime not linked (e.g. running in Expo Go)
  | 'DECODER_MISSING'        // no JS JPEG decoder to build the input tensor
  | 'MODEL_FILE_MISSING'     // no weights bundled for this crop
  | 'KNOWLEDGE_ONLY';        // only the bundled knowledge base is available

export interface RuntimeProbe {
  ortAvailable: boolean;
  decoderAvailable: boolean;
  details: string;
}

let cachedProbe: RuntimeProbe | null = null;

/** Attempts to load the optional native runtime and JPEG decoder. */
export function probeRuntime(): RuntimeProbe {
  if (cachedProbe) return cachedProbe;

  let ortAvailable = false;
  let decoderAvailable = false;
  const notes: string[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ort = require('onnxruntime-react-native');
    ortAvailable = !!(ort && ort.InferenceSession);
    if (!ortAvailable) notes.push('onnxruntime-react-native loaded but exposes no InferenceSession');
  } catch {
    notes.push('onnxruntime-react-native is not installed/linked in this build');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jpeg = require('jpeg-js');
    decoderAvailable = !!(jpeg && typeof jpeg.decode === 'function');
    if (!decoderAvailable) notes.push('jpeg-js loaded but exposes no decode()');
  } catch {
    notes.push('jpeg-js decoder is not installed');
  }

  cachedProbe = {
    ortAvailable,
    decoderAvailable,
    details: notes.length ? notes.join('; ') : 'Native ONNX runtime and JPEG decoder are available',
  };
  return cachedProbe;
}

/** Returns the optional onnxruntime module, or null when unavailable. */
export function getOrt(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ort = require('onnxruntime-react-native');
    return ort && ort.InferenceSession ? ort : null;
  } catch {
    return null;
  }
}

/** Returns the optional jpeg-js module, or null when unavailable. */
export function getJpegDecoder(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jpeg = require('jpeg-js');
    return jpeg && typeof jpeg.decode === 'function' ? jpeg : null;
  } catch {
    return null;
  }
}

/** Clears the cached probe (used by the diagnostics screen). */
export function resetRuntimeProbe(): void {
  cachedProbe = null;
}
