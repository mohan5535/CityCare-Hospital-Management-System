'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Priya Sharma',
    image: '/images/doctor-priya.jpg',
    specialty: 'Interventional Cardiology',
    department: 'Cardiology',
    experience: '14+ Years Exp',
    rating: 4.9,
    reviews: 142,
    fee: '₹800',
    available: 'Available Today',
    profileLink: '/doctors',
    bookingLink: '/doctors',
  },
  {
    name: 'Dr. Rajesh Verma',
    image: '/images/doctor-rajesh.jpg',
    specialty: 'Neurology & Stroke Medicine',
    department: 'Neurology',
    experience: '18+ Years Exp',
    rating: 4.9,
    reviews: 189,
    fee: '₹1,200',
    available: 'Available Today',
    profileLink: '/doctors',
    bookingLink: '/doctors',
  },
  {
    name: 'Dr. Ananya Iyer',
    image: '/images/doctor-ananya.jpg',
    specialty: 'Pediatrics & Neonatal Care',
    department: 'Pediatrics',
    experience: '10+ Years Exp',
    rating: 4.8,
    reviews: 98,
    fee: '₹600',
    available: 'Next Slot: Tomorrow',
    profileLink: '/doctors',
    bookingLink: '/doctors',
  },
  {
    name: 'Dr. Vikram Malhotra',
    image: '/images/doctor-vikram.jpg',
    specialty: 'Orthopedics & Joint Replacement',
    department: 'Orthopedics',
    experience: '15+ Years Exp',
    rating: 4.9,
    reviews: 165,
    fee: '₹900',
    available: 'Available Today',
    profileLink: '/doctors',
    bookingLink: '/doctors',
  },
];

export const FeaturedDoctors: React.FC = () => {
  return (
    <section id="featured-doctors" className="py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
              Board-Certified Practitioners
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
              Meet Our Distinguished Specialists
            </h2>
            <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
              Every medical practitioner is credential-verified and certified by hospital administration to guarantee compassionate, world-class clinical care.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm group"
            >
              <span>View All 24+ Specialists</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Doctor Grid with Realistic Photography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {doctors.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-soft hover:shadow-soft-xl hover:border-primary-200 transition-all duration-300 flex flex-col group"
            >
              {/* Doctor Portrait Container with Zoom */}
              <div className="relative aspect-[4/3] sm:aspect-[4/3.5] overflow-hidden bg-slate-100">
                <Image
                  src={doc.image}
                  alt={doc.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                {/* Department pill */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-navy-900 shadow-soft-sm border border-slate-100">
                  {doc.department}
                </div>
                {/* Verified badge */}
                <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-soft-sm">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{doc.experience}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal">({doc.reviews})</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-navy-900 group-hover:text-primary-600 transition-colors">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {doc.specialty}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-500">Consultation Fee</span>
                    <span className="font-extrabold text-navy-900 text-sm">{doc.fee}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={doc.bookingLink}
                      className="w-full text-center py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-soft-sm transition-all"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

