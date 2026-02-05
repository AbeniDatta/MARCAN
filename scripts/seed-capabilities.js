// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Initialize Prisma Client with adapter for seeding
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding capabilities...');

  // Processes
  const processes = [
    { slug: 'cnc-machining', name: 'CNC Machining' },
    { slug: 'casting', name: 'Casting' },
    { slug: 'fabrication', name: 'Fabrication' },
    { slug: 'welding', name: 'Welding' },
    { slug: 'molding', name: 'Molding' },
    { slug: 'stamping', name: 'Stamping' },
    { slug: 'assembly', name: 'Assembly' },
    { slug: 'tooling', name: 'Tooling' },
    { slug: 'forging', name: 'Forging' },
    { slug: 'extrusion', name: 'Extrusion' },
  ];

  // Materials
  const materials = [
    { slug: 'aluminum', name: 'Aluminum' },
    { slug: 'steel', name: 'Steel' },
    { slug: 'stainless-steel', name: 'Stainless Steel' },
    { slug: 'titanium', name: 'Titanium' },
    { slug: 'brass', name: 'Brass' },
    { slug: 'copper', name: 'Copper' },
    { slug: 'plastic', name: 'Plastic' },
    { slug: 'composite', name: 'Composite' },
    { slug: 'ceramic', name: 'Ceramic' },
    { slug: 'rubber', name: 'Rubber' },
  ];

  // Finishes
  const finishes = [
    { slug: 'anodizing', name: 'Anodizing' },
    { slug: 'powder-coating', name: 'Powder Coating' },
    { slug: 'plating', name: 'Plating' },
    { slug: 'painting', name: 'Painting' },
    { slug: 'polishing', name: 'Polishing' },
    { slug: 'sandblasting', name: 'Sandblasting' },
  ];

  // Certifications
  const certifications = [
    { slug: 'iso-9001', name: 'ISO 9001' },
    { slug: 'as9100', name: 'AS9100' },
    { slug: 'cgrp', name: 'CGRP' },
    { slug: 'nadcap', name: 'NADCAP' },
    { slug: 'iso-14001', name: 'ISO 14001' },
    { slug: 'iso-45001', name: 'ISO 45001' },
  ];

  // Industries
  const industries = [
    { slug: 'aerospace', name: 'Aerospace' },
    { slug: 'automotive', name: 'Automotive' },
    { slug: 'medical', name: 'Medical' },
    { slug: 'defense', name: 'Defense' },
    { slug: 'energy', name: 'Energy' },
    { slug: 'automation', name: 'Automation' },
  ];

  // Company Types
  const companyTypes = [
    { slug: 'job-shop', name: 'Job Shop' },
    { slug: 'contract-manufacturer', name: 'Contract Manufacturer' },
    { slug: 'oem', name: 'OEM' },
    { slug: 'distributor', name: 'Distributor' },
  ];

  // Create capabilities
  for (const proc of processes) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'PROCESS', slug: proc.slug } },
      update: {},
      create: {
        type: 'PROCESS',
        slug: proc.slug,
        name: proc.name,
      },
    });
  }

  for (const mat of materials) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'MATERIAL', slug: mat.slug } },
      update: {},
      create: {
        type: 'MATERIAL',
        slug: mat.slug,
        name: mat.name,
      },
    });
  }

  for (const fin of finishes) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'FINISH', slug: fin.slug } },
      update: {},
      create: {
        type: 'FINISH',
        slug: fin.slug,
        name: fin.name,
      },
    });
  }

  for (const cert of certifications) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'CERTIFICATION', slug: cert.slug } },
      update: {},
      create: {
        type: 'CERTIFICATION',
        slug: cert.slug,
        name: cert.name,
      },
    });
  }

  for (const ind of industries) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'INDUSTRY', slug: ind.slug } },
      update: {},
      create: {
        type: 'INDUSTRY',
        slug: ind.slug,
        name: ind.name,
      },
    });
  }

  for (const ct of companyTypes) {
    await prisma.capability.upsert({
      where: { type_slug: { type: 'COMPANY_TYPE', slug: ct.slug } },
      update: {},
      create: {
        type: 'COMPANY_TYPE',
        slug: ct.slug,
        name: ct.name,
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
