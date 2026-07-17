'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users, Target, Clock, Trophy } from 'lucide-react';

type LeaderboardEntry = {
  rank: number;
  studentId: string;
  name: string;
  rollNo: string;
  batch: string;
  score: number;
  scorePercent: number;
  accuracy: number;
  timeTakenSeconds: number;
  date: string;
};

type TestAnalytics = {
  test: { id: string; name: string; exam_type: string; total_marks: number; duration_minutes: number; due_date: string | null };
  stats: { participations: number; avgScorePercent: number; avgAccuracy: number; avgTimeTakenSeconds: number; highestScore: number } | null;
  leaderboard: LeaderboardEntry[];
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function AdminAssignedTestAnalyticsPage({ params }: { params: Promise<{ testId: string }> }) {
  const router = useRouter();
  const [testId, setTestId] = useState('');
  const [data, setData] = useState<TestAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { params.then(p => setTestId(p.testId)); }, [params]);

  useEffect(() => {
    if (!testId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/assigned-tests/${testId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [testId]);

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!data || !data.test) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Test not found.</p>
    </div>
  );

  const { test, stats, leaderboard } = data;

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/dashboard/assigned-tests')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-1 inline-block">{test.exam_type}</span>
          <h1 className="text-2xl font-bold text-slate-900">{test.name}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {test.duration_minutes} Mins • {test.total_marks} Marks
            {test.due_date && ` • Due: ${new Date(test.due_date).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {/* Aggregate Stats */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-sm">Participations</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.participations}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <Trophy className="w-5 h-5" />
              <h3 className="font-bold text-sm">Average Score</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.avgScorePercent}%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Target className="w-5 h-5" />
              <h3 className="font-bold text-sm">Average Accuracy</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.avgAccuracy}%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold text-sm">Average Time</h3>
            </div>
            <p className="text-3xl font-black text-slate-900">{formatTime(stats.avgTimeTakenSeconds)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-semibold">
          No one has taken this test yet.
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboard.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Batch Leaderboard
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">Time Taken</th>
                  <th className="px-6 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map(entry => (
                  <tr key={entry.studentId} className={`hover:bg-slate-50 ${entry.rank <= 3 ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1 ? 'bg-amber-100 text-amber-700' : 
                        entry.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        #{entry.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{entry.name}</p>
                      <p className="text-xs text-slate-400">Roll: {entry.rollNo} • {entry.batch}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">{entry.score}</span>
                      <span className="text-xs text-slate-500 ml-1">({entry.scorePercent}%)</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {entry.accuracy}%
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatTime(entry.timeTakenSeconds)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {new Date(entry.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
