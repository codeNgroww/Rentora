import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rentora | UAE Smart Property & Expense Management',
  description:
    'Rentora - Next-generation multi-tenant rental property management and expense platform for UAE landlords, property managers, and accountants.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#12a370" />
      </head>
      <body>{children}</body>
    </html>
  );
}
