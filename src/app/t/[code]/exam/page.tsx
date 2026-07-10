'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { ChevronLeft, ChevronRight, Flag, Clock, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  marks: number;
  negative_marks: number;
  subject: string;
  image_url?: string;
}

interface TestTemplate {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  question_ids: string[];
  access_code: string;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-review' | 'answered-marked';

const STATUS_COLORS: Record<QuestionStatus, string> = {
  'not-visited':    'bg-slate-300 text-slate-700',
  'not-answered':   'bg-red-500 text-white',
  'answered':       'bg-green-500 text-white',
  'marked-review':  'bg-purple-500 text-white',
  'answered-marked':'bg-purple-500 text-white ring-2 ring-green-400',
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function GuestExamPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);

  const [code, setCode] = useState('');
  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [autoSubmitReason, setAutoSubmitReason] = useState('');

  const subjects = [...new Set(questions.map(q => q.subject))];

  useEffect(() => {
    params.then(p => {
      setCode(p.code);
      const name = sessionStorage.getItem(`exam_student_${p.code}`) || '';
      // We'll get name after template loads using template.id but code-based session is fine too
      const nameKey = Object.keys(sessionStorage).find(k => k.startsWith('exam_student_'));
      if (nameKey) setStudentName(sessionStorage.getItem(nameKey) || '');
      loadTest(p.code);
    });
  }, [params]);

  const loadTest = async (code: string) => {
    setIsLoading(true);
    try {
      const { data: tmpl } = await supabase
        .from('mock_test_templates')
        .select('*')
        .eq('access_code', code)
        .single();

      if (!tmpl) { setError('Test not found. Please go back and try again.'); return; }
      setTemplate(tmpl);
      setTimeLeft(tmpl.duration_minutes * 60);

      // Get student name from sessionStorage
      const storedName = sessionStorage.getItem(`exam_student_${tmpl.id}`);
      if (storedName) setStudentName(storedName);

      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_text, options, marks, negative_marks, subject, image_url')
        .in('id', tmpl.question_ids);

      const ordered = tmpl.question_ids
        .map((qid: string) => qs?.find((q: Question) => q.id === qid))
        .filter(Boolean) as Question[];

      setQuestions(ordered);

      const initStatuses: Record<string, QuestionStatus> = {};
      ordered.forEach((q, i) => { initStatuses[q.id] = i === 0 ? 'not-answered' : 'not-visited'; });
      setStatuses(initStatuses);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== SUBMIT =====
  const handleSubmit = useCallback(async (auto = false, reason = '') => {
    if (hasSubmittedRef.current) return;
    if (!auto && !showConfirm) { setShowConfirm(true); return; }
    hasSubmittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (reason) setAutoSubmitReason(reason);
    setIsSubmitting(true);

    try {
      const { data: correctData } = await supabase
        .from('questions')
        .select('id, correct_answer_index, marks, negative_marks, subject')
        .in('id', questions.map(q => q.id));

      const correctMap: Record<string, { correct_answer_index: number; marks: number; negative_marks: number; subject: string }> = {};
      correctData?.forEach(q => { correctMap[q.id] = q; });

      let totalScore = 0;
      const subjectScores: Record<string, number> = {};
      let correctCount = 0, incorrectCount = 0, unansweredCount = 0;

      const responses = questions.map(q => {
        const selected = answers[q.id];
        const correct = correctMap[q.id];
        let is_correct: boolean | null = null;

        if (selected === undefined || selected === null) {
          unansweredCount++;
        } else if (correct && selected === correct.correct_answer_index) {
          is_correct = true;
          correctCount++;
          const gain = correct.marks || 4;
          totalScore += gain;
          subjectScores[correct.subject] = (subjectScores[correct.subject] || 0) + gain;
        } else {
          is_correct = false;
          incorrectCount++;
          const loss = correct?.negative_marks || 1;
          totalScore -= loss;
          subjectScores[correct?.subject || q.subject] = (subjectScores[correct?.subject || q.subject] || 0) - loss;
        }

        return { question_id: q.id, selected_option: selected ?? null, is_correct, status: statuses[q.id] || 'not-visited' };
      });

      const name = studentName || sessionStorage.getItem(Object.keys(sessionStorage).find(k => k.startsWith('exam_student_')) || '') || 'Anonymous';

      const { data: session } = await supabase.from('test_sessions').insert({
        test_template_id: template!.id,
        student_name: name,
        responses,
        total_score: totalScore,
        subject_scores: subjectScores,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        time_taken_seconds: (template!.duration_minutes * 60) - timeLeft,
      }).select('id').single();

      // Clear session storage
      sessionStorage.removeItem(`exam_student_${template!.id}`);

      router.push(`/t/${code}/submitted?session=${session?.id || ''}&score=${totalScore}`);
    } catch {
      setIsSubmitting(false);
      hasSubmittedRef.current = false;
    }
  }, [answers, questions, statuses, showConfirm, template, timeLeft, studentName, code, supabase, router]);

  // ===== TIMER =====
  useEffect(() => {
    if (isLoading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true, 'Time is up!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isLoading, questions.length, handleSubmit]);

  // ===== ANTI-CHEAT: Page Visibility =====
  useEffect(() => {
    if (questions.length === 0) return;
    const handleVisibility = () => {
      if (document.hidden && !hasSubmittedRef.current) {
        handleSubmit(true, 'You switched tabs — test was auto-submitted.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [questions.length, handleSubmit]);

  // ===== NAVIGATION =====
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const q = questions[index];
    setCurrentIndex(index);
    setStatuses(prev => ({ ...prev, [q.id]: prev[q.id] === 'not-visited' ? 'not-answered' : prev[q.id] }));
    setIsPaletteOpen(false);
  };

  const handleOptionSelect = (optIdx: number) => {
    const q = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
    setStatuses(prev => ({
      ...prev,
      [q.id]: prev[q.id] === 'marked-review' || prev[q.id] === 'answered-marked' ? 'answered-marked' : 'answered',
    }));
  };

  const handleClearResponse = () => {
    const q = questions[currentIndex];
    setAnswers(prev => { const n = { ...prev }; delete n[q.id]; return n; });
    setStatuses(prev => ({ ...prev, [q.id]: 'not-answered' }));
  };

  const handleMarkForReview = () => {
    const q = questions[currentIndex];
    const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== null;
    setStatuses(prev => ({ ...prev, [q.id]: hasAnswer ? 'answered-marked' : 'marked-review' }));
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  };

  if (isLoading) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white"><div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" /><p>Loading Test...</p></div>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white max-w-sm"><p className="text-xl font-bold text-red-400 mb-4">{error}</p><button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">← Go Back</button></div>
    </div>
  );

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;
  const markedCount = Object.values(statuses).filter(s => s === 'marked-review' || s === 'answered-marked').length;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* TOP BAR */}
      <header className="bg-slate-900 text-white flex items-center justify-between px-4 py-2 flex-shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm">S</div>
          <div>
            <p className="text-sm font-bold leading-tight">{template?.name}</p>
            <p className="text-xs text-slate-400">{studentName && `👤 ${studentName} · `}{template?.exam_type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-slate-700'}`}>
          <Clock className="w-5 h-5" />{formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPaletteOpen(o => !o)} className="md:hidden px-3 py-1.5 bg-slate-700 rounded-lg text-xs font-semibold">Palette</button>
          <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors">
            Submit
          </button>
        </div>
      </header>

      {/* SUBJECT TABS */}
      <div className="bg-white border-b border-slate-200 flex gap-0 overflow-x-auto flex-shrink-0">
        {subjects.map(sub => {
          const subQs = questions.filter(q => q.subject === sub);
          const subAns = subQs.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
          return (
            <button key={sub} onClick={() => goToQuestion(questions.findIndex(q => q.subject === sub))}
              className="px-5 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap border-transparent text-slate-600 hover:text-blue-700 hover:border-blue-400">
              {sub} <span className="text-xs text-slate-400 ml-1">({subAns}/{subQs.length})</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* QUESTION PANEL */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500">Q. {currentIndex + 1} of {questions.length}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentQ?.subject === 'Physics' ? 'bg-blue-100 text-blue-700' : currentQ?.subject === 'Chemistry' ? 'bg-green-100 text-green-700' : currentQ?.subject === 'Mathematics' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{currentQ?.subject}</span>
            </div>
            <div className="text-xs text-slate-500">Marks: <span className="font-bold text-green-600">+{currentQ?.marks}</span> | Neg: <span className="font-bold text-red-600">-{currentQ?.negative_marks}</span></div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="text-slate-900 text-base leading-relaxed"><MathRenderer text={currentQ?.question_text || ''} /></div>
              {currentQ?.image_url && <img src={currentQ.image_url} alt="diagram" className="mt-4 max-h-48 object-contain rounded-lg border border-slate-200" />}
            </div>

            <div className="space-y-3">
              {(currentQ?.options || []).map((opt, idx) => {
                const isSelected = answers[currentQ?.id] === idx;
                return (
                  <button key={idx} onClick={() => handleOptionSelect(idx)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm leading-relaxed mt-0.5 ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}><MathRenderer text={opt} /></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex gap-2">
              <button onClick={handleMarkForReview} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">
                <Flag className="w-4 h-4" /> Mark & Next
              </button>
              <button onClick={handleClearResponse} className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">Clear</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => goToQuestion(currentIndex - 1)} disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button onClick={() => goToQuestion(currentIndex + 1)} disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* PALETTE */}
        <aside className={`flex-shrink-0 w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden md:flex ${isPaletteOpen ? 'flex absolute right-0 top-0 bottom-0 z-10 shadow-2xl' : 'hidden'}`}>
          <div className="p-4 border-b border-slate-200 flex-shrink-0">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Question Palette</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[['bg-green-500', 'Answered'], ['bg-red-500', 'Not Answered'], ['bg-slate-300', 'Not Visited'], ['bg-purple-500', 'Marked']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5"><div className={`w-4 h-4 rounded ${color}`} /><span className="text-slate-600">{label}</span></div>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 flex gap-3 text-center flex-shrink-0">
            <div className="flex-1"><p className="text-lg font-bold text-green-600">{answeredCount}</p><p className="text-xs text-slate-500">Done</p></div>
            <div className="flex-1"><p className="text-lg font-bold text-red-500">{questions.length - answeredCount}</p><p className="text-xs text-slate-500">Left</p></div>
            <div className="flex-1"><p className="text-lg font-bold text-purple-600">{markedCount}</p><p className="text-xs text-slate-500">Marked</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {subjects.map(sub => (
              <div key={sub} className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{sub}</p>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, idx) => q.subject === sub && (
                    <button key={q.id} onClick={() => goToQuestion(idx)}
                      className={`w-8 h-8 rounded text-xs font-bold transition-all hover:opacity-80 ${idx === currentIndex ? 'ring-2 ring-offset-1 ring-blue-500 ' : ''}${STATUS_COLORS[statuses[q.id] || 'not-visited']}`}>
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-200 flex-shrink-0">
            <button onClick={() => setShowConfirm(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* CONFIRM SUBMIT MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Submit Test?</h2>
            <p className="text-slate-500 text-sm mb-5">Once submitted, you cannot change your answers.</p>
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="bg-green-50 rounded-xl p-3"><p className="text-2xl font-bold text-green-600">{answeredCount}</p><p className="text-xs text-slate-500 mt-0.5">Answered</p></div>
              <div className="bg-red-50 rounded-xl p-3"><p className="text-2xl font-bold text-red-500">{questions.length - answeredCount}</p><p className="text-xs text-slate-500 mt-0.5">Unanswered</p></div>
              <div className="bg-purple-50 rounded-xl p-3"><p className="text-2xl font-bold text-purple-600">{markedCount}</p><p className="text-xs text-slate-500 mt-0.5">Marked</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50">Go Back</button>
              <button onClick={() => handleSubmit(false)} disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-SUBMIT OVERLAY */}
      {autoSubmitReason && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Test Auto-Submitted</h2>
            <p className="text-slate-500 text-sm">{autoSubmitReason}</p>
            <p className="text-slate-400 text-xs mt-3">Calculating your results...</p>
          </div>
        </div>
      )}
    </div>
  );
}
