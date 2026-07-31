'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import {
  Loader2, Globe, BookOpen, Settings2, X, Play, Trash2,
  ChevronLeft, CheckCircle2, Clock, Award, Zap, Eye, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

// ── Constants ──────────────────────────────────────────────
const EXAM_OPTIONS = [
  { id: 'JEE Main',     label: 'JEE Main',     desc: '90 Qs · 180 Min · PCM',  badge: 'bg-blue-100 text-blue-800' },
  { id: 'JEE Advanced', label: 'JEE Advanced', desc: '60 Qs · 180 Min · PCM',  badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'NEET',         label: 'NEET',         desc: '180 Qs · 200 Min · PCB', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'MHT-CET A',   label: 'MHT-CET A',   desc: '150 Qs · 180 Min · PCM', badge: 'bg-orange-100 text-orange-800' },
  { id: 'MHT-CET B',   label: 'MHT-CET B',   desc: '200 Qs · 180 Min · PCB', badge: 'bg-rose-100 text-rose-800' },
];

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  'JEE Main':     ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
  'MHT-CET A':   ['Physics', 'Chemistry', 'Mathematics'],
  'MHT-CET B':   ['Physics', 'Chemistry', 'Biology'],
};

const BOARDS = [
  { id: 'NCERT',    label: 'NCERT',              subtitle: 'JEE / NEET Syllabus',   color: 'from-blue-500 to-indigo-600', icon: '📘' },
  { id: 'MH Board', label: 'Maharashtra Board',  subtitle: 'MHT-CET Syllabus',      color: 'from-orange-500 to-rose-500', icon: '🏛️' },
];

const SUBJECTS_BY_BOARD: Record<string, { id: string; label: string; icon: string; color: string }[]> = {
  'NCERT': [
    { id: 'Physics',     label: 'Physics',     icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'Chemistry',   label: 'Chemistry',   icon: '🧪', color: 'from-green-400 to-emerald-600' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', color: 'from-blue-400 to-blue-600' },
    { id: 'Biology',     label: 'Biology',     icon: '🌿', color: 'from-teal-400 to-green-600' },
  ],
  'MH Board': [
    { id: 'Physics',     label: 'Physics',     icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'Chemistry',   label: 'Chemistry',   icon: '🧪', color: 'from-green-400 to-emerald-600' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', color: 'from-blue-400 to-blue-600' },
    { id: 'Biology',     label: 'Biology',     icon: '🌿', color: 'from-teal-400 to-green-600' },
  ],
};

function getExamTypeForChapters(board: string, subject: string): string {
  if (board === 'NCERT') return subject === 'Biology' ? 'NEET' : 'JEE Main';
  return subject === 'Biology' ? 'MHT-CET B' : 'MHT-CET A';
}

// ── Types ──────────────────────────────────────────────────
type MockTest = {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
};

type TestAttempt = {
  test_template_id: string;
  total_score: number;
  time_taken_seconds: number;
};

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
  timeTakenSeconds: number;
  date: string;
};

function ScoreBadge({ percent }: { percent: number }) {
  if (percent >= 80) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Excellent</span>;
  if (percent >= 60) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Good</span>;
  if (percent >= 40) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Average</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Needs Work</span>;
}

// ── Main Component ─────────────────────────────────────────
export default function PracticeTestsPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [tests,   setTests]   = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>({});
  const [history, setHistory]   = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  // Modal states
  const [showFullMockModal,   setShowFullMockModal]   = useState(false);
  const [showChapterModal,    setShowChapterModal]    = useState(false);
  const [showCustomModal,     setShowCustomModal]     = useState(false);
  const [isGenerating,        setIsGenerating]        = useState(false);

  // Custom test form
  const [customExam,      setCustomExam]      = useState('JEE Main');
  const [customSubjects,  setCustomSubjects]  = useState<string[]>(['Physics', 'Chemistry', 'Mathematics']);
  const [customMcqCount,       setCustomMcqCount]       = useState(20);
  const [customNumericalCount, setCustomNumericalCount] = useState(5);
  const [customTime,      setCustomTime]      = useState(60);

  // Chapter wizard
  const [chapterMcqCount, setChapterMcqCount] = useState(20);
  const [chapterNumericalCount, setChapterNumericalCount] = useState(5);

  const handleCustomExamChange = (exam: string) => {
    setCustomExam(exam);
    setCustomSubjects(SUBJECTS_BY_EXAM[exam] || []);
  };

  // Chapter wizard
  const [wizardStep,       setWizardStep]       = useState(1);
  const [chapterBoard,     setChapterBoard]     = useState('');
  const [chapterSubject,   setChapterSubject]   = useState('');
  const [chapterStandard,  setChapterStandard]  = useState('');
  const [chapterName,      setChapterName]      = useState('');
  const [availableChapters, setAvailableChapters] = useState<{ name: string; chapter_number: number }[]>([]);
  const [chaptersLoading,  setChaptersLoading]  = useState(false);

  const resetWizard = () => {
    setWizardStep(1); setChapterBoard(''); setChapterSubject('');
    setChapterStandard(''); setChapterName(''); setAvailableChapters([]);
  };

  // Fetch chapters dynamically
  useEffect(() => {
    if (!showChapterModal || wizardStep !== 4 || !chapterBoard || !chapterSubject || !chapterStandard) return;
    const fetchChapters = async () => {
      setChaptersLoading(true);
      const examType = getExamTypeForChapters(chapterBoard, chapterSubject);
      const { data } = await supabase
        .from('chapters')
        .select('name, chapter_number')
        .eq('exam_type', examType)
        .eq('subject', chapterSubject)
        .eq('standard', chapterStandard)
        .eq('is_active', true)
        .order('chapter_number');
      setAvailableChapters(data || []);
      if (data && data.length > 0) setChapterName(data[0].name);
      else setChapterName('');
      setChaptersLoading(false);
    };
    fetchChapters();
  }, [chapterBoard, chapterSubject, chapterStandard, wizardStep, showChapterModal, supabase]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashRes, histRes] = await Promise.all([
        fetch('/api/student/dashboard-data'),
        fetch('/api/student/history'),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setTests(d.tests || []);
        const map: Record<string, TestAttempt> = {};
        (d.attempts || []).forEach((a: TestAttempt) => { map[a.test_template_id] = a; });
        setAttempts(map);
      }
      if (histRes.ok) {
        const h = await histRes.json();
        setHistory(h.history || []);
      }
    } catch { /* silent */ }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── API Handlers ──────────────────────────────────────────
  const handleAutoCreateFullMock = async (examType: string) => {
    setIsGenerating(true);
    try {
      const res  = await fetch('/api/student/create-auto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      toast.success('Full Mock Test ready!');
      setShowFullMockModal(false);
      await fetchData();
      router.push(`/exam/${data.testId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustomTest = async (isChapterMode: boolean) => {
    setIsGenerating(true);
    try {
      const payload = isChapterMode ? {
        examType: getExamTypeForChapters(chapterBoard, chapterSubject),
        subjects: [chapterSubject],
        mcqCount: chapterMcqCount,
        numericalCount: chapterNumericalCount,
        durationMinutes: 30,
        testName: `${chapterName} — ${chapterSubject} Chapter Test`,
        isChapterMode: true,
        chapterName,
      } : {
        examType: customExam,
        subjects: customSubjects,
        mcqCount: customMcqCount,
        numericalCount: customNumericalCount,
        durationMinutes: customTime,
        testName: `Custom Test (${customSubjects.join(', ')})`,
        isChapterMode: false,
      };
      const res  = await fetch('/api/student/create-custom-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      toast.success(`Test ready! ${data.totalQuestions || payload.mcqCount + payload.numericalCount} questions loaded.`);
      setShowChapterModal(false);
      setShowCustomModal(false);
      resetWizard();
      await fetchData();
      router.push(`/exam/${data.testId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Delete this unattempted test?')) return;
    try {
      const res  = await fetch(`/api/student/delete-test/${testId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Test deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendingTests   = tests.filter(t => !attempts[t.id]);
  const completedTests = tests.filter(t => !!attempts[t.id]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-4">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Practice Tests</h1>
        <p className="text-slate-500 mt-1">Generate and manage your self-created practice tests.</p>
      </div>

      {/* ── Generator Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Full Mock */}
        <button
          onClick={() => setShowFullMockModal(true)}
          className="group flex flex-col items-start p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Full Mock Test</h3>
          <p className="text-sm text-slate-500">Auto-generated full syllabus exam perfectly mimicking real weightage.</p>
          <span className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
            Select exam type →
          </span>
        </button>

        {/* Chapter Test */}
        <button
          onClick={() => { resetWizard(); setShowChapterModal(true); }}
          className="group flex flex-col items-start p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Chapter Test</h3>
          <p className="text-sm text-slate-500">Target a specific weak chapter. Get 20 focused questions.</p>
          <span className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
            Pick chapter →
          </span>
        </button>

        {/* Custom Test */}
        <button
          onClick={() => setShowCustomModal(true)}
          className="group flex flex-col items-start p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Settings2 className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Custom Test</h3>
          <p className="text-sm text-slate-500">Mix subjects (11th & 12th), set your own count and time limit.</p>
          <span className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
            Customize →
          </span>
        </button>
      </div>

      {/* ── Tabs: Pending / History ────────────────────── */}
      <div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
          {(['pending', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'pending' ? `Pending (${pendingTests.length})` : `History (${history.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : activeTab === 'pending' ? (
          /* ── Pending Tests ── */
          pendingTests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No pending tests</p>
              <p className="text-sm text-slate-400 mt-1">Generate a test above to start practicing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingTests.map(test => (
                <div key={test.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative">
                  <button
                    onClick={() => handleDeleteTest(test.id)}
                    className="absolute top-4 right-4 p-1.5 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                    title="Delete test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-3 inline-block">
                    {test.exam_type}
                  </span>
                  <h3 className="font-black text-slate-900 text-base pr-10 leading-snug line-clamp-2 mb-3">
                    {test.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{test.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{test.total_marks} marks</span>
                  </div>
                  <button
                    onClick={() => router.push(`/exam/${test.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-sm"
                  >
                    <Play className="w-4 h-4" /> Start Now
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── History Tab ── */
          history.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500">No test history yet</p>
              <p className="text-sm text-slate-400 mt-1">Complete a test to see your history here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">{item.examType}</span>
                        <ScoreBadge percent={item.scorePercent} />
                      </div>
                      <h3 className="font-black text-slate-900 text-sm truncate">{item.testName}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{item.correctCount} correct
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />{item.accuracy}% accuracy
                        </span>
                        <span className="text-slate-400">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-base border-4 ${
                        item.scorePercent >= 80 ? 'border-emerald-400 text-emerald-600 bg-emerald-50' :
                        item.scorePercent >= 60 ? 'border-blue-400 text-blue-600 bg-blue-50' :
                        item.scorePercent >= 40 ? 'border-amber-400 text-amber-600 bg-amber-50' :
                        'border-rose-400 text-rose-600 bg-rose-50'
                      }`}>
                        {item.scorePercent}%
                      </div>
                      <button
                        onClick={() => router.push(`/exam/${item.testId}/review`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
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
          )
        )}
      </div>

      {/* ════════════════════ MODALS ════════════════════ */}

      {/* 1. Full Mock Modal */}
      {showFullMockModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Select Exam Type</h2>
              <button onClick={() => setShowFullMockModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAM_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleAutoCreateFullMock(opt.id)} disabled={isGenerating}
                    className="flex flex-col text-left p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <span className={`px-2.5 py-1 rounded text-xs font-bold mb-3 w-fit ${opt.badge}`}>{opt.id}</span>
                    <h3 className="text-lg font-black text-slate-900">{opt.label} Full Mock</h3>
                    <p className="text-sm text-slate-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {isGenerating && (
                <div className="flex items-center justify-center gap-3 py-4 mt-4 border-t border-slate-100">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-slate-500 font-medium">Generating your test...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Chapter Test Modal — 4-Step Wizard */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {wizardStep > 1 && (
                  <button onClick={() => setWizardStep(s => s - 1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900">Chapter Test</h2>
                  <p className="text-xs text-slate-400">Step {wizardStep} of 4 — {['Pick Board', 'Pick Subject', 'Pick Standard', 'Pick Chapter'][wizardStep - 1]}</p>
                </div>
              </div>
              <button onClick={() => { setShowChapterModal(false); resetWizard(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex h-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`flex-1 transition-all duration-300 ${s <= wizardStep ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              ))}
            </div>
            <div className="p-6">
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-4">Which curriculum are your chapters from?</p>
                  {BOARDS.map(board => (
                    <button key={board.id} onClick={() => { setChapterBoard(board.id); setWizardStep(2); }}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${board.color} flex items-center justify-center text-2xl shadow-md`}>{board.icon}</div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">{board.label}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{board.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {wizardStep === 2 && (
                <div>
                  <p className="text-sm text-slate-500 mb-4">Select your subject:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(SUBJECTS_BY_BOARD[chapterBoard] || []).map(sub => (
                      <button key={sub.id} onClick={() => { setChapterSubject(sub.id); setWizardStep(3); }}
                        className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-2xl shadow-sm`}>{sub.icon}</div>
                        <span className="text-sm font-black text-slate-800">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div>
                  <p className="text-sm text-slate-500 mb-4">Which class are the chapters from?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['11th', '12th'].map(std => (
                      <button key={std} onClick={() => { setChapterStandard(std); setWizardStep(4); }}
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                      >
                        <span className="text-5xl font-black text-slate-300">{std.replace('th', '')}</span>
                        <span className="text-base font-black text-slate-700">Class {std}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500">Select a chapter:</p>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                      {chapterSubject} · {chapterStandard}
                    </span>
                  </div>
                  {chaptersLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                  ) : availableChapters.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-500 font-bold">No chapters found</p>
                      <p className="text-xs text-slate-400 mt-1">Questions for this combination haven't been added yet.</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {availableChapters.map(ch => (
                        <button key={ch.name} onClick={() => setChapterName(ch.name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            chapterName === ch.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{ch.chapter_number}.</span>
                          <span className="text-sm font-semibold text-slate-800 flex-1">{ch.name}</span>
                          {chapterName === ch.name && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">MCQs</label>
                      <input type="number" value={chapterMcqCount} onChange={e => setChapterMcqCount(parseInt(e.target.value) || 0)}
                        className="w-full h-10 rounded-xl border border-slate-200 px-3 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Numericals</label>
                      <input type="number" value={chapterNumericalCount} onChange={e => setChapterNumericalCount(parseInt(e.target.value) || 0)}
                        className="w-full h-10 rounded-xl border border-slate-200 px-3 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreateCustomTest(true)}
                    isLoading={isGenerating}
                    disabled={!chapterName || isGenerating}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base mt-2"
                  >
                    Start: {chapterName || 'Select a chapter'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom Test Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Custom Test</h2>
              <button onClick={() => setShowCustomModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Exam Type</label>
                <select value={customExam} onChange={e => handleCustomExamChange(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  {EXAM_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {(SUBJECTS_BY_EXAM[customExam] || []).map(sub => (
                    <button key={sub} type="button"
                      onClick={() => setCustomSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                        customSubjects.includes(sub)
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Total MCQs</label>
                  <input type="number" value={customMcqCount} onChange={e => setCustomMcqCount(parseInt(e.target.value) || 0)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Numericals</label>
                  <input type="number" value={customNumericalCount} onChange={e => setCustomNumericalCount(parseInt(e.target.value) || 0)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Time (mins)</label>
                  <input type="number" value={customTime} onChange={e => setCustomTime(parseInt(e.target.value) || 10)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none font-semibold"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleCreateCustomTest(false)}
                isLoading={isGenerating}
                disabled={customSubjects.length === 0}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-base"
              >
                Generate Custom Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
