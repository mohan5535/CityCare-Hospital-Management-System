'use client';

import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      'The Live Token tracker completely changed how I visit the hospital. I could wait comfortably nearby and walk straight in right when Token #14 was called. No sitting in crowded OPD waiting rooms for hours.',
    author: 'Rahul Deshmukh',
    treatment: 'Cardiology Patient',
    verified: true,
    rating: 5,
  },
  {
    quote:
      'Booking was instant and the doctor had my entire prescription ready on my portal immediately after our video call. It felt like an effortless, modern hospital experience for the first time.',
    author: 'Sunita Rao',
    treatment: 'Neurology Consultation',
    verified: true,
    rating: 5,
  },
  {
    quote:
      'As a working mother, the automated waitlist offer was a lifesaver. A slot opened up due to a cancellation, I received the 15-minute claim notification, and booked my son’s pediatric checkup in seconds.',
    author: 'Meera Nambiar',
    treatment: 'Pediatric Care',
    verified: true,
    rating: 5,
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-blue-100">
            Real Patient Experiences
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 tracking-tight mt-3">
            Trusted by Over 12,000 Patients
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed">
            Discover why patients and their families rely on CityCare HMS for timely, dignified, and stress-free medical appointments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-slate-200 group-hover:text-primary-200 transition-colors" />
                </div>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-navy-900">{item.author}</h4>
                  <p className="text-xs text-slate-400">{item.treatment}</p>
                </div>
                {item.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Patient
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

