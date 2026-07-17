'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Play, Clock, Award, FileText, Plus, X, Loader2, Zap, Globe, BookOpen, Settings2, BarChart3, Trash2 } from 'lucide-react';
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
  const [customQuestions, setCustomQuestions] = useState(30);
  const [customTime, setCustomTime] = useState(60);

  // Chapter Test Form State
  const [chapterExam, setChapterExam] = useState('JEE Main');
  const [chapterSubject, setChapterSubject] = useState('Physics');
  const [chapterStandard, setChapterStandard] = useState('11th');
  const [chapterName, setChapterName] = useState('');
  const [availableChapters, setAvailableChapters] = useState<{name: string, chapter_number: number}[]>([]);

  // Fetch Chapters Dynamically
  useEffect(() => {
    if (!showChapterModal) return;
    const fetchChapters = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('name, chapter_number')
        .eq('exam_type', chapterExam)
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
    };
    fetchChapters();
  }, [chapterExam, chapterSubject, chapterStandard, showChapterModal, supabase]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/dashboard-data');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      
      setTests(data.tests || []);
      if (data.quickStats) setQuickStats(data.quickStats);
      
      const attemptMap: Record<string, TestAttempt> = {};
      (data.attempts || []).forEach((att: TestAttempt) => { attemptMap[att.test_template_id] = att; });
      setAttempts(attemptMap);
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
        examType: chapterExam,
        subjects: [chapterSubject],
        totalQuestions: 20,
        durationMinutes: 30,
        testName: `${chapterName} Chapter Test`,
        isChapterMode: true,
        chapterName: chapterName
      } : {
        examType: customExam,
        subjects: customSubjects,
        totalQuestions: customQuestions,
        durationMinutes: customTime,
        testName: `Custom Test (${customSubjects.length} Subjects)`,
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
          <div onClick={() => setShowChapterModal(true)} className="bg-white border-2 border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden">
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

      {/* 2. Chapter Test Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Target a Chapter</h2>
              <button onClick={() => setShowChapterModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Exam</label>
                  <select value={chapterExam} onChange={e => setChapterExam(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
                    <option value="JEE Main">JEE Main</option>
                    <option value="NEET">NEET</option>
                    <option value="MHT-CET A">MHT-CET A</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Standard</label>
                  <div className="flex gap-2">
                    {['11th', '12th'].map(std => (
                      <button key={std} type="button" onClick={() => setChapterStandard(std)}
                        className={`flex-1 h-11 rounded-xl border-2 text-sm font-bold transition-all ${chapterStandard === std ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {std}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Subject</label>
                <select value={chapterSubject} onChange={e => setChapterSubject(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Chapter</label>
                <select value={chapterName} onChange={e => setChapterName(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-emerald-500 outline-none" disabled={availableChapters.length === 0}>
                  {availableChapters.length === 0 ? (
                    <option value="">No chapters found</option>
                  ) : (
                    availableChapters.map(ch => (
                      <option key={ch.name} value={ch.name}>{ch.chapter_number}. {ch.name}</option>
                    ))
                  )}
                </select>
                <p className="text-xs text-slate-500">You'll receive 20 random questions from this chapter.</p>
              </div>
              <Button onClick={() => handleCreateCustomTest(true)} isLoading={isGenerating} disabled={!chapterName} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base">
                Start Chapter Test
              </Button>
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
                <select value={customExam} onChange={e => setCustomExam(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-4 focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="JEE Main">JEE Main</option>
                  <option value="NEET">NEET</option>
                  <option value="MHT-CET A">MHT-CET A</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Subjects to Include <span className="font-normal text-slate-400">(11th & 12th combined)</span></label>
                <div className="flex flex-wrap gap-2">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => (
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
