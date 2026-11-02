import React from 'react';
import Link from 'next/link';
import { HeartPulse, ShieldCheck, PhoneCall, Clock, MapPin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-navy-800">
      {/* Emergency Hotline Top Ribbon */}
      <div className="bg-primary-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>24/7 Emergency & Critical Trauma Response Center Active</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold">
              <PhoneCall className="w-3.5 h-3.5" /> Emergency Hotline: 112 / 108
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">General Reception: +91 98765 43210</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Clinical Philosophy */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-soft">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight">
                City<span className="text-primary-400">Care</span> HMS
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              CityCare Hospital Management System is a next-generation clinical appointment booking and real-time queue management platform designed for hospital excellence. Zero double-booking, authenticated live queue broadcasts, and verified medical practitioners.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                <span>OPD Consultations: Monday – Saturday (08:00 AM – 08:00 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary-400" />
                <span>Central Medical Hub, Healthcare Boulevard, Metro City</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary-400" />
                <span>support@citycare-hms.com</span>
              </div>
            </div>
          </div>

          {/* Col 2: Clinical Portals */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Clinical Portals
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/doctors" className="hover:text-white transition-colors">
                  Find Doctors by Specialty
                </Link>
              </li>
              <li>
                <Link href="/patient/appointments" className="hover:text-white transition-colors">
                  Patient Appointments
                </Link>
              </li>
              <li>
                <Link href="/patient/queue/dr.priya@hms.com" className="hover:text-white transition-colors">
                  Live Token Tracker
                </Link>
              </li>
              <li>
                <Link href="/doctor/dashboard" className="hover:text-white transition-colors">
                  Doctor Queue Manager
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                  Hospital Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Medical Departments */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Specialties
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/doctors?department=cardiology" className="hover:text-white transition-colors">
                  Cardiology & Heart Care
                </Link>
              </li>
              <li>
                <Link href="/doctors?department=neurology" className="hover:text-white transition-colors">
                  Neurology & Stroke
                </Link>
              </li>
              <li>
                <Link href="/doctors?department=orthopedics" className="hover:text-white transition-colors">
                  Orthopedics & Joint Clinic
                </Link>
              </li>
              <li>
                <Link href="/doctors?department=pediatrics" className="hover:text-white transition-colors">
                  Pediatrics & Child Health
                </Link>
              </li>
              <li>
                <Link href="/doctors?department=dermatology" className="hover:text-white transition-colors">
                  Dermatology & Skin
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Compliance & Security */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Trust & Compliance
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified License IDs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Double-Booking</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>HMAC-SHA256 Payments</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>RBAC Isolated Records</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 space-y-3">
          <p className="leading-relaxed">
            <span className="font-bold text-slate-400">CLINICAL DISCLAIMER:</span> CityCare Hospital Management System AI symptom guidance is provided strictly for departmental navigation and triage assistance. It does not replace emergency medical diagnosis or treatment. If you are experiencing chest pain, acute shortness of breath, or sudden weakness, call 112 / 108 immediately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 pt-2">
            <span>© 2026 CityCare Hospital Management System. All rights reserved.</span>
            <div className="flex items-center space-x-4">
              <Link href="/#why-us" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/#why-us" className="hover:text-white transition-colors">
                Clinical Standards
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Staff Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
