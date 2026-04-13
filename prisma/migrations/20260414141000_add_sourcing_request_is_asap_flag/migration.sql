-- Persist explicit ASAP deadline state on sourcing requests.
ALTER TABLE "sourcing_requests"
ADD COLUMN IF NOT EXISTS "is_asap" BOOLEAN NOT NULL DEFAULT false;

-- Backfill legacy rows where NULL deadline represented ASAP.
UPDATE "sourcing_requests"
SET "is_asap" = true
WHERE "deadline" IS NULL;
