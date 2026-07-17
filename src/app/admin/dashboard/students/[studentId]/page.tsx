'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Award, TrendingUp, TrendingDown,
  BookOpen, Clock, CheckCircle, XCircle, Zap, Target,
  BarChart3, Calendar, GraduationCap, Phone
} from 'lucide-react';

type SubjectStat = { subject: string; accuracy: number; correct: number; incorrect: number };

type HistoryItem = {
  id: string;
  testName: string;
  examType: string;
  totalScore: number;
  totalMarks: number;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  date: string;
  isAssigned: boolean;
};

type StudentDetails = {
  student: {
    id: string;
    name: string;
    roll_no: string;
    batch: string;
    standard: string;
    parent_phone: string;
    testsTaken: number;
    avgScore: number;
  };
  history: HistoryItem[];
  analytics: {
    strongestSubject: string | null;
    weakestSubject: string | null;
    subjectStats: SubjectStat[];
    scoreTimeline: { date: string; score: number }[];
    totalCorrect: number;
    totalIncorrect: number;
    totalUnanswered: number;
    bestScore: number;
    assignedCompleted: number;
  };
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const BATCH_COLORS: Record<string, string> = {
  JEE:    'bg-blue-100 text-blue-700',
  NEET:   'bg-emerald-100 text-emerald-700',
  'CET A': 'bg-violet-100 text-violet-700',
  'CET B': 'bg-amber-100 text-amber-700',
};

export default function AdminStudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => { params.then(p => setStudentId(p.studentId)); }, [params]);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/student/${studentId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-slate-400">Loading student profile...</p>
    </div>
  );

  if (!data || !data.student) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Student not found.</p>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline text-sm font-semibold">Go Back</button>
    </div>
  );

  const { student, history, analytics } = data;
  const batchColor = BATCH_COLORS[student.batch] || 'bg-slate-100 text-slate-600';

  const totalAttempted = analytics.totalCorrect + analytics.totalIncorrect;
  const overallAccuracy = totalAttempted > 0 ? Math.round((analytics.totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">

      {/* Back + Hero Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/admin/dashboard/students')}
          className="mt-1 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex-1">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-200 shrink-0">
              {student.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${batchColor}`}>{student.batch}</span>
                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Class {student.standard}th
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 truncate">{student.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 font-medium">
                <span>Roll #{student.roll_no}</span>
                {student.parent_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {student.parent_phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{student.testsTaken}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Tests Taken</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Award className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{student.avgScore}%</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Avg Score</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Target className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{overallAccuracy}%</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Accuracy</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{analytics.bestScore ?? '—'}%</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Best Score</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-slate-900">{analytics.assignedCompleted ?? 0}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">Assigned Done</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
        {(['overview', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : '📋 Test History'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Strongest / Weakest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700 mb-3">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Strongest Subject</span>
              </div>
              <p className="text-2xl font-black text-emerald-900">{analytics.strongestSubject || '—'}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
              <div className="flex items-center gap-2 text-rose-700 mb-3">
                <TrendingDown className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Needs Improvement</span>
              </div>
              <p className="text-2xl font-black text-rose-900">{analytics.weakestSubject || '—'}</p>
            </div>
          </div>

          {/* Subject Accuracy Breakdown */}
          {analytics.subjectStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-slate-900">Subject Accuracy Breakdown</h2>
              </div>
              <div className="p-6 space-y-4">
                {analytics.subjectStats
                  .sort((a, b) => b.accuracy - a.accuracy)
                  .map(stat => (
                    <div key={stat.subject}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-sm text-slate-700">{stat.subject}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {stat.correct}
                          </span>
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> {stat.incorrect}
                          </span>
                          <span className={`font-black text-sm ${stat.accuracy >= 70 ? 'text-emerald-600' : stat.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {stat.accuracy}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stat.accuracy >= 70 ? 'bg-emerald-500' :
                            stat.accuracy >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${stat.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Question Stats Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" /> Overall Question Stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-3xl font-black text-emerald-700">{analytics.totalCorrect}</p>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mt-1">Correct</p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-3xl font-black text-rose-600">{analytics.totalIncorrect}</p>
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wide mt-1">Wrong</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-3xl font-black text-slate-500">{analytics.totalUnanswered}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Skipped</p>
              </div>
            </div>
          </div>

          {/* No data state */}
          {student.testsTaken === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tests taken yet</p>
              <p className="text-sm text-slate-400 mt-1">Analytics will appear once the student takes their first test.</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Test History</h2>
            <span className="text-sm text-slate-400 font-medium">{history.length} tests</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No tests taken yet.</td>
                  </tr>
                ) : history.map(item => {
                  const totalAttempted = item.correctCount + item.incorrectCount;
                  const accuracy = totalAttempted > 0 ? Math.round((item.correctCount / totalAttempted) * 100) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{item.testName}</p>
                        <span className="text-xs text-slate-400">{item.examType}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.isAssigned
                          ? <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">Assigned</span>
                          : <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">Practice</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-black text-base ${item.scorePercent >= 60 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {item.scorePercent}%
                        </span>
                        {item.totalMarks > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.totalScore} / {item.totalMarks}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>{accuracy}%</span>
                          <div className="flex gap-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5 text-emerald-500">
                              <CheckCircle className="w-3 h-3" />{item.correctCount}
                            </span>
                            <span className="flex items-center gap-0.5 text-rose-400">
                              <XCircle className="w-3 h-3" />{item.incorrectCount}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {formatTime(item.timeTakenSeconds)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        <p>{new Date(item.date).toLocaleDateString()}</p>
                        <p className="text-slate-400">{timeAgo(item.date)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
