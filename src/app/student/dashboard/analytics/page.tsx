'use client';

import React, { useEffect, useState } from 'react';
import {
  Loader2, TrendingUp, TrendingDown, Target, BookOpen,
  Clock, BarChart3, Users, ChevronDown, AlertCircle,
  Zap, CheckCircle2, XCircle, MinusCircle, Trophy, Flame
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
type SubjectStat = { subject: string; correct: number; incorrect: number; unanswered: number; total: number; accuracy: number };
type ChapterStat = { subject: string; chapter: string; correct: number; incorrect: number; unanswered: number; total: number; accuracy: number };
type TimelineEntry = { testId: string; testName: string; date: string; score: number; maxScore: number; raw: number; rawMax: number; missed: boolean; examType: string };
type BatchEntry = { testId: string; testName: string; date: string; studentScore: number; batchAvg: number; scoreDiff: number };
type TimeSubject = { subject: string; mcqAvgSec: number; numericAvgSec: number; totalTimeSec: number; mcqCount: number; numericCount: number };
type TimeEntry = { testId: string; testName: string; date: string; totalTime: number; subjects: TimeSubject[] };

// ─── Color helpers ────────────────────────────────────────
const SUBJECT_CFG: Record<string, { bg: string; ring: string; text: string; bar: string; accent: string }> = {
  Physics:     { bg: 'bg-amber-50',   ring: 'ring-amber-300',   text: 'text-amber-700',   bar: 'bg-amber-500',   accent: '#f59e0b' },
  Chemistry:   { bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-700', bar: 'bg-emerald-500', accent: '#10b981' },
  Mathematics: { bg: 'bg-blue-50',    ring: 'ring-blue-300',    text: 'text-blue-700',    bar: 'bg-blue-500',    accent: '#3b82f6' },
  Biology:     { bg: 'bg-teal-50',    ring: 'ring-teal-300',    text: 'text-teal-700',    bar: 'bg-teal-500',    accent: '#14b8a6' },
};
const subjectCfg = (s: string) => SUBJECT_CFG[s] || SUBJECT_CFG['Physics'];

function scoreColor(pct: number, missed = false): string {
  if (missed) return 'bg-slate-300';
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  if (pct >= 30) return 'bg-orange-500';
  return 'bg-rose-500';
}
function scoreTextColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-700';
  if (pct >= 50) return 'text-amber-600';
  if (pct >= 30) return 'text-orange-600';
  return 'text-rose-600';
}
function scoreBgBorder(pct: number, missed = false): string {
  if (missed) return 'bg-slate-50 border-slate-200';
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  if (pct >= 30) return 'bg-orange-50 border-orange-200';
  return 'bg-rose-50 border-rose-200';
}
function formatSecs(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

// ─── Select Dropdown ──────────────────────────────────────
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────
function SectionHeader({ icon: Icon, color, title, sub }: { icon: any; color: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 leading-tight">{title}</h2>
        <p className="text-xs font-medium text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function AnalyticsPage() {
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [chapterStats, setChapterStats] = useState<ChapterStat[]>([]);
  const [scoreTimeline, setScoreTimeline] = useState<TimelineEntry[]>([]);
  const [batchComparison, setBatchComparison] = useState<BatchEntry[]>([]);
  const [timeAnalysis, setTimeAnalysis] = useState<TimeEntry[]>([]);
  const [overallTimeAnalysis, setOverallTimeAnalysis] = useState<TimeSubject[]>([]);
  const [overallBatch, setOverallBatch] = useState<{ studentAvg: number; batchAvg: number; totalTests: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [heatmapSubject, setHeatmapSubject] = useState('all');
  const [batchTestId, setBatchTestId] = useState('overall');
  const [timeTestId, setTimeTestId] = useState('overall');

  useEffect(() => {
    fetch('/api/student/analytics')
      .then(r => r.json())
      .then(data => {
        setSubjectStats(data.subjectStats || []);
        setChapterStats(data.chapterStats || []);
        setScoreTimeline(data.scoreTimeline || []);
        setBatchComparison(data.batchComparison || []);
        setTimeAnalysis(data.timeAnalysis || []);
        setOverallTimeAnalysis(data.overallTimeAnalysis || []);
        setOverallBatch(data.overallBatchComparison || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Derived
  const filteredChapters = heatmapSubject === 'all' ? chapterStats : chapterStats.filter(c => c.subject === heatmapSubject);
  const batchTestOptions = [{ value: 'overall', label: 'Overall (All Tests)' }, ...batchComparison.map(b => ({ value: b.testId, label: b.testName }))];
  const timeTestOptions = [{ value: 'overall', label: 'Overall (All Tests)' }, ...timeAnalysis.map(t => ({ value: t.testId, label: t.testName }))];
  const selectedBatchData = batchTestId === 'overall' ? null : batchComparison.find(b => b.testId === batchTestId) || null;
  const selectedTimeData = timeTestId === 'overall' ? null : timeAnalysis.find(t => t.testId === timeTestId) || null;
  const timeSubjects = selectedTimeData ? selectedTimeData.subjects : overallTimeAnalysis;

  const strongest = subjectStats[0];
  const weakest = subjectStats[subjectStats.length - 1];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-white animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-slate-500 text-sm font-medium">Loading your analytics...</p>
      </div>
    );
  }

  if (subjectStats.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Your performance breakdown across all tests.</p>
        </div>
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-slate-700 font-bold text-lg">No analytics yet</p>
          <p className="text-sm text-slate-400 mt-1">Complete at least one test to see your performance data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-16">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Student Panel</p>
          <h1 className="text-4xl font-black text-slate-900 leading-tight">Performance Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">Deep dive into your subject, chapter, time, and batch performance.</p>
        </div>
        <div className="flex items-center gap-2">
          {strongest && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
              <Trophy className="w-3.5 h-3.5" />
              Best: {strongest.subject} {strongest.accuracy}%
            </div>
          )}
          {weakest && weakest.subject !== strongest?.subject && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">
              <Flame className="w-3.5 h-3.5" />
              Focus: {weakest.subject} {weakest.accuracy}%
            </div>
          )}
        </div>
      </div>

      {/* ── 1. Subject Breakdown ────────────────────────── */}
      <section>
        <SectionHeader icon={BarChart3} color="bg-gradient-to-br from-blue-500 to-indigo-600" title="Subject Breakdown" sub="Overall accuracy and question stats per subject" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map(stat => {
            const cfg = subjectCfg(stat.subject);
            return (
              <div key={stat.subject} className={`${cfg.bg} ring-1 ${cfg.ring} rounded-2xl p-5 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: cfg.accent, transform: 'translate(30%, -30%)' }} />
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-black ${cfg.text}`}>{stat.subject}</p>
                  <span className={`text-3xl font-black ${cfg.text}`}>{stat.accuracy}%</span>
                </div>
                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden mb-3">
                  <div className={`h-full ${cfg.bar} rounded-full transition-all duration-700`} style={{ width: `${stat.accuracy}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />{stat.correct}</span>
                  <span className="flex items-center gap-1 text-rose-500"><XCircle className="w-3 h-3" />{stat.incorrect}</span>
                  <span className="flex items-center gap-1 text-slate-400"><MinusCircle className="w-3 h-3" />{stat.unanswered}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. Chapter Heatmap ──────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <SectionHeader icon={BookOpen} color="bg-gradient-to-br from-violet-500 to-purple-600" title="Chapter Heatmap" sub="Chapter-wise accuracy — click subject filter to drill down" />
          <Select
            value={heatmapSubject}
            onChange={setHeatmapSubject}
            options={[
              { value: 'all', label: 'All Subjects' },
              ...subjectStats.map(s => ({ value: s.subject, label: s.subject }))
            ]}
          />
        </div>

        {filteredChapters.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">No chapter data for this subject yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChapters.map(ch => (
              <div key={`${ch.subject}-${ch.chapter}`} className={`border rounded-xl p-4 ${scoreBgBorder(ch.accuracy)}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${subjectCfg(ch.subject).text}`}>{ch.subject}</p>
                    <p className="text-sm font-bold text-slate-800 leading-snug mt-0.5">{ch.chapter}</p>
                  </div>
                  <span className={`text-xl font-black shrink-0 ${scoreTextColor(ch.accuracy)}`}>{ch.accuracy}%</span>
                </div>
                <div className="h-1.5 bg-white/70 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${scoreColor(ch.accuracy)} rounded-full transition-all`} style={{ width: `${ch.accuracy}%` }} />
                </div>
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="text-emerald-600">✓ {ch.correct}</span>
                  <span className="text-rose-500">✗ {ch.incorrect}</span>
                  <span className="text-slate-400">— {ch.unanswered} skipped</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {filteredChapters.length > 0 && (
          <div className="flex items-center gap-4 mt-5 text-xs text-slate-500 flex-wrap pt-4 border-t border-slate-100">
            <span className="font-bold text-slate-700">Accuracy:</span>
            {[
              { label: '≥75% Strong', color: 'bg-emerald-500' },
              { label: '50–74% Good', color: 'bg-amber-400' },
              { label: '30–49% Avg', color: 'bg-orange-500' },
              { label: '<30% Weak', color: 'bg-rose-500' }
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 font-semibold">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Growth Chart ─────────────────────────────── */}
      {scoreTimeline.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader icon={TrendingUp} color="bg-gradient-to-br from-emerald-500 to-teal-600" title="Growth Chart" sub="Score progression across all tests — red = missed assigned test" />

          <div className="relative overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Y axis labels */}
              <div className="flex">
                <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-2 pb-8 h-64">
                  {[100, 75, 50, 25, 0].map(v => <span key={v}>{v}%</span>)}
                </div>

                {/* Chart area */}
                <div className="flex-1 relative h-64 pb-8">
                  {/* Grid lines */}
                  <div className="absolute inset-0 pb-8 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="w-full border-t border-slate-100" />
                    ))}
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-0 pb-8 flex items-end gap-1.5 px-1">
                    {scoreTimeline.map((item, idx) => {
                      const barColor = item.missed
                        ? 'bg-slate-300 border-slate-400'
                        : item.score >= 75
                          ? 'bg-emerald-500 border-emerald-600'
                          : item.score >= 50
                            ? 'bg-amber-400 border-amber-500'
                            : item.score >= 30
                              ? 'bg-orange-500 border-orange-600'
                              : 'bg-rose-500 border-rose-600';
                      const heightPct = item.missed ? 8 : Math.max(3, item.score);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap shadow-lg">
                              <p>{item.testName}</p>
                              {item.missed ? (
                                <p className="text-rose-300">❌ Missed</p>
                              ) : (
                                <p>{item.score}% · {item.date}</p>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-full border-t-2 rounded-t-md transition-all duration-500 ${barColor}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex px-1 h-8">
                    {scoreTimeline.map((item, idx) => (
                      <div key={idx} className="flex-1 flex items-end justify-center">
                        <span className="text-[9px] font-semibold text-slate-400 -rotate-45 origin-top-left whitespace-nowrap" style={{ marginLeft: '-50%' }}>
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap text-xs font-semibold border-t border-slate-100 pt-4">
            {[
              { color: 'bg-emerald-500', label: '≥75% Strong' },
              { color: 'bg-amber-400',   label: '50–74% Good' },
              { color: 'bg-orange-500',  label: '30–49% Avg' },
              { color: 'bg-rose-500',    label: '<30% Weak' },
              { color: 'bg-slate-300',   label: 'Missed Test' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-slate-600">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Batch Comparison ─────────────────────────── */}
      {(batchComparison.length > 0 || overallBatch) && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <SectionHeader icon={Users} color="bg-gradient-to-br from-indigo-500 to-blue-600" title="Batch Comparison" sub="How you perform relative to your batch average" />
            <Select
              value={batchTestId}
              onChange={setBatchTestId}
              options={batchTestOptions}
            />
          </div>

          {/* Overall summary card */}
          {batchTestId === 'overall' && overallBatch && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Your Average</p>
                <p className="text-4xl font-black">{overallBatch.studentAvg}%</p>
                <p className="text-sm text-blue-200 mt-1">Across {overallBatch.totalTests} tests</p>
              </div>
              <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl p-5 text-white">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Batch Average</p>
                <p className="text-4xl font-black">{overallBatch.batchAvg}%</p>
                <p className="text-sm text-slate-300 mt-1">Your batch peers</p>
              </div>
              <div className={`rounded-2xl p-5 text-white ${overallBatch.studentAvg >= overallBatch.batchAvg ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'}`}>
                <p className="text-xs font-bold opacity-75 uppercase tracking-wider mb-1">Difference</p>
                <p className="text-4xl font-black">
                  {overallBatch.studentAvg >= overallBatch.batchAvg ? '+' : ''}{overallBatch.studentAvg - overallBatch.batchAvg}%
                </p>
                <p className="text-sm opacity-75 mt-1">{overallBatch.studentAvg >= overallBatch.batchAvg ? '🏆 Above batch' : '📈 Keep pushing'}</p>
              </div>
            </div>
          )}

          {/* Per-test detail */}
          {batchTestId === 'overall' ? (
            <div className="space-y-3">
              {batchComparison.map((comp, idx) => {
                const diff = comp.studentScore - comp.batchAvg;
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{comp.testName}</p>
                        <p className="text-xs text-slate-400 font-medium">{comp.date}</p>
                      </div>
                      <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${diff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {diff >= 0 ? '+' : ''}{diff}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-xs font-black text-blue-600">You: {comp.studentScore}%</span>
                        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${scoreColor(comp.studentScore)}`} style={{ width: `${comp.studentScore}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-xs font-bold text-slate-500">Batch: {comp.batchAvg}%</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${comp.batchAvg}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : selectedBatchData ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-slate-900 text-lg">{selectedBatchData.testName}</p>
                  <p className="text-sm text-slate-400 font-medium">{selectedBatchData.date}</p>
                </div>
                <span className={`text-base font-black px-3 py-1.5 rounded-xl ${selectedBatchData.scoreDiff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {selectedBatchData.scoreDiff >= 0 ? '+' : ''}{selectedBatchData.scoreDiff}% vs batch
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-blue-600 text-white rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-blue-200 mb-1">Your Score</p>
                  <p className="text-5xl font-black">{selectedBatchData.studentScore}%</p>
                </div>
                <div className="bg-slate-700 text-white rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-300 mb-1">Batch Avg</p>
                  <p className="text-5xl font-black">{selectedBatchData.batchAvg}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-black text-blue-600">You: {selectedBatchData.studentScore}%</span>
                  <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreColor(selectedBatchData.studentScore)}`} style={{ width: `${selectedBatchData.studentScore}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-bold text-slate-500">Batch: {selectedBatchData.batchAvg}%</span>
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: `${selectedBatchData.batchAvg}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ── 5. Focus Areas ──────────────────────────────── */}
      {chapterStats.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader icon={Target} color="bg-gradient-to-br from-rose-500 to-pink-600" title="Focus Areas" sub="All chapters that need improvement, sorted by priority" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chapterStats.filter(c => c.accuracy < 70).map((ch, idx) => (
              <div key={`${ch.subject}-${ch.chapter}`} className={`flex items-center gap-4 p-4 rounded-xl border ${scoreBgBorder(ch.accuracy)}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${ch.accuracy < 30 ? 'bg-rose-500 text-white' : ch.accuracy < 50 ? 'bg-orange-500 text-white' : 'bg-amber-400 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-wider ${subjectCfg(ch.subject).text}`}>{ch.subject}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{ch.chapter}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden">
                      <div className={`h-full ${scoreColor(ch.accuracy)} rounded-full`} style={{ width: `${ch.accuracy}%` }} />
                    </div>
                    <span className={`text-xs font-black shrink-0 ${scoreTextColor(ch.accuracy)}`}>{ch.accuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {chapterStats.filter(c => c.accuracy < 70).length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-emerald-700">All chapters above 70% — great work! 🎉</p>
            </div>
          )}
        </section>
      )}

      {/* ── 6. Time Analysis ────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <SectionHeader icon={Clock} color="bg-gradient-to-br from-amber-500 to-orange-600" title="Time Analysis" sub="Average time spent per question — subject & type breakdown" />
          <Select
            value={timeTestId}
            onChange={setTimeTestId}
            options={timeTestOptions}
          />
        </div>

        {timeSubjects.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">No time data available yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {timeSubjects.map(ts => {
              const cfg = subjectCfg(ts.subject);
              const maxTime = Math.max(ts.mcqAvgSec, ts.numericAvgSec, 1);
              return (
                <div key={ts.subject} className={`${cfg.bg} rounded-2xl p-5 border ${cfg.ring.replace('ring', 'border')}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={`font-black text-base ${cfg.text}`}>{ts.subject}</p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-white/60 ${cfg.text}`}>
                      Total: {formatSecs(ts.totalTimeSec)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {/* MCQ */}
                    {ts.mcqCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600">MCQ avg ({ts.mcqCount} questions)</span>
                          <span className={cfg.text}>{formatSecs(ts.mcqAvgSec)} / question</span>
                        </div>
                        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cfg.bar} rounded-full transition-all`}
                            style={{ width: `${Math.min(100, (ts.mcqAvgSec / Math.max(maxTime, 120)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* Numerical */}
                    {ts.numericCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600">Numerical avg ({ts.numericCount} questions)</span>
                          <span className={cfg.text}>{formatSecs(ts.numericAvgSec)} / question</span>
                        </div>
                        <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cfg.bar} opacity-70 rounded-full transition-all`}
                            style={{ width: `${Math.min(100, (ts.numericAvgSec / Math.max(maxTime, 120)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
