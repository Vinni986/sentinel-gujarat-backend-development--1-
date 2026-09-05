import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sentinel Gujarat - Unified CCTV Intelligence Platform',
  description: 'Smart surveillance and vehicle tracking system for Gujarat Police',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        {children}
      </body>
    </html>
  );
}
