'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, MinusCircle, Clock, Award, BarChart3, ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

type ReviewQuestion = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  imageUrl: string | null;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  marks: number;
  negativeMarks: number;
  subject: string;
  chapter: string;
  explanation: string | null;
  status: string;
};

type ReviewData = {
  test: { id: string; name: string; examType: string; totalMarks: number; durationMinutes: number };
  attempt: { totalScore: number; correctCount: number; incorrectCount: number; unansweredCount: number; timeTakenSeconds: number; accuracy: number; date: string };
  sections: Record<string, ReviewQuestion[]>;
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function QuestionCard({ q, globalIndex }: { q: ReviewQuestion; globalIndex: number }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = q.isCorrect === true
    ? 'border-emerald-300 bg-emerald-50/30'
    : q.isCorrect === false
    ? 'border-rose-300 bg-rose-50/30'
    : 'border-slate-200 bg-white';

  const Icon = q.isCorrect === true ? CheckCircle2 : q.isCorrect === false ? XCircle : MinusCircle;
  const iconColor = q.isCorrect === true ? 'text-emerald-500' : q.isCorrect === false ? 'text-rose-500' : 'text-slate-400';

  return (
    <div className={`border-2 ${borderColor} rounded-2xl overflow-hidden transition-all`}>
      {/* Question Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-black/[0.02] transition-colors"
      >
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Q{globalIndex}</span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{q.subject}</span>
            {q.chapter && <span className="text-xs text-slate-400">{q.chapter}</span>}
            {q.isCorrect === true && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">+{q.marks}</span>
            )}
            {q.isCorrect === false && (
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">−{q.negativeMarks}</span>
            )}
          </div>
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{q.questionText}</p>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-200 p-5 space-y-4">
          {/* Full question text */}
          <p className="text-sm text-slate-800 leading-relaxed font-medium">{q.questionText}</p>

          {/* Question image */}
          {q.imageUrl && (
            <img src={q.imageUrl} alt="Question" className="rounded-xl max-h-64 object-contain border border-slate-200" />
          )}

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isCorrectOpt = idx === q.correctIndex;
              const isSelectedOpt = idx === q.selectedIndex;
              const isWrongSelected = isSelectedOpt && !isCorrectOpt;

              let optClass = 'border-slate-200 bg-white text-slate-700';
              if (isCorrectOpt) optClass = 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold';
              if (isWrongSelected) optClass = 'border-rose-400 bg-rose-50 text-rose-800 font-semibold';

              return (
                <div key={idx} className={`flex items-start gap-3 border-2 ${optClass} rounded-xl px-4 py-3 text-sm`}>
                  <span className="font-bold shrink-0 mt-0.5">
                    {['A', 'B', 'C', 'D'][idx]}.
                  </span>
                  <span className="flex-1">{opt}</span>
                  <span className="shrink-0">
                    {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {isWrongSelected && <XCircle className="w-4 h-4 text-rose-500" />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Your answer summary */}
          <div className="text-xs font-medium text-slate-500 flex flex-wrap gap-3">
            <span>
              <strong>Correct Answer:</strong> {['A', 'B', 'C', 'D'][q.correctIndex]}
            </span>
            <span>
              <strong>Your Answer:</strong>{' '}
              {q.selectedIndex === null
                ? <span className="text-slate-400">Skipped</span>
                : <span className={q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{['A', 'B', 'C', 'D'][q.selectedIndex]}</span>
              }
            </span>
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">Explanation</p>
              <p className="text-sm text-blue-900 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [testId, setTestId] = useState('');
  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');

  useEffect(() => { params.then(p => setTestId(p.id)); }, [params]);

  useEffect(() => {
    if (!testId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/student/review/${testId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load review');
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [testId]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-xl font-bold text-slate-900 mb-2">Review Not Available</p>
        <p className="text-slate-500 text-sm mb-6">{error || 'You have not attempted this test yet.'}</p>
        <button onClick={() => router.push('/student/dashboard/history')}
          className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          Back to History
        </button>
      </div>
    </div>
  );

  const { test, attempt, sections } = data;

  // Flatten all questions across sections
  const allQuestions: (ReviewQuestion & { _sectionSubject: string })[] = [];
  let globalCounter = 1;
  const sectionSubjects = Object.keys(sections);
  for (const subj of sectionSubjects) {
    for (const q of sections[subj]) {
      allQuestions.push({ ...q, questionNumber: globalCounter++, _sectionSubject: subj });
    }
  }

  // Filter by subject + mode
  const visibleQuestions = allQuestions.filter(q => {
    const subjectMatch = activeSubject === 'all' || q._sectionSubject === activeSubject;
    const modeMatch =
      filterMode === 'all' ||
      (filterMode === 'correct' && q.isCorrect === true) ||
      (filterMode === 'wrong' && q.isCorrect === false) ||
      (filterMode === 'skipped' && q.selectedIndex === null);
    return subjectMatch && modeMatch;
  });

  const scorePercent = Math.round(Math.max(0, attempt.totalScore) / test.totalMarks * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-16">

        {/* Back button */}
        <button onClick={() => router.push('/student/dashboard/history')}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to My Tests
        </button>

        {/* Test Summary Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{test.examType}</span>
              <h1 className="text-xl font-bold mt-0.5">{test.name}</h1>
              <p className="text-slate-400 text-xs mt-1">
                {new Date(attempt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {/* Big score */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-4 shrink-0 ${
              scorePercent >= 80 ? 'border-emerald-400 text-emerald-400' :
              scorePercent >= 60 ? 'border-blue-400 text-blue-400' :
              scorePercent >= 40 ? 'border-amber-400 text-amber-400' : 'border-rose-400 text-rose-400'
            }`}>
              {scorePercent}%
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/10">
            <div className="text-center">
              <p className="text-slate-400 text-xs">Score</p>
              <p className="text-lg font-bold">{attempt.totalScore}/{test.totalMarks}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Correct</p>
              <p className="text-lg font-bold text-emerald-400">{attempt.correctCount}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Wrong</p>
              <p className="text-lg font-bold text-rose-400">{attempt.incorrectCount}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Time</p>
              <p className="text-lg font-bold">{formatTime(attempt.timeTakenSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Subject filter */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveSubject('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubject === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
              All Subjects
            </button>
            {sectionSubjects.map(subj => (
              <button key={subj} onClick={() => setActiveSubject(subj)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSubject === subj ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
                {subj}
              </button>
            ))}
          </div>

          {/* Mode filter */}
          <div className="flex gap-2 sm:ml-auto">
            {([
              { key: 'all', label: `All (${allQuestions.length})` },
              { key: 'correct', label: `✓ ${attempt.correctCount}` },
              { key: 'wrong', label: `✗ ${attempt.incorrectCount}` },
              { key: 'skipped', label: `— ${attempt.unansweredCount}` },
            ] as const).map(btn => (
              <button key={btn.key} onClick={() => setFilterMode(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === btn.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {visibleQuestions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <p className="text-slate-500 font-medium">No questions match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleQuestions.map(q => (
              <QuestionCard key={q.questionId} q={q} globalIndex={q.questionNumber} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
