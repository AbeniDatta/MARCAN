'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function StoreProfileRedirectPage() {
  const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      router.replace('/shop?tab=stores&restoreStores=1');
      return;
    }
    const from = searchParams.get('from') || '/shop?tab=stores&restoreStores=1';
    router.replace(`/profile?id=${encodeURIComponent(id)}&from=${encodeURIComponent(from)}`);
  }, [router, searchParams]);

  return null;
}

