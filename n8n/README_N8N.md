# KRISHI MARGA — n8n Workflow

`krishi_marga_workflow.json` is the canonical workflow. The project root file
`active_workflow.json` is kept in sync with it; the other workflow exports in the
repository root (`current_wf.json`, `workflow_exported.json`,
`exported_workflows.json`, `api_workflow_fetched.json`) are historical snapshots
and were left untouched.

## What the workflow contains

Two independent webhook entry points on one workflow:

| Path | Purpose | Branch |
| --- | --- | --- |
| `POST /webhook/detect-disease` | Crop disease diagnosis, 1-10 images | Nodes 1-7 |
| `POST /webhook/scan-pesticide` | Pesticide label reading, 1-3 images | Nodes 1P-7P |

Before this change the app sent pesticide scans to `detect-disease`. There was no
pesticide branch, so the crop validator rejected every label scan with
`INVALID_CROP` and the app rendered an empty result card. The pesticide branch
fixes that.

## Import steps

1. n8n → **Workflows** → **Import from File** → select `krishi_marga_workflow.json`.
2. Open each of the four HTTP Request nodes (`4A`, `4B`, `4C`, `4P`) and re-select
   the **Header Auth** credential holding the Gemini API key. The exported JSON
   only references a credential by id/name — the key itself is never in the file
   and must be created in n8n.
   - Credential type: *Header Auth*
   - Header name: `x-goog-api-key`
   - Header value: your Gemini API key
3. Activate the workflow and copy the production webhook base URL.
4. Put that base URL in the app's `EXPO_PUBLIC_BACKEND_URL`.

## Timeout budget

The client timeout and the server budget are matched deliberately so a slow
server produces a clean error instead of a hung screen.

| Stage | Budget |
| --- | --- |
| Gemini model 1 | 15s |
| Gemini model 2 (failover) | 15s |
| Gemini model 3 (failover) | 12s |
| Validation + formatting | ~3s |
| **Server worst case** | **~45s** |
| Workflow `executionTimeout` | 120s |
| App timeout — disease | 75s |
| App timeout — pesticide | 45s (single model call) |

If you add another failover model, raise `NetworkBudget.diagnosisTimeoutMs` in
`src/services/config.ts` to stay ahead of the new server worst case.

## Error handling

Every Gemini HTTP node is set to `onError: continueRegularOutput` with
`neverError: true`. Previously a Gemini 4xx/5xx or timeout aborted the whole
execution, the `respondToWebhook` node never ran, and the phone waited for its
own timeout with no explanation. Now a failed model call produces an item the
evaluate node marks unusable, and the failover chain continues to a controlled
JSON error that the webhook actually returns.

## Memory protection

- The validate node no longer returns a second full copy of every Base64 image
  alongside `geminiPayload`. That duplicate roughly doubled peak memory per
  request.
- Per-image cap: 4MB (disease) / 5MB (pesticide) of decoded data.
- Combined payload cap: 12MB for a disease request.
- `saveExecutionProgress: false` and `saveDataSuccessExecution: "none"` stop n8n
  from persisting multi-megabyte image payloads into its execution database on
  every scan, which is a common cause of disk and memory growth.

## Reverse proxy

For production, put n8n behind HTTPS (Caddy, nginx + certbot, or a managed host)
and set `WEBHOOK_URL` to the public HTTPS origin so n8n generates correct webhook
URLs. The mobile app refuses a non-HTTPS endpoint in release builds.
