import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About Us - Marcan',
  description:
    'Learn about Marcan, a premium B2B network built to revitalize Canadian manufacturing through fast, local connections.',
};

export default function AboutPage() {
  return <AboutPageClient />;
}
