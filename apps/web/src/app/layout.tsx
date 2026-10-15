import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rentora | UAE Smart Property & Expense Management',
  description:
    'Rentora - Next-generation multi-tenant rental property management and expense platform for UAE landlords, property managers, and accountants.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body>{children}</body>
    </html>
  );
}
