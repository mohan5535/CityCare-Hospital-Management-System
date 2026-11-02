import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'CityCare Hospital Management System - Premium Healthcare & Clinical Scheduling',
  description:
    'Experience world-class healthcare with verified medical specialists at CityCare Hospital Management System. Zero double-booking atomic scheduling, real-time live queue token tracking, and encrypted teleconsultation.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans flex flex-col min-h-screen text-navy-800 bg-[#F8FAFC] antialiased selection:bg-primary-100 selection:text-primary-800">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
