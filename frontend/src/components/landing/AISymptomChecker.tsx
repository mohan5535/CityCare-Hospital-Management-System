'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Info,
  Loader2,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';

export const AISymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchApi('/ai/triage', {
        method: 'POST',
        body: JSON.stringify({ symptoms }),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze symptoms. Please select a department manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    'Persistent chest tightness and shortness of breath when walking',
    'Severe throbbing headache on left side with light sensitivity',
    'Right knee swelling and acute pain after physical injury',
    'High fever, dry cough, and mild throat irritation in child',
  ];

  return (
    <section id="ai-triage" className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 text-white relative overflow-hidden border-b border-navy-700/80">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>AI Symptom Department Navigator</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Not Sure Which Specialist to Consult?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
            Describe your symptoms in natural language. Our clinical guidance engine directs you to the most appropriate medical department.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-soft-xl">
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label htmlFor="symptom-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Describe your symptoms & discomfort:
              </label>
              <textarea
                id="symptom-input"
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="E.g., I have had a severe throbbing headache behind my eyes and nausea for two days..."
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm sm:text-base resize-none transition-all"
              />
            </div>

            {/* Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Quick examples:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSymptoms(q)}
                  className="text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/15 px-3 py-1 rounded-full border border-white/10 transition-colors truncate max-w-[280px]"
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Private & non-diagnostic; used only for navigation.</span>
              </div>
              <button
                type="submit"
                disabled={isLoading || !symptoms.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold text-sm shadow-soft transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Find Department</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              {/* Emergency Alert Banner */}
              {result.isEmergency && (
                <div className="p-4 rounded-2xl bg-rose-600/30 border-2 border-rose-500 text-white flex items-start gap-3 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-rose-200">
                      EMERGENCY RED FLAG DETECTED
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1">
                      {result.emergencyAdvice ||
                        'Your symptoms may indicate a condition requiring urgent medical evaluation. Do not delay emergency care.'}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <a
                        href="tel:112"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-soft"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Call Emergency: 112 / 108
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendation Card */}
              <div className="p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      Recommended Department
                    </span>
                    <h4 className="text-xl font-extrabold text-white">
                      {result.recommendedDepartment || 'General Internal Medicine'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                      {result.rationale ||
                        'Based on the clinical indicators provided, this specialty provides comprehensive evaluation and diagnosis.'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/doctors?department=${encodeURIComponent(
                    (result.recommendedDepartment || 'general').toLowerCase()
                  )}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shrink-0 shadow-soft transition-all"
                >
                  <span>Book with {result.recommendedDepartment || 'Specialist'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
