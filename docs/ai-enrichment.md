# AI enrichment (Marcan)

Server-side pipeline that normalizes marketplace entities into strict JSON (`aiSchema`), a short `aiSummary`, and lifecycle fields (`aiStatus`, `aiEnrichedAt`, `aiError`). Supplier profiles additionally map normalized terms into `Capability` + `ProfileCapability` with `source = "ai"` (existing signup/manual links are never removed).

## What gets enriched

| Entity | Trigger |
|--------|---------|
| `SupplierProfile` | After successful create/update via `POST /api/profiles` |
| `BuyerProfile` | After create/update via `POST /api/users`; also when a new buyer profile is created from `POST /api/wishlist` |
| `StorefrontProfile` | After create/update via `POST /api/storefront-profile` |
| `SourcingRequest` | After create via `POST /api/wishlist` |
| `StorefrontListing` | After create via `POST /api/listings` |

Creation and updates **always succeed** even if OpenAI fails; failures are stored on the row (`aiStatus = failed`, `aiError` set).

## Code layout

- `services/ai-enrichment/` — prompts, Zod schemas, OpenAI call, taxonomy mapping, per-entity enrich functions, `schedule*` helpers (fire-and-forget).
- `services/ai-enrichment/prompts.ts` — system/user prompt builders per entity.
- `services/ai-enrichment/schemas.ts` — Zod schemas for model JSON (validated before persistence).
- `services/ai-enrichment/taxonomy.ts` — canonical vocabulary + synonym resolution for capability mapping.
- `services/ai-enrichment/mapSupplierCapabilities.ts` — upserts `Capability` rows and inserts `ProfileCapability` (`source: "ai"`, `isCore` when applicable).
- `services/ai-enrichment/openai-client.ts` — lazy OpenAI client (no throw if `OPENAI_API_KEY` is missing; enrichment then records `failed`).

## Supplier capability mapping

1. The model returns `normalized_capabilities` and `core_capabilities` as slug-style strings.
2. `resolveCanonical()` maps each phrase to a **known** canonical slug per `CapabilityType` using the curated lists in `taxonomy.ts`.
3. Unrecognized terms are **skipped** (no arbitrary Capability rows are created from raw guesses).
4. `ensureCapability()` creates or reuses a `Capability` row; `ProfileCapability` is created only if that link does not already exist (signup data preserved).

Extend `taxonomy.ts` with more `CanonicalEntry` rows and aliases as your marketplace grows.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For successful runs | API key for enrichment (same as other OpenAI features if you use them). If unset, enrichment sets `aiStatus = failed` with a clear `aiError`. |
| `OPENAI_ENRICHMENT_MODEL` | No | Defaults to `gpt-4o-mini`. |
| `ENRICHMENT_RETRY_SECRET` | For HTTP retry API | Shared secret for `POST /api/enrichment/retry`. |

## Manual re-run

**Option A — HTTP (awaitable)**

```bash
curl -sS -X POST "$BASE_URL/api/enrichment/retry" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ENRICHMENT_RETRY_SECRET" \
  -d '{"entity":"supplier_profile","id":"<uuid>"}'
```

`entity` is one of: `supplier_profile`, `buyer_profile`, `storefront_profile`, `sourcing_request`, `storefront_listing`.

**Option B — programmatic**

Import `enrichSupplierProfile`, `enrichBuyerProfile`, etc. from `@/services/ai-enrichment` and call them with the row id (e.g. from a one-off script or job worker).

## Database migrations

After pulling changes, apply Prisma migrations (or `db push` in development) so the `ai_*` columns exist:

```bash
npx prisma migrate deploy
# or during development:
npx prisma migrate dev
```

Then regenerate the client if needed:

```bash
npx prisma generate
```

## Production notes

- Enrichment is invoked **after** the DB write with `void enrich…()` so the HTTP response is not blocked.
- On serverless hosts, the function may freeze shortly after the response; long runs are not guaranteed without a queue. The code is isolated so you can swap in BullMQ / Cloud Tasks / Supabase cron later.
- Idempotency: re-running enrichment overwrites `aiSchema` / `aiSummary` and appends new AI `ProfileCapability` links that were missing; it does not delete manual signup links.
