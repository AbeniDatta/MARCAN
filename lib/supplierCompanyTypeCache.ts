import type { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Denormalized cache on `supplier_profiles.company_type`.
 * Source of truth remains `profile_capabilities` rows where `capabilities.type = COMPANY_TYPE`.
 * Picks signup-sourced link when present, else earliest `created_at`.
 */
export async function syncSupplierCompanyTypeCache(db: Db, supplierProfileId: string): Promise<void> {
  const links = await db.profileCapability.findMany({
    where: { supplierProfileId },
    include: { capability: true },
    orderBy: { createdAt: 'asc' },
  });

  const companyLinks = links.filter((l) => l.capability.type === 'COMPANY_TYPE');
  companyLinks.sort((a, b) => {
    const pri = (s: string | null | undefined) => (s === 'signup' ? 0 : 1);
    const d = pri(a.source) - pri(b.source);
    if (d !== 0) return d;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const chosenId = companyLinks[0]?.capability.id ?? null;

  await db.supplierProfile.update({
    where: { id: supplierProfileId },
    data: { companyType: chosenId },
  });
}
