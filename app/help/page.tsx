import type { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = {
  title: 'Help Centre - Marcan',
  description: 'Find answers to your questions about Marcan.',
};

export default function HelpPage() {
  return <HelpPageClient />;
}
