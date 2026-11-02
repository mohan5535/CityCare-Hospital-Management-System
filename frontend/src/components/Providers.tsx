'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </AuthProvider>
  );
}

