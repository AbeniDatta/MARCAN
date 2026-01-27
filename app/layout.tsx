import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import AmbientBackground from '@/components/AmbientBackground';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Marcan - Manufacturing Canada',
  description: 'A verified network of Canadian Micro & Small Enterprises. Sourcing local just got smarter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} bg-marcan-dark text-slate-300 font-sans h-screen overflow-hidden flex selection:bg-marcan-red selection:text-white`}
      >
        <AmbientBackground />
        <Sidebar />
        {children}
      </body>
    </html>
  );
}
