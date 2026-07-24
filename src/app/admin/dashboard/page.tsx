'use client';

import React, { useEffect, useState } from 'react';
import { Users, FileText, Activity, CheckCircle2, Clock, TrendingUp, BookOpen, Zap, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalStudents: number;
  students11th: number;
  students12th: number;
  totalAttempts: number;
  avgScorePercent: number;
  coachingId?: string;
}

interface ActivityItem {
  studentName: string;
  testName: string;
  score: number;
  maxMarks: number;
  scorePercent: number;
  date: string;
}

interface RecentTest {
  id: string;
  name: string;
  created_at: string;
}

interface CoachingInfo {
  name: string;
  plan_type: string;
  account_status: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getCoachingName(): string {
  if (typeof document === 'undefined') return '';
  try {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('exam_coaching_session='));
    if (!sessionCookie) return '';
    const raw = sessionCookie.split('=').slice(1).join('=').trim();
    const sessionData = JSON.parse(decodeURIComponent(raw));
    return sessionData.coaching_name || '';
  } catch {
    return '';
  }
}

export default function AdminDashboardOverview() {
  const router = useRouter();
  const [coachingName, setCoachingName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [coachingInfo, setCoachingInfo] = useState<CoachingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read coaching name from cookie immediately (no flash)
    setCoachingName(getCoachingName());

    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to load');
        }
        const data = await res.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setRecentTests(data.recentTests || []);
        setCoachingInfo(data.coachingInfo || null);

        // If API returned coaching name from CRM, prefer that
        if (data.coachingInfo?.name && !getCoachingName()) {
          setCoachingName(data.coachingInfo.name);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const displayName = coachingName || coachingInfo?.name || 'Admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Welcome, {displayName}!
          </h1>
          <p className="text-slate-500 mt-1">Here's your coaching's exam performance at a glance.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {coachingInfo ? (
            <span className={`px-3 py-1.5 rounded-full text-xs font-black border ${
              coachingInfo.account_status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {coachingInfo.plan_type} · {coachingInfo.account_status}
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-black border bg-rose-50 text-rose-700 border-rose-200">
              Coaching Not Found in CRM
            </span>
          )}
          
          {stats?.coachingId ? (
            <span className="text-[10px] font-mono text-slate-400">
              ID: {stats.coachingId}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-rose-400">
              ID: Missing in Cookie!
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Total Students */}
        <div
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 rounded-2xl shadow-lg shadow-blue-200 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => router.push('/admin/dashboard/students')}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-blue-100 text-sm font-semibold">Total Students</p>
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-200 mt-1" />
          ) : (
            <>
              <div className="text-4xl font-black">{stats?.totalStudents ?? '--'}</div>
              <div className="flex gap-3 mt-2 text-xs text-blue-200 font-semibold">
                <span>11th: {stats?.students11th ?? '--'}</span>
                <span>·</span>
                <span>12th: {stats?.students12th ?? '--'}</span>
              </div>
            </>
          )}
        </div>

        {/* Tests Assigned */}
        <div
          className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
          onClick={() => router.push('/admin/dashboard/assigned-tests')}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-sm font-semibold">Tests Assigned</p>
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
          ) : (
            <>
              <div className="text-4xl font-black text-slate-900">{stats?.totalTests ?? '--'}</div>
              <p className="text-xs text-slate-400 mt-2 font-semibold">Click to manage →</p>
            </>
          )}
        </div>

        {/* Total Attempts */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-sm font-semibold">Total Attempts</p>
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
          ) : (
            <>
              <div className="text-4xl font-black text-slate-900">{stats?.totalAttempts ?? '--'}</div>
              <p className="text-xs text-slate-400 mt-2 font-semibold">Across all students</p>
            </>
          )}
        </div>

        {/* Avg Score */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-sm font-semibold">Avg Score</p>
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-1" />
          ) : stats?.totalAttempts ? (
            <>
              <div className={`text-4xl font-black ${
                (stats.avgScorePercent ?? 0) >= 70 ? 'text-emerald-600' :
                (stats.avgScorePercent ?? 0) >= 50 ? 'text-amber-600' : 'text-rose-500'
              }`}>
                {stats?.avgScorePercent ?? '--'}%
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (stats?.avgScorePercent ?? 0) >= 70 ? 'bg-emerald-500' :
                    (stats?.avgScorePercent ?? 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${stats?.avgScorePercent ?? 0}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl font-black text-slate-300">—</div>
              <p className="text-xs text-slate-400 mt-2 font-semibold">No attempts yet</p>
            </>
          )}
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Could not load dashboard data: {error}</span>
        </div>
      )}

      {/* ── Bottom Grid: Activity + Quick Actions ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Activity Feed */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
            </h2>
            <button
              onClick={() => router.push('/admin/dashboard/students')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View All Students →
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">No test activity yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Once your students start taking tests, their results will appear here.
              </p>
              <button
                onClick={() => router.push('/admin/dashboard/assigned-tests')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition"
              >
                Assign First Test →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {item.studentName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{item.studentName}</p>
                    <p className="text-xs text-slate-400 truncate">completed <span className="font-semibold text-slate-600">{item.testName}</span></p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-black text-sm ${
                      item.scorePercent >= 70 ? 'text-emerald-600' :
                      item.scorePercent >= 50 ? 'text-amber-600' : 'text-rose-500'
                    }`}>
                      {item.scorePercent}%
                    </span>
                    <p className="text-xs text-slate-400">{timeAgo(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Recent Tests */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: 'View All Students', sub: 'Manage & track your students', icon: Users, color: 'bg-blue-100 text-blue-600', href: '/admin/dashboard/students' },
                { label: 'Assign New Test', sub: 'From global or custom bank', icon: FileText, color: 'bg-indigo-100 text-indigo-600', href: '/admin/dashboard/assigned-tests' },
                { label: 'Generate Offline Paper', sub: 'Question paper + OMR + key', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', href: '/admin/dashboard/offline-test' },
                { label: 'Advanced Analytics', sub: 'Chapter-wise performance', icon: TrendingUp, color: 'bg-amber-100 text-amber-600', href: '/admin/dashboard/analytics' },
              ].map(({ label, sub, icon: Icon, color, href }) => (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Recently Assigned Tests */}
          {recentTests.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Tests
              </h2>
              <div className="space-y-2">
                {recentTests.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/admin/dashboard/assigned-tests/${t.id}/analytics`)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">{t.name}</p>
                      <p className="text-xs text-slate-400">{timeAgo(t.created_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
