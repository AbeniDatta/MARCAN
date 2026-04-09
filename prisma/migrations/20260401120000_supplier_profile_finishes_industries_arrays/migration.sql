-- Legacy text arrays for finish + industry names (taxonomy selections + free-text "Other" values)

ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "finishes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "industries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
