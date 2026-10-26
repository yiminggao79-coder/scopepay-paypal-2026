# Devpost draft — not submitted

## Project name
ScopePay

## Elevator pitch
AI drafts the scope. Fixed catalog rules set the price. You approve the PayPal sandbox payment.

## Problem and audience
Freelancers repeatedly turn vague client messages into service quotes. An AI can help interpret the request, but its guesses should never decide a payment amount or trigger spending. ScopePay gives a solo service business one reviewable path from brief to an approved, traceable sandbox checkout.

## What we built
An OpenAI-compatible model selects services and drafts acceptance notes. Server validation checks the catalog, quantities, duplicate lines and maximum budget, then stores an immutable USD quote. The buyer explicitly reviews the scope and confirms before a PayPal sandbox order is created. Capture is separately confirmed and checked against the expected amount and currency. Stable idempotency keys and saved state support retries. The AG Grid Community ledger lets the operator sort/filter saved scopes, reopen their exact payment state and export a CSV.

## AI and PayPal roles
AI interprets unstructured work requirements. PayPal is the checkout and capture path for the resulting scope, not a decorative link. The agent has no authority to change catalog prices or bypass approval. An earlier real Qwen3-8B run kept catalog prices but exposed misleading payment text in an acceptance note. We added a deterministic note rule and retained its offline replay. A subsequent real model regression through the final application returned HTTP200/$420 for website+review, HTTP200/$60 for content edit, and HTTP400 for the adversarial payment note: three limited scenarios passed. Request times were 48.562/3.414/2.489 seconds, including a slow first cold request. This is not a general or multilingual semantic injection defense.

## Current evidence boundary
Real AI inference and local product flows are verified. Actual PayPal sandbox OAuth, order creation, buyer approval and capture are pending credentials and testing. Do not state that end-to-end payment works until that evidence exists. This project supports sandbox only. Repository URL and public YouTube URL are pending user-approved publication.

## AG Grid award note
We use AG Grid Community36.2.0 locally for the actual persistent scope ledger. Sorting, text/number filtering, quick search, selecting an old scope and CSV export are implemented. No enterprise trial or license key is required. Render is prepared as an optional deployment; we have not used it and do not claim a Render award qualification.

## Video script — target 2:45

- 0:00–0:20: Present the freelancer problem and type a specific brief with a budget.
- 0:20–0:55: Draft with the real AI endpoint. Inspect actual services, notes and fixed total. Briefly show an attempted price instruction stays bounded by catalog prices.
- 0:55–1:20: Open the saved scope ledger, filter/reopen a real scope and review its payment state.
- 1:20–2:10: Explicitly approve the scope, create a real PayPal sandbox order, approve as the sandbox buyer, return and confirm capture. Show the actual completed record and sandbox seller activity, with private details masked.
- 2:10–2:45: Show the evidence export and explain deterministic guardrails, audience and current limitations.

The payment segment must be recorded after genuine sandbox validation. Current rehearsal is not payment proof. Use owned visuals and no unlicensed music.
