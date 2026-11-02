'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const aptCardRef = useRef<HTMLDivElement>(null);
  const queueCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: any;
    // Asynchronously load GSAP for smooth client-side entrance
    import('gsap').then(({ default: gsap }) => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.6 }
        )
          .fromTo(
            headlineRef.current,
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.8 },
            '-=0.3'
          )
          .fromTo(
            descRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            '-=0.4'
          )
          .fromTo(
            ctaRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.6 },
            '-=0.3'
          )
          .fromTo(
            imageContainerRef.current,
            { opacity: 0, scale: 0.96, x: 20 },
            { opacity: 1, scale: 1, x: 0, duration: 0.9, ease: 'power2.out' },
            '-=0.6'
          )
          .fromTo(
            aptCardRef.current,
            { opacity: 0, y: 25, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6 },
            '-=0.3'
          )
          .fromTo(
            queueCardRef.current,
            { opacity: 0, y: -25, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6 },
            '-=0.4'
          )
          .fromTo(
            trustRef.current,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.6 },
            '-=0.2'
          );
      });
    });

    return () => ctx?.revert();
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/50 to-[#F8FAFC] pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60">
      {/* Decorative ambient background elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Editorial Hierarchy (45-50% width on desktop) */}
          <div className="lg:col-span-6 xl:col-span-6 z-10">
            {/* Small Trust Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ice border border-blue-200/80 mb-6 shadow-soft-sm">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                Healthcare That Puts You First
              </span>
            </div>

            {/* Editorial Headline with Playfair Display */}
            <h1
              ref={headlineRef}
              className="font-display text-5xl sm:text-6xl lg:text-[72px] leading-[1.08] font-bold text-navy-900 tracking-tight mb-6"
            >
              Your Health, <br />
              <span className="text-primary-600 italic">Our Priority.</span>
            </h1>

            {/* Supporting Text */}
            <p
              ref={descRef}
              className="text-slate-600 text-lg sm:text-xl font-normal leading-relaxed max-w-xl mb-8"
            >
              Find trusted doctors, book appointments effortlessly, and manage your healthcare journey—all in one place.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base shadow-soft hover:shadow-primary-500/25 transition-all duration-200 group"
              >
                <span>Book an Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#featured-doctors"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-navy-900 font-semibold text-base border border-slate-200/80 shadow-soft-sm hover:border-slate-300 transition-all duration-200"
              >
                <span>Explore Our Doctors</span>
              </Link>
            </div>

            {/* Compact Trust Indicators (Real Project Data) */}
            <div
              ref={trustRef}
              className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-navy-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium leading-tight">Verified Doctors</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-navy-900">Zero</div>
                  <div className="text-xs text-slate-500 font-medium leading-tight">Double-Booking</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-navy-900">Live</div>
                  <div className="text-xs text-slate-500 font-medium leading-tight">Queue Sync</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Healthcare Photography & Floating Cards (50-55% width) */}
          <div className="lg:col-span-6 xl:col-span-6 relative mt-6 lg:mt-0">
            {/* Main Photorealistic Doctor Image Container */}
            <div
              ref={imageContainerRef}
              className="relative mx-auto max-w-[540px] lg:max-w-none"
            >
              {/* Elegant curved image mask */}
              <div className="relative w-full aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] overflow-hidden hero-curve-mask shadow-soft-xl border-4 border-white bg-slate-100">
                <Image
                  src="/images/hero-doctor.jpg"
                  alt="Senior specialist doctor in modern hospital environment"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Subtle soft gradient overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* FLOATING CARD 1: Appointment Preview Card (Top Right / Bottom Left) */}
              <div
                ref={aptCardRef}
                className="absolute -bottom-6 -left-4 sm:-bottom-8 sm:-left-6 max-w-[280px] sm:max-w-[310px] bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-soft-xl border border-slate-100 z-20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                    Upcoming Consultation
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Today, 10:30 AM</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-soft-sm">
                    <Image
                      src="/images/doctor-priya.jpg"
                      alt="Dr. Priya Sharma"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-navy-900 truncate">Dr. Priya Sharma</h4>
                    <p className="text-xs text-slate-500 truncate">Interventional Cardiology</p>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed Slot
                  </span>
                  <Link
                    href="/patient/appointments"
                    className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* FLOATING CARD 2: Live Queue Card (Top Right) */}
              <div
                ref={queueCardRef}
                className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 bg-navy-900 text-white p-4 sm:p-5 rounded-2xl shadow-soft-xl border border-navy-700/80 max-w-[240px] sm:max-w-[260px] z-20"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      Live Token Sync
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">OPD #3</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight text-white mt-1">
                  Token #14
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>~12 mins remaining</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-medium">
                  Status: In Consultation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
