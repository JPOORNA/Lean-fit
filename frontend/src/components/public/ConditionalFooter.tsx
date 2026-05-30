'use client';

import { usePathname } from 'next/navigation';
import PublicFooter from './PublicFooter';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter = pathname === '/login' || pathname === '/register';

  if (hideFooter) return null;

  return <PublicFooter />;
}
