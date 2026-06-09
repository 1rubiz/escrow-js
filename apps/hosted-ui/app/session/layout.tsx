/**
 * Session Layout
 * 
 * Layout for the session page (iframe content).
 * Minimal layout without the main app navigation.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payluk Session',
  description: 'Payluk Escrow Session',
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

// Made with Bob