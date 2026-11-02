'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { Clock, Calendar, CheckCircle2, Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [schedules, setSchedules] = useState<any[]>(
    DAYS.map((_, i) => ({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
      isDayOff: i === 0 || i === 6, // weekend off by default
      breakTimes: [{ startTime: '13:00', endTime: '14:00', title: 'Lunch Break' }],
    }))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?._id) {
      setLoading(true);
      fetchApi(`/availability/schedule/${user._id}`)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const mapped = [...schedules];
            res.data.forEach((item: any) => {
              if (item.dayOfWeek >= 0 && item.dayOfWeek < 7) {
                mapped[item.dayOfWeek] = item;
              }
            });
            setSchedules(mapped);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated, user]);

  const handleToggleDayOff = (dayIdx: number) => {
    const updated = [...schedules];
    updated[dayIdx].isDayOff = !updated[dayIdx].isDayOff;
    setSchedules(updated);
  };

  const handleTimeChange = (dayIdx: number, field: string, value: any) => {
    const updated = [...schedules];
    updated[dayIdx][field] = value;
    setSchedules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await fetchApi('/availability/schedule', {
        method: 'POST',
        body: JSON.stringify({ schedules }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save schedules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-4">
          <Link href="/doctor/dashboard" className="hover:text-primary-600 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Weekly Consultation Schedule
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Configure your consultation hours, slot duration, and off-days.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-primary-500/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Schedule</span>
              </>
            )}
          </button>
        </div>

        {saveSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Schedule successfully updated and generated for patient bookings!</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          {schedules.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.isDayOff ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-4 w-40">
                <input
                  type="checkbox"
                  checked={!item.isDayOff}
                  onChange={() => handleToggleDayOff(idx)}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{DAYS[idx]}</div>
                  <div className="text-[11px] text-slate-400">
                    {item.isDayOff ? 'Day Off' : 'Working'}
                  </div>
                </div>
              </div>

              {!item.isDayOff && (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">From:</span>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">To:</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Slot:</span>
                    <select
                      value={item.slotDurationMinutes}
                      onChange={(e) => handleTimeChange(idx, 'slotDurationMinutes', Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

