import React from 'react';
import type { Metadata } from 'next';
import PublicNavbar from '@/components/public/PublicNavbar';
import ConditionalFooter from '@/components/public/ConditionalFooter';

export const metadata: Metadata = {
  title: 'Leanfit — ISSA Certified Nutritionist & Fitness Coach',
  description:
    'Transform your health with Leanfit, an ISSA certified nutritionist specializing in fat loss, muscle gaining, and strength training. Book your consultation today.',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <main style={{ minHeight: '100vh' }}>{children}</main>
      <ConditionalFooter />
    </>
  );
}
