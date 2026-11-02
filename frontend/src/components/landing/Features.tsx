import React from 'react';
import {
  Lock,
  Clock,
  ShieldCheck,
  CreditCard,
  BellRing,
  Video,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Lock,
    title: 'Atomic Scheduling Ledger',
    desc: 'Database-enforced unique time slot locks prevent race conditions and concurrent double-bookings with 10-minute payment hold windows.',
    tag: 'Concurrency Safe',
  },
  {
    icon: Clock,
    title: 'Persistent Live Token Tracker',
    desc: 'Real-time Socket.io token updates. Patients can monitor their queue position and estimated wait times remotely without crowded waiting rooms.',
    tag: 'Socket.io',
  },
  {
    icon: ShieldCheck,
    title: 'Practitioner Verification',
    desc: 'Doctors must have verified medical registration numbers and administrator approval before accepting patient bookings.',
    tag: 'Clinical Safety',
  },
  {
    icon: CreditCard,
    title: 'Payment Ledger & Razorpay',
    desc: 'Secure Indian payment gateway integration with cryptographic HMAC-SHA256 signature verification and idempotent webhook reconciliation.',
    tag: 'Financial Integrity',
  },
  {
    icon: BellRing,
    title: 'Automated Slot Waitlists',
    desc: 'When an appointment is cancelled, waitlisted patients receive immediate notifications with exclusive time-limited offers to claim the slot.',
    tag: 'Automated Priority',
  },
  {
    icon: Video,
    title: 'Encrypted Teleconsultation',
    desc: 'Integrated browser-to-browser WebRTC video consultations with room authentication, camera/microphone controls, and prescription drafting.',
    tag: 'WebRTC Ready',
  },
];

export const Features: React.FC = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-primary-600 font-semibold text-xs uppercase tracking-wider mb-2">
            Engineered for Modern Healthcare
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Reliable Architecture from Reception to Consultation
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Every feature is designed around real hospital workflows, protecting patient data integrity and eliminating scheduling conflicts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

