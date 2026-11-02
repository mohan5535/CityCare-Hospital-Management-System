'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  CalendarCheck,
  QrCode,
  FileText,
  ArrowRight,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Select Doctor or Specialty',
    description:
      'Search our directory of certified practitioners by clinical department, consultation fee, or natural-language symptoms.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Reserve Real-Time Slot',
    description:
      'Choose an available date and time. Our atomic scheduling ledger locks the slot instantly, eliminating double-booking.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Check-In & Live Token',
    description:
      'On consultation day, complete 1-click check-in to receive your digital token and track live queue progress via Socket.io.',
    icon: QrCode,
  },
  {
    step: '04',
    title: 'Consult & Digital Rx',
    description:
      'Meet your doctor in OPD or via encrypted WebRTC teleconsultation. Access signed prescriptions and clinical notes anytime.',
    icon: FileText,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
            Effortless Healthcare Journey
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
            How Appointment Booking Works
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            From discovering the right physician to leaving with an audited digital prescription, experience healthcare designed for clarity and peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-display text-3xl font-extrabold text-primary-600/30 group-hover:text-primary-600 transition-colors">
                      {st.step}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-ice text-primary-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform shadow-soft-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-navy-900 mb-2">
                    {st.title}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-primary-600 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Step {st.step} of 04</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-soft hover:shadow-primary-500/25 transition-all"
          >
            <span>Start Your Booking Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

