-- Company name for sourcing requests comes from buyer_profiles.company_name.
ALTER TABLE "sourcing_requests"
DROP COLUMN IF EXISTS "company_name";
