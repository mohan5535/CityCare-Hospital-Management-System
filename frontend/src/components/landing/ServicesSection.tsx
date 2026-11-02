'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock,
  Sparkles,
  Video,
  FileCheck2,
  Hourglass,
  ArrowRight,
  Shield,
} from 'lucide-react';

const services = [
  {
    title: 'Atomic OPD Scheduling',
    description:
      'Zero double-booking guarantee powered by database-level compound unique constraints and 10-minute atomic locks.',
    icon: CalendarCheck2,
    badge: 'Zero Conflicts',
    badgeColor: 'bg-blue-50 text-primary-700 border-blue-200',
    link: '/doctors',
  },
  {
    title: 'Live Token Queue Tracker',
    description:
      'Real-time Socket.io token broadcasting with rolling wait-time estimates so patients never wait blindly in waiting rooms.',
    icon: Clock,
    badge: 'Live Sync',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    link: '/patient/queue/dr.priya@hms.com',
  },
  {
    title: 'AI Symptom Guidance',
    description:
      'Natural-language symptom evaluation with automated life-threatening red-flag detection and emergency helpline guidance.',
    icon: Sparkles,
    badge: 'Triage AI',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    link: '#ai-triage',
  },
  {
    title: 'WebRTC Teleconsultations',
    description:
      'High-definition in-browser encrypted video consultation with camera, microphone, and live clinical note synchronization.',
    icon: Video,
    badge: 'Encrypted',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    link: '/patient/appointments',
  },
  {
    title: 'Digital Prescriptions & Records',
    description:
      'Tamper-evident prescriptions, vitals tracking, dosage instructions, and patient history strictly isolated by RBAC permissions.',
    icon: FileCheck2,
    badge: 'HIPAA Audited',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    link: '/patient/appointments',
  },
  {
    title: 'Automated Priority Waitlist',
    description:
      'When slots release, BullMQ automated background workers notify waitlisted patients with an exclusive 15-minute booking offer.',
    icon: Hourglass,
    badge: 'Smart Claim',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    link: '/doctors',
  },
];

export const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
            Engineered For Clinical Integrity
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
            Healthcare Services Built for Trust
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            From atomic double-booking prevention to live queue broadcasting, every module is designed to solve real hospital workflow bottlenecks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-xl hover:border-primary-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-ice text-primary-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-soft-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${svc.badgeColor}`}
                    >
                      {svc.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-navy-900 group-hover:text-primary-600 transition-colors">
                    {svc.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={svc.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

