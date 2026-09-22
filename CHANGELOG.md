# CHANGELOG — Krishi Marga Source Code Fixes

All changes were made to a working copy of the uploaded archive. No original
file was deleted. 392 files in, 398 files out (6 new files, listed at the end).

Static verification performed on the modified project:

- `npx tsc --noEmit` → **0 errors** (the unmodified original also compiled with 0 errors, so this is not a regression baseline shift)
- All 100+ JSON files parse
- Both workflow JSONs validated: every connection target resolves to an existing node, required top-level keys present, 2 webhooks / 2 responders
- Secret scan across all source, config and docs → no keys found
- File-parity check → no deletions

**Not tested:** nothing was run on a device or emulator, and no request was made
to a live n8n instance or to Gemini. Runtime behaviour of the app and workflow
still needs to be exercised by you.

---

## 1. `src/services/config.ts` — rewritten

**Changed:** Removed all LAN, tunnel and debugger-host resolution. The endpoint
now comes only from `EXPO_PUBLIC_BACKEND_URL`, `app.json → extra.backendUrl`, or
(in `__DEV__` only) `EXPO_PUBLIC_DEV_BACKEND_URL`. Deleted the hardcoded fallback
IP `10.204.126.232`, the `Constants.manifest.debuggerHost` / `hostUri` parsing,
and the `require('os').networkInterfaces()` block. Added `getEndpointUrl()` which
derives per-feature webhook paths from one base URL, `isConfigured()`,
`isSecure()`, `describeBackend()` (non-throwing, for diagnostics), and a
`NetworkBudget` block holding every timeout and retry constant.

**Reason:** Production must reach a permanent HTTPS endpoint. The old code
guessed a developer laptop address whenever nothing else was set, and
`os.networkInterfaces()` does not exist in React Native at all — that branch
could only ever throw.

**Result:** No production code path depends on `192.168.x.x`, `10.x.x.x`,
`localhost`, the Expo debugger host, or a tunnel URL. A release build with a
non-HTTPS URL, or no URL, now raises `BackendNotConfiguredError` with an
actionable message instead of silently failing to connect.

---

## 2. `src/services/httpClient.ts` — new file

**Changed:** Added one shared multipart uploader used by both scanners. It
provides a hard timeout, a cancel handle, upload-progress callbacks, in-flight
de-duplication keyed on a request signature, and at most one retry — only for
transport-level failures.

**Reason:** The two services each had their own copy of XHR handling with
different timeouts, different error names, no cancellation and no de-duplication.

**Result:** Duplicate submissions of identical photos share one upload. Retries
are bounded (`maxTransientRetries: 1`), so no infinite retry loop is possible. A
genuine 4xx/5xx is classified `SERVER_ERROR` and surfaced, never disguised as a
network problem.

---

## 3. `src/services/diagnosisApi.ts` — rewritten

**Changed:**
- `DEFAULT_N8N_WEBHOOK_URL` (a module-level `Config.getBackendUrl()` call) replaced with the lazy `getDefaultWebhookUrl()`.
- Transport moved to `HttpClient`; timeout raised from 25s to `NetworkBudget.diagnosisTimeoutMs` (75s).
- Added `scan_type: 'disease'` to the form body.
- Added `parseAndNormalize()`, which rejects a non-object response, honours `success: false`, and requires at least one diagnosis field before building a result.
- Confidence is only trusted when the server actually sent a number. Missing confidence now yields `confidence_level: 'Low'` and `health_status: 'Uncertain'`.
- Error cases widened to include `TIMEOUT`, `ABORTED`, `NOT_CONFIGURED`, `INVALID_RESPONSE`, `NO_IMAGES`, each carrying a `retryable` flag.

**Reason:** The old module called `Config.getBackendUrl()` at import time, so an
unconfigured build crashed on first import. The 25s timeout was shorter than the
workflow's own 37s sequential failover budget, guaranteeing client-side timeouts
on any failover. A missing `confidence` silently defaulted to `0.85`, so an
empty server response rendered as a confident-looking diagnosis.

**Result:** The client timeout now sits above the documented server worst case
(~45s). Malformed and server-rejected responses fail in a controlled way rather
than producing a plausible-looking empty result card.

---

## 4. `src/services/pesticideService.ts` — rewritten

**Changed:**
- Now posts to the dedicated `/webhook/scan-pesticide` endpoint instead of the disease webhook.
- Honours `success: false` from the server and throws instead of rendering a blank card.
- Validates that `result.identified` is present before normalizing.
- Removed the three hardcoded fallback safety instructions that were emitted when neither the AI nor the local database supplied any. Replaced with a single instruction to read the printed label.
- Label photos now use their own compression profile (1600px, quality 0.85, max 3 images) rather than the leaf-photo profile.
- Added `lookupOffline()` and a `data_source` field (`ai_label_reading` / `ai_plus_local_database` / `local_database`).
- Fixed the error message that claimed "timed out after 60 seconds" while the timeout was set to 25s.

**Reason:** The app sent `scan_type=pesticide` to `detect-disease`, where the
crop validator rejected it with `INVALID_CROP` and returned `success: false`.
The old code did `const res = raw.result || {}`, so that rejection became an
empty object and the UI showed a result card populated entirely with invented
fallback safety text. Aggressive leaf-photo compression also destroyed the small
printed text that label OCR depends on.

**Result:** Label scans reach the correct workflow branch. Safety and dosage text
comes only from the AI's reading of the label or from the bundled CIBRC record —
nothing is invented. Server failures produce a real message plus a route to the
offline directory.

---

## 5. `src/services/imageOptimizer.ts` — rewritten

**Changed:** Batch processing changed from `Promise.all` (fully concurrent) to
sequential. Added a `UploadBudget` that scales max dimension and JPEG quality to
the batch size (1280px for 1-2 images down to 820px for 8-10), caps the batch at
10 images, and steps down further once a running total passes ~2MB. Added an
`optimized: boolean` flag so callers can tell a real optimization from a
fall-through to the original file.

**Reason:** `Promise.all` decoded up to ten full-resolution camera photos
simultaneously — a common out-of-memory crash on low-end Android. A 10-image
batch at the old fixed settings also produced a payload that the server had to
hold in memory as Base64, roughly 33% larger again.

**Result:** Peak device memory is roughly one decoded image. A 10-image request
now lands in a similar payload envelope to a 2-image request.

---

## 6. `src/offline/onnxEngine.ts` — rewritten

**Changed:** The old `runInference()` never touched a model. It read
`cropDiseases[0]` from the knowledge JSON, computed confidence as
`min(0.94, 0.78 + (imageCount - 1) * 0.03)`, set `analysis_source: 'offline'`,
and returned `"Offline diagnosis confirmed {disease}"`. The image URIs were
accepted and ignored. That has been removed and replaced with two clearly
separated paths:

1. `runModelInference()` — genuine ONNX inference. Preprocesses each photo to a real `[1,3,224,224]` NCHW float32 tensor, runs the session per image, applies softmax, averages probabilities across images, and takes the top class. The reported confidence is the model's own averaged probability, with no image-count bonus and no floor. Returns `null` if the session, tensors or outputs are unusable.
2. `buildKnowledgeResult()` — knowledge-base lookup, marked `analysis_source: 'offline_knowledge'`, `is_diagnosis: false`, `confidence: 0`, `health_status: 'Uncertain'`, with a localized `source_note` in all six languages stating it is not an AI diagnosis, plus a `reference_conditions` list.

Also changed: `loadCropModel()` now resolves a real on-device file path via the
new `ModelAssets` module instead of passing the bundler-unresolvable relative
string `assets/models/<crop>/disease.onnx`. Added `releaseSession()` and
`getCapability()`. The old `runIndependentPestAssessment` /
`runIndependentNutrientAssessment` (which returned hardcoded 0.86 and 0.82
confidences for pests and nutrients nobody had detected) are now
`getPestReference()` / `getNutrientReference()` with status
`KNOWLEDGE_AVAILABLE` and no confidence field. `getCropProtectionReference()` no
longer falls back to inventing "Azadirachtin 0.03% EC / Copper Oxychloride 50% WP"
when the dataset has no entry — it returns an empty list and advises consulting
RSK/KVK. The hardcoded `100:50:50` / `120:60:60` NPK guess was removed.

**Reason:** Presenting a static knowledge-base row as a 78-94% confident AI
diagnosis of a photo the code never examined is exactly the fabrication your
brief forbids, and the invented pesticide and NPK figures are a safety issue.

**Result:** The app either runs a real model or clearly says it is showing
reference information. The two are distinguishable by `analysis_source` and
`is_diagnosis`, and the offline path no longer states chemical recommendations
that are not in the bundled dataset.

---

## 7. `src/offline/onnxRuntimeStatus.ts` — new file

**Changed:** Runtime capability probe. Attempts to load `onnxruntime-react-native`
and `jpeg-js` and reports exactly which are present, with `getOrt()`,
`getJpegDecoder()` and a cached `probeRuntime()`.

**Reason:** Nothing in the codebase could tell whether on-device inference was
actually possible, so the app asserted it was.

**Result:** The app can state its true capability. See "Deployment work still
required" below — neither package is currently installed.

---

## 8. `src/offline/preprocess.ts` — new file

**Changed:** Implements the preprocessing the old comments described but never
performed: aspect-ratio-preserving resize, neutral letterbox padding at 114/255,
RGB extraction with alpha discarded, NCHW channel-planar layout, ImageNet
mean/std normalization, numerically stable softmax, and equal-weight probability
averaging across images. Returns `null` when no JPEG decoder is available.

**Reason:** The old file contained a 40-line specification of this pipeline as a
comment block, and a `getPreprocessingSpec()` function returning a description of
it, but no implementation.

**Result:** A real input tensor can be built once `jpeg-js` is installed.

---

## 9. `src/offline/modelAssets.ts` — new file

**Changed:** Resolves `disease.onnx` from `documentDirectory + models/<crop>/` or
`bundleDirectory + assets/models/<crop>/`, with caching and a
`describeSearchPaths()` helper for diagnostics.

**Reason:** `InferenceSession.create('assets/models/tomato/disease.onnx')` cannot
work — that path is neither a bundler asset reference nor a filesystem path. A
React Native bundler also cannot `require()` a path built at runtime, and `.onnx`
is not a registered asset extension.

**Result:** Model loading targets real file paths and reports honestly when the
weights are absent — which, in this archive, they are for every crop.

---

## 10. `src/screens/AnalyzingScreen.tsx` — logic rewritten, UI untouched

**Changed:**
- **Retry fixed.** The old handler passed the already-cleared `intervalId` into a recursive `runDiagnosis(intervalId)`, so a retry ran with a dead progress ticker that never restarted. Retry now calls a single `runDiagnosis()` entry point that restarts the ticker, clears prior state and cancels any prior upload.
- **Offline path implemented.** Previously no connectivity meant an alert and `goBack()`, even for crops with offline content — and `OnnxEngine` was imported into this screen and never called. Now `runOffline()` runs whatever genuine capability exists and tells the farmer which one they got.
- **Mid-request network failure** now falls back to the offline path when the crop has offline capability, instead of only showing an error.
- **Watchdog added** at `diagnosisTimeoutMs + 20s` as an absolute ceiling on the analysing state.
- **Unmount cleanup added:** clears all three timers and cancels the in-flight upload.
- **`AsyncStorage` failure no longer strands the user** — `saveCase` is wrapped so a storage error cannot block navigation to the result.
- Offline results are saved with `syncStatus: 'pending'` rather than `'synced'`.
- Error titles are now specific: Server Not Configured / Server Took Too Long / Server Error / Diagnosis Error, with Retry shown only when the error is retryable.

**Reason:** Several paths could leave the app permanently on the analysing
screen, and the retry button did not work.

**Result:** Every path exits the loading state. No styles, colours, layout or
copy in the rendered output were altered.

---

## 11. `src/screens/PesticideScannerScreen.tsx` — `handleScan` rewritten

**Changed:** Added a synchronous `isScanningRef` duplicate-tap guard (state
updates settle too late to prevent a double fire), an `isMountedRef` so a
response arriving after navigation cannot call `setState`, upload cancellation on
unmount, and an offline pre-check that routes to the directory rather than
waiting for a timeout. The catch block now shows the real error — the old one
reported every failure, including HTTP 500 and malformed JSON, as
"Could not reach the online label recognition engine". Retry is offered when the
error is retryable, and `setIsScanning(false)` runs on every path.

**Reason:** Real server errors were hidden, and a mid-scan navigation left the
upload running.

**Result:** Failures are accurate and actionable. The offline directory remains
reachable from every error state. No UI styling changed.

---

## 12. `src/screens/ResultScreen.tsx` — two-line addition

**Changed:** When `is_diagnosis === false`, the confidence value renders as `—`
instead of `Low (0%)`, and the localized `source_note` appears below the
condition name using a new `sourceNoteText` style consistent with the existing
card.

**Reason:** A knowledge-base lookup must not be presented in the same visual
language as an AI diagnosis. `analysis_source: 'offline_knowledge'` already falls
into the existing "offline" badge branch, so no badge logic changed.

**Result:** Reference results are labelled. Colours, fonts, layout and navigation
are unchanged.

---

## 13. `src/screens/DevBuildStatusScreen.tsx` — accuracy fixes

**Changed:** Added an `unconfigured` connection state so a build with no endpoint
reports "NOT CONFIGURED" rather than "UNREACHABLE"; `Config.getBackendUrl()`
replaced with the non-throwing `describeBackend()`. The hardcoded claims
"8 crops trained & exported", "REQUIRES NATIVE BUILD" and "Embedded Agronomic
Database Active" were replaced with live probe values: registry entry count,
ONNX runtime LINKED/NOT LINKED, decoder AVAILABLE/NOT INSTALLED, on-device
inference POSSIBLE/UNAVAILABLE, and a note that the no-model path is
knowledge-base reference only.

**Reason:** This screen is labelled "Live Runtime Ground Truth" but three of its
rows were hardcoded strings, and it would have thrown on an unconfigured build.

**Result:** The panel reports what is actually loaded.

---

## 14. `src/models/index.ts` — type additions

**Changed:** `AnalysisSource` extended with `'offline_knowledge'`. Added optional
`is_diagnosis`, `source_note` and `reference_conditions` to `NormalizedResult`.

**Reason:** The type system had no way to express "this is reference information,
not a diagnosis".

**Result:** All additions are optional, so existing stored cases in AsyncStorage
still satisfy the type.

---

## 15. `active_workflow.json` + `n8n/krishi_marga_workflow.json` — 16 nodes → 24

`n8n/krishi_marga_workflow.json` is the canonical copy; `active_workflow.json` is
identical. The other four workflow exports in the root
(`current_wf.json`, `workflow_exported.json`, `exported_workflows.json`,
`api_workflow_fetched.json`) were left untouched as historical snapshots.

### 15a. Pesticide branch added (8 new nodes)

**Changed:** New `POST /webhook/scan-pesticide` entry point with its own
validation, Gemini vision call, response evaluation, formatter, error node and
responder: `1P` … `7P` plus `Pesticide Error JSON`.

**Reason:** There was no pesticide branch at all. Every label scan hit the crop
validator and was rejected.

**Result:** Label scanning has a working server path. The prompt instructs the
model to read only what is printed and to leave fields null when illegible —
dosage in particular is only reported when the number and unit are visible.

### 15b. Gemini nodes no longer abort the execution

**Changed:** All four HTTP Request nodes set to `onError: continueRegularOutput`,
`alwaysOutputData: true`, `retryOnFail: false`, and `neverError: true` on the
response option. The evaluate nodes were updated to recognise an error-shaped
item and return `is_usable: false`.

**Reason:** Without `onError`, a Gemini 4xx/5xx or timeout aborted the whole
execution. `respondToWebhook` never ran, so the phone received nothing and waited
out its own timeout with no explanation.

**Result:** A failed model call now flows into the failover chain and, if all
three fail, produces a controlled JSON error the webhook actually returns.

### 15c. Memory protections

**Changed:** The validate node no longer returns `images: imagesList` alongside
`geminiPayload` — that was a second full Base64 copy of every photo in the node
output. Added per-image caps (4MB disease / 5MB pesticide), a 12MB combined
payload cap, and an `UNREADABLE_IMAGE` guard for empty decode results. Workflow
settings now include `saveExecutionProgress: false`,
`saveDataSuccessExecution: "none"` and `executionTimeout: 120`.

**Reason:** Peak memory per request was roughly double what it needed to be, and
n8n was persisting multi-megabyte image payloads into its execution database on
every single scan.

**Result:** Sharply lower memory and disk growth per request.

### 15d. Timeout budget aligned

**Changed:** Model timeouts set to 15s / 15s / 12s (from 10s / 12s / 15s), giving
a ~45s server worst case against the client's 75s ceiling.

**Reason:** The old 37s server budget exceeded the client's 25s timeout, so any
failover was guaranteed to time out on the phone.

### 15e. Made cleanly importable

**Changed:** Added `name`, `active: false`, `settings`, `tags`, `pinData`. The
file previously contained only `nodes` and `connections`.

**Result:** Validated — all connection targets resolve, no duplicate node ids,
2 webhooks and 2 responders. Credentials are referenced by n8n credential id and
name only; no key material is in the file.

---

## 16. `.env.example` — rewritten

**Changed:** Reduced the mobile section to one variable,
`EXPO_PUBLIC_BACKEND_URL`, with an HTTPS example and an explicit note that
release builds require HTTPS. Removed the LAN-IP example. Moved
`GEMINI_API_KEY` under a server-side heading with an explanation that anything
prefixed `EXPO_PUBLIC_` is compiled into the APK and readable by anyone. Marked
`DATABASE_URL` as not implemented.

**Reason:** The old file's primary example was `http://YOUR_LAN_IP:5678/...` and
it listed the Gemini key in the same block as the Expo config, inviting exactly
the mistake that would leak it.

---

## 17. `n8n/README_N8N.md` — new file

Import steps, credential setup, the webhook path table, the full timeout budget,
and the reverse-proxy requirement.

---

## Dependencies

`package.json` and `package-lock.json` are **unchanged**. No package was added,
removed or upgraded. `npm install` completed cleanly against the existing lock
file (582 packages) and `tsc` passed against those exact versions.

`onnxruntime-react-native` and `jpeg-js` are loaded through guarded `require()`
calls and are **not** in `package.json`. Adding `onnxruntime-react-native` would
contain native code and break the Expo Go workflow this project currently uses,
so that decision is left to you — see the deployment notes.

---

## Files added

```
n8n/README_N8N.md
n8n/krishi_marga_workflow.json
src/offline/modelAssets.ts
src/offline/onnxRuntimeStatus.ts
src/offline/preprocess.ts
src/services/httpClient.ts
```

## Files modified

```
.env.example
active_workflow.json
src/models/index.ts
src/offline/onnxEngine.ts
src/screens/AnalyzingScreen.tsx
src/screens/DevBuildStatusScreen.tsx
src/screens/PesticideScannerScreen.tsx
src/screens/ResultScreen.tsx
src/services/config.ts
src/services/diagnosisApi.ts
src/services/imageOptimizer.ts
src/services/pesticideService.ts
```

No files deleted. All `.onnx`-related metadata, `classes.json` files,
`PREPROCESSING.txt` files, model registries, crop knowledge JSON, the pesticide
database, the Karnataka RSK dataset, locales, assets and the historical workflow
exports are untouched.
