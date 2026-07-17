'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Award, BarChart3, Eye, Loader2, FileText, Trophy } from 'lucide-react';

type HistoryItem = {
  id: string;
  testId: string;
  testName: string;
  examType: string;
  totalMarks: number;
  totalScore: number;
  scorePercent: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  durationMinutes: number;
  rank: number;
  totalParticipants: number;
  date: string;
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ScoreBadge({ percent }: { percent: number }) {
  if (percent >= 80) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Excellent</span>;
  if (percent >= 60) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Good</span>;
  if (percent >= 40) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Average</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Needs Work</span>;
}

export default function TestHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/history');
        const data = await res.json();
        setHistory(data.history || []);
      } catch {
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const examTypes = ['all', ...Array.from(new Set(history.map(h => h.examType)))];
  const filtered = filter === 'all' ? history : history.filter(h => h.examType === filter);

  // Summary stats
  const avgScore = history.length > 0
    ? Math.round(history.reduce((a, h) => a + h.scorePercent, 0) / history.length)
    : 0;
  const avgAccuracy = history.length > 0
    ? Math.round(history.reduce((a, h) => a + h.accuracy, 0) / history.length)
    : 0;
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.scorePercent)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Tests</h1>
        <p className="text-slate-500 mt-1">Your complete test history and performance record.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tests Taken</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{history.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</p>
          <p className="text-3xl font-black text-blue-600 mt-1">{avgScore}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Accuracy</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{avgAccuracy}%</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 shadow-sm text-white">
          <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Best Score</p>
          <p className="text-3xl font-black mt-1">{bestScore}%</p>
        </div>
      </div>

      {/* Filter Pills */}
      {examTypes.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {examTypes.map(et => (
            <button key={et} onClick={() => setFilter(et)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                filter === et
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {et === 'all' ? 'All Tests' : et}
            </button>
          ))}
        </div>
      )}

      {/* Test History List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tests found</p>
          <p className="text-sm text-slate-400 mt-1">Complete a test to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => (
            <div key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: Test info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item.examType}</span>
                    <ScoreBadge percent={item.scorePercent} />
                    {item.rank === 1 && item.totalParticipants > 1 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🏆 Top Scorer</span>}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">{item.testName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatTime(item.timeTakenSeconds)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {item.correctCount} correct
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-rose-500 font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      {item.incorrectCount} wrong
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {item.accuracy}% accuracy
                    </span>
                    {item.rank > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium">
                        <Trophy className="w-3.5 h-3.5" />
                        Rank #{item.rank} / {item.totalParticipants}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Score + Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                  {/* Score circle */}
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-lg border-4 ${
                      item.scorePercent >= 80 ? 'border-emerald-400 text-emerald-600 bg-emerald-50' :
                      item.scorePercent >= 60 ? 'border-blue-400 text-blue-600 bg-blue-50' :
                      item.scorePercent >= 40 ? 'border-amber-400 text-amber-600 bg-amber-50' :
                      'border-rose-400 text-rose-600 bg-rose-50'
                    }`}>
                      {item.scorePercent}%
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.totalScore} / {item.totalMarks}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/exam/${item.testId}/review`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>

              {/* Score progress bar */}
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.scorePercent >= 80 ? 'bg-emerald-500' :
                    item.scorePercent >= 60 ? 'bg-blue-500' :
                    item.scorePercent >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.scorePercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
