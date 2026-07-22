'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Activity, AlertCircle, ShieldAlert, Power, Monitor, CheckCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface LiveSession {
  id: string;
  student_name: string;
  batch_name: string;
  current_question: number;
  time_left: number;
  status: string;
  tab_switches: number;
  fullscreen_exits: number;
  last_ping: string;
}

export default function LiveMonitorDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForcing, setIsForcing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/admin/assigned-tests');
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
        if (data.tests?.length > 0) {
          setSelectedTestId(data.tests[0].id);
        }
      }
    } catch (e) {
      toast.error('Failed to load tests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTestId) return;
    fetchSessions();
    pollTimer.current = setInterval(fetchSessions, 10000); // poll every 10s

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [selectedTestId]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/admin/live-monitor/${selectedTestId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.activeSessions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceSubmit = async () => {
    if (!confirm('Are you sure? This will force submit tests for all active students.')) return;
    
    setIsForcing(true);
    try {
      const res = await fetch(`/api/admin/live-monitor/${selectedTestId}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Force submit signal sent.');
        fetchSessions();
      } else {
        toast.error('Failed to send force submit signal.');
      }
    } catch (e) {
      toast.error('Server error.');
    } finally {
      setIsForcing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Loading Live Monitor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" /> Live Exam Monitor
          </h1>
          <p className="text-slate-500 mt-1">Real-time proctoring and session tracking for active tests.</p>
        </div>
        
        {sessions.length > 0 && (
          <button 
            onClick={handleForceSubmit}
            disabled={isForcing}
            className="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition flex items-center gap-2 shadow-sm shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] disabled:opacity-50"
          >
            {isForcing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            Force Submit All
          </button>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Test to Monitor</label>
        <div className="relative max-w-md">
          <select 
            value={selectedTestId} 
            onChange={e => setSelectedTestId(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm text-slate-800"
          >
            {tests.length === 0 ? (
              <option value="">No tests available</option>
            ) : (
              tests.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.exam_type})</option>
              ))
            )}
          </select>
          <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-600" /> Active Sessions ({sessions.length})
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync Active
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold mb-1">No Active Students</h3>
            <p className="text-slate-500 text-sm">Waiting for students to start the exam...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Q</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time Left</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proctoring Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800">{s.student_name}</td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{s.batch_name}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">Q. {s.current_question + 1}</td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">{formatTime(s.time_left)}</td>
                    <td className="py-4 px-4">
                      {s.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        </span>
                      ) : s.status === 'force_submit' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <Loader2 className="w-3 h-3 animate-spin" /> Force Submitting...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                          <CheckCircle className="w-3 h-3" /> Submitted
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        {(s.tab_switches > 0 || s.fullscreen_exits > 0) ? (
                          <>
                            {s.tab_switches > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md" title="Tab Switches">
                                <AlertCircle className="w-3 h-3" /> {s.tab_switches} Tabs
                              </span>
                            )}
                            {s.fullscreen_exits > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md" title="Fullscreen Exits">
                                <ShieldAlert className="w-3 h-3" /> {s.fullscreen_exits} Exits
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Clean</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
