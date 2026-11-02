'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, downloadFileApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useAuth } from '../../../context/AuthContext';
import { Appointment, Prescription, PublicQueueData } from '../../../types';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  XCircle,
  CalendarDays,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Loader2,
  Building2,
  Volume2,
  Printer,
  Download,
  ChevronRight,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Token & Queue state for today's checked-in appointment
  const [activeQueueData, setActiveQueueData] = useState<PublicQueueData | null>(null);
  const [calledAlert, setCalledAlert] = useState<string | null>(null);

  // Appointment Details Modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Cancel Modal
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict');
  const [isCancelling, setIsCancelling] = useState(false);

  // Prescription View Modal
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Pay Modal
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadAppointments = () => {
    setLoading(true);
    fetchApi('/appointments/my')
      .then((res) => {
        const appts: Appointment[] = res.data || [];
        setAppointments(appts);

        // Check if there's an appointment today that is checked-in or in consultation
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const localToday = `${yyyy}-${mm}-${dd}`;
        const utcToday = now.toISOString().slice(0, 10);
        const isTodayDate = (d: string) => d === localToday || d === utcToday;

        const todayQueued = appts.find(
          (a) =>
            isTodayDate(a.appointmentDate) &&
            (a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION')
        );

        if (todayQueued && todayQueued.doctor) {
          const docId = todayQueued.doctor._id || (todayQueued.doctor as any);
          fetchApi(`/queue/public/${docId}`)
            .then((qRes) => setActiveQueueData(qRes.data))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAppointments();

      // Setup Socket.io notifications
      const socket = getSocket();
      if (user?._id) {
        socket.emit('join_user_room', user._id);
      }

      socket.on('token.called', (payload: { tokenNumber: number; message: string }) => {
        setCalledAlert(payload.message || `Token #${payload.tokenNumber} is now called!`);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
        } catch (e) {
          // Audio policy ignore
        }
      });

      socket.on('queue.updated', (data: PublicQueueData) => {
        setActiveQueueData(data);
      });

      socket.on('appointment.updated', () => {
        loadAppointments();
      });

      return () => {
        socket.off('token.called');
        socket.off('queue.updated');
        socket.off('appointment.updated');
      };
    }
  }, [authLoading, isAuthenticated, user]);

  const handleCancel = async () => {
    if (!cancellingAppointmentId) return;
    setIsCancelling(true);
    try {
      await fetchApi(`/appointments/${cancellingAppointmentId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      });
      setCancellingAppointmentId(null);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCheckIn = async (appointmentId: string, doctorId: string) => {
    try {
      await fetchApi(`/appointments/${appointmentId}/check-in`, {
        method: 'POST',
      });
      loadAppointments();
      router.push(`/patient/queue/${doctorId}`);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleViewPrescription = async (appointmentId: string) => {
    setLoadingPrescription(true);
    try {
      const res = await fetchApi(`/prescriptions/appointment/${appointmentId}`);
      setViewingPrescription(res.data);
    } catch (err: any) {
      alert(err.message || 'No finalized prescription available yet.');
    } finally {
      setLoadingPrescription(false);
    }
  };

  const handleDownloadPdf = async (prescriptionId: string, ref: string) => {
    setDownloadingPdfId(prescriptionId);
    try {
      await downloadFileApi(
        `/prescriptions/${prescriptionId}/pdf`,
        `CityCare-Prescription-${ref || 'Consultation'}.pdf`
      );
    } catch (err: any) {
      alert(err.message || 'Error downloading PDF');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handlePayNow = async (apt: Appointment) => {
    setIsProcessingPayment(true);
    try {
      const orderRes = await fetchApi('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ appointmentId: apt._id }),
      });

      const orderData = orderRes.data;

      await fetchApi('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: apt._id,
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: `pay_sandbox_${Date.now()}`,
          razorpaySignature: 'sandbox_verified_signature',
        }),
      });

      alert('Payment confirmed successfully!');
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md space-y-4">
          <Calendar className="w-10 h-10 text-primary-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 font-display">Sign in to view your appointments</h2>
          <p className="text-xs text-slate-500">Access your healthcare bookings, live queue tokens, and digital prescriptions.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 shadow-soft transition-colors"
          >
            Sign In with Patient Account
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const localToday = `${yyyy}-${mm}-${dd}`;
  const utcToday = now.toISOString().slice(0, 10);
  const isTodayDate = (d: string) => d === localToday || d === utcToday;

  const activeQueuedAppt = appointments.find(
    (a) =>
      isTodayDate(a.appointmentDate) &&
      (a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION')
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Token Call Chime Alert Banner */}
        {calledAlert && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-6 h-6 text-white shrink-0" />
              <div>
                <div className="font-extrabold text-base">Consultation Chime Alert!</div>
                <div className="text-xs text-amber-100">{calledAlert}</div>
              </div>
            </div>
            <button
              onClick={() => setCalledAlert(null)}
              className="text-xs bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-xl font-bold"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Live Token Queue Tracker Widget if Patient is in Queue Today */}
        {activeQueuedAppt && activeQueueData && (
          <div className="bg-gradient-to-br from-navy-900 via-primary-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    Live Token Queue Active
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Dr. {activeQueuedAppt.doctor?.firstName} {activeQueuedAppt.doctor?.lastName}
                </h2>
                <div className="text-xs text-primary-200 flex flex-wrap gap-3">
                  <span>Ref: {activeQueuedAppt.appointmentReference}</span>
                  <span>•</span>
                  <span>Today's Time: {activeQueuedAppt.startTime}</span>
                  <span>•</span>
                  <span>Currently Serving: #{activeQueueData.currentRunningToken || 0}</span>
                </div>

                {/* Doctor Delay Notice if any */}
                {activeQueueData.doctorDelayMinutes ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Clinical Delay Recorded:</strong> ~{activeQueueData.doctorDelayMinutes} mins delay ({activeQueueData.delayReason || 'Emergency inpatient case'}).
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={`/patient/queue/${activeQueuedAppt.doctor?._id || (activeQueuedAppt.doctor as any)}`}
                  className="w-full sm:w-auto px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-transform hover:scale-105"
                >
                  <Activity className="w-4 h-4" />
                  <span>Open Live Board Tracker</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight font-display">
              My Appointments & Prescriptions
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Confirmed consultations, appointment references, live token tracking, and downloadable medical records.
            </p>
          </div>
          <Link
            href="/doctors"
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-xs shadow-sm inline-flex items-center space-x-1.5 self-start"
          >
            <Calendar className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                <div className="h-5 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <CalendarDays className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No appointments scheduled</h3>
            <p className="text-xs text-slate-500">You do not have any past or upcoming medical appointments.</p>
            <Link href="/doctors" className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-semibold">
              Find a Doctor Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const isToday = isTodayDate(apt.appointmentDate);
              const isConfirmed = apt.status === 'CONFIRMED';
              const isInQueue = apt.status === 'IN_QUEUE' || apt.status === 'CHECKED_IN';
              const isConsulting = apt.status === 'IN_CONSULTATION';
              const isCompleted = apt.status === 'COMPLETED';
              const isCancelled = apt.status === 'CANCELLED';
              const isNoShow = apt.status === 'NO_SHOW';

              const hasFinalizedPrescription =
                apt.prescription && apt.prescription.status === 'FINALIZED';

              return (
                <div
                  key={apt._id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-navy-900 text-base">
                        Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                      </span>
                      {apt.appointmentReference && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {apt.appointmentReference}
                        </span>
                      )}
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                        {apt.department?.name || 'Medical Specialist'}
                      </span>
                      {apt.type === 'TELECONSULTATION' ? (
                        <span className="inline-flex items-center space-x-1 text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-semibold">
                          <Video className="w-3 h-3" />
                          <span>Video Consult</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                          <Building2 className="w-3 h-3" />
                          <span>In-Hospital</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-primary-600" />
                        <span>{apt.appointmentDate}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        <span>{apt.startTime} - {apt.endTime}</span>
                      </div>
                      <div className="text-slate-500">
                        Reason: <span className="text-slate-700 font-medium">{apt.reasonForVisit}</span>
                      </div>
                    </div>

                    {/* Status badges & Consultation states */}
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      {isConfirmed && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-primary-100 text-primary-800">
                          Confirmed
                        </span>
                      )}
                      {isInQueue && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Checked In • In Queue</span>
                        </span>
                      )}
                      {isConsulting && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-teal-100 text-teal-800 flex items-center space-x-1 animate-pulse">
                          <Stethoscope className="w-3 h-3 text-teal-600" />
                          <span>Consultation in Progress</span>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Consultation Completed</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-rose-100 text-rose-800">
                          Cancelled
                        </span>
                      )}
                      {isNoShow && (
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-slate-200 text-slate-700">
                          No Show
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${
                          apt.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        Payment: {apt.paymentStatus} (₹{apt.consultationFee})
                      </span>

                      {/* Finalized Prescription availability indicator */}
                      {hasFinalizedPrescription && (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-primary-50 text-primary-700 border border-primary-200 flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-primary-600" />
                          <span>Official Rx Finalized</span>
                        </span>
                      )}

                      {/* Follow-up reminder if set by doctor */}
                      {apt.prescription?.followUpDate && (
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Follow-up: {apt.prescription.followUpDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* View Details button */}
                    <button
                      onClick={() => setSelectedAppointment(apt)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="View appointment summary"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>Details</span>
                    </button>

                    {/* Pay now if pending */}
                    {apt.paymentStatus === 'PENDING' && !isCancelled && (
                      <button
                        onClick={() => handlePayNow(apt)}
                        disabled={isProcessingPayment}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Online ₹{apt.consultationFee}</span>
                      </button>
                    )}

                    {/* Check In if today */}
                    {isToday && isConfirmed && !isInQueue && !isConsulting && !isCompleted && (
                      <button
                        onClick={() => {
                          const docId = apt.doctor?._id || (typeof apt.doctor === 'string' ? apt.doctor : '');
                          handleCheckIn(apt._id, docId);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Check In & Get Token</span>
                      </button>
                    )}

                    {/* View Token if in queue */}
                    {(isInQueue || isConsulting) && (
                      <Link
                        href={`/patient/queue/${apt.doctor?._id || (typeof apt.doctor === 'string' ? apt.doctor : '')}`}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 rounded-xl text-xs font-bold flex items-center space-x-1"
                      >
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        <span>Live Queue Board</span>
                      </Link>
                    )}

                    {/* Teleconsultation link */}
                    {apt.type === 'TELECONSULTATION' && apt.teleconsultationRoomId && !isCancelled && (
                      <Link
                        href={`/teleconsultation/${apt.teleconsultationRoomId}`}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Video Room</span>
                      </Link>
                    )}

                    {/* Finalized Prescription Actions */}
                    {hasFinalizedPrescription ? (
                      <>
                        <button
                          onClick={() => handleViewPrescription(apt._id)}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Rx</span>
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadPdf(
                              apt.prescription?._id || apt._id,
                              apt.appointmentReference || 'Consultation'
                            )
                          }
                          disabled={downloadingPdfId === (apt.prescription?._id || apt._id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                          title="Download Official PDF"
                        >
                          {downloadingPdfId === (apt.prescription?._id || apt._id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>PDF</span>
                        </button>
                      </>
                    ) : isCompleted ? (
                      <span className="text-[11px] text-slate-400 italic px-2 py-1">
                        Prescription awaiting doctor signature
                      </span>
                    ) : null}

                    {/* Cancel button */}
                    {isConfirmed && !isInQueue && !isConsulting && (
                      <button
                        onClick={() => setCancellingAppointmentId(apt._id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-lg">Appointment Details</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref: {selectedAppointment.appointmentReference || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Doctor</span>
                    <strong className="text-navy-900 text-sm">
                      Dr. {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Specialty</span>
                    <strong className="text-slate-800">{selectedAppointment.department?.name || 'Specialist'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Date & Time</span>
                    <span className="text-slate-700 font-medium">
                      {selectedAppointment.appointmentDate} at {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Consultation Fee</span>
                    <span className="font-bold text-emerald-700">₹{selectedAppointment.consultationFee} ({selectedAppointment.paymentStatus})</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-0.5">Reason for Consultation</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium">
                    {selectedAppointment.reasonForVisit}
                  </div>
                </div>

                {selectedAppointment.symptomsSummary && (
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-0.5">Symptoms Notes</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                      {selectedAppointment.symptomsSummary}
                    </div>
                  </div>
                )}

                {/* Consultation Lifecycle Timestamps */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Current Status:</span>
                    <strong className="text-navy-900 uppercase font-bold">{selectedAppointment.status}</strong>
                  </div>
                  {selectedAppointment.consultationStartedAt && (
                    <div className="flex justify-between">
                      <span>Consultation Started:</span>
                      <span>{new Date(selectedAppointment.consultationStartedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedAppointment.consultationEndedAt && (
                    <div className="flex justify-between">
                      <span>Consultation Completed:</span>
                      <span>{new Date(selectedAppointment.consultationEndedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingAppointmentId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-lg">
                <AlertCircle className="w-5 h-5" />
                <span>Cancel Appointment</span>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel? This slot will immediately be released and offered to waitlisted patients.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for cancellation</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancellingAppointmentId(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Keep Appointment
                </button>
                <button
                  disabled={isCancelling}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Prescription View & Print Modal */}
        {viewingPrescription && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 print:shadow-none print:border-none print:p-0">
              {/* Header Letterhead */}
              <div className="border-b-2 border-primary-600 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-900 font-display">CityCare Medical Center</h2>
                  <p className="text-xs text-slate-500">Official Clinical Outpatient Prescription Record</p>
                  <p className="text-[11px] text-slate-400">Accredited Clinical Care • 24x7 Emergency: 112 / 108</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-navy-900">
                    Dr. {viewingPrescription.doctor?.firstName} {viewingPrescription.doctor?.lastName}
                  </div>
                  <div className="text-[11px] text-primary-600 font-semibold">Attending Medical Specialist</div>
                  <div className="text-[10px] text-slate-400">Version {viewingPrescription.version || 1} • {viewingPrescription.status || 'FINALIZED'}</div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient Name</span>
                  <span className="font-bold text-slate-900">{viewingPrescription.patient?.firstName} {viewingPrescription.patient?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Reference</span>
                  <span className="font-mono text-slate-800">{viewingPrescription.appointmentReference || 'Consultation'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Consultation Date</span>
                  <span className="text-slate-800">{new Date(viewingPrescription.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Validation Status</span>
                  <span className="font-bold text-emerald-700">{viewingPrescription.status || 'FINALIZED'}</span>
                </div>
              </div>

              {/* Vitals */}
              {viewingPrescription.vitals && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.bloodPressure || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Pulse</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.pulseRate || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.temperature || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.spO2 || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Weight</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.weight || 'N/A'}</strong>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div className="text-xs">
                <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Clinical Diagnosis</span>
                <p className="text-sm font-bold text-navy-900 mt-1 p-3 bg-primary-50/50 rounded-xl border border-primary-100">
                  {viewingPrescription.diagnosis}
                </p>
              </div>

              {/* Medications Table */}
              <div className="text-xs space-y-2">
                <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Prescribed Medications (Rx)</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Strength</th>
                        <th className="p-2.5">Route</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingPrescription.medications?.map((med, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-navy-900">{med.name}</td>
                          <td className="p-2.5">{med.dosage}</td>
                          <td className="p-2.5 text-slate-600">{med.route || 'Oral'}</td>
                          <td className="p-2.5 font-semibold text-primary-700">{med.frequency}</td>
                          <td className="p-2.5">{med.duration}</td>
                          <td className="p-2.5 text-slate-500">{med.timing} {med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Advice & Follow-Up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {viewingPrescription.clinicalNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">Doctor Advice</span>
                    <p className="text-slate-700">{viewingPrescription.clinicalNotes}</p>
                  </div>
                )}
                {viewingPrescription.followUpDate && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">Recommended Follow-up</span>
                    <p className="text-primary-700 font-bold">{viewingPrescription.followUpDate}</p>
                  </div>
                )}
              </div>

              {/* Digital Signature */}
              <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-xs">
                <div className="text-[10px] text-slate-400">
                  Digitally issued under CityCare Hospital Management System. Keep this record for your health history.
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-base text-navy-900 border-b border-slate-300 pb-1">
                    Dr. {viewingPrescription.doctor?.firstName} {viewingPrescription.doctor?.lastName}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">Authorized Doctor Sign-off</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
                <button
                  onClick={() =>
                    handleDownloadPdf(
                      viewingPrescription._id,
                      viewingPrescription.appointmentReference || 'Consultation'
                    )
                  }
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print View</span>
                </button>
                <button
                  onClick={() => setViewingPrescription(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
