'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  Zap, ListChecks, ChevronRight, ChevronLeft,
  CheckSquare, Square, Search, Loader2, Copy, Link2
} from 'lucide-react';

const EXAMS = [
  { id: 'JEE Main',     label: 'JEE Main',     color: 'from-blue-500 to-blue-700',    desc: '90 Q · PCM · 180 min' },
  { id: 'JEE Advanced', label: 'JEE Advanced', color: 'from-indigo-500 to-indigo-700', desc: '60 Q · PCM · 180 min' },
  { id: 'NEET',         label: 'NEET',         color: 'from-emerald-500 to-emerald-700', desc: '180 Q · PCB · 200 min' },
  { id: 'MHT-CET A',   label: 'MHT-CET A',   color: 'from-orange-500 to-orange-700', desc: '150 Q · PCM · 180 min' },
  { id: 'MHT-CET B',   label: 'MHT-CET B',   color: 'from-rose-500 to-rose-700',     desc: '200 Q · PCB · 180 min' },
];

const EXAM_DURATION: Record<string, number> = {
  'JEE Main': 180, 'JEE Advanced': 180, 'NEET': 200, 'MHT-CET A': 180, 'MHT-CET B': 180,
};

interface Question {
  id: string;
  question_text: string;
  subject: string;
  chapter: string;
  year: number | null;
  difficulty: string;
  marks: number;
}

type Step = 'exam' | 'mode' | 'manual-select' | 'done';

export default function CreateTestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('exam');
  const [selectedExam, setSelectedExam] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual mode
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQ, setIsLoadingQ] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterSubject, setFilterSubject] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [search, setSearch] = useState('');

  // Done state
  const [testCode, setTestCode] = useState('');
  const [testId, setTestId] = useState('');

  // ===== LOAD QUESTIONS FOR MANUAL MODE =====
  const loadQuestions = useCallback(async (exam: string) => {
    setIsLoadingQ(true);
    const { data } = await supabase
      .from('questions')
      .select('id, question_text, subject, chapter, year, difficulty, marks')
      .eq('exam_type', exam)
      .order('subject')
      .order('year', { ascending: false });
    setQuestions(data || []);
    setIsLoadingQ(false);
  }, [supabase]);

  useEffect(() => {
    if (step === 'manual-select' && selectedExam) {
      loadQuestions(selectedExam);
    }
  }, [step, selectedExam, loadQuestions]);

  // ===== GENERATE 4-DIGIT CODE =====
  const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

  // ===== AUTO CREATE =====
  const handleAutoCreate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/student/create-auto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType: selectedExam }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Attach code to the test
      const code = generateCode();
      await supabase.from('mock_test_templates').update({ access_code: code }).eq('id', data.testId);

      setTestId(data.testId);
      setTestCode(code);
      setStep('done');
      toast.success('Test created successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setIsGenerating(false);
    }
  };

  // ===== MANUAL CREATE =====
  const handleManualCreate = async () => {
    if (selectedIds.size === 0) { toast.error('Select at least one question'); return; }
    setIsGenerating(true);
    try {
      const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
      const sections: Record<string, string[]> = {};
      let totalMarks = 0;

      selectedQuestions.forEach(q => {
        if (!sections[q.subject]) sections[q.subject] = [];
        sections[q.subject].push(q.id);
        totalMarks += (q.marks || 4);
      });

      const code = generateCode();

      const { data: newTest, error } = await supabase
        .from('mock_test_templates')
        .insert({
          name: `Manual ${selectedExam} Test — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          exam_type: selectedExam,
          duration_minutes: EXAM_DURATION[selectedExam] || 180,
          total_marks: totalMarks,
          sections: sections,
          access_code: code,
        })
        .select('id')
        .single();

      if (error) throw error;
      setTestId(newTest.id);
      setTestCode(code);
      setStep('done');
      toast.success('Test created!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // ===== FILTER QUESTIONS =====
  const subjects = [...new Set(questions.map(q => q.subject))];
  const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => (b as number) - (a as number));
  const filtered = questions.filter(q => {
    if (filterSubject && q.subject !== filterSubject) return false;
    if (filterYear && String(q.year) !== filterYear) return false;
    if (search && !q.question_text.toLowerCase().includes(search.toLowerCase()) && !q.chapter.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleQuestion = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${testCode}` : `/t/${testCode}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to Admin
          </button>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold tracking-widest uppercase">Super Admin</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* ===== STEP: SELECT EXAM ===== */}
        {step === 'exam' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create Test</h1>
              <p className="text-slate-500 mt-1">First, select which exam this test is for.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXAMS.map(exam => (
                <button key={exam.id} onClick={() => { setSelectedExam(exam.id); setStep('mode'); }}
                  className="text-left group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`bg-gradient-to-br ${exam.color} p-5`}>
                    <h3 className="text-xl font-bold text-white">{exam.label}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-500">{exam.desc}</p>
                    <div className="flex items-center text-blue-600 text-sm font-medium mt-2">Select <ChevronRight className="w-4 h-4 ml-1" /></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP: SELECT MODE ===== */}
        {step === 'mode' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('exam')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Choose Creation Mode</h1>
                <p className="text-slate-500 mt-1">Creating a <strong>{selectedExam}</strong> test.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {/* AUTO */}
              <button onClick={handleAutoCreate} disabled={isGenerating}
                className="group flex flex-col items-start gap-4 p-7 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                  {isGenerating ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <Zap className="w-7 h-7 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700">Auto Generate</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Instantly creates a test by randomly picking questions using official NTA weightage. No manual work needed.</p>
                </div>
                <span className="text-sm font-semibold text-blue-600 group-hover:underline">Generate Now →</span>
              </button>

              {/* MANUAL */}
              <button onClick={() => setStep('manual-select')} disabled={isGenerating}
                className="group flex flex-col items-start gap-4 p-7 rounded-2xl border-2 border-slate-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all text-left disabled:opacity-60">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                  <ListChecks className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-purple-700">Pick Questions Manually</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Browse all questions in the database filtered by subject and year. Hand-pick exactly what you want.</p>
                </div>
                <span className="text-sm font-semibold text-purple-600 group-hover:underline">Browse Questions →</span>
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP: MANUAL SELECT ===== */}
        {step === 'manual-select' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('mode')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">Select Questions — {selectedExam}</h1>
                <p className="text-slate-500 text-sm mt-0.5">{selectedIds.size} question{selectedIds.size !== 1 ? 's' : ''} selected</p>
              </div>
              <Button variant="primary" onClick={handleManualCreate} isLoading={isGenerating} disabled={selectedIds.size === 0}>
                Create Test ({selectedIds.size})
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search question text or chapter..."
                  className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Years</option>
                {years.map(y => <option key={y!} value={String(y)}>{y}</option>)}
              </select>
            </div>

            {isLoadingQ ? (
              <div className="text-center py-16 text-slate-500">Loading questions...</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {filtered.map(q => {
                  const isSelected = selectedIds.has(q.id);
                  return (
                    <button key={q.id} onClick={() => toggleQuestion(q.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className={`flex-shrink-0 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${q.subject === 'Physics' ? 'bg-blue-100 text-blue-700' : q.subject === 'Chemistry' ? 'bg-green-100 text-green-700' : q.subject === 'Mathematics' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{q.subject}</span>
                          <span className="text-xs text-slate-500">{q.chapter}</span>
                          {q.year && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{q.year}</span>}
                          <span className="text-xs text-slate-400">+{q.marks}M</span>
                        </div>
                        <div className="text-sm text-slate-700 line-clamp-2">
                          <MathRenderer text={q.question_text} />
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400">No questions match your filters.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP: DONE — SHOW LINK & CODE ===== */}
        {step === 'done' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Test Created!</h1>
              <p className="text-slate-500 mt-2">Share the link and code with your students.</p>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-8 space-y-7">
                {/* Code */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">4-Digit Access Code</p>
                  <div className="flex justify-center gap-3">
                    {testCode.split('').map((digit, i) => (
                      <div key={i} className="w-16 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Link */}
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Shareable Link</p>
                  <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="flex-1 text-sm font-mono text-slate-700 truncate">{shareUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors flex-shrink-0">
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  <strong>Instructions for students:</strong> Open the link above, enter your name and the 4-digit code, and the test will begin automatically.
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setStep('exam'); setSelectedExam(''); setSelectedIds(new Set()); }}>
                    Create Another Test
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => router.push(`/admin/results/${testId}`)}>
                    View Results Page →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
