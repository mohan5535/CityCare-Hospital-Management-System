'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi, downloadFileApi } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useAuth } from '../../../context/AuthContext';
import { ClinicalQueueEntry, Appointment, Prescription } from '../../../types';
import {
  Users,
  Clock,
  CheckCircle2,
  Volume2,
  FilePlus,
  Play,
  SkipForward,
  Video,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Search,
  Printer,
  Calendar,
  Activity,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Download,
  Info,
  UserCheck,
  Stethoscope,
} from 'lucide-react';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<
    'TODAY' | 'WAITING' | 'IN_CONSULTATION' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED_NOSHOW' | 'ALL'
  >('TODAY');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueEntries, setQueueEntries] = useState<ClinicalQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Active consultation & modal states
  const [activeConsultationAppt, setActiveConsultationAppt] = useState<any | null>(null);
  const [selectedPatientAppt, setSelectedPatientAppt] = useState<Appointment | null>(null);
  const [activeQueueEntryId, setActiveQueueEntryId] = useState<string | null>(null);

  // Action in progress indicators
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Prescription Modal Form State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptomsAndFindings, setSymptomsAndFindings] = useState('');
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80',
    pulseRate: '72',
    temperature: '98.6',
    weight: '68',
    spO2: '98%',
  });
  const [medications, setMedications] = useState([
    {
      name: '',
      dosage: '500 mg',
      route: 'Oral',
      frequency: '1-0-1',
      duration: '5 days',
      timing: 'After food',
      quantity: '10 Tablets',
      instructions: '',
    },
  ]);
  const [labTestsRecommended, setLabTestsRecommended] = useState<string[]>([]);
  const [newLabTest, setNewLabTest] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [additionalAdvice, setAdditionalAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  // Prescription Printable View Modal
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);

  // Doctor Delay Modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Emergency ICU consultation');
  const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apptsRes, queueRes] = await Promise.all([
        fetchApi('/appointments/my?limit=100'),
        fetchApi('/queue/clinical').catch(() => ({ data: { entries: [] } })),
      ]);
      setAppointments(apptsRes.data || []);
      setQueueEntries(queueRes.data?.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'DOCTOR') {
      loadData();

      // Listen for socket queue updates
      const socket = getSocket();
      socket.emit('join_doctor_queue', user._id);

      socket.on('queue.updated', () => {
        loadData();
      });

      socket.on('appointment.updated', () => {
        loadData();
      });

      return () => {
        socket.emit('leave_doctor_queue', user._id);
        socket.off('queue.updated');
        socket.off('appointment.updated');
      };
    }
  }, [authLoading, isAuthenticated, user]);

  // Action 2: Check In / Mark Arrived
  const handleCheckIn = async (appointmentId: string) => {
    setActionInProgressId(appointmentId);
    try {
      await fetchApi(`/appointments/${appointmentId}/check-in`, {
        method: 'POST',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to check in patient');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Action 3: Call Patient
  const handleCallPatient = async (entryId: string) => {
    setActionInProgressId(entryId);
    try {
      await fetchApi(`/queue/${entryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CALLED' }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to call patient');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Action 4: Start Consultation
  const handleStartConsultation = async (appointmentId: string, queueEntryId?: string) => {
    setActionInProgressId(appointmentId);
    try {
      await fetchApi(`/appointments/${appointmentId}/start-consultation`, {
        method: 'POST',
      });
      if (queueEntryId) {
        await fetchApi(`/queue/${queueEntryId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_CONSULTATION' }),
        }).catch(() => {});
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to start consultation');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Action 7: Complete Consultation
  const handleCompleteConsultation = async (appointmentId: string, queueEntryId?: string) => {
    setActionInProgressId(appointmentId);
    try {
      await fetchApi(`/appointments/${appointmentId}/complete-consultation`, {
        method: 'POST',
      });
      if (queueEntryId) {
        await fetchApi(`/queue/${queueEntryId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'COMPLETED' }),
        }).catch(() => {});
      }
      alert('Consultation marked as completed successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleOpenPrescriptionForAppointment = (appt: any, queueEntryId?: string) => {
    setActiveConsultationAppt(appt);
    setActiveQueueEntryId(queueEntryId || null);
    setDiagnosis(appt.prescription?.diagnosis || appt.reasonForVisit || '');
    setSymptomsAndFindings(appt.symptomsSummary || '');
    if (appt.prescription?.followUpDate) {
      setFollowUpDate(appt.prescription.followUpDate);
    }
    setShowPrescriptionModal(true);
  };

  const handleRecordDelay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDelay(true);
    try {
      await fetchApi('/queue/delay', {
        method: 'POST',
        body: JSON.stringify({
          delayMinutes: Number(delayMinutes),
          reason: delayReason,
        }),
      });
      alert(`Delay of ${delayMinutes} minutes broadcast to waiting patients.`);
      setShowDelayModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record delay');
    } finally {
      setIsSubmittingDelay(false);
    }
  };

  const handleSavePrescription = async (isFinalized: boolean) => {
    if (!activeConsultationAppt) return;

    setIsSavingPrescription(true);
    try {
      const apptId = activeConsultationAppt._id || activeConsultationAppt;
      await fetchApi('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: apptId,
          diagnosis,
          symptomsAndFindings,
          vitals,
          medications,
          labTestsRecommended,
          clinicalNotes,
          additionalAdvice,
          followUpDate,
          isFinalized,
        }),
      });

      setShowPrescriptionModal(false);
      setActiveConsultationAppt(null);
      setActiveQueueEntryId(null);
      alert(isFinalized ? 'Prescription finalized and signed!' : 'Prescription draft saved.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save prescription');
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const handleViewPrescription = async (appointmentId: string) => {
    setLoadingPrescription(true);
    try {
      const res = await fetchApi(`/prescriptions/appointment/${appointmentId}`);
      setViewingPrescription(res.data);
    } catch (err: any) {
      alert(err.message || 'No prescription found for this appointment');
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

  const addMedicationRow = () => {
    setMedications([
      ...medications,
      {
        name: '',
        dosage: '500 mg',
        route: 'Oral',
        frequency: '1-0-1',
        duration: '5 days',
        timing: 'After food',
        quantity: '10 Tablets',
        instructions: '',
      },
    ]);
  };

  const removeMedicationRow = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const addLabTest = () => {
    if (newLabTest.trim()) {
      setLabTestsRecommended([...labTestsRecommended, newLabTest.trim()]);
      setNewLabTest('');
    }
  };

  const removeLabTest = (idx: number) => {
    setLabTestsRecommended(labTestsRecommended.filter((_, i) => i !== idx));
  };

  // Filter appointments according to activeTab and searchQuery
  const todayLocal = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const todayUTC = React.useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const isTodayDate = (dateStr?: string) => {
    if (!dateStr) return false;
    return dateStr === todayLocal || dateStr === todayUTC;
  };

  const tabCounts = React.useMemo(() => {
    return {
      TODAY: appointments.filter(
        (a) =>
          isTodayDate(a.appointmentDate) ||
          a.status === 'IN_CONSULTATION' ||
          a.status === 'IN_QUEUE' ||
          a.status === 'CHECKED_IN'
      ).length,
      WAITING: appointments.filter(
        (a) => a.status === 'IN_QUEUE' || a.status === 'CHECKED_IN'
      ).length,
      IN_CONSULTATION: appointments.filter((a) => a.status === 'IN_CONSULTATION').length,
      UPCOMING: appointments.filter(
        (a) => a.appointmentDate > todayLocal && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
      ).length,
      COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
      CANCELLED_NOSHOW: appointments.filter(
        (a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW'
      ).length,
      ALL: appointments.length,
    };
  }, [appointments, todayLocal, todayUTC]);

  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      searchQuery === '' ||
      appt.appointmentReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.reasonForVisit?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'TODAY') {
      return (
        isTodayDate(appt.appointmentDate) ||
        appt.status === 'IN_CONSULTATION' ||
        appt.status === 'IN_QUEUE' ||
        appt.status === 'CHECKED_IN'
      );
    }
    if (activeTab === 'WAITING') {
      return appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN';
    }
    if (activeTab === 'IN_CONSULTATION') {
      return appt.status === 'IN_CONSULTATION';
    }
    if (activeTab === 'UPCOMING') {
      return (
        appt.appointmentDate > todayLocal &&
        appt.status !== 'CANCELLED' &&
        appt.status !== 'COMPLETED'
      );
    }
    if (activeTab === 'COMPLETED') {
      return appt.status === 'COMPLETED';
    }
    if (activeTab === 'CANCELLED_NOSHOW') {
      return appt.status === 'CANCELLED' || appt.status === 'NO_SHOW';
    }
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md space-y-4">
          <Users className="w-10 h-10 text-primary-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 font-display">Doctor Clinical Workstation</h2>
          <p className="text-xs text-slate-500">
            Please sign in with your verified practitioner account to access appointments, patient records, and digital prescriptions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 shadow-soft transition-colors"
          >
            Sign In with Practitioner Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Workstation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                Clinical Workstation Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mt-1">
              Dr. {user.firstName} {user.lastName}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Live token calls, clinical diagnosis, vitals tracking, and digital prescription issuance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowDelayModal(true)}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Record Consultation Delay</span>
            </button>

            <Link
              href="/doctor/schedule"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Manage Schedules</span>
            </Link>

            <button
              onClick={loadData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Active Consultation & Waiting Queue Overview */}
        {queueEntries.length > 0 && (
          <div className="bg-gradient-to-r from-navy-900 to-primary-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm tracking-wide uppercase text-primary-200 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>Live In-Consultation & Waiting Tokens</span>
              </h2>
              <span className="text-xs text-primary-200">
                {queueEntries.filter((e) => e.status === 'WAITING').length} waiting •{' '}
                {queueEntries.filter((e) => e.status === 'IN_CONSULTATION').length} in progress
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {queueEntries.map((entry) => {
                const isConsulting = entry.status === 'IN_CONSULTATION';
                const isCalled = entry.status === 'CALLED';
                const isWaiting = entry.status === 'WAITING';

                return (
                  <div
                    key={entry._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isConsulting
                        ? 'bg-white text-navy-900 border-teal-400 shadow-md ring-2 ring-teal-400'
                        : isCalled
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-white/10 border-white/15 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-extrabold text-sm ${
                            isConsulting ? 'bg-navy-900 text-white' : 'bg-white text-navy-900'
                          }`}
                        >
                          #{entry.tokenNumber}
                        </span>
                        <span className="font-bold text-sm truncate max-w-[140px]">
                          {entry.patient?.firstName} {entry.patient?.lastName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isConsulting ? 'bg-teal-100 text-teal-800' : 'bg-white/20 text-white'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <div
                      className={`text-xs mb-3 truncate ${
                        isConsulting ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      Reason: {entry.appointment?.reasonForVisit}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-current/10">
                      {isWaiting && (
                        <button
                          onClick={() => handleCallPatient(entry._id)}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Call Patient</span>
                        </button>
                      )}

                      {isCalled && (
                        <button
                          onClick={() =>
                            handleStartConsultation(entry.appointment._id, entry._id)
                          }
                          className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Begin Consult</span>
                        </button>
                      )}

                      {isConsulting && (
                        <button
                          onClick={() =>
                            handleOpenPrescriptionForAppointment(entry.appointment, entry._id)
                          }
                          className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 shadow-xs"
                        >
                          <FilePlus className="w-3.5 h-3.5" />
                          <span>Write Prescription</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Navigation & Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b md:border-b-0 pb-2 md:pb-0 border-slate-100">
              {[
                { id: 'TODAY', label: "Today's Schedule" },
                { id: 'WAITING', label: 'Waiting Patients' },
                { id: 'IN_CONSULTATION', label: 'In Consultation' },
                { id: 'UPCOMING', label: 'Upcoming' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED_NOSHOW', label: 'Cancelled / No-Show' },
                { id: 'ALL', label: 'All Consultations' },
              ].map((tab) => {
                const count = tabCounts[tab.id as keyof typeof tabCounts] || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        activeTab === tab.id
                          ? 'bg-white/25 text-white'
                          : count > 0
                          ? 'bg-primary-50 text-primary-700 font-bold border border-primary-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, reference (APT-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Appointments Roster */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600 mb-2" />
              <span>Loading appointment roster...</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-slate-700 text-sm font-semibold">
                {activeTab === 'TODAY'
                  ? "No appointments scheduled for today."
                  : `No ${activeTab.toLowerCase().replace('_', ' ')} appointments found.`}
              </p>
              {appointments.length > 0 && activeTab !== 'ALL' && (
                <button
                  onClick={() => setActiveTab('ALL')}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center space-x-1.5"
                >
                  <span>View All Consultations ({appointments.length})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appt) => {
                const isConfirmed = appt.status === 'CONFIRMED';
                const isInQueue = appt.status === 'IN_QUEUE' || appt.status === 'CHECKED_IN';
                const isConsulting = appt.status === 'IN_CONSULTATION';
                const isCompleted = appt.status === 'COMPLETED';
                const isCancelled = appt.status === 'CANCELLED';
                const isNoShow = appt.status === 'NO_SHOW';
                const isToday = isTodayDate(appt.appointmentDate);

                const hasFinalizedRx = appt.prescription && appt.prescription.status === 'FINALIZED';

                return (
                  <div
                    key={appt._id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-navy-900 text-sm">
                          {appt.patient?.firstName} {appt.patient?.lastName}
                        </span>
                        {appt.appointmentReference && (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {appt.appointmentReference}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : isConsulting
                              ? 'bg-teal-100 text-teal-800 animate-pulse'
                              : isInQueue
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-primary-100 text-primary-800'
                          }`}
                        >
                          {appt.status}
                        </span>
                        {appt.type === 'TELECONSULTATION' && (
                          <span className="inline-flex items-center space-x-1 text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-semibold">
                            <Video className="w-3 h-3" />
                            <span>Video Consultation</span>
                          </span>
                        )}
                        {hasFinalizedRx && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200">
                            Rx Finalized (v{appt.prescription?.version || 1})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {appt.appointmentDate} • {appt.startTime} - {appt.endTime}
                        </span>
                        <span>•</span>
                        <span>Phone: {appt.patient?.phone || 'N/A'}</span>
                        <span>•</span>
                        <span>Reason: <strong className="text-slate-800">{appt.reasonForVisit}</strong></span>
                      </div>
                    </div>

                    {/* Contextual Action Buttons (Task 2 Specifications) */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. View Patient Details */}
                      <button
                        onClick={() => setSelectedPatientAppt(appt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                        title="View Patient Medical Summary"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Patient</span>
                      </button>

                      {/* 2. Check In / Mark Arrived (if confirmed and today) */}
                      {isConfirmed && isToday && (
                        <button
                          onClick={() => handleCheckIn(appt._id)}
                          disabled={actionInProgressId === appt._id}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Check In / Arrived</span>
                        </button>
                      )}

                      {/* 3 & 4. Start Consultation (if checked in or confirmed today) */}
                      {(isInQueue || isConfirmed) && isToday && (
                        <button
                          onClick={() => handleStartConsultation(appt._id)}
                          disabled={actionInProgressId === appt._id}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>
                      )}

                      {/* 5. Open Consultation & 6. Create Prescription (if in consultation) */}
                      {isConsulting && (
                        <>
                          <button
                            onClick={() => handleOpenPrescriptionForAppointment(appt)}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                            <span>Prescription</span>
                          </button>

                          {/* 7. Complete Consultation */}
                          <button
                            onClick={() => handleCompleteConsultation(appt._id)}
                            disabled={actionInProgressId === appt._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        </>
                      )}

                      {/* Teleconsultation Room */}
                      {appt.type === 'TELECONSULTATION' && appt.teleconsultationRoomId && !isCancelled && (
                        <Link
                          href={`/teleconsultation/${appt.teleconsultationRoomId}`}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Room</span>
                        </Link>
                      )}

                      {/* View / Download Prescription if completed */}
                      {isCompleted && (
                        <>
                          <button
                            onClick={() => handleViewPrescription(appt._id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Rx</span>
                          </button>

                          {hasFinalizedRx && (
                            <button
                              onClick={() =>
                                handleDownloadPdf(
                                  appt.prescription?._id || appt._id,
                                  appt.appointmentReference || 'Consultation'
                                )
                              }
                              disabled={downloadingPdfId === (appt.prescription?._id || appt._id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                              title="Download Prescription PDF"
                            >
                              {downloadingPdfId === (appt.prescription?._id || appt._id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>PDF</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View Patient Details Drawer Modal */}
        {selectedPatientAppt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-lg">
                    {selectedPatientAppt.patient?.firstName} {selectedPatientAppt.patient?.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Reference: {selectedPatientAppt.appointmentReference || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPatientAppt(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Contact Phone</span>
                    <strong className="text-slate-900">{selectedPatientAppt.patient?.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Email</span>
                    <strong className="text-slate-900">{selectedPatientAppt.patient?.email || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Appointment Schedule</span>
                    <span className="text-slate-700">
                      {selectedPatientAppt.appointmentDate} at {selectedPatientAppt.startTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Payment Status</span>
                    <span className="font-bold text-emerald-700">₹{selectedPatientAppt.consultationFee} ({selectedPatientAppt.paymentStatus})</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-0.5">Chief Complaint</span>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium">
                    {selectedPatientAppt.reasonForVisit}
                  </div>
                </div>

                {selectedPatientAppt.symptomsSummary && (
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-0.5">Symptoms Notes</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                      {selectedPatientAppt.symptomsSummary}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                {selectedPatientAppt.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      handleCheckIn(selectedPatientAppt._id);
                      setSelectedPatientAppt(null);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                  >
                    Check In Patient
                  </button>
                )}
                <button
                  onClick={() => setSelectedPatientAppt(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Delay Modal */}
        {showDelayModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-amber-700 font-extrabold text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Record Consultation Delay</span>
              </div>
              <p className="text-xs text-slate-500">
                Broadcast an expected clinical delay to waiting patients. Estimated wait times will update automatically.
              </p>

              <form onSubmit={handleRecordDelay} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Delay (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason / Clinical Context</label>
                  <input
                    type="text"
                    required
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="e.g. Critical inpatient round, Emergency surgery"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDelayModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDelay}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-1"
                  >
                    {isSubmittingDelay ? 'Broadcasting...' : 'Broadcast Delay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription Creation Modal (Task 4 Specifications) */}
        {showPrescriptionModal && activeConsultationAppt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                    Clinical Digital Prescription
                  </div>
                  <h3 className="font-extrabold text-navy-900 text-lg">
                    Consultation for {activeConsultationAppt.patient?.firstName}{' '}
                    {activeConsultationAppt.patient?.lastName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Ref: {activeConsultationAppt.appointmentReference || 'In-Person'} • Chief Complaint:{' '}
                    {activeConsultationAppt.reasonForVisit}
                  </div>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Clinical Diagnosis */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Provisional / Final Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Tract Infection, Essential Hypertension Stage 1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                {/* Clinical Findings & Symptoms */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Clinical Findings & Examination Observations
                  </label>
                  <textarea
                    rows={2}
                    value={symptomsAndFindings}
                    onChange={(e) => setSymptomsAndFindings(e.target.value)}
                    placeholder="Physical examination notes, systemic signs, clear lungs, S1/S2 heard..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>

                {/* Patient Vitals */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recorded Patient Vitals</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">BP (mmHg)</span>
                      <input
                        type="text"
                        value={vitals.bloodPressure}
                        onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Pulse (bpm)</span>
                      <input
                        type="text"
                        value={vitals.pulseRate}
                        onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Temp (°F)</span>
                      <input
                        type="text"
                        value={vitals.temperature}
                        onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">Weight (kg)</span>
                      <input
                        type="text"
                        value={vitals.weight}
                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">SpO2 (%)</span>
                      <input
                        type="text"
                        value={vitals.spO2}
                        onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Prescribed Medications Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-700">Rx Medications *</label>
                    <button
                      type="button"
                      onClick={addMedicationRow}
                      className="text-primary-600 font-bold text-xs flex items-center space-x-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medication</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {medications.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            required
                            placeholder="Drug Name (e.g. Amoxicillin)"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].name = e.target.value;
                              setMedications(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Dose (500mg)"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].dosage = e.target.value;
                              setMedications(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <select
                            value={med.route || 'Oral'}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].route = e.target.value;
                              setMedications(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="Oral">Oral</option>
                            <option value="Topical">Topical</option>
                            <option value="IV/IM">IV / IM</option>
                            <option value="Inhalation">Inhalation</option>
                            <option value="Sublingual">Sublingual</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Frequency (1-0-1)"
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].frequency = e.target.value;
                              setMedications(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Duration (5 days)"
                            value={med.duration}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].duration = e.target.value;
                              setMedications(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMedicationRow(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Lab Tests */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recommended Diagnostic / Lab Tests
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray"
                      value={newLabTest}
                      onChange={(e) => setNewLabTest(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={addLabTest}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold"
                    >
                      Add Test
                    </button>
                  </div>
                  {labTestsRecommended.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {labTestsRecommended.map((test, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 font-semibold text-[11px] flex items-center space-x-1"
                        >
                          <span>{test}</span>
                          <button
                            type="button"
                            onClick={() => removeLabTest(i)}
                            className="text-primary-500 hover:text-rose-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Notes & Additional Advice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Clinical Advice & Notes</label>
                    <textarea
                      rows={2}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Hydration instructions, rest, red-flag symptoms..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Additional Dietary Guidance</label>
                    <textarea
                      rows={2}
                      value={additionalAdvice}
                      onChange={(e) => setAdditionalAdvice(e.target.value)}
                      placeholder="Low sodium diet, avoid cold drinks..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recommended Follow-Up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                {/* Dual Actions: Save Draft vs Finalize & Sign */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSavingPrescription || !diagnosis}
                      onClick={() => handleSavePrescription(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPrescription || !diagnosis}
                      onClick={() => handleSavePrescription(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isSavingPrescription ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalize & Sign Rx</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Viewer & Print Modal */}
        {viewingPrescription && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 print:shadow-none print:border-none print:p-0">
              {/* Header Letterhead */}
              <div className="border-b-2 border-primary-600 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-900 font-display">CityCare Medical Center</h2>
                  <p className="text-xs text-slate-500">Official Clinical Outpatient Prescription Record</p>
                  <p className="text-[11px] text-slate-400">Emergency 24x7: 112 / 108 • NABH Accredited</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-navy-900">
                    Dr. {viewingPrescription.doctor?.firstName} {viewingPrescription.doctor?.lastName}
                  </div>
                  <div className="text-[11px] text-primary-600 font-semibold">Attending Medical Practitioner</div>
                  <div className="text-[10px] text-slate-400">
                    Version {viewingPrescription.version || 1} • {viewingPrescription.status || 'FINALIZED'}
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient Name</span>
                  <span className="font-bold text-slate-900">
                    {viewingPrescription.patient?.firstName} {viewingPrescription.patient?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Reference</span>
                  <span className="font-mono text-slate-800">
                    {viewingPrescription.appointmentReference || 'Consultation'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Date</span>
                  <span className="text-slate-800">{new Date(viewingPrescription.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Status</span>
                  <span className="font-bold text-emerald-700">{viewingPrescription.status || 'FINALIZED'}</span>
                </div>
              </div>

              {/* Vitals */}
              {viewingPrescription.vitals && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.bloodPressure || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                    <strong className="text-slate-800">{viewingPrescription.vitals.pulseRate || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block">Temperature</span>
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
                <span className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">
                  Prescribed Medications (Rx)
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2.5">Medication Name</th>
                        <th className="p-2.5">Dosage</th>
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
                          <td className="p-2.5 text-slate-500">
                            {med.timing} {med.instructions}
                          </td>
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
                    <span className="font-bold text-[10px] text-slate-400 uppercase block mb-1">Clinical Advice</span>
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
                  Digitally signed and cryptographically verified under CityCare HMS Medical Records protocol.
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-base text-navy-900 border-b border-slate-300 pb-1">
                    Dr. {viewingPrescription.doctor?.firstName} {viewingPrescription.doctor?.lastName}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">
                    Authorized Medical Sign-off
                  </span>
                </div>
              </div>

              {/* Modal Action Controls */}
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
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
