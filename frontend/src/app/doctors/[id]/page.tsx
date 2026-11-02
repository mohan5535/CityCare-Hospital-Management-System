'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { DoctorProfile, GeneratedSlot } from '../../../types';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Video,
  Star,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BellRing,
  CreditCard,
  Building2,
  Loader2,
} from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const doctorId = params.id as string;
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<GeneratedSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<GeneratedSlot | null>(null);

  const [appointmentType, setAppointmentType] = useState<'IN_PERSON' | 'TELECONSULTATION'>('IN_PERSON');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [symptomsSummary, setSymptomsSummary] = useState('');

  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Waitlist state
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Generate next 7 dates starting from today
  const next7Days = React.useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      dates.push({ dateStr, dayName, dayNum, monthName });
    }
    return dates;
  }, []);

  useEffect(() => {
    if (next7Days.length > 0 && !selectedDate) {
      setSelectedDate(next7Days[0].dateStr);
    }
  }, [next7Days, selectedDate]);

  // Load doctor details
  useEffect(() => {
    setIsLoadingDoctor(true);
    fetchApi(`/doctors/${doctorId}`)
      .then((res) => {
        setDoctor(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingDoctor(false));
  }, [doctorId]);

  const getDocUserId = (doc: DoctorProfile | null): string => {
    if (!doc) return '';
    return doc.user?._id || (typeof doc.user === 'string' ? doc.user : '');
  };

  // Load slots for selected date
  useEffect(() => {
    if (!doctor || !selectedDate) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    setBookingError(null);

    const docUserId = getDocUserId(doctor);
    fetchApi(`/availability/slots?doctorId=${docUserId}&date=${selectedDate}`)
      .then((res) => {
        setSlots(res.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingSlots(false));
  }, [doctor, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!isAuthenticated) {
      setBookingError('Please sign in to your patient account to book an appointment.');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const docUserId = getDocUserId(doctor);
      const res = await fetchApi('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: docUserId,
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          type: appointmentType,
          reasonForVisit: reasonForVisit || 'General Medical Consultation',
          symptomsSummary,
          idempotencyKey: `hms-book-${user?._id}-${selectedDate}-${selectedSlot.startTime}`,
        }),
      });

      setBookingSuccess(res.data);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book slot. It might have been taken by another patient.');
      // Refresh slots
      const docUserId = getDocUserId(doctor);
      fetchApi(`/availability/slots?doctorId=${docUserId}&date=${selectedDate}`).then((r) =>
        setSlots(r.data || [])
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      const docUserId = getDocUserId(doctor);
      await fetchApi('/waitlist/join', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: docUserId,
          desiredDate: selectedDate,
        }),
      });
      setWaitlistSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to join waitlist');
    }
  };

  if (isLoadingDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-800">Doctor not found</h2>
        <button onClick={() => router.push('/doctors')} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm">
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Doctor Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start space-x-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
                {doctor.user.firstName?.[0]}
                {doctor.user.lastName?.[0]}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {doctor.user.firstName} {doctor.user.lastName}
                  </h1>
                  <span title="Verified Medical License">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary-600 mt-1">
                  {doctor.department?.name} Specialist
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                  <span>{doctor.qualifications?.join(', ')}</span>
                  <span>•</span>
                  <span>{doctor.experienceYears} Years Experience</span>
                  <span>•</span>
                  <span>License: {doctor.licenseNumber}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right w-full md:w-auto flex md:flex-col justify-between items-center md:items-end">
              <div className="text-xs uppercase font-bold text-slate-400">Consultation Fee</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">₹{doctor.consultationFee}</div>
              <div className="text-[11px] text-teal-600 font-medium">Atomic Slot Allocation</div>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        {bookingSuccess ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center max-w-xl mx-auto shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Appointment Confirmed!</h2>
            <p className="text-sm text-slate-600">
              Your appointment with {doctor.user.firstName} {doctor.user.lastName} is confirmed for{' '}
              <strong className="text-slate-900">{bookingSuccess.appointmentDate}</strong> at{' '}
              <strong className="text-slate-900">{bookingSuccess.startTime}</strong>.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-1.5">
              <div><strong>Appointment ID:</strong> {bookingSuccess._id}</div>
              <div><strong>Type:</strong> {bookingSuccess.type}</div>
              <div><strong>Status:</strong> <span className="text-emerald-700 font-semibold">{bookingSuccess.status}</span></div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => router.push('/patient/appointments')}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 shadow-sm"
              >
                View My Appointments
              </button>
              <button
                onClick={() => router.push(`/patient/queue/${getDocUserId(doctor)}`)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Track Live Queue
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Date & Slot Picker */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date selection carousel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 mb-4">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>Select Consultation Date</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {next7Days.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-3 rounded-2xl text-center border transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`text-[10px] font-bold uppercase ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>
                          {d.dayName}
                        </div>
                        <div className="text-lg font-extrabold my-0.5">{d.dayNum}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-primary-100' : 'text-slate-400'}`}>
                          {d.monthName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span>Available Time Slots ({selectedDate})</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Available</span>
                    <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1.5" /> Booked</span>
                  </div>
                </div>

                {isLoadingSlots ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 mb-2" />
                    <span>Checking scheduling ledger...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
                    <p className="text-slate-600 text-xs">No scheduled consultation slots on this date.</p>
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Join Slot Waitlist</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {slots.map((slot, i) => {
                      const isAvailable = slot.status === 'AVAILABLE';
                      const isSelected = selectedSlot?.startTime === slot.startTime;

                      return (
                        <button
                          key={i}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-300'
                              : isAvailable
                              ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Booking Form Summary */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-bold text-slate-900 text-base">
                  Consultation Summary
                </h3>

                {/* Consultation type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentType('IN_PERSON')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        appointmentType === 'IN_PERSON'
                          ? 'bg-primary-50 text-primary-700 border-primary-400 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>In-Hospital</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentType('TELECONSULTATION')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        appointmentType === 'TELECONSULTATION'
                          ? 'bg-teal-50 text-teal-700 border-teal-400 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Call</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Reason for Consultation
                  </label>
                  <input
                    type="text"
                    required
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    placeholder="e.g. Follow-up ECG review, fever, joint pain"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Symptoms Summary (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={symptomsSummary}
                    onChange={(e) => setSymptomsSummary(e.target.value)}
                    placeholder="Any relevant duration, severity or previous medications..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-primary-500"
                  />
                </div>

                {/* Selected Slot Recap */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-800">{selectedDate || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time Slot:</span>
                    <span className="font-semibold text-primary-600">
                      {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'Select a slot'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold">
                    <span>Fee:</span>
                    <span className="text-slate-900">₹{doctor.consultationFee}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="p-3.5 rounded-2xl bg-primary-50/80 border border-primary-100 text-slate-700 text-xs space-y-2">
                    <div className="font-medium text-navy-900">Sign in to confirm your appointment reservation.</div>
                    <Link
                      href={`/login`}
                      className="inline-flex items-center justify-center w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                    >
                      Sign In to Book
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedSlot || isBooking}
                  onClick={handleBooking}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 text-xs flex items-center justify-center space-x-2 transition-all"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locking Slot Atomically...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Book Appointment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waitlist Modal */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
                <BellRing className="w-5 h-5 text-teal-600" />
                <span>Join Slot Waitlist</span>
              </div>
              <p className="text-xs text-slate-600">
                All regular slots are currently reserved. If another patient cancels or reschedules,
                you will automatically receive an exclusive 15-minute priority claim offer!
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div><strong>Doctor:</strong> {doctor.user.firstName} {doctor.user.lastName}</div>
                <div><strong>Date:</strong> {selectedDate}</div>
              </div>

              {waitlistSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  You are registered on the waitlist! We will notify you immediately when a slot opens.
                </div>
              ) : null}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowWaitlistModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                {!waitlistSuccess && (
                  <button
                    onClick={handleJoinWaitlist}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Confirm Waitlist Registration
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
