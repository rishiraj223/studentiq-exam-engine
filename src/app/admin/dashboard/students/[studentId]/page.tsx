'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Award, TrendingUp, TrendingDown,
  BookOpen, Clock, CheckCircle, XCircle, Zap, Target,
  BarChart3, Calendar, GraduationCap, Phone, MessageSquare, Plus, Trash2
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
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes'>('overview');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

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
    
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/admin/student/${studentId}/notes`);
        const json = await res.json();
        if (json.notes) setNotes(json.notes);
      } catch (err) {}
    };

    load();
    fetchNotes();
  }, [studentId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/admin/student/${studentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });
      const json = await res.json();
      if (json.notes) {
        setNotes(json.notes);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

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
      <div className="flex items-center gap-6 border-b border-slate-200 mt-6 px-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Test History ({data.history.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Remarks & Notes
          {notes.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'notes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {notes.length}
            </span>
          )}
        </button>
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

          {/* Time Spent Analysis */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Time Spent Analysis
              </h2>
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Recent Mock Test</option>
                <option>All Time Average</option>
              </select>
            </div>
            
            <div className="space-y-6">
              {[
                { 
                  subject: 'Physics', 
                  color: 'bg-blue-500', 
                  stats: [
                    { label: 'MCQ Avg Time', time: '1m 45s', width: '45%' },
                    { label: 'Numeric Avg Time', time: '2m 30s', width: '70%' },
                  ]
                },
                { 
                  subject: 'Chemistry', 
                  color: 'bg-emerald-500', 
                  stats: [
                    { label: 'MCQ Avg Time', time: '1m 15s', width: '30%' },
                    { label: 'Numeric Avg Time', time: '2m 10s', width: '60%' },
                  ]
                },
                { 
                  subject: 'Mathematics', 
                  color: 'bg-rose-500', 
                  stats: [
                    { label: 'MCQ Avg Time', time: '2m 05s', width: '55%' },
                    { label: 'Numeric Avg Time', time: '3m 45s', width: '90%' },
                  ]
                },
              ].map(sub => (
                <div key={sub.subject} className="space-y-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${sub.color}`}></div>
                    {sub.subject}
                  </h3>
                  <div className="space-y-3 pl-4">
                    {sub.stats.map(stat => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>{stat.label}</span>
                          <span className="text-slate-800 font-bold">{stat.time}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${sub.color} rounded-full`} style={{ width: stat.width }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                  const isExpanded = expandedTestId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-slate-50/80 cursor-pointer"
                        onClick={() => setExpandedTestId(isExpanded ? null : item.id)}
                      >
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
                      {isExpanded && (
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <td colSpan={6} className="px-8 py-6">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-blue-500" />
                              Subject-Wise Breakdown
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {['Physics', 'Chemistry', 'Mathematics'].map(sub => {
                                const subAcc = Math.floor(Math.random() * 40) + 50;
                                return (
                                  <div key={sub} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition">
                                    <h5 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
                                      <div className={`w-2 h-2 rounded-full ${sub === 'Physics' ? 'bg-blue-500' : sub === 'Chemistry' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                      {sub}
                                    </h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Accuracy</span>
                                        <span className={`font-bold ${subAcc >= 70 ? 'text-emerald-600' : subAcc >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{subAcc}%</span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full ${subAcc >= 70 ? 'bg-emerald-500' : subAcc >= 60 ? 'bg-amber-400' : 'bg-rose-500'} rounded-full`} style={{ width: `${subAcc}%` }}></div>
                                      </div>
                                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-50">
                                        <span className="text-slate-500 font-medium">Time Spent</span>
                                        <span className="font-bold text-slate-700">{Math.floor(Math.random() * 15) + 10}m {Math.floor(Math.random() * 59)}s</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Add Private Remark
            </h3>
            <div className="flex gap-3">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="e.g., Needs extra attention in Physics numericals. Missed last two classes."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none h-24"
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddNote}
                disabled={isSubmittingNote || !newNote.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isSubmittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Remark
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Previous Remarks</h3>
            </div>
            {notes.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No remarks added yet.</p>
                <p className="text-sm text-slate-400 mt-1">Use notes to track student progress and behavior privately.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <div key={note.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black uppercase">
                          {note.author.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{note.author}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(note.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap ml-8 leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
