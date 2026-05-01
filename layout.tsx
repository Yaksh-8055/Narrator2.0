/**
 * app/layout.tsx
 *
 * Root layout — wraps every page in the app.
 * Sets global metadata, loads the Inter font, and applies Tailwind base styles.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Story Narrator',
  description:
    'AI-powered story generation and narration using Gemini and ElevenLabs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
