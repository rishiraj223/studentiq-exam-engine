'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Logo } from '@/components/ui/Logo';
import { Download, ArrowLeft, Users, Trophy, BarChart3 } from 'lucide-react';

interface TestSession {
  id: string;
  student_name: string;
  total_score: number;
  subject_scores: Record<string, number>;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_taken_seconds: number;
  submitted_at: string;
}

interface TestTemplate {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  access_code: string;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function AdminResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();

  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    params.then(p => loadData(p.id));
  }, [params]);

  const loadData = async (id: string) => {
    setIsLoading(true);
    const [{ data: tmpl }, { data: sess }] = await Promise.all([
      supabase.from('mock_test_templates').select('*').eq('id', id).single(),
      supabase.from('test_sessions').select('*').eq('test_template_id', id).order('total_score', { ascending: false }),
    ]);
    if (tmpl) setTemplate(tmpl);
    if (sess) setSessions(sess);
    setIsLoading(false);
  };

  const calculatePercentile = (score: number, allScores: number[]): number => {
    const maxScore = Math.max(...allScores);
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const allScores = sessions.map(s => s.total_score);
  const allSubjects = sessions.length > 0
    ? [...new Set(sessions.flatMap(s => Object.keys(s.subject_scores || {})))]
    : [];

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(template!.name, 14, 18);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`${template!.exam_type} · Total Marks: ${template!.total_marks} · Code: ${template!.access_code}`, 14, 26);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')} · Total Students: ${sessions.length}`, 14, 32);
      doc.setTextColor(0);

      // Table headers
      const headers = ['#', 'Student Name', ...allSubjects.map(s => s.substring(0, 4)), 'Total Score', 'Correct', 'Wrong', 'Time Taken', 'Percentile'];
      const rows = sessions.map((s, i) => [
        i + 1,
        s.student_name,
        ...allSubjects.map(sub => (s.subject_scores?.[sub] ?? 0).toFixed(0)),
        s.total_score.toFixed(0),
        s.correct_count,
        s.incorrect_count,
        formatTime(s.time_taken_seconds),
        `${calculatePercentile(s.total_score, allScores)}%`,
      ]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 38,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 40 } },
      });

      doc.save(`${template!.name.replace(/\s+/g, '_')}_Results.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500">Loading results...</div>
    </div>
  );

  const topScore = sessions.length > 0 ? Math.max(...allScores) : 0;
  const avgScore = sessions.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </button>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold tracking-widest uppercase">Super Admin</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{template?.name}</h1>
            <p className="text-slate-500 mt-1">{template?.exam_type} · Access Code: <span className="font-mono font-bold text-slate-800">{template?.access_code}</span></p>
          </div>
          <button onClick={handleDownloadPDF} disabled={isDownloading || sessions.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors">
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5 text-blue-600" />, label: 'Students', value: sessions.length, bg: 'bg-blue-50' },
            { icon: <Trophy className="w-5 h-5 text-yellow-600" />, label: 'Top Score', value: topScore, bg: 'bg-yellow-50' },
            { icon: <BarChart3 className="w-5 h-5 text-green-600" />, label: 'Average', value: avgScore, bg: 'bg-green-50' },
            { icon: <span className="text-lg">📊</span>, label: 'Total Marks', value: template?.total_marks || 0, bg: 'bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-white`}>
              <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-sm font-semibold text-slate-600">{stat.label}</span></div>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Results Table */}
        {sessions.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Students Yet</h3>
            <p className="text-slate-500 mt-1">Share the test link and code with your students. Results will appear here.</p>
            <div className="mt-4 font-mono text-2xl tracking-widest font-bold text-slate-800">{template?.access_code}</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    {allSubjects.map(sub => (
                      <th key={sub} className="px-4 py-3 font-semibold">{sub}</th>
                    ))}
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Correct</th>
                    <th className="px-4 py-3 font-semibold">Wrong</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => {
                    const percentile = calculatePercentile(session.total_score, allScores);
                    const isTop = idx === 0;
                    return (
                      <tr key={session.id} className={`border-b border-slate-100 last:border-0 ${isTop ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-4 py-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          {isTop && <span title="Top Scorer">🏆</span>}
                          {session.student_name}
                        </td>
                        {allSubjects.map(sub => (
                          <td key={sub} className="px-4 py-3 text-slate-700">
                            {(session.subject_scores?.[sub] ?? 0).toFixed(0)}
                          </td>
                        ))}
                        <td className="px-4 py-3 font-bold text-slate-900">{session.total_score.toFixed(0)}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{session.correct_count}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">{session.incorrect_count}</td>
                        <td className="px-4 py-3 text-slate-500">{formatTime(session.time_taken_seconds)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${percentile >= 90 ? 'bg-green-100 text-green-800' : percentile >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                            {percentile}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
