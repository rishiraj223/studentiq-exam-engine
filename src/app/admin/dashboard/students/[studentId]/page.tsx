'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Award, TrendingUp, TrendingDown, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';

type StudentDetails = {
  student: { id: string; name: string; roll_no: string; batch: string; testsTaken: number; avgScore: number };
  history: Array<{ id: string; testName: string; examType: string; scorePercent: number; correctCount: number; incorrectCount: number; timeTakenSeconds: number; date: string; isAssigned: boolean }>;
  analytics: { strongestSubject: string | null; weakestSubject: string | null; subjectStats: Array<{ subject: string; accuracy: number }> };
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function AdminStudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!data || !data.student) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Student not found.</p>
    </div>
  );

  const { student, history, analytics } = data;

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/dashboard/students')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">Roll: {student.roll_no} • {student.batch}</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm">Tests Taken</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{student.testsTaken}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-sm">Avg Score</h3>
          </div>
          <p className="text-3xl font-black text-slate-900">{student.avgScore}%</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-emerald-700 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-bold text-sm">Strongest</h3>
          </div>
          <p className="text-lg font-bold text-emerald-900 truncate">{analytics.strongestSubject || 'N/A'}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-rose-700 mb-2">
            <TrendingDown className="w-5 h-5" />
            <h3 className="font-bold text-sm">Weakest</h3>
          </div>
          <p className="text-lg font-bold text-rose-900 truncate">{analytics.weakestSubject || 'N/A'}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Test Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Accuracy</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No tests taken yet.</td></tr>
              ) : history.map(item => {
                const totalAttempted = item.correctCount + item.incorrectCount;
                const accuracy = totalAttempted > 0 ? Math.round((item.correctCount / totalAttempted) * 100) : 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.testName}</p>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> {formatTime(item.timeTakenSeconds)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.isAssigned 
                        ? <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">Assigned</span>
                        : <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">Practice</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${item.scorePercent >= 60 ? 'text-emerald-600' : 'text-rose-500'}`}>{item.scorePercent}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{accuracy}%</span>
                        <div className="flex gap-2 text-xs">
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3 h-3"/> {item.correctCount}</span>
                          <span className="flex items-center gap-1 text-rose-500"><XCircle className="w-3 h-3"/> {item.incorrectCount}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">{new Date(item.date).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
