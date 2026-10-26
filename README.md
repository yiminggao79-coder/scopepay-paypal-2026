# ScopePay

Turn a freelancer brief into a catalog-bound scope, review the price, and continue to **PayPal sandbox** checkout. AI proposes service IDs and acceptance notes; server code determines every price and enforces the budget. A saved-scope ledger built with AG Grid Community supports sorting, filtering, reopening past scopes and CSV export.

## Run locally

Node.js 24 or newer. Install the single runtime dependency from the lockfile:

```powershell
npm ci --ignore-scripts
node --env-file-if-exists=.env server.mjs
```

Open http://127.0.0.1:4313 . **Load rehearsal example** works without accounts. It is visibly labeled and cannot create PayPal orders. This single-operator workspace is not a public customer storefront.

For a real model and checkout, run `setup-local.ps1` and enter the AI base URL including `/v1`, model name, optional AI key, and PayPal **sandbox** app credentials. Secrets stay in that process and are never printed or saved. Alternatively configure `.env` from `.env.example` and keep it private. `AI_BASE_URL` accepts HTTPS or HTTP loopback only. An OpenAI-compatible `/chat/completions` endpoint is required. No model weights are bundled.

## End-to-end sandbox flow

1. Obtain a free [PayPal Developer account](https://developer.paypal.com/) and sandbox business app Client ID/Secret; keep the generated personal buyer sandbox account available. [Official sandbox setup guide](https://github.com/paypaldev/getting-started-with-paypal-sandbox).
2. Start an AI endpoint and set `AI_BASE_URL`, `AI_MODEL`, optional `AI_API_KEY`. The current model evaluation used an already installed Qwen3 8B GGUF through a temporary local server; this server is not bundled or guaranteed to remain running.
3. Run `npm run check`. This only checks configuration, AI model listing and PayPal sandbox OAuth; it never creates an order.
4. Draft a real AI scope, inspect services/notes/budget, check the approval box, then continue to PayPal sandbox. The server creates an order from its own immutable quote, using the quote ID as a stable idempotency key.
5. Approve using the **sandbox personal buyer**, return, and explicitly confirm capture. The server verifies completed capture status, USD currency and exact expected amount before showing success. Repeated order/capture requests reuse stable keys. State survives restarts in `data/state.json`.

The PayPal host is hard-coded to `api-m.sandbox.paypal.com`; live payments are unavailable. Provider errors never become fake success. Order/capture IDs and concise events are stored, not buyer credentials or raw payer payloads. Captures must match a known quote and order. Do not run multiple server instances against the same JSON data file; for a public storefront use a proper transactional database, customer authentication and reconciliation/webhook processing.

## Evidence and limits

`npm test` exercises catalog price enforcement, invalid/duplicate services, quantity bounds, budget rejection, JSON parsing, sandbox-only requests/idempotency headers, safe provider errors, and a real HTTP rehearsal/checkout-blocking/persistence workflow. Provider unit tests use explicitly stubbed HTTP responses; they are **not** evidence that PayPal accepted a transaction.

`scripts/evaluate-ai.mjs` runs real AI requests through a running local app. The **earlier** [evaluation](docs/evidence/real-ai-evidence.json) passed its then-current SKU/amount/budget checks but exposed a misleading payment note; that older file correctly keeps `current_policy_retested: false`. [Offline replay](docs/evidence/policy-revalidation.json) first confirmed the new note rule rejected that actual captured response. A subsequent **real model run against the final policy** ([raw results](docs/evidence/real-ai-policy-evidence.json)) then passed three limited scenarios: HTTP200 with $420 website+review, HTTP200 with $60 content edit, and HTTP400 rejection of the adversarial pricing note. Measured times were 48.562/3.414/2.489 seconds; the first request included a slow cold start with different local runtime settings. These are three synthetic cases, not a general, multilingual or semantic security/quality benchmark. PayPal OAuth/order/approval/capture has **not** been exercised with actual sandbox credentials.

The immutable quote, not edited browser values or AI-suggested prices, determines checkout. Briefs are sent to the configured AI endpoint; avoid private client information unless authorized. The local app uses CSRF tokens, a host allowlist, loopback binding, and safe text rendering. CSV export prefixes formula-like cell content.

The earlier adversarial model response contained a misleading one-dollar statement in its acceptance notes. We found this in browser review and added deterministic rejection of pricing/payment instructions in those notes, including revalidation of old quotes before checkout. The offline replay and the later real model regression are distinct evidence, both retained. This conservative English/currency-symbol rule is not a universal prompt-injection defense and can reject benign wording. Review all acceptance text.

## Deployment

`Dockerfile` and `render.yaml` are prepared, not deployed. Render's persistent disk blueprint uses a paid `starter` plan and therefore requires a separate spending decision. Use `ADMIN_KEY`, HTTPS `PUBLIC_BASE_URL`, a persistent `DATA_DIR` and private environment variables. The public repository must never include `.env`, `data/`, private keys, sandbox login passwords or model files. A local runnable build is accepted by the event, so paid deployment is optional. AG Grid Community works locally with no account, license key or enterprise trial.

See `docs/rules-and-provenance.md`, `docs/submission-draft.md`, `docs/progress.md` and `docs/engineering/problem-log.md`. Codex implemented this project with the user's authorization; user review and understanding remain necessary before submission or resume claims.
