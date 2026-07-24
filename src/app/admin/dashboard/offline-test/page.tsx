'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Printer, FileText, Download, CheckSquare, ListChecks,
  AlertCircle, ChevronDown, History, Trash2, RefreshCw,
  Plus, X, BarChart3, Clock, BookOpen, Layers, ChevronRight,
  ZapIcon, PackageOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';
import {
  generateQuestionPaperPDF,
  generateAnswerKeyPDF,
  generateOMRPDF,
  PDFConfig
} from '@/features/offline-test/pdfUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'MHT-CET A', 'MHT-CET B'];
const STANDARDS = ['11th', '12th'];

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  'JEE Main':     ['Physics', 'Chemistry', 'Mathematics'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Mathematics'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
  'MHT-CET A':   ['Physics', 'Chemistry', 'Mathematics'],
  'MHT-CET B':   ['Physics', 'Chemistry', 'Biology'],
};

const DIFFICULTIES = [
  { id: 'all', label: 'All' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

type Tab = 'builder' | 'history';
type Mode = 'single' | 'multi';

interface SubjectSection {
  subject: string;
  chapters: string[];
  count: number; // requested number of questions
}

interface SavedTest {
  id: string;
  test_name: string;
  exam_type: string;
  subject: string | null;
  subjects: string[];
  standard: string;
  chapters: string[];
  num_questions: number;
  total_marks: number;
  duration_minutes: number | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

// ─── Chapter Selector sub-component ──────────────────────────────────────────

function ChapterSelector({
  chapters,
  selected,
  counts,
  onToggle,
  onSelectAll,
  onClear,
}: {
  chapters: string[];
  selected: string[];
  counts: Record<string, number>;
  onToggle: (ch: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (Bug #5 fix)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = selected.length === 0
    ? 'Select chapters...'
    : selected.length === 1
      ? (selected[0].length > 28 ? selected[0].slice(0, 28) + '…' : selected[0])
      : `${selected.length} chapters selected`;

  return (
    <div ref={ref} className="relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-slate-500 uppercase">Chapters</span>
        {chapters.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={onSelectAll} className="text-xs text-blue-600 font-semibold hover:underline">All</button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={onClear} className="text-xs text-slate-500 font-semibold hover:underline">Clear</button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-300 transition"
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && chapters.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-slate-200 rounded-xl bg-white shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-50 z-50">
          {chapters.map(ch => {
            const total = counts[ch] ?? 0;
            const isSelected = selected.includes(ch);
            return (
              <label
                key={ch}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(ch)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700 font-medium flex-1 leading-tight">{ch}</span>
                {/* Feature B: Available question count per chapter */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  total === 0 ? 'bg-red-100 text-red-500' :
                  total < 5  ? 'bg-amber-100 text-amber-600' :
                               'bg-emerald-100 text-emerald-700'
                }`}>
                  {total === 0 ? 'No Qs' : `${total} Q${total !== 1 ? 's' : ''}`}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {chapters.length === 0 && (
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> No chapters found for this selection.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OfflineTestGenerator() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [mode, setMode] = useState<Mode>('single'); // Feature C: multi-subject

  // ── Single-subject form state ──
  const [exam, setExam]               = useState('JEE Main');
  const [standard, setStandard]       = useState('11th');
  const [subject, setSubject]         = useState('Physics');
  const [difficulty, setDifficulty]   = useState('all');
  const [numQuestions, setNumQuestions] = useState('20');
  const [testName, setTestName]       = useState('');
  const [duration, setDuration]       = useState('60');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chaptersList, setChaptersList] = useState<string[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});

  // Feature D: Difficulty distribution
  const [useMix, setUseMix] = useState(false);
  const [diffMix, setDiffMix] = useState({ easy: 5, medium: 10, hard: 5 });

  // Feature E: Avoid repeated questions
  const [avoidRepeats, setAvoidRepeats] = useState(true);

  // ── Multi-subject form state (Feature C) ──
  const [sections, setSections] = useState<SubjectSection[]>([
    { subject: 'Physics', chapters: [], count: 10 },
  ]);

  // ── Result state ──
  const [isGenerating, setIsGenerating]                   = useState(false);
  const [generatedQuestions, setGeneratedQuestions]       = useState<any[]>([]);
  const [pdfConfig, setPdfConfig]                         = useState<PDFConfig | null>(null);
  const [isDownloading, setIsDownloading]                 = useState<string | null>(null);

  // ── History state (Feature A) ──
  const [history, setHistory]         = useState<SavedTest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const subjects = SUBJECTS_BY_EXAM[exam] || ['Physics', 'Chemistry', 'Mathematics'];

  // Auto-fix subject when exam changes
  useEffect(() => {
    if (!subjects.includes(subject)) setSubject(subjects[0]);
  }, [exam]);

  // Fetch chapters + question counts
  const fetchChapters = useCallback(async () => {
    setSelectedChapters([]);
    setChaptersList([]);
    setChapterCounts({});

    const [chaptersRes, countsRes] = await Promise.all([
      supabase
        .from('chapters')
        .select('name')
        .eq('exam_type', exam)
        .eq('subject', subject)
        .eq('standard', standard)
        .order('chapter_number'),
      fetch(`/api/admin/offline-test/availability?exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}&standard=${encodeURIComponent(standard)}&difficulty=${difficulty}`)
    ]);

    const names = (chaptersRes.data || []).map((c: any) => c.name);
    setChaptersList(names);

    if (countsRes.ok) {
      const data = await countsRes.json();
      setChapterCounts(data.counts || {});
    }
  }, [exam, subject, standard, difficulty, supabase]);

  useEffect(() => { fetchChapters(); }, [fetchChapters]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/offline-test/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, fetchHistory]);

  // Chapter toggle helpers
  const toggleChapter = (name: string) =>
    setSelectedChapters(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  // Calculate total from mix
  const mixTotal = diffMix.easy + diffMix.medium + diffMix.hard;

  // Calculate total questions in multi-subject mode
  const multiTotal = sections.reduce((s, sec) => s + (sec.count || 0), 0);

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'single' && selectedChapters.length === 0) {
      toast.error('Select at least one chapter');
      return;
    }
    if (mode === 'multi' && sections.some(s => s.chapters.length === 0)) {
      toast.error('Each subject section needs at least one chapter');
      return;
    }

    const count = mode === 'single' ? parseInt(numQuestions) : multiTotal;
    if (!count || count <= 0 || count > 200) {
      toast.error('Invalid question count (1–200)');
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);
    setPdfConfig(null);

    try {
      const finalName = testName.trim() || (mode === 'single' ? `${subject} — ${exam}` : `Mixed Paper — ${exam}`);

      // Feature E: Get recently used question IDs to avoid repeats
      let usedIds: string[] = [];
      if (avoidRepeats && history.length > 0) {
        // Collect IDs from last 5 saved tests
        const recent = history.slice(0, 5);
        usedIds = recent.flatMap((t: SavedTest) => []);
        // We'll pass coaching_id to the API, which will query history itself
      }

      const body = mode === 'single'
        ? {
            exam, subject, subjects: [subject], standard,
            chapters: selectedChapters,
            difficulty: useMix ? 'mix' : difficulty,
            difficultyMix: useMix ? diffMix : null,
            count,
            testName: finalName,
            duration: duration ? parseInt(duration) : null,
            avoidRepeats,
          }
        : {
            exam, standard,
            mode: 'multi',
            sections: sections.map(s => ({ subject: s.subject, chapters: s.chapters, count: s.count })),
            difficulty: 'all',
            testName: finalName,
            duration: duration ? parseInt(duration) : null,
            avoidRepeats,
          };

      const res = await fetch('/api/admin/offline-test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      if (!data.questions || data.questions.length === 0) {
        toast.error('No questions found. Try adjusting filters.');
        return;
      }

      if (data.questions.length < count) {
        toast.warning(`Only ${data.questions.length} questions available (requested ${count}).`);
      } else {
        toast.success(`✅ Test ready — ${data.questions.length} questions, ${data.totalMarks} marks`);
      }

      setGeneratedQuestions(data.questions);

      const config: PDFConfig = {
        coachingName:    data.coachingName,
        testName:        finalName,
        examName:        exam,
        subject:         mode === 'single' ? subject : 'Mixed',
        standard,
        date:            new Date().toLocaleDateString('en-IN'),
        duration:        data.duration?.toString() || null,
        totalMarks:      data.totalMarks,
        numberOfQuestions: data.questions.length,
      };
      setPdfConfig(config);

      // Feature A: Auto-save to history
      const saveBody = {
        test_name:        finalName,
        exam_type:        exam,
        subject:          mode === 'single' ? subject : null,
        subjects:         mode === 'single' ? [subject] : sections.map(s => s.subject),
        standard,
        chapters:         mode === 'single' ? selectedChapters : sections.flatMap(s => s.chapters),
        question_ids:     data.questions.map((q: any) => q.id),
        total_marks:      data.totalMarks,
        duration_minutes: data.duration || null,
        difficulty_mix:   useMix ? diffMix : null,
        num_questions:    data.questions.length,
      };
      await fetch('/api/admin/offline-test/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody),
      });
      // Silently refresh history in background
      fetchHistory();

    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async (type: 'paper' | 'key' | 'omr') => {
    if (!pdfConfig) return;
    setIsDownloading(type);
    try {
      if (type === 'paper') await generateQuestionPaperPDF(generatedQuestions, pdfConfig);
      else if (type === 'key') generateAnswerKeyPDF(generatedQuestions, pdfConfig);
      else generateOMRPDF(pdfConfig);
    } catch (err) {
      toast.error('PDF generation failed. Please try again.');
      console.error(err);
    } finally {
      setIsDownloading(null);
    }
  };

  // Feature G: Bulk download all 3 PDFs
  const handleDownloadAll = async () => {
    if (!pdfConfig) return;
    toast.info('Generating all 3 PDFs — please wait...');
    setIsDownloading('all');
    try {
      await generateQuestionPaperPDF(generatedQuestions, pdfConfig);
      await new Promise(r => setTimeout(r, 300));
      generateAnswerKeyPDF(generatedQuestions, pdfConfig);
      await new Promise(r => setTimeout(r, 300));
      generateOMRPDF(pdfConfig);
      toast.success('All 3 PDFs downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDFs');
    } finally {
      setIsDownloading(null);
    }
  };

  // Delete from history
  const handleDeleteHistory = async (id: string) => {
    await fetch('/api/admin/offline-test/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setHistory(prev => prev.filter(h => h.id !== id));
    toast.success('Deleted from history');
  };

  // Re-generate from history
  const handleRegenerate = async (saved: SavedTest) => {
    setActiveTab('builder');
    setExam(saved.exam_type);
    setStandard(saved.standard);
    setTestName(saved.test_name);
    if (saved.duration_minutes) setDuration(saved.duration_minutes.toString());
    if (saved.subject) {
      setMode('single');
      setSubject(saved.subject);
      // Chapters will be set after fetchChapters completes
      toast.info('Config loaded! Click Generate to recreate this test.');
    }
  };

  // ── Multi-subject section helpers ─────────────────────────────────────────
  const addSection = () => {
    const existing = sections.map(s => s.subject);
    const next = (SUBJECTS_BY_EXAM[exam] || []).find(s => !existing.includes(s));
    if (!next) return toast.error('All subjects already added');
    setSections(prev => [...prev, { subject: next, chapters: [], count: 10 }]);
  };

  const removeSection = (idx: number) =>
    setSections(prev => prev.filter((_, i) => i !== idx));

  const updateSection = (idx: number, patch: Partial<SubjectSection>) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Printer className="w-7 h-7 text-blue-600" /> Offline Test Generator
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Generate print-ready Question Papers, Answer Keys, and OMR sheets instantly.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'builder' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Printer className="w-4 h-4" /> Builder
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History className="w-4 h-4" /> History
            {history.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-black px-1.5 py-0.5 rounded-full">{history.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ══ HISTORY TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" /> Saved Test Papers
            </h2>
            <button onClick={fetchHistory} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-blue-500" /></div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <PackageOpen className="w-12 h-12 mb-3 text-slate-200" />
              <p className="font-medium text-slate-500">No tests generated yet</p>
              <p className="text-sm mt-1">Your generated tests appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {history.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.test_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.exam_type} · {item.standard} · {item.subject || 'Multi-Subject'} · {item.num_questions} Qs · {item.total_marks} marks
                      {item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium shrink-0">{timeAgo(item.created_at)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRegenerate(item)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600"
                      title="Load config into builder"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ BUILDER TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left Panel: Config Form ─────────────────────────────────── */}
          <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">Test Configuration</h2>

              {/* Test Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Test Name</label>
                <input
                  type="text"
                  placeholder={`e.g. Weekly Test #5 — ${subject}`}
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Exam + Standard */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exam</label>
                  <select value={exam} onChange={e => setExam(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                    {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standard</label>
                  <select value={standard} onChange={e => setStandard(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  min="5" max="300"
                />
              </div>

              {/* Mode toggle — Feature C */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Paper Type</label>
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('single')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'single' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 inline mr-1" />Single Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('multi')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'multi' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Layers className="w-3.5 h-3.5 inline mr-1" />Multi-Subject
                  </button>
                </div>
              </div>
            </div>

            {/* ── Single Subject Section ─────────────────── */}
            {mode === 'single' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Subject & Questions
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Chapter multi-selector with counts */}
                <ChapterSelector
                  chapters={chaptersList}
                  selected={selectedChapters}
                  counts={chapterCounts}
                  onToggle={toggleChapter}
                  onSelectAll={() => setSelectedChapters([...chaptersList])}
                  onClear={() => setSelectedChapters([])}
                />

                {/* Difficulty — Feature D */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Difficulty</label>
                    <button
                      type="button"
                      onClick={() => setUseMix(m => !m)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${useMix ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {useMix ? '✓ Custom Mix' : 'Use Custom Mix'}
                    </button>
                  </div>

                  {!useMix ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDifficulty(d.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${difficulty === d.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map(d => (
                        <div key={d} className="text-center">
                          <label className="text-xs font-bold text-slate-400 capitalize block mb-1">{d}</label>
                          <input
                            type="number"
                            min="0" max="100"
                            value={diffMix[d]}
                            onChange={e => setDiffMix(prev => ({ ...prev, [d]: parseInt(e.target.value) || 0 }))}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question count (only when not using mix) */}
                {!useMix && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">No. of Questions</label>
                    <input
                      type="number"
                      value={numQuestions}
                      onChange={e => setNumQuestions(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      min="1" max="200"
                    />
                  </div>
                )}

                {useMix && (
                  <div className="bg-blue-50 px-3 py-2 rounded-xl text-sm text-blue-700 font-bold">
                    Total: {mixTotal} questions
                  </div>
                )}
              </div>
            )}

            {/* ── Multi-Subject Sections — Feature C ─────── */}
            {mode === 'multi' && (
              <div className="space-y-3">
                {sections.map((sec, idx) => {
                  const secSubjects = (SUBJECTS_BY_EXAM[exam] || []).filter(s => !sections.some((o, oi) => oi !== idx && o.subject === s));
                  return (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-700">Section {idx + 1}</span>
                        {sections.length > 1 && (
                          <button type="button" onClick={() => removeSection(idx)} className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                          <select
                            value={sec.subject}
                            onChange={e => updateSection(idx, { subject: e.target.value, chapters: [] })}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            {(SUBJECTS_BY_EXAM[exam] || []).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Questions</label>
                          <input
                            type="number"
                            value={sec.count}
                            onChange={e => updateSection(idx, { count: parseInt(e.target.value) || 0 })}
                            min="1" max="100"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Chapters: {sec.chapters.length > 0 ? sec.chapters.slice(0, 2).join(', ') + (sec.chapters.length > 2 ? ` +${sec.chapters.length - 2}` : '') : 'None selected'}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addSection}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Subject Section
                </button>

                <div className="bg-blue-50 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Total Questions</span>
                  <span className="text-xl font-black text-blue-700">{multiTotal}</span>
                </div>
              </div>
            )}

            {/* Options row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Options</h3>
              {/* Feature E: Avoid repeats */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidRepeats}
                  onChange={e => setAvoidRepeats(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Avoid recently used questions</p>
                  <p className="text-xs text-slate-400">Skips questions used in your last 5 generated tests.</p>
                </div>
              </label>
            </div>

            {/* Generate button */}
            <button
              type="submit"
              disabled={isGenerating || (mode === 'single' && selectedChapters.length === 0)}
              className="w-full py-3.5 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isGenerating
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Fetching Questions...</>
                : <><ZapIcon className="w-4 h-4" /> Generate Test Package</>}
            </button>
          </form>

          {/* ── Right Panel: Results ────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {generatedQuestions.length === 0 ? (
              <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-16 text-center min-h-80">
                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-1">No Test Generated Yet</h3>
                <p className="max-w-xs text-sm text-slate-400">Configure your test on the left and click Generate.</p>
              </div>
            ) : (
              <>
                {/* Success Banner + Downloads */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                    <div>
                      <h3 className="text-lg font-black text-emerald-800">Test Package Ready!</h3>
                      <p className="text-emerald-700 text-sm mt-0.5">
                        {pdfConfig?.testName} · {generatedQuestions.length} questions · {pdfConfig?.totalMarks} marks
                        {pdfConfig?.duration ? ` · ${pdfConfig.duration} min` : ''}
                      </p>
                    </div>
                    {/* Feature G: Download all */}
                    <button
                      onClick={handleDownloadAll}
                      disabled={isDownloading === 'all'}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      {isDownloading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download All (3 PDFs)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'paper' as const, label: 'Question Paper', icon: FileText, color: 'emerald' },
                      { type: 'key'   as const, label: 'Answer Key',     icon: CheckSquare, color: 'blue' },
                      { type: 'omr'   as const, label: 'OMR Sheet',      icon: ListChecks, color: 'purple' },
                    ].map(({ type, label, icon: Icon, color }) => (
                      <button
                        key={type}
                        onClick={() => handleDownload(type)}
                        disabled={!!isDownloading}
                        className={`flex flex-col items-center p-4 bg-white border border-${color}-200 rounded-xl hover:shadow-md hover:border-${color}-400 transition-all group disabled:opacity-60`}
                      >
                        <div className={`w-10 h-10 bg-${color}-100 text-${color}-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                          {isDownloading === type ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-slate-700 text-xs text-center">{label}</span>
                        <span className={`flex items-center gap-1 text-xs text-${color}-600 mt-1 font-semibold`}>
                          <Download className="w-3 h-3" /> PDF
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Feature F: Browser Print option (avoids LaTeX issues) */}
                  <button
                    onClick={() => {
                      const html = generatedQuestions.map((q, i) => {
                        const labels = ['A', 'B', 'C', 'D'];
                        const opts = (q.options || []).map((o: string, oi: number) =>
                          `<div style="margin:4px 0 4px 24px"><b>(${labels[oi]})</b> ${o}</div>`
                        ).join('');
                        return `<div style="margin-bottom:18px;page-break-inside:avoid"><b>Q${i+1}.</b> ${q.question_text || ''}<br/>${opts}</div>`;
                      }).join('');
                      const win = window.open('', '_blank');
                      win?.document.write(`<html><head><title>${pdfConfig?.testName}</title><style>body{font-family:serif;font-size:13px;padding:32px}@media print{.no-print{display:none}}</style></head><body><h2 style="text-align:center">${pdfConfig?.coachingName}</h2><h3 style="text-align:center">${pdfConfig?.testName}</h3><hr/>${html}</body></html>`);
                      win?.document.close();
                      win?.print();
                    }}
                    className="mt-3 w-full py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print via Browser (better for equations)
                  </button>
                </div>

                {/* Question Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" /> Preview (First 5)
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">{generatedQuestions.length} total</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {generatedQuestions.slice(0, 5).map((q, idx) => {
                      const labels = ['A', 'B', 'C', 'D'];
                      const qText = q.question_text || 'No text.';
                      return (
                        <div key={q.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex gap-2 mb-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                            <p className="text-sm text-slate-700 font-medium leading-snug">{qText.length > 180 ? qText.slice(0, 180) + '…' : qText}</p>
                          </div>
                          <div className="ml-8 grid grid-cols-2 gap-1">
                            {(q.options || []).map((opt: string, oi: number) => (
                              <span key={oi} className={`text-xs px-2 py-1 rounded-lg font-medium ${oi === q.correct_answer_index ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                ({labels[oi]}) {(opt || '').length > 45 ? opt.slice(0, 45) + '…' : opt}
                              </span>
                            ))}
                          </div>
                          <div className="ml-8 mt-2 flex items-center gap-2 text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {q.difficulty || 'medium'}
                            </span>
                            <span className="text-slate-400 truncate">{q.chapter}</span>
                            {q.marks && <span className="text-slate-400 ml-auto shrink-0">+{q.marks}/−{q.negative_marks || 1}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {generatedQuestions.length > 5 && (
                      <p className="text-center text-sm text-slate-400 font-medium py-2">
                        + {generatedQuestions.length - 5} more questions in the PDF
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
