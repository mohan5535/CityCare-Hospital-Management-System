'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import { PublicQueueData } from '../../../../types';
import {
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Users,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export default function LiveTokenTrackerPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [queueData, setQueueData] = useState<PublicQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [calledAlert, setCalledAlert] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = () => {
    setLoading(true);
    setError(null);
    fetchApi(`/queue/public/${encodeURIComponent(doctorId)}`)
      .then((res) => {
        setQueueData(res.data);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch((err) => {
        console.error('Queue load error:', err);
        setError('Unable to load live queue. Please check connection and refresh.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueue();

    // Socket.io real-time connection
    const socket = getSocket();

    // Join doctor's specific live queue room
    socket.emit('join_doctor_queue', doctorId);

    // Listen for queue updates broadcast by backend
    socket.on('queue.updated', (data: PublicQueueData) => {
      setQueueData(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    // Listen for personal token called notification
    socket.on('token.called', (payload: { tokenNumber: number; message: string }) => {
      setCalledAlert(payload.message || `Token #${payload.tokenNumber} has been called!`);
      // Try playing web audio notification chime if permitted
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (err) {
        // Audio policy ignore
      }
    });

    return () => {
      socket.emit('leave_doctor_queue', doctorId);
      socket.off('queue.updated');
      socket.off('token.called');
    };
  }, [doctorId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Doctors Directory</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Clinical Stream</span>
          </div>
        </div>

        {/* Token Alert Banner if called */}
        {calledAlert && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500 text-slate-900 border border-amber-600 shadow-xl flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-6 h-6 text-slate-900 shrink-0" />
              <div className="font-extrabold text-sm sm:text-base">{calledAlert}</div>
            </div>
            <button
              onClick={() => setCalledAlert(null)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold transition-colors"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Header Section with Responsive Non-Overflowing Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
              {queueData?.doctor?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                  <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                  <span className="truncate max-w-[240px] sm:max-w-sm">{queueData.doctor.name}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 tracking-tight font-display">
              Live Token Queue Tracker
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time clinical OPD consultation board. Tokens update automatically when the physician calls or completes patient visits.
            </p>
          </div>

          {/* Refresh & Sync Status */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {lastRefreshed && (
              <span className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-soft-sm font-medium">
                Synced at: <strong className="text-navy-900">{lastRefreshed}</strong>
              </span>
            )}
            <button
              onClick={loadQueue}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 active:scale-95 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-soft-sm hover:border-slate-300 transition-all disabled:opacity-50"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={loadQueue} className="text-xs font-bold underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Current Serving Card */}
        <div className="bg-gradient-to-br from-navy-900 via-primary-950 to-navy-900 rounded-3xl p-6 sm:p-10 text-white shadow-soft-xl mb-8 relative overflow-hidden border border-navy-800">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-primary-200 text-xs uppercase font-bold tracking-wider mb-4 border border-white/10">
                <Activity className="w-3.5 h-3.5 text-teal-300" />
                <span>Currently In Consultation</span>
              </div>
              <div className="text-5xl sm:text-7xl font-extrabold tracking-tight font-display text-white">
                {queueData?.currentRunningToken ? `#${queueData.currentRunningToken}` : 'Ready'}
              </div>
              <div className="text-slate-300 text-xs sm:text-sm mt-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-400 shrink-0" />
                <span>Avg. Consultation: ~{queueData?.averageConsultationMinutes || 15} mins / patient</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/15 space-y-3.5">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">Queue Status:</span>
                <span className="font-bold text-white uppercase text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40">
                  {queueData?.status || 'OPEN'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">Total Checked In:</span>
                <span className="font-bold text-white">{queueData?.tokens.length || 0} patients</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">Waiting in Queue:</span>
                <span className="font-bold text-amber-300">
                  {queueData?.tokens.filter((t) => t.status === 'WAITING').length || 0} remaining
                </span>
              </div>
              {queueData?.doctorDelayMinutes ? (
                <div className="pt-2.5 border-t border-white/10 text-xs text-amber-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>Clinical Notice:</strong> Expected delay of ~{queueData.doctorDelayMinutes} mins ({queueData.delayReason || 'Inpatient emergency'}).
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tokens List Board */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-navy-900 flex items-center space-x-2 font-display">
              <Users className="w-5 h-5 text-primary-600" />
              <span>Today's Consultation Token Board</span>
            </h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Anonymized for patient clinical privacy</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
              <span className="text-xs font-semibold text-slate-500">Loading live queue status...</span>
            </div>
          ) : !queueData || queueData.tokens.length === 0 ? (
            <div className="py-14 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 p-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Patients in Queue Today</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
                The live consultation board is currently clear. Checked-in patients and upcoming consultation tokens will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {queueData.tokens.map((token) => {
                const isWaiting = token.status === 'WAITING';
                const isCalled = token.status === 'CALLED';
                const isConsulting = token.status === 'IN_CONSULTATION';
                const isCompleted = token.status === 'COMPLETED';

                return (
                  <div
                    key={token.tokenNumber}
                    className={`p-4 rounded-2xl border transition-all ${
                      isConsulting
                        ? 'bg-primary-50/80 border-primary-400 shadow-sm ring-1 ring-primary-300'
                        : isCalled
                        ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-300 animate-pulse'
                        : isCompleted
                        ? 'bg-slate-50 border-slate-200/80 opacity-60'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-extrabold text-navy-900 font-display">
                        Token #{token.tokenNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isConsulting
                            ? 'bg-primary-600 text-white'
                            : isCalled
                            ? 'bg-amber-500 text-slate-900'
                            : isCompleted
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {token.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      {isWaiting && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Est. Wait: <strong className="text-navy-900 font-semibold">~{token.estimatedWaitMinutes} mins</strong></span>
                        </div>
                      )}
                      {isCalled && (
                        <div className="text-amber-800 font-bold text-xs flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Proceed to Doctor Room</span>
                        </div>
                      )}
                      {isConsulting && (
                        <div className="text-primary-700 font-semibold text-xs flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary-600" />
                          <span>In Consultation Now</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="text-emerald-700 font-semibold flex items-center space-x-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Consultation Finished</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
