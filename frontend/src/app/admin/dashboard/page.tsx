'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Activity,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi('/admin/stats').catch(() => ({ data: null })),
      fetchApi('/doctors/admin/all?status=PENDING').catch(() => ({ data: [] })),
      fetchApi('/admin/audit-logs').catch(() => ({ data: [] })),
    ])
      .then(([statsRes, docsRes, logsRes]) => {
        setStats(statsRes.data);
        setPendingDoctors(docsRes.data || []);
        setAuditLogs(logsRes.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated]);

  const handleVerifyDoctor = async (doctorId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await fetchApi(`/doctors/admin/verify/${doctorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      alert(`Doctor status successfully set to ${status}!`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  if (!isAuthenticated || !['SUPER_ADMIN', 'HOSPITAL_ADMIN'].includes(user?.role || '')) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md space-y-4">
          <ShieldCheck className="w-10 h-10 text-primary-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 font-display">Hospital Administration Access</h2>
          <p className="text-xs text-slate-500">Authorized personnel only. Please sign in with your hospital administrative account.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl text-xs hover:bg-primary-700 shadow-soft transition-colors"
          >
            Sign In with Administrator Credentials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-primary-600">
            Administrative Oversight
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Hospital Operations Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Doctor verification queue, appointment analytics, and immutable clinical audit trails.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Patients</span>
              <Users className="w-4 h-4 text-primary-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats?.totalPatients ?? 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Verified Doctors</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats?.totalDoctors ?? 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pending Verification</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">
              {stats?.pendingDoctors ?? pendingDoctors.length}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Payments</span>
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">
              ₹{stats?.totalRevenue ?? 0}
            </div>
          </div>
        </div>

        {/* Doctor Verification Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>Doctor Credential Verification Queue ({pendingDoctors.length})</span>
            </h2>
            <div className="text-xs text-slate-400">Approval enables appointment booking for the practitioner</div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></div>
          ) : pendingDoctors.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              All registered doctors are currently verified. No pending reviews.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doc) => (
                <div
                  key={doc._id}
                  className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">
                        {doc.user?.firstName} {doc.user?.lastName}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                        {doc.verificationStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                      <span>Email: {doc.user?.email}</span>
                      <span>•</span>
                      <span>License ID: <strong className="text-slate-800">{doc.licenseNumber}</strong></span>
                      <span>•</span>
                      <span>Fee: ₹{doc.consultationFee}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerifyDoctor(doc._id, 'VERIFIED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Doctor</span>
                    </button>
                    <button
                      onClick={() => handleVerifyDoctor(doc._id, 'REJECTED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-primary-600" />
            <span>Immutable Administrative Audit Trail</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 10).map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{log.targetResource}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

