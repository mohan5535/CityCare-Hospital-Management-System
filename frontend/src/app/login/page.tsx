'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, demoLoginsEnabled, isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (role === 'DOCTOR') router.push('/doctor/dashboard');
      else if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(role || '')) router.push('/admin/dashboard');
      else router.push('/patient/appointments');
    }
  }, [isAuthenticated, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST') => {
    setError(null);
    setLoading(true);
    try {
      const authenticatedUser = await quickLogin(demoRole);
      const targetRole = authenticatedUser?.role || demoRole;
      if (targetRole === 'DOCTOR') router.push('/doctor/dashboard');
      else if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'].includes(targetRole || '')) router.push('/admin/dashboard');
      else router.push('/patient/appointments');
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please verify credentials or backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-primary-500/25 mb-4">
            <Activity className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight font-display">
            Sign In to CityCare
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Access your patient portal, clinical queue, or hospital console
          </p>
        </div>

        {/* 1-Click Demo Logins Card (Controlled by demoLoginsEnabled) */}
        {demoLoginsEnabled && (
          <div className="bg-white p-5 rounded-2xl border border-teal-200/80 shadow-soft-sm bg-gradient-to-br from-teal-50/40 via-white to-primary-50/20">
            <div className="flex items-center justify-between text-teal-800 font-bold text-xs uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Instant Evaluator Demo Logins</span>
              </div>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">DEV/EVAL</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoClick('PATIENT')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary-500 hover:text-primary-600 text-left transition-all font-medium text-slate-700 shadow-xs"
              >
                <div className="font-bold text-slate-900">Patient</div>
                <div className="text-[10px] text-slate-400">Rahul Deshmukh</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('DOCTOR')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary-500 hover:text-primary-600 text-left transition-all font-medium text-slate-700 shadow-xs"
              >
                <div className="font-bold text-slate-900">Doctor</div>
                <div className="text-[10px] text-slate-400">Dr. Priya Sharma</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('HOSPITAL_ADMIN')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary-500 hover:text-primary-600 text-left transition-all font-medium text-slate-700 shadow-xs"
              >
                <div className="font-bold text-slate-900">Hospital Admin</div>
                <div className="text-[10px] text-slate-400">Kavita Singhania</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('RECEPTIONIST')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-primary-500 hover:text-primary-600 text-left transition-all font-medium text-slate-700 shadow-xs"
              >
                <div className="font-bold text-slate-900">Front-desk</div>
                <div className="text-[10px] text-slate-400">Sunita Rao</div>
              </button>
            </div>
          </div>
        )}

        {/* Real Authentication Form */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-soft">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-soft hover:shadow-primary-500/25 transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
