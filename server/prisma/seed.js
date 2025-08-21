const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create initial categories
  const categories = [
    {
      name: 'Metal Fabrication',
      isFeatured: false
    },
    {
      name: 'Tool & Die',
      isFeatured: false
    },
    {
      name: 'Injection Molding',
      isFeatured: false
    },
    {
      name: 'Precision Machining',
      isFeatured: false
    },
    {
      name: 'Industrial Casting',
      isFeatured: false
    },
    {
      name: 'Consumer Products',
      isFeatured: false
    },
    {
      name: 'Assemblies',
      isFeatured: false
    },
    {
      name: 'Lighting & Fixtures',
      isFeatured: false
    },
    {
      name: 'Automotive Services',
      isFeatured: true,
      imageUrl: '/src/assets/Automotive_Services.png'
    },
    {
      name: 'Defence',
      isFeatured: true,
      imageUrl: '/src/assets/Defence.png'
    }
  ];

  for (const category of categories) {
    try {
      await prisma.category.upsert({
        where: { name: category.name },
        update: category,
        create: category
      });
      console.log(`✅ Category "${category.name}" created/updated`);
    } catch (error) {
      console.error(`❌ Error creating category "${category.name}":`, error);
    }
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });