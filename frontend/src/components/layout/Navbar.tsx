'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Calendar,
  Clock,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Stethoscope,
  Search,
  ArrowRight,
  HeartPulse,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, quickLogin, demoLoginsEnabled } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [quickLoginError, setQuickLoginError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const quickLoginRef = useRef<HTMLDivElement>(null);

  const handleQuickLogin = async (targetRole: 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST') => {
    try {
      setLoadingRole(targetRole);
      setQuickLoginError(null);
      const authenticatedUser = await quickLogin(targetRole);
      setQuickLoginOpen(false);
      setMobileMenuOpen(false);
      const role = authenticatedUser?.role || targetRole;
      if (role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN' || role === 'RECEPTIONIST') {
        router.push('/admin/dashboard');
      } else {
        router.push('/patient/appointments');
      }
    } catch (err: any) {
      console.error('Demo login failed:', err);
      setQuickLoginError(err.message || 'Login failed. Please verify credentials or server.');
    } finally {
      setLoadingRole(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickLoginRef.current && !quickLoginRef.current.contains(event.target as Node)) {
        setQuickLoginOpen(false);
      }
    };
    if (quickLoginOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickLoginOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft border-b border-slate-200/80'
          : 'bg-white/80 backdrop-blur-sm border-b border-slate-200/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="font-display font-extrabold text-xl text-navy-900 tracking-tight leading-none">
              City<span className="text-primary-600">Care</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
              Hospital System
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <Link href="/doctors" className="hover:text-primary-600 transition-colors">
            Find Doctors
          </Link>
          <Link href="/#departments" className="hover:text-primary-600 transition-colors">
            Departments
          </Link>
          <Link href="/#services" className="hover:text-primary-600 transition-colors">
            Services
          </Link>
          <Link href="/#why-us" className="hover:text-primary-600 transition-colors">
            Why Us
          </Link>

          {/* Authenticated Portal Quick Links */}
          {isAuthenticated && (
            <>
              {user?.role === 'PATIENT' && (
                <Link
                  href="/patient/appointments"
                  className="text-primary-600 hover:text-primary-700 font-bold transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  My Appointments
                </Link>
              )}

              {user?.role === 'DOCTOR' && (
                <>
                  <Link
                    href="/doctor/dashboard"
                    className="text-primary-600 hover:text-primary-700 font-bold transition-colors flex items-center gap-1"
                  >
                    <Activity className="w-4 h-4" />
                    OPD Queue
                  </Link>
                  <Link
                    href="/doctor/schedule"
                    className="text-teal-600 hover:text-teal-700 font-bold transition-colors flex items-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    Schedule
                  </Link>
                </>
              )}

              {['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(user?.role || '') && (
                <Link
                  href="/admin/dashboard"
                  className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Console
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Search bar & Action CTAs */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Quick Doctor Search input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-primary-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>

          {/* 1-Click Demo Login Switcher (Controlled by demoLoginsEnabled) */}
          {!isAuthenticated && demoLoginsEnabled && (
            <div className="relative" ref={quickLoginRef}>
              <button
                onClick={() => {
                  setQuickLoginOpen(!quickLoginOpen);
                  setQuickLoginError(null);
                }}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-ice text-primary-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 shadow-soft-sm active:scale-95"
                title="1-Click Demo Account Switcher"
              >
                <span>⚡ Demo Logins</span>
              </button>
              {quickLoginOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-xl border border-slate-200 p-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5 flex items-center justify-between">
                    <span>1-Click Role Switcher</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">DEV/EVAL</span>
                  </div>

                  {quickLoginError && (
                    <div className="mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{quickLoginError}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleQuickLogin('PATIENT')}
                    disabled={!!loadingRole}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-primary-700 font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Rahul (Patient)</span>
                        {loadingRole === 'PATIENT' && <Loader2 className="w-3 h-3 animate-spin text-primary-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400">patient@hms.com</div>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">PATIENT</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('DOCTOR')}
                    disabled={!!loadingRole}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Dr. Priya (Cardio)</span>
                        {loadingRole === 'DOCTOR' && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400">dr.priya@hms.com</div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">DOCTOR</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('HOSPITAL_ADMIN')}
                    disabled={!!loadingRole}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Kavita (Hospital Admin)</span>
                        {loadingRole === 'HOSPITAL_ADMIN' && <Loader2 className="w-3 h-3 animate-spin text-purple-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400">admin@hms.com</div>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('RECEPTIONIST')}
                    disabled={!!loadingRole}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-700 font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Sunita (Front-desk)</span>
                        {loadingRole === 'RECEPTIONIST' && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400">receptionist@hms.com</div>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">STAFF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* User Status / Login / Book Button */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs font-bold text-navy-900 leading-tight">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 hover:text-primary-600 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/doctors"
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-soft hover:shadow-primary-500/25 transition-all flex items-center gap-1.5"
          >
            <span>Book Visit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-soft-xl">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 border border-slate-200 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Home
          </Link>
          <Link
            href="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Find Doctors
          </Link>
          <Link
            href="/#departments"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Departments
          </Link>
          <Link
            href="/#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Services
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase">
                {user?.role} Portal
              </div>
              {user?.role === 'PATIENT' && (
                <Link
                  href="/patient/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  My Appointments
                </Link>
              )}
              {user?.role === 'DOCTOR' && (
                <Link
                  href="/doctor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  Doctor Queue
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {demoLoginsEnabled && (
                <div className="p-3 bg-ice/60 rounded-2xl border border-blue-200/80 space-y-2 mb-2">
                  <div className="text-[11px] font-bold text-primary-700 uppercase tracking-wider flex items-center justify-between">
                    <span>⚡ Quick Demo Logins</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">DEV/EVAL</span>
                  </div>

                  {quickLoginError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{quickLoginError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleQuickLogin('PATIENT')}
                      disabled={!!loadingRole}
                      className="p-2 text-left bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 hover:border-primary-500 shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Rahul (Patient)</span>
                        {loadingRole === 'PATIENT' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-primary-600" />
                        ) : (
                          <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">PATIENT</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">patient@hms.com</div>
                    </button>
                    <button
                      onClick={() => handleQuickLogin('DOCTOR')}
                      disabled={!!loadingRole}
                      className="p-2 text-left bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 hover:border-emerald-500 shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Dr. Priya (Cardio)</span>
                        {loadingRole === 'DOCTOR' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold">DOCTOR</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">dr.priya@hms.com</div>
                    </button>
                    <button
                      onClick={() => handleQuickLogin('HOSPITAL_ADMIN')}
                      disabled={!!loadingRole}
                      className="p-2 text-left bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 hover:border-purple-500 shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Kavita (Admin)</span>
                        {loadingRole === 'HOSPITAL_ADMIN' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                        ) : (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-bold">ADMIN</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">admin@hms.com</div>
                    </button>
                    <button
                      onClick={() => handleQuickLogin('RECEPTIONIST')}
                      disabled={!!loadingRole}
                      className="p-2 text-left bg-white rounded-xl border border-slate-200 font-semibold text-slate-800 hover:border-amber-500 shadow-xs disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Sunita (Staff)</span>
                        {loadingRole === 'RECEPTIONIST' ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-bold">STAFF</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">receptionist@hms.com</div>
                    </button>
                  </div>
                </div>
              )}

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/doctors"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-soft"
              >
                Book Appointment
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
