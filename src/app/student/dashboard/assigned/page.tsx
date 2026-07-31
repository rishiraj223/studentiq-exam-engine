'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Bell, CheckCircle2, Clock, Zap, Calendar,
  FileText, ChevronRight, Eye, Filter
} from 'lucide-react';

type AssignedTest = {
  id: string;
  name: string;
  exam_type: string;
  total_marks: number;
  duration_minutes: number;
  due_date: string | null;
  isCompleted: boolean;
};

type TestStatus = 'pending' | 'due_soon' | 'expired' | 'completed';

function getStatus(test: AssignedTest): TestStatus {
  if (test.isCompleted) return 'completed';
  if (!test.due_date) return 'pending';
  const diff = new Date(test.due_date).getTime() - Date.now();
  if (diff < 0) return 'expired';
  if (diff < 3 * 86400000) return 'due_soon';
  return 'pending';
}

function formatDueDate(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Due today!';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const STATUS_STYLES: Record<TestStatus, { badge: string; border: string; label: string }> = {
  pending:   { badge: 'bg-blue-100 text-blue-700',   border: 'border-slate-200',  label: 'Pending' },
  due_soon:  { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200',  label: 'Due Soon' },
  expired:   { badge: 'bg-rose-100 text-rose-700',   border: 'border-rose-200',   label: 'Expired' },
  completed: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
};

type FilterType = 'all' | 'pending' | 'completed';

export default function AssignedTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch('/api/student/assigned-tests');
      const data = await res.json();
      setTests(data.assignments || []);
    } catch {
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const filtered = tests.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !t.isCompleted;
    return t.isCompleted;
  });

  const pendingCount   = tests.filter(t => !t.isCompleted).length;
  const completedCount = tests.filter(t => t.isCompleted).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Assigned Tests</h1>
          <p className="text-slate-500 mt-1">Tests assigned by your coaching academy.</p>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                <Bell className="w-3.5 h-3.5" /> {pendingCount} Pending
              </span>
            )}
            {completedCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> {completedCount} Done
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter pills */}
      {!isLoading && tests.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(['all', 'pending', 'completed'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                filter === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-bold text-slate-600 text-lg">No tests assigned yet</p>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
            Your coaching academy hasn't assigned any tests yet. Check back later.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="font-bold text-slate-600">No {filter} tests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(test => {
            const status  = getStatus(test);
            const styles  = STATUS_STYLES[status];
            const dueInfo = test.due_date ? formatDueDate(test.due_date) : null;

            return (
              <div
                key={test.id}
                className={`bg-white border-2 ${styles.border} rounded-2xl p-5 hover:shadow-md transition-all group`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {test.exam_type}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${styles.badge}`}>
                        {styles.label}
                      </span>
                      {test.due_date && (
                        <span className={`flex items-center gap-1 text-xs font-bold ${
                          status === 'expired' ? 'text-rose-600' :
                          status === 'due_soon' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {dueInfo}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-base truncate">{test.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {test.duration_minutes} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> {test.total_marks} marks
                      </span>
                      {test.due_date && (
                        <span className="text-slate-400">Assigned {formatDate(test.due_date)}</span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {test.isCompleted ? (
                      <button
                        onClick={() => router.push(`/exam/${test.id}/results`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-emerald-300 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all text-sm"
                      >
                        <Eye className="w-4 h-4" /> View Results
                      </button>
                    ) : status === 'expired' ? (
                      <button
                        disabled
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed"
                      >
                        Expired
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push(`/exam/${test.id}`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all text-sm group-hover:shadow-md"
                      >
                        Start Test <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
