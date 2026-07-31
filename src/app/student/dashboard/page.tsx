'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Bell, CheckCircle2, Calendar, Clock, Zap,
  BookOpen, ChevronRight, BarChart3, Target, Sparkles, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

type QuickStats = {
  totalTests: number;
  avgScorePercent: number;
  accuracyPercent: number;
};

type AssignedTest = {
  id: string;
  name: string;
  exam_type: string;
  total_marks: number;
  duration_minutes: number;
  due_date: string | null;
  isCompleted: boolean;
};

function timeFromNow(dateStr: string): { label: string; urgent: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return { label: 'Expired', urgent: true };
  if (days === 0) return { label: 'Due today!', urgent: true };
  if (days === 1) return { label: 'Due tomorrow', urgent: true };
  return { label: `Due in ${days}d`, urgent: days <= 3 };
}

export default function StudentHomePage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [stats, setStats]   = useState<QuickStats | null>(null);
  const [assigned, setAssigned] = useState<AssignedTest[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [meRes, dashRes, assignRes] = await Promise.all([
        fetch('/api/auth/student-me'),
        fetch('/api/student/dashboard-data'),
        fetch('/api/student/assigned-tests'),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        if (me.student?.name) setStudentName(me.student.name.split(' ')[0]);
      }

      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.quickStats) setStats(d.quickStats);
      }

      if (assignRes.ok) {
        const a = await assignRes.json();
        const pending = (a.assignments || []).filter((t: AssignedTest) => !t.isCompleted);
        setAssigned(pending.slice(0, 3)); // show max 3 pending on home
      }

      // AI recommendations (non-blocking)
      fetch('/api/student/ai?action=recommendations')
        .then(r => r.json())
        .then(d => { if (d.recommendations) setRecommendations(d.recommendations); })
        .catch(() => {});
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-4">

      {/* ── Greeting ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-slate-500 text-sm font-medium">{greeting} 👋</p>
          <h1 className="text-3xl font-black text-slate-900 mt-0.5">
            {studentName ? `Welcome back, ${studentName}!` : 'Your Dashboard'}
          </h1>
        </div>
        {!isLoading && stats && stats.totalTests > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-emerald-700">{stats.totalTests} tests completed</span>
          </div>
        )}
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tests Taken */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tests Taken</p>
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <p className="text-3xl font-black text-slate-900">{stats?.totalTests ?? 0}</p>
          )}
        </div>

        {/* Avg Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Score</p>
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <p className={`text-3xl font-black ${
              (stats?.avgScorePercent ?? 0) >= 70 ? 'text-emerald-600' :
              (stats?.avgScorePercent ?? 0) >= 50 ? 'text-amber-600' : 'text-rose-500'
            }`}>{stats?.avgScorePercent ?? 0}%</p>
          )}
        </div>

        {/* Accuracy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          ) : (
            <p className={`text-3xl font-black ${
              (stats?.accuracyPercent ?? 0) >= 70 ? 'text-emerald-600' :
              (stats?.accuracyPercent ?? 0) >= 50 ? 'text-amber-600' : 'text-rose-500'
            }`}>{stats?.accuracyPercent ?? 0}%</p>
          )}
        </div>

        {/* Assigned Pending */}
        <div
          className={`rounded-2xl p-5 shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
            assigned.length > 0
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
              : 'bg-white border border-slate-200'
          }`}
          onClick={() => router.push('/student/dashboard/assigned')}
        >
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-bold uppercase tracking-wider ${assigned.length > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
              Assigned
            </p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${assigned.length > 0 ? 'bg-white/20' : 'bg-indigo-100'}`}>
              <Bell className={`w-4 h-4 ${assigned.length > 0 ? 'text-white' : 'text-indigo-600'}`} />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className={`w-5 h-5 animate-spin ${assigned.length > 0 ? 'text-white/50' : 'text-slate-300'}`} />
          ) : (
            <>
              <p className={`text-3xl font-black ${assigned.length > 0 ? 'text-white' : 'text-slate-900'}`}>
                {assigned.length}
              </p>
              <p className={`text-xs mt-1 font-semibold ${assigned.length > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
                {assigned.length > 0 ? 'Pending tests →' : 'All done!'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Pending Assigned Tests Alert ───────────────── */}
      {!isLoading && assigned.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">
                Action Required — {assigned.length} Pending
              </h2>
            </div>
            <button
              onClick={() => router.push('/student/dashboard/assigned')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {assigned.map(test => {
              const due = test.due_date ? timeFromNow(test.due_date) : null;
              return (
                <div
                  key={test.id}
                  onClick={() => router.push(`/exam/${test.id}`)}
                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-indigo-100 hover:border-indigo-300 cursor-pointer transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                      {test.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 font-medium">{test.exam_type}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />{test.duration_minutes}m
                      </span>
                      {due && (
                        <span className={`flex items-center gap-1 text-xs font-bold ${due.urgent ? 'text-rose-600' : 'text-amber-600'}`}>
                          <Calendar className="w-3 h-3" />{due.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0 ml-3 transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">What do you want to do?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/student/dashboard/practice')}
            className="group flex items-center gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
              <Zap className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Start Practice Test</p>
              <p className="text-sm text-slate-500 mt-0.5">Full mock, chapter, or custom test</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 ml-auto shrink-0 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/student/dashboard/assigned')}
            className="group flex items-center gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
              <CheckCircle2 className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">View Assigned Tests</p>
              <p className="text-sm text-slate-500 mt-0.5">Tests from your coaching academy</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 ml-auto shrink-0 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/student/dashboard/analytics')}
            className="group flex items-center gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
              <BarChart3 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">View Analytics</p>
              <p className="text-sm text-slate-500 mt-0.5">Subject & chapter-wise breakdown</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 ml-auto shrink-0 transition-colors" />
          </button>

          <button
            onClick={() => router.push('/student/dashboard/ai-planner')}
            className="group flex items-center gap-4 p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-purple-400 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">AI Study Planner</p>
              <p className="text-sm text-slate-500 mt-0.5">Personalised weak chapter focus</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 ml-auto shrink-0 transition-colors" />
          </button>
        </div>
      </div>

      {/* ── AI Recommendation Strip ────────────────────── */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 opacity-80">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">AI Insight</span>
            </div>
            <h3 className="text-lg font-black">Focus on these chapters next</h3>
            <p className="text-indigo-200 text-sm mt-1">Based on your recent test mistakes</p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            {recommendations.map((chap, idx) => (
              <div key={idx} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 font-bold text-sm flex items-center gap-3">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{chap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
