'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '../../lib/api';
import { DoctorProfile, Department } from '../../types';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  Video,
  Clock,
  Calendar,
  ArrowRight,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

function DoctorsPageContent() {
  const searchParams = useSearchParams();
  const initialDeptSlug = searchParams.get('departmentSlug') || searchParams.get('department') || '';
  const initialSearch = searchParams.get('search') || '';

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string>(initialDeptSlug);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [teleconsultationOnly, setTeleconsultationOnly] = useState(false);
  const [maxFee, setMaxFee] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const dept = searchParams.get('departmentSlug') || searchParams.get('department') || '';
    const search = searchParams.get('search') || '';
    setSelectedDeptSlug(dept);
    setSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    // Fetch clinical departments
    fetchApi('/departments')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.departments || []);
        setDepartments(list);
      })
      .catch((err) => console.error('Failed to load departments:', err));
  }, []);

  const loadDoctors = useCallback(() => {
    setIsLoading(true);
    setApiError(null);

    let url = `/doctors?limit=50`;
    if (selectedDeptSlug) url += `&departmentSlug=${encodeURIComponent(selectedDeptSlug)}`;
    if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    if (teleconsultationOnly) url += `&teleconsultation=true`;
    if (maxFee < 2000) url += `&maxFee=${maxFee}`;

    fetchApi(url)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.doctors || []);
        setDoctors(list);
      })
      .catch((err) => {
        console.error('Error fetching doctors:', err);
        setApiError(err.message || 'Unable to connect to hospital server. Please verify backend service.');
      })
      .finally(() => setIsLoading(false));
  }, [selectedDeptSlug, searchQuery, teleconsultationOnly, maxFee]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleResetFilters = () => {
    setSelectedDeptSlug('');
    setSearchQuery('');
    setTeleconsultationOnly(false);
    setMaxFee(2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Find Hospital Specialists
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Book certified appointments with verified practitioners across all clinical departments.
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor by name, specialty (e.g. Heart, Migraine, Joints)..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={teleconsultationOnly}
                  onChange={(e) => setTeleconsultationOnly(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <Video className="w-4 h-4 text-primary-600" />
                <span>Teleconsultation Only</span>
              </label>
            </div>
          </div>

          {/* Department Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              onClick={() => setSelectedDeptSlug('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                !selectedDeptSlug
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Specialties
            </button>
            {departments.map((dept) => (
              <button
                key={dept._id}
                onClick={() => setSelectedDeptSlug(dept.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDeptSlug === dept.slug
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-6 text-center max-w-xl mx-auto mb-8 shadow-xs space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-base">Backend Connection Issue</h3>
              <p className="text-rose-700 text-xs mt-1 leading-relaxed">{apiError}</p>
            </div>
            <div className="pt-1">
              <button
                onClick={loadDoctors}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4">
                <div className="flex space-x-3">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : !apiError && doctors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">No specialists found</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              {selectedDeptSlug || searchQuery || teleconsultationOnly || maxFee < 2000
                ? 'No certified medical practitioners match your selected criteria. Try adjusting or clearing your filters.'
                : 'No verified hospital practitioners are currently registered in this department.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-primary-50 text-primary-600 font-semibold text-xs rounded-xl hover:bg-primary-100 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-primary-300 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
                        {doc.user?.firstName?.[0] || 'D'}
                        {doc.user?.lastName?.[0] || 'R'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-bold text-slate-900 text-base">
                            {doc.user?.firstName || 'Doctor'} {doc.user?.lastName || ''}
                          </h3>
                          <span title="Verified Medical License">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary-600">
                          {doc.department?.name || 'Specialist'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {doc.qualifications?.join(', ') || 'MBBS'} • {doc.experienceYears || 0}+ yrs exp
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Bio */}
                  <div className="mt-4 flex items-center space-x-2 text-xs">
                    <div className="flex items-center text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                      <span>{(doc.averageRating || 5.0).toFixed(1)}</span>
                    </div>
                    <span className="text-slate-400">({doc.totalReviews || 0} consultations)</span>
                    {doc.teleconsultationEnabled && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        <Video className="w-3 h-3 text-teal-600" />
                        <span>Video Consult</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {doc.bio || 'Dedicated medical specialist committed to clinical excellence.'}
                  </p>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Fee
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{doc.consultationFee || 500}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/patient/queue/${doc.user?._id || doc._id}`}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-primary-600 hover:bg-slate-50 transition-colors"
                      title="View Live Queue Token Tracker"
                    >
                      <Clock className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/doctors/${doc._id}`}
                      className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-md shadow-primary-500/20 transition-all flex items-center space-x-1.5"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500">Loading specialist directory...</div>}>
      <DoctorsPageContent />
    </Suspense>
  );
}
