'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarPlus,
  PhoneCall,
  ShieldCheck,
  Clock,
  ArrowRight,
  HeartPulse,
} from 'lucide-react';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-primary-950 text-white shadow-soft-xl border border-navy-700/80 p-8 sm:p-12 lg:p-16">
          {/* Subtle background ambient glow & image overlay */}
          <div className="absolute right-0 top-0 w-full lg:w-1/2 h-full opacity-15 pointer-events-none">
            <Image
              src="/images/medical-team.jpg"
              alt="Medical team collaborating"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
              <HeartPulse className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs font-semibold text-blue-200 tracking-wide uppercase">
                24/7 Clinical Care Access
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5 leading-tight">
              Ready to Experience Modern, Dignified Healthcare?
            </h2>

            <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed font-normal">
              Book your visit in under two minutes with guaranteed atomic slot locking, live queue tracking, and direct access to board-certified medical specialists.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-base shadow-lg hover:shadow-primary-500/30 transition-all group"
              >
                <span>Book an Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:112"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-md transition-all"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Emergency: 112 / 108</span>
              </a>
            </div>

            {/* Micro badges below CTA */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified License IDs</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Live Socket.io Tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary-400" />
                <span>Zero Double-Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

