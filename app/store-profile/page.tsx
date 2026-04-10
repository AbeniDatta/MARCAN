import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StoreProfileRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; from?: string }>;
}) {
  const { id, from } = await searchParams;
  if (!id) {
    redirect('/shop?tab=stores&restoreStores=1');
  }
  const returnTo = from || '/shop?tab=stores&restoreStores=1';
  redirect(`/profile?id=${encodeURIComponent(id)}&from=${encodeURIComponent(returnTo)}`);
}

