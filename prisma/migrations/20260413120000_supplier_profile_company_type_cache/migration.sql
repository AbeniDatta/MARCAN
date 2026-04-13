-- Cached copy of the selected COMPANY_TYPE capability id (source of truth: profile_capabilities + capabilities).

ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "company_type" UUID;
ALTER TABLE "supplier_profiles" ALTER COLUMN "preferred_contact_method" SET DEFAULT 'EMAIL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_profiles_company_type_fkey'
  ) THEN
    ALTER TABLE "supplier_profiles"
      ADD CONSTRAINT "supplier_profiles_company_type_fkey"
      FOREIGN KEY ("company_type") REFERENCES "capabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: prefer signup-sourced link, else earliest created_at
UPDATE "supplier_profiles" sp
SET "company_type" = picked.cid
FROM (
  SELECT DISTINCT ON (pc.supplier_profile_id)
    pc.supplier_profile_id,
    c.id AS cid
  FROM "profile_capabilities" pc
  INNER JOIN "capabilities" c ON c.id = pc.capability_id
  WHERE c.type = 'COMPANY_TYPE'
  ORDER BY pc.supplier_profile_id,
    CASE WHEN pc.source = 'signup' THEN 0 ELSE 1 END,
    pc.created_at ASC
) picked
WHERE sp.id = picked.supplier_profile_id;

-- Backfill preferred contact method default for existing nulls.
UPDATE "supplier_profiles"
SET "preferred_contact_method" = 'EMAIL'
WHERE "preferred_contact_method" IS NULL;
