'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Target, BookOpen } from 'lucide-react';

type SubjectStat = {
  subject: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  accuracy: number;
};

type ChapterStat = {
  subject: string;
  chapter: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  accuracy: number;
};

const SUBJECT_COLORS: Record<string, { bg: string; ring: string; text: string; bar: string }> = {
  Physics:     { bg: 'bg-yellow-50',   ring: 'ring-yellow-300', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  Chemistry:   { bg: 'bg-emerald-50',  ring: 'ring-emerald-300',text: 'text-emerald-700',bar: 'bg-emerald-500' },
  Mathematics: { bg: 'bg-blue-50',     ring: 'ring-blue-300',   text: 'text-blue-700',  bar: 'bg-blue-500' },
  Biology:     { bg: 'bg-teal-50',     ring: 'ring-teal-300',   text: 'text-teal-700',  bar: 'bg-teal-500' },
};

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-blue-500';
  if (pct >= 40) return 'bg-amber-500';
  if (pct >= 20) return 'bg-orange-500';
  return 'bg-rose-500';
}

function accuracyTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-700';
  if (pct >= 60) return 'text-blue-700';
  if (pct >= 40) return 'text-amber-700';
  return 'text-rose-700';
}

function accuracyBgColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 60) return 'bg-blue-50 border-blue-200';
  if (pct >= 40) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}

export default function AnalyticsPage() {
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [chapterStats, setChapterStats] = useState<ChapterStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/analytics');
        const data = await res.json();
        setSubjectStats(data.subjectStats || []);
        setChapterStats(data.chapterStats || []);
      } catch {
        setSubjectStats([]);
        setChapterStats([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredChapters = selectedSubject === 'all'
    ? chapterStats
    : chapterStats.filter(c => c.subject === selectedSubject);

  const strongestSubject = subjectStats[0];
  const weakestSubject = subjectStats[subjectStats.length - 1];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (subjectStats.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Your subject and chapter performance breakdown.</p>
        </div>
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No analytics yet</p>
          <p className="text-sm text-slate-400 mt-1">Complete at least one test to see your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Your subject and chapter performance breakdown.</p>
      </div>

      {/* Strongest / Weakest cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strongestSubject && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Strongest Subject</p>
              <p className="text-lg font-black text-emerald-800">{strongestSubject.subject}</p>
              <p className="text-sm text-emerald-600">{strongestSubject.accuracy}% accuracy · {strongestSubject.correct} correct</p>
            </div>
          </div>
        )}
        {weakestSubject && weakestSubject.subject !== strongestSubject?.subject && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Needs Most Work</p>
              <p className="text-lg font-black text-rose-800">{weakestSubject.subject}</p>
              <p className="text-sm text-rose-600">{weakestSubject.accuracy}% accuracy · {weakestSubject.incorrect} wrong</p>
            </div>
          </div>
        )}
      </div>

      {/* Subject Performance Cards */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Subject Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map(stat => {
            const colors = SUBJECT_COLORS[stat.subject] || SUBJECT_COLORS['Physics'];
            return (
              <div key={stat.subject} className={`${colors.bg} ring-1 ${colors.ring} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-bold ${colors.text}`}>{stat.subject}</p>
                  <span className={`text-2xl font-black ${colors.text}`}>{stat.accuracy}%</span>
                </div>
                {/* Accuracy bar */}
                <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
                  <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${stat.accuracy}%` }} />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-600">✓ {stat.correct}</span>
                  <span className="text-rose-500">✗ {stat.incorrect}</span>
                  <span className="text-slate-400">— {stat.unanswered}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chapter Accuracy Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-900">Chapter Heatmap</h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedSubject === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All
            </button>
            {subjectStats.map(s => {
              const colors = SUBJECT_COLORS[s.subject] || SUBJECT_COLORS['Physics'];
              return (
                <button key={s.subject} onClick={() => setSelectedSubject(s.subject)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedSubject === s.subject ? `${colors.bar} text-white` : `${colors.bg} ${colors.text}`}`}>
                  {s.subject}
                </button>
              );
            })}
          </div>
        </div>

        {filteredChapters.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No chapter data yet for this subject.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChapters.map(ch => (
              <div key={`${ch.subject}-${ch.chapter}`}
                className={`border rounded-xl p-4 ${accuracyBgColor(ch.accuracy)}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{ch.subject}</p>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{ch.chapter}</p>
                  </div>
                  <span className={`text-lg font-black shrink-0 ${accuracyTextColor(ch.accuracy)}`}>
                    {ch.accuracy}%
                  </span>
                </div>
                {/* Mini bar */}
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${accuracyColor(ch.accuracy)} rounded-full`} style={{ width: `${ch.accuracy}%` }} />
                </div>
                <div className="flex gap-3 text-xs font-medium text-slate-500">
                  <span className="text-emerald-600">✓ {ch.correct}</span>
                  <span className="text-rose-500">✗ {ch.incorrect}</span>
                  <span className="text-slate-400">— {ch.unanswered} skip</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Heatmap legend */}
        {filteredChapters.length > 0 && (
          <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 flex-wrap">
            <span className="font-medium">Accuracy:</span>
            {[{ label: '≥80% Strong', color: 'bg-emerald-500' }, { label: '60–79% Good', color: 'bg-blue-500' }, { label: '40–59% Avg', color: 'bg-amber-500' }, { label: '<40% Weak', color: 'bg-rose-500' }].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
