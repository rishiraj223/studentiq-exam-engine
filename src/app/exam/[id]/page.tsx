'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { ChevronLeft, ChevronRight, Flag, Clock, LogOut, CheckCircle } from 'lucide-react';

// ===== TYPES =====
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
  sections: Record<string, string[]>;
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'marked-review' | 'answered-marked';

const STATUS_COLORS: Record<QuestionStatus, string> = {
  'not-visited':    'bg-slate-300 text-slate-700',
  'not-answered':   'bg-red-500 text-white',
  'answered':       'bg-green-500 text-white',
  'marked-review':  'bg-purple-500 text-white',
  'answered-marked':'bg-purple-500 text-white border-2 border-green-400',
};

const STATUS_LABELS: { color: string; label: string }[] = [
  { color: 'bg-green-500',  label: 'Answered' },
  { color: 'bg-red-500',    label: 'Not Answered' },
  { color: 'bg-slate-300',  label: 'Not Visited' },
  { color: 'bg-purple-500', label: 'Marked for Review' },
];

// Format seconds to HH:MM:SS
function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// ===== MAIN COMPONENT =====
export default function ExamSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [testId, setTestId] = useState<string>('');
  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Exam state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Subject tabs
  const subjects = template ? Object.keys(template.sections) : [];

  // ===== RESOLVE PARAMS & LOAD =====
  useEffect(() => {
    params.then(p => setTestId(p.id));
  }, [params]);

  useEffect(() => {
    if (!testId) return;
    loadTest(testId);
  }, [testId]);

  const loadTest = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/exam/${id}`);
      if (!res.ok) {
        setError('Failed to load test. You might not have permission.');
        return;
      }
      
      const data = await res.json();
      const tmpl = data.template;
      const qs = data.questions;
      
      setTemplate(tmpl);
      setTimeLeft(tmpl.duration_minutes * 60);

      // Preserve order from sections (group by subject, then by ID array)
      const ordered: Question[] = [];
      Object.keys(tmpl.sections).forEach(subject => {
        tmpl.sections[subject].forEach((qid: string) => {
          const q = qs.find((q: Question) => q.id === qid);
          if (q) ordered.push(q);
        });
      });

      setQuestions(ordered);

      // Initialize statuses
      const initStatuses: Record<string, QuestionStatus> = {};
      ordered.forEach((q, i) => {
        initStatuses[q.id] = i === 0 ? 'not-answered' : 'not-visited';
      });
      setStatuses(initStatuses);
    } catch (err) {
      setError('An error occurred while loading the test.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TIMER =====
  useEffect(() => {
    if (isLoading || questions.length === 0 || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [isLoading, questions.length]);

  // ===== NAVIGATION =====
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const q = questions[index];
    setCurrentIndex(index);
    setStatuses(prev => ({
      ...prev,
      [q.id]: prev[q.id] === 'not-visited' ? 'not-answered' : prev[q.id],
    }));
    setIsPaletteOpen(false);
  };

  const handleOptionSelect = (optionIndex: number) => {
    const q = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [q.id]: optionIndex }));
    setStatuses(prev => ({
      ...prev,
      [q.id]: prev[q.id] === 'marked-review' || prev[q.id] === 'answered-marked'
        ? 'answered-marked'
        : 'answered',
    }));
  };

  const handleClearResponse = () => {
    const q = questions[currentIndex];
    setAnswers(prev => { const n = {...prev}; delete n[q.id]; return n; });
    setStatuses(prev => ({ ...prev, [q.id]: 'not-answered' }));
  };

  const handleMarkForReview = () => {
    const q = questions[currentIndex];
    const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== null;
    setStatuses(prev => ({
      ...prev,
      [q.id]: hasAnswer ? 'answered-marked' : 'marked-review',
    }));
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  };

  // ===== SUBMIT =====
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!autoSubmit && !showConfirmSubmit) { setShowConfirmSubmit(true); return; }
    clearInterval(timerRef.current!);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/student/exam/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, statuses, timeLeft }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit exam');
      }

      router.push(`/exam/${testId}/results`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
      alert('Failed to submit the exam. Please check your connection and try again.');
    }
  }, [showConfirmSubmit, answers, statuses, testId, router, timeLeft]);

  // ===== LOADING / ERROR =====
  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading Test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl font-bold text-red-400">{error}</p>
          <button onClick={() => router.push('/student/dashboard')} className="mt-4 text-sm text-slate-400 hover:text-white">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;
  const markedCount = Object.values(statuses).filter(s => s === 'marked-review' || s === 'answered-marked').length;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* ===== TOP BAR ===== */}
      <header className="bg-slate-900 text-white flex items-center justify-between px-4 py-2 flex-shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm">S</div>
          <div>
            <p className="text-sm font-bold leading-tight">{template?.name}</p>
            <p className="text-xs text-slate-400">{template?.exam_type}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-slate-700'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaletteOpen(o => !o)}
            className="md:hidden px-3 py-1.5 bg-slate-700 rounded-lg text-xs font-semibold"
          >
            Palette
          </button>
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Submit
          </button>
        </div>
      </header>

      {/* ===== SUBJECT TABS ===== */}
      <div className="bg-white border-b border-slate-200 flex gap-0 overflow-x-auto flex-shrink-0">
        {subjects.map(sub => {
          const subQs = questions.filter(q => q.subject === sub);
          const subAnswered = subQs.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
          return (
            <button
              key={sub}
              onClick={() => goToQuestion(questions.findIndex(q => q.subject === sub))}
              className="px-5 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap border-transparent text-slate-600 hover:text-blue-700 hover:border-blue-400"
            >
              {sub} <span className="text-xs text-slate-400 ml-1">({subAnswered}/{subQs.length})</span>
            </button>
          );
        })}
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== QUESTION PANEL ===== */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Question header */}
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-500">Q. {currentIndex + 1} of {questions.length}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentQ?.subject === 'Physics' ? 'bg-blue-100 text-blue-700' : currentQ?.subject === 'Chemistry' ? 'bg-green-100 text-green-700' : currentQ?.subject === 'Mathematics' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {currentQ?.subject}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Marks: <span className="font-bold text-green-600">+{currentQ?.marks}</span> | Negative: <span className="font-bold text-red-600">-{currentQ?.negative_marks}</span>
            </div>
          </div>

          {/* Scrollable question area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Question text */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="text-slate-900 text-base leading-relaxed">
                <MathRenderer text={currentQ?.question_text || ''} />
              </div>
              {currentQ?.image_url && (
                <img src={currentQ.image_url} alt="Question diagram" className="mt-4 max-h-48 object-contain rounded-lg border border-slate-200" />
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(currentQ?.options || []).map((opt, idx) => {
                const isSelected = answers[currentQ?.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className={`text-sm leading-relaxed mt-0.5 ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                      <MathRenderer text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0 gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleMarkForReview}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
              >
                <Flag className="w-4 h-4" /> Mark & Next
              </button>
              <button
                onClick={handleClearResponse}
                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => goToQuestion(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* ===== QUESTION PALETTE SIDEBAR ===== */}
        <aside className={`
          flex-shrink-0 w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden
          md:flex
          ${isPaletteOpen ? 'flex absolute right-0 top-0 bottom-0 z-10 shadow-2xl' : 'hidden'}
        `}>
          {/* Legend */}
          <div className="p-4 border-b border-slate-200 flex-shrink-0">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Question Palette</p>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_LABELS.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded ${s.color} flex-shrink-0`} />
                  <span className="text-xs text-slate-600">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-b border-slate-100 flex gap-4 text-center flex-shrink-0">
            <div className="flex-1">
              <p className="text-lg font-bold text-green-600">{answeredCount}</p>
              <p className="text-xs text-slate-500">Answered</p>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-red-500">{questions.length - answeredCount}</p>
              <p className="text-xs text-slate-500">Remaining</p>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-purple-600">{markedCount}</p>
              <p className="text-xs text-slate-500">Marked</p>
            </div>
          </div>

          {/* Number Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {subjects.map(sub => (
              <div key={sub} className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{sub}</p>
                <div className="flex flex-wrap gap-2">
                  {questions
                    .map((q, idx) => ({ q, idx }))
                    .filter(({ q }) => q.subject === sub)
                    .map(({ q, idx }) => (
                      <button
                        key={q.id}
                        onClick={() => goToQuestion(idx)}
                        className={`w-8 h-8 rounded text-xs font-bold transition-all hover:opacity-80 ${
                          idx === currentIndex ? 'ring-2 ring-offset-1 ring-blue-500 ' : ''
                        }${STATUS_COLORS[statuses[q.id] || 'not-visited']}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit button at bottom of palette */}
          <div className="p-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ===== CONFIRM SUBMIT MODAL ===== */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Submit Test?</h2>
            <p className="text-slate-500 text-sm mb-5">Once submitted, you cannot change your answers.</p>
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Answered</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-red-500">{questions.length - answeredCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Unanswered</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-purple-600">{markedCount}</p>
                <p className="text-xs text-slate-500 mt-0.5">Marked</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
