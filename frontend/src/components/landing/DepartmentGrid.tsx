'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart,
  Brain,
  Bone,
  Baby,
  Sparkles,
  Ear,
  Activity,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';

const DEPARTMENTS = [
  {
    name: 'Cardiology',
    slug: 'cardiology',
    desc: 'Cardiovascular diagnostics, hypertension, ECG, echocardiography, and heart failure care.',
    icon: Heart,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
    hoverBorder: 'hover:border-rose-300',
    doctorsCount: '4 Specialists',
  },
  {
    name: 'Neurology',
    slug: 'neurology',
    desc: 'Specialized management of migraines, neuromuscular disorders, stroke, and spine wellness.',
    icon: Brain,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
    doctorsCount: '3 Specialists',
  },
  {
    name: 'Orthopedics',
    slug: 'orthopedics',
    desc: 'Joint replacement, trauma care, fracture recovery, and advanced sports injury therapy.',
    icon: Bone,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    hoverBorder: 'hover:border-amber-300',
    doctorsCount: '5 Specialists',
  },
  {
    name: 'Pediatrics',
    slug: 'pediatrics',
    desc: 'Compassionate pediatric wellness, infant growth tracking, and developmental health.',
    icon: Baby,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
    doctorsCount: '4 Specialists',
  },
  {
    name: 'Dermatology',
    slug: 'dermatology',
    desc: 'Comprehensive clinical care for skin disorders, allergies, hair wellness, and therapies.',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
    hoverBorder: 'hover:border-purple-300',
    doctorsCount: '3 Specialists',
  },
  {
    name: 'ENT Specialist',
    slug: 'ent',
    desc: 'Care for sinus disorders, hearing loss, throat conditions, and head-and-neck balance.',
    icon: Ear,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    hoverBorder: 'hover:border-blue-300',
    doctorsCount: '2 Specialists',
  },
  {
    name: 'Gastroenterology',
    slug: 'gastroenterology',
    desc: 'Digestive health, liver care, gastrointestinal diagnostics, and metabolic wellness.',
    icon: Activity,
    color: 'text-teal-600 bg-teal-50 border-teal-100',
    hoverBorder: 'hover:border-teal-300',
    doctorsCount: '3 Specialists',
  },
  {
    name: 'Internal Medicine',
    slug: 'internal-medicine',
    desc: 'Comprehensive adult health, chronic illness, preventive check-ups, and diagnostic review.',
    icon: Stethoscope,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    hoverBorder: 'hover:border-slate-300',
    doctorsCount: '6 Specialists',
  },
];

export const DepartmentGrid: React.FC = () => {
  return (
    <section id="departments" className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
            Clinical Centers of Excellence
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
            Explore Medical Departments
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            Our multi-specialty departments offer comprehensive inpatient and outpatient services with board-certified physicians and advanced medical technology.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEPARTMENTS.map((dept, idx) => {
            const Icon = dept.icon;
            return (
              <Link
                key={idx}
                href={`/doctors?department=${dept.slug}`}
                className={`group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 flex flex-col justify-between ${dept.hoverBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-soft-sm ${dept.color} group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {dept.doctorsCount}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-navy-900 group-hover:text-primary-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {dept.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary-600">
                  <span>View Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
