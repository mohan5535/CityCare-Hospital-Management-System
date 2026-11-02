'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarPlus,
  Search,
  Sparkles,
  Video,
  Clock,
  FileText,
  ArrowUpRight,
} from 'lucide-react';

const actions = [
  {
    title: 'Book Appointment',
    subtitle: 'Atomic real-time slots',
    icon: CalendarPlus,
    href: '/doctors',
    iconBg: 'bg-blue-50 text-primary-600 border-blue-100',
    hoverBorder: 'hover:border-primary-300',
  },
  {
    title: 'Find a Specialist',
    subtitle: 'Verified doctors by dept',
    icon: Search,
    href: '/doctors',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
  },
  {
    title: 'AI Symptom Guidance',
    subtitle: 'Emergency triage guide',
    icon: Sparkles,
    href: '#ai-triage',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
  },
  {
    title: 'Video Consultation',
    subtitle: 'Encrypted WebRTC calls',
    icon: Video,
    href: '/patient/appointments',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    hoverBorder: 'hover:border-purple-300',
  },
  {
    title: 'Track Live Token',
    subtitle: 'Real-time queue board',
    icon: Clock,
    href: '/patient/queue/dr.priya@hms.com',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    hoverBorder: 'hover:border-amber-300',
  },
  {
    title: 'Medical Records',
    subtitle: 'Signed prescriptions',
    icon: FileText,
    href: '/patient/appointments',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    hoverBorder: 'hover:border-teal-300',
  },
];

export const QuickActionPanel: React.FC = () => {
  return (
    <div className="relative -mt-6 sm:-mt-8 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-soft-xl border border-slate-200/80 p-3 sm:p-4 lg:p-6 backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <Link
                key={idx}
                href={act.href}
                className={`flex flex-col items-start p-3.5 sm:p-4 rounded-xl border border-slate-100 hover:bg-slate-50/80 transition-all duration-200 group ${act.hoverBorder}`}
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-soft-sm ${act.iconBg} group-hover:scale-105 transition-transform duration-200`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-navy-900 text-sm leading-snug group-hover:text-primary-600 transition-colors">
                  {act.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {act.subtitle}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

