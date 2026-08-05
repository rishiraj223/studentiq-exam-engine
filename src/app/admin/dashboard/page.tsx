'use client';

import React, { useEffect, useState } from 'react';
import {
  Users, FileText, CheckCircle2, TrendingUp, BarChart2,
  Loader2, AlertCircle, AlertTriangle, MessageCircle,
  ArrowRight, Zap, Printer, ChevronRight, Clock,
  BookOpenCheck, Star, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalStudents: number;
  students11th: number;
  students12th: number;
  totalTests: number;
  totalAttempts: number;
  avgScorePercent: number;
  coachingId?: string;
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
    return JSON.parse(decodeURIComponent(raw)).coaching_name || '';
  } catch { return ''; }
}

const statCards = [
  {
    key: 'students',
    label: 'Total Students',
    icon: Users,
    gradient: 'from-indigo-500 to-blue-600',
    shadow: 'shadow-indigo-200',
    iconBg: 'bg-white/25',
    lightBg: 'bg-indigo-50',
    textAccent: 'text-indigo-600',
    href: '/admin/dashboard/students',
  },
  {
    key: 'tests',
    label: 'Tests Assigned',
    icon: FileText,
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-orange-200',
    iconBg: 'bg-white/25',
    lightBg: 'bg-orange-50',
    textAccent: 'text-orange-600',
    href: '/admin/dashboard/assigned-tests',
  },
  {
    key: 'attempts',
    label: 'Total Attempts',
    icon: CheckCircle2,
    gradient: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-200',
    iconBg: 'bg-white/25',
    lightBg: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    href: null,
  },
  {
    key: 'avg',
    label: 'Avg Score',
    icon: TrendingUp,
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-200',
    iconBg: 'bg-white/25',
    lightBg: 'bg-rose-50',
    textAccent: 'text-rose-600',
    href: null,
  },
];

const quickActions = [
  { label: 'All Students', sub: 'Profiles, batches & history', icon: Users, bg: 'bg-indigo-100', text: 'text-indigo-600', href: '/admin/dashboard/students', badge: null },
  { label: 'Assign New Test', sub: 'Global bank or custom', icon: FileText, bg: 'bg-amber-100', text: 'text-amber-600', href: '/admin/dashboard/assigned-tests', badge: 'New' },
  { label: 'Advanced Analytics', sub: 'Batch & chapter insights', icon: BarChart2, bg: 'bg-emerald-100', text: 'text-emerald-600', href: '/admin/dashboard/analytics', badge: null },
  { label: 'Offline Paper', sub: 'Print-ready OMR sheets', icon: Printer, bg: 'bg-violet-100', text: 'text-violet-600', href: '/admin/dashboard/offline-test', badge: null },
  { label: 'Live Monitor', sub: 'Real-time test tracking', icon: Activity, bg: 'bg-sky-100', text: 'text-sky-600', href: '/admin/dashboard/live-monitor', badge: 'Live' },
];

export default function AdminDashboardOverview() {
  const router = useRouter();
  const [coachingName, setCoachingName] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [coachingInfo, setCoachingInfo] = useState<CoachingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [atRiskStudents] = useState<any[]>([
    { id: '1', name: 'Atharv Jadhav', issue: 'Scored 12% in last mock', batch: 'JEE', phone: '919876543210' },
    { id: '2', name: 'Rohan Shinde', issue: 'Missed last 2 tests', batch: 'NEET', phone: '919876543211' },
    { id: '3', name: 'Priya Kulkarni', issue: 'Accuracy below 30% (3 tests)', batch: 'CET-A', phone: '919876543212' },
  ]);

  useEffect(() => {
    setCoachingName(getCoachingName());
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to load'); }
        const data = await res.json();
        setStats(data.stats);
        setRecentTests(data.recentTests || []);
        setCoachingInfo(data.coachingInfo || null);
        if (data.coachingInfo?.name && !getCoachingName()) setCoachingName(data.coachingInfo.name);
      } catch (err: any) { setError(err.message); }
      finally { setIsLoading(false); }
    };
    fetchDashboard();
  }, []);

  const displayName = coachingName || coachingInfo?.name || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const statValues: Record<string, any> = {
    students: stats?.totalStudents,
    tests: stats?.totalTests,
    attempts: stats?.totalAttempts,
    avg: stats?.totalAttempts ? `${stats.avgScorePercent}%` : '—',
  };

  const statSubs: Record<string, string> = {
    students: `11th: ${stats?.students11th ?? '--'} · 12th: ${stats?.students12th ?? '--'}`,
    tests: 'Click to manage →',
    attempts: 'Across all students',
    avg: stats?.totalAttempts ? 'Overall performance' : 'No attempts yet',
  };

  const batchColors: Record<string, string> = {
    JEE: 'bg-indigo-100 text-indigo-700',
    NEET: 'bg-emerald-100 text-emerald-700',
    'CET-A': 'bg-amber-100 text-amber-700',
    'CET-B': 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500 max-w-7xl mx-auto">

      {/* ── Hero Header Banner ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-7 shadow-xl shadow-indigo-200">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-yellow-400/10 rounded-full translate-y-1/2" />

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-white/70 text-sm font-semibold">{today}</span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight">
              {greeting}, <span className="text-yellow-300">{displayName}!</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm">Your coaching performance at a glance — let's crush today's targets.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {coachingInfo ? (
              <span className={`px-3 py-1.5 rounded-full text-xs font-black ${
                coachingInfo.account_status === 'Active'
                  ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
              }`}>
                ✦ {coachingInfo.plan_type} · {coachingInfo.account_status}
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs font-black bg-rose-400/20 text-rose-200 border border-rose-400/30">
                Coaching Not Found in CRM
              </span>
            )}
            {stats?.coachingId && (
              <span className="text-[10px] font-mono text-white/30">ID: {stats.coachingId}</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Could not load dashboard data: {error}</span>
        </div>
      )}

      {/* ── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.key}
            onClick={card.href ? () => router.push(card.href!) : undefined}
            className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} text-white ${card.href ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-white/75">{card.label}</p>
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin text-white/40 mt-1" />
            ) : (
              <>
                <div className="text-4xl font-black leading-none">{statValues[card.key] ?? '--'}</div>
                <p className="text-xs text-white/60 font-semibold mt-2">{statSubs[card.key]}</p>
              </>
            )}
            {/* Decorative circle */}
            <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -top-3 -left-3 w-16 h-16 rounded-full bg-white/5" />
          </div>
        ))}
      </div>

      {/* ── Bottom Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Attention Required — 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-orange-50">
            <h2 className="font-black text-slate-900 flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              Attention Required
              <span className="text-[11px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{atRiskStudents.length}</span>
            </h2>
            <button
              onClick={() => router.push('/admin/dashboard/students')}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 text-rose-600 flex items-center justify-center font-black text-sm shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${batchColors[student.batch] ?? 'bg-slate-100 text-slate-600'}`}>
                      {student.batch}
                    </span>
                  </div>
                  <p className="text-xs text-rose-500 font-medium">{student.issue}</p>
                </div>
                <a
                  href={`https://wa.me/${student.phone}?text=Hello, this is an update regarding ${student.name}'s performance: ${student.issue}. Please review.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm hover:shadow-emerald-200"
                  title="Message Parent on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column — 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <h2 className="font-black text-slate-900 flex items-center gap-2.5 text-base">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                Quick Actions
              </h2>
            </div>
            <div className="p-3 space-y-0.5">
              {quickActions.map(({ label, sub, icon: Icon, bg, text, href, badge }) => (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{label}</p>
                      {badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${badge === 'Live' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Tests */}
          {recentTests.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50">
                <h2 className="font-black text-slate-900 flex items-center gap-2.5 text-base">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-sky-500" />
                  </div>
                  Recent Tests
                </h2>
              </div>
              <div className="p-3 space-y-0.5">
                {recentTests.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/admin/dashboard/analytics?testId=${t.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpenCheck className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{t.name}</p>
                      <p className="text-xs text-slate-400">{timeAgo(t.created_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0" />
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
