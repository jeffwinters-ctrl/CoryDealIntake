import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Visionary Capital | Deal Intake',
  description: 'Secure deal intake portal for Visionary Capital',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
