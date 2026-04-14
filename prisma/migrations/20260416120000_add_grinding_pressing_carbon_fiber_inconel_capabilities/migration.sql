-- Four capabilities for supplier signup (page 2). Safe if already present from seed.
INSERT INTO "capabilities" ("id", "type", "slug", "name", "aliases", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'PROCESS', 'grinding', 'Grinding', ARRAY[]::TEXT[], NOW(), NOW()),
  (gen_random_uuid(), 'PROCESS', 'pressing', 'Pressing', ARRAY[]::TEXT[], NOW(), NOW()),
  (gen_random_uuid(), 'MATERIAL', 'carbon-fiber', 'Carbon Fiber', ARRAY[]::TEXT[], NOW(), NOW()),
  (gen_random_uuid(), 'MATERIAL', 'inconel', 'Inconel', ARRAY[]::TEXT[], NOW(), NOW())
ON CONFLICT ("type", "slug") DO NOTHING;
