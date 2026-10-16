'use client';

import { useEffect, useState } from 'react';

export function CurrentYear({ fallback = '2026' }: { fallback?: string }) {
  const [year, setYear] = useState(fallback);

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return <span suppressHydrationWarning>{year}</span>;
}
