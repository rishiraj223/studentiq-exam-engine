'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Play, Clock, Award, FileText, X, Loader2, Zap, Globe, BookOpen, Settings2, BarChart3, Trash2, ChevronLeft, CheckCircle2, Bell, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

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

const EXAM_OPTIONS = [
  { id: 'JEE Main', label: 'JEE Main', color: 'from-blue-500 to-blue-700', desc: '90 Questions · 180 Min · PCM', badge: 'bg-blue-100 text-blue-800' },
  { id: 'JEE Advanced', label: 'JEE Advanced', color: 'from-indigo-500 to-indigo-700', desc: '60 Questions · 180 Min · PCM', badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'NEET', label: 'NEET', color: 'from-emerald-500 to-emerald-700', desc: '180 Questions · 200 Min · PCB', badge: 'bg-emerald-100 text-emerald-800' },
  { id: 'MHT-CET A', label: 'MHT-CET A', color: 'from-orange-500 to-orange-700', desc: '150 Questions · 180 Min · PCM', badge: 'bg-orange-100 text-orange-800' },
  { id: 'MHT-CET B', label: 'MHT-CET B', color: 'from-rose-500 to-rose-700', desc: '200 Questions · 180 Min · PCB', badge: 'bg-rose-100 text-rose-800' },
];

// ✅ FIX: Correct subjects per exam — no Bio in JEE, no Maths in NEET
const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  'JEE Main':     ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
  'MHT-CET A':   ['Physics', 'Chemistry', 'Mathematics'],
  'MHT-CET B':   ['Physics', 'Chemistry', 'Biology'],
};

// Board config for the 4-step chapter wizard
const BOARDS = [
  { id: 'NCERT', label: 'NCERT', subtitle: 'JEE / NEET Syllabus', color: 'from-blue-500 to-indigo-600', icon: '📘' },
  { id: 'MH Board', label: 'Maharashtra Board', subtitle: 'MHT-CET Syllabus', color: 'from-orange-500 to-rose-500', icon: '🏛️' },
];

// When board + subject selected, which exam_type to query chapters from
function getExamTypeForChapters(board: string, subject: string): string {
  if (board === 'NCERT') return subject === 'Biology' ? 'NEET' : 'JEE Main';
  return subject === 'Biology' ? 'MHT-CET B' : 'MHT-CET A';
}

// Subjects available per board
const SUBJECTS_BY_BOARD: Record<string, { id: string; label: string; icon: string; color: string }[]> = {
  'NCERT': [
    { id: 'Physics', label: 'Physics', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'Chemistry', label: 'Chemistry', icon: '🧪', color: 'from-green-400 to-emerald-600' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', color: 'from-blue-400 to-blue-600' },
    { id: 'Biology', label: 'Biology', icon: '🌿', color: 'from-teal-400 to-green-600' },
  ],
  'MH Board': [
    { id: 'Physics', label: 'Physics', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
    { id: 'Chemistry', label: 'Chemistry', icon: '🧪', color: 'from-green-400 to-emerald-600' },
    { id: 'Mathematics', label: 'Mathematics', icon: '📐', color: 'from-blue-400 to-blue-600' },
    { id: 'Biology', label: 'Biology', icon: '🌿', color: 'from-teal-400 to-green-600' },
  ],
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [quickStats, setQuickStats] = useState({ totalTests: 0, avgScorePercent: 0, accuracyPercent: 0 });

  // Modal states
  const [showFullMockModal, setShowFullMockModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Test Form State
  const [customExam, setCustomExam] = useState('JEE Main');
  const [customSubjects, setCustomSubjects] = useState<string[]>(['Physics', 'Chemistry', 'Mathematics']);

  // ✅ FIX: When exam changes in custom modal, reset subjects to correct ones for that exam
  const handleCustomExamChange = (exam: string) => {
    setCustomExam(exam);
    setCustomSubjects(SUBJECTS_BY_EXAM[exam] || []);
  };
  const [customQuestions, setCustomQuestions] = useState(30);
  const [customTime, setCustomTime] = useState(60);

  // Chapter Test Wizard State (4 steps)
  const [wizardStep, setWizardStep] = useState(1); // 1=Board, 2=Subject, 3=Standard, 4=Chapter
  const [chapterBoard, setChapterBoard] = useState('');
  const [chapterSubject, setChapterSubject] = useState('');
  const [chapterStandard, setChapterStandard] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [availableChapters, setAvailableChapters] = useState<{name: string, chapter_number: number}[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const resetWizard = () => {
    setWizardStep(1);
    setChapterBoard('');
    setChapterSubject('');
    setChapterStandard('');
    setChapterName('');
    setAvailableChapters([]);
  };

  // Fetch Chapters Dynamically when on step 4
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
      if (data && data.length > 0) {
        setChapterName(data[0].name);
      } else {
        setChapterName('');
      }
      setChaptersLoading(false);
    };
    fetchChapters();
  }, [chapterBoard, chapterSubject, chapterStandard, wizardStep, showChapterModal, supabase]);

  const [assignedTests, setAssignedTests] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, assignRes] = await Promise.all([
        fetch('/api/student/dashboard-data'),
        fetch('/api/student/assigned-tests')
      ]);
      
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      
      setTests(data.tests || []);
      if (data.quickStats) setQuickStats(data.quickStats);
      
      const attemptMap: Record<string, TestAttempt> = {};
      (data.attempts || []).forEach((att: TestAttempt) => { attemptMap[att.test_template_id] = att; });
      setAttempts(attemptMap);

      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setAssignedTests(assignData.assignments || []);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAutoCreateFullMock = async (examType: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/student/create-auto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      toast.success(`Full Mock Test ready!`);
      setShowFullMockModal(false);
      await fetchDashboardData();
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
        examType: getExamTypeForChapters(chapterBoard, chapterSubject), // ✅ FIX: use board-derived exam type
        subjects: [chapterSubject],
        totalQuestions: 20,
        durationMinutes: 30,
        testName: `${chapterName} — ${chapterSubject} Chapter Test`,
        isChapterMode: true,
        chapterName: chapterName
      } : {
        examType: customExam,
        subjects: customSubjects,
        totalQuestions: customQuestions,
        durationMinutes: customTime,
        testName: `Custom Test (${customSubjects.join(', ')})`,
        isChapterMode: false
      };

      const res = await fetch('/api/student/create-custom-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      
      toast.success(`Test ready! ${data.totalQuestions} questions loaded.`);
      setShowChapterModal(false);
      setShowCustomModal(false);
      resetWizard(); // ✅ Reset wizard for next time
      await fetchDashboardData();
      router.push(`/exam/${data.testId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this unattempted test?')) return;
    try {
      const res = await fetch(`/api/student/delete-test/${testId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete test');
      toast.success('Test deleted successfully');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
        <p className="text-slate-500 mt-1">Track your progress and generate targeted tests.</p>
      </div>

      {/* ===== ASSIGNED TESTS NOTIFICATIONS ===== */}
      {assignedTests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" /> Action Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTests.filter(t => !t.isCompleted).map(test => (
              <div key={test.id} className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Assigned Test</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{test.exam_type}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{test.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {test.total_marks} marks</span>
                    {test.due_date && <span className="flex items-center gap-1 text-rose-600 font-semibold"><Calendar className="w-3 h-3" /> Due {new Date(test.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={() => router.push(`/exam/${test.id}`)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm shadow-indigo-200 transition-all shrink-0">
                  Start Test
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUICK STATS STRIP ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0 shadow-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Global Rank</p>
              <h3 className="text-3xl font-bold mt-1">N/A</h3>
            </div>
            <Award className="w-10 h-10 text-indigo-300 opacity-50" />
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Tests Taken</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{quickStats.totalTests}</h3>
            </div>
            <FileText className="w-10 h-10 text-blue-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Avg Score</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{quickStats.avgScorePercent}%</h3>
            </div>
            <BarChart3 className="w-10 h-10 text-emerald-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Overall Accuracy</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{quickStats.accuracyPercent}%</h3>
            </div>
            <Zap className="w-10 h-10 text-amber-100" />
          </CardContent>
        </Card>
      </div>

      {/* ===== TEST CATEGORIES (GENERATE NEW TESTS) ===== */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Generate New Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Full Mock */}
          <div onClick={() => setShowFullMockModal(true)} className="bg-white border-2 border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe className="w-24 h-24 text-blue-600" />
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Full Mock Test</h3>
            <p className="text-sm text-slate-500 mt-2">Auto-generated full syllabus exam perfectly mimicking real weightage.</p>
          </div>

          {/* Chapter Test */}
          <div onClick={() => { resetWizard(); setShowChapterModal(true); }} className="bg-white border-2 border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chapter Test</h3>
            <p className="text-sm text-slate-500 mt-2">Target a specific weak chapter. Get 20 questions just from that chapter.</p>
          </div>

          {/* Custom Test */}
          <div onClick={() => setShowCustomModal(true)} className="bg-white border-2 border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Settings2 className="w-24 h-24 text-purple-600" />
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Settings2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Customized Test</h3>
            <p className="text-sm text-slate-500 mt-2">Mix subjects (11th & 12th), set your own question count and time limit.</p>
          </div>
        </div>
      </div>

      {/* ===== RECENT TESTS ===== */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Your Recent Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-48 bg-slate-100 rounded-xl" />
              </Card>
            ))
          ) : tests.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <p className="text-slate-500">You haven't generated any tests yet.</p>
            </div>
          ) : (
            tests.map((test) => {
              const attempt = attempts[test.id];
              const isCompleted = !!attempt;
              return (
                <Card key={test.id} className={`border-slate-200 transition-all hover:shadow-md relative group ${isCompleted ? 'bg-slate-50 border-slate-300' : 'bg-white'}`}>
                  {/* Delete Button for UNATTEMPTED tests */}
                  {!isCompleted && (
                    <button 
                      onClick={() => handleDeleteTest(test.id)}
                      className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="mb-4 pr-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 mb-2">
                        {test.exam_type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2">{test.name}</h3>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-5">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{test.duration_minutes}m</span>
                      <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />{test.total_marks}m</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {isCompleted ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Score</p>
                            <p className="text-xl font-black text-emerald-600">{attempt.total_score}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/exam/${test.id}/results`)}>
                            View Results
                          </Button>
                        </div>
                      ) : (
                        <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/exam/${test.id}`)}>
                          <Play className="w-4 h-4 mr-2" /> Start Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      
      {/* 1. Full Mock Modal */}
      {showFullMockModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Select Exam Type</h2>
              <button onClick={() => setShowFullMockModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAM_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleAutoCreateFullMock(opt.id)} disabled={isGenerating}
                    className="flex flex-col text-left p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold mb-3 w-fit ${opt.badge}`}>{opt.id}</span>
                    <h3 className="text-lg font-bold text-slate-900">{opt.label} Full Mock</h3>
                    <p className="text-sm text-slate-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Chapter Test Modal — 4-Step Wizard */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {wizardStep > 1 && (
                  <button onClick={() => setWizardStep(s => s - 1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Chapter Test</h2>
                  <p className="text-xs text-slate-400">Step {wizardStep} of 4 — {['Pick Board', 'Pick Subject', 'Pick Standard', 'Pick Chapter'][wizardStep - 1]}</p>
                </div>
              </div>
              <button onClick={() => { setShowChapterModal(false); resetWizard(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="flex h-1">
              {[1,2,3,4].map(s => (
                <div key={s} className={`flex-1 transition-all duration-300 ${s <= wizardStep ? 'bg-emerald-500' : 'bg-slate-100'}`} />
              ))}
            </div>

            <div className="p-6">

              {/* STEP 1: Board */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-6">Which curriculum are your chapters from?</p>
                  <div className="grid grid-cols-1 gap-4">
                    {BOARDS.map(board => (
                      <button key={board.id} onClick={() => { setChapterBoard(board.id); setWizardStep(2); }}
                        className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${board.color} flex items-center justify-center text-2xl shadow-md`}>
                          {board.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700">{board.label}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">{board.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Subject */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-2">Select your subject:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(SUBJECTS_BY_BOARD[chapterBoard] || []).map(sub => (
                      <button key={sub.id} onClick={() => { setChapterSubject(sub.id); setWizardStep(3); }}
                        className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-2xl shadow-sm`}>
                          {sub.icon}
                        </div>
                        <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Standard */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 mb-2">Which class are the chapters from?</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['11th', '12th'].map(std => (
                      <button key={std} onClick={() => { setChapterStandard(std); setWizardStep(4); }}
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                        <span className="text-4xl font-black text-slate-300 group-hover:text-emerald-200 transition-colors">{std.replace('th', '')}</span>
                        <span className="text-base font-bold text-slate-700 group-hover:text-emerald-700">Class {std}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Chapter */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500">Select a chapter to practice:</p>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                      {chapterSubject} · {chapterStandard}
                    </span>
                  </div>
                  {chaptersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                  ) : availableChapters.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-500 font-medium">No chapters found</p>
                      <p className="text-xs text-slate-400 mt-1">Questions for this combination haven't been added yet.</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {availableChapters.map(ch => (
                        <button key={ch.name} onClick={() => setChapterName(ch.name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${chapterName === ch.name ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                          <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{ch.chapter_number}.</span>
                          <span className="text-sm font-semibold text-slate-800 flex-1">{ch.name}</span>
                          {chapterName === ch.name && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => handleCreateCustomTest(true)}
                    isLoading={isGenerating}
                    disabled={!chapterName || isGenerating}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base mt-2"
                  >
                    Start Chapter Test — {chapterName || 'Select a chapter'}
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 3. Customized Test Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Customized Test</h2>
              <button onClick={() => setShowCustomModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Exam Type</label>
                <select value={customExam} onChange={e => handleCustomExamChange(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none">
                  {EXAM_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subjects to Include <span className="font-normal text-slate-400">(11th & 12th combined)</span></label>
                <div className="flex flex-wrap gap-2">
                  {(SUBJECTS_BY_EXAM[customExam] || []).map(sub => (
                    <button key={sub} type="button"
                      onClick={() => setCustomSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${customSubjects.includes(sub) ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Total Questions</label>
                  <input type="number" value={customQuestions} onChange={e => setCustomQuestions(parseInt(e.target.value))} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Time Limit <span className="font-normal text-slate-400">(mins)</span></label>
                  <input type="number" value={customTime} onChange={e => setCustomTime(parseInt(e.target.value))} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-900" />
                </div>
              </div>
              
              <Button onClick={() => handleCreateCustomTest(false)} isLoading={isGenerating} disabled={customSubjects.length === 0} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-base mt-2">
                Generate Custom Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
