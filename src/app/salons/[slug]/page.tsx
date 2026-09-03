// src/app/salons/[slug]/page.tsx
import { INITIAL_SALONS } from '@/lib/mockData';
import SalonDetailClient from './SalonDetailClient';

export function generateStaticParams() {
  return INITIAL_SALONS.map((salon) => ({
    slug: salon.slug,
  }));
}

export default async function SalonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SalonDetailClient slug={slug} />;
}
