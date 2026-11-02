'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Award,
} from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN: Realistic Hospital Architecture & Consultation Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-[500px] lg:max-w-none">
              {/* Primary Photography: Hospital Interior */}
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-soft-xl border-4 border-white bg-slate-100">
                <Image
                  src="/images/hospital-interior.jpg"
                  alt="Modern hospital reception and diagnostic wing"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover"
                />
              </div>

              {/* Secondary Overlapping Photography: Doctor Consultation */}
              <div className="absolute -bottom-8 -right-4 sm:-bottom-10 sm:-right-8 w-3/5 aspect-[4/3] rounded-2xl overflow-hidden shadow-soft-xl border-4 border-white bg-slate-100 hidden sm:block">
                <Image
                  src="/images/consultation.jpg"
                  alt="Specialist physician conducting consultation"
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -top-4 -left-2 sm:-top-6 sm:-left-6 bg-white p-4 rounded-2xl shadow-soft-xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-navy-900">4.9 / 5.0</div>
                  <div className="text-xs text-slate-500 font-medium">Patient Satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Editorial Pillars of Excellence */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
              The CityCare Difference
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
              Why Patients & Specialists Trust CityCare
            </h2>
            <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed">
              We eliminated the chaos of clinical waiting rooms, double-booked slots, and fragmented records with an enterprise hospital platform designed for real humans.
            </p>

            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary-600 flex items-center justify-center shrink-0 border border-blue-100 mt-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-navy-900">
                    Medical Practitioner Verification
                  </h4>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    Every doctor undergoes state medical council license ID verification and clinical credential review before accepting patients.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 mt-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-navy-900">
                    Zero Double-Booking Guarantee
                  </h4>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    Our atomic scheduling ledger applies compound unique indexes to guarantee that concurrent booking requests never produce overlapping slots.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 mt-1">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-navy-900">
                    Live Token Broadcasting
                  </h4>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    Track your doctor's active consultation status, token progress, and estimated wait times right from your smartphone without sitting in crowded waiting halls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 mt-1">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-navy-900">
                    Patient Privacy & RBAC Isolation
                  </h4>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    Your diagnoses, prescriptions, and clinical history are securely partitioned. Public token boards strictly sanitize and anonymize patient identities.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/doctors"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm group"
              >
                <span>Experience our clinical scheduling</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

