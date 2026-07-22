'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, AlertTriangle, Download, FileText, ChevronDown, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from '@/features/analytics/exportUtils';
import { createClient } from '@/lib/supabase/browser';

export default function AdvancedAnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [testData, setTestData] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [coachingName, setCoachingName] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('exam_coaching_session='));
        if (sessionCookie) {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          setCoachingName(sessionData.coaching_name || 'Coaching Admin');
        }

        const [alertsRes, testsRes] = await Promise.all([
          fetch('/api/admin/analytics/alerts'),
          fetch('/api/admin/assigned-tests')
        ]);

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData.alerts || []);
        }

        if (testsRes.ok) {
          const testsData = await testsRes.json();
          const availableTests = (testsData.tests || []).filter((t: any) => t.participations > 0);
          setTests(availableTests);
          if (availableTests.length > 0) {
            setSelectedTestId(availableTests[0].id);
          }
        }
      } catch (err) {
        toast.error('Failed to load initial analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedTestId) return;

    const fetchTestData = async () => {
      setIsTestLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/test/${selectedTestId}`);
        if (!res.ok) throw new Error('Failed to fetch test data');
        const data = await res.json();
        setTestData(data);
      } catch (err) {
        toast.error('Failed to load test analytics');
      } finally {
        setIsTestLoading(false);
      }
    };
    fetchTestData();
  }, [selectedTestId]);

  const handleExportCSV = () => {
    if (!testData || !selectedTestId) return;
    const test = tests.find(t => t.id === selectedTestId);
    
    // Export Batch Performance
    exportAnalyticsToCSV(testData.batchPerformance, `${test?.name || 'test'}_batch_performance`);
    // Export Question Difficulty
    exportAnalyticsToCSV(testData.questionDifficulty, `${test?.name || 'test'}_question_difficulty`);
    
    toast.success('Downloaded CSV files');
  };

  const handleExportPDF = () => {
    if (!testData || !selectedTestId) return;
    const test = tests.find(t => t.id === selectedTestId);
    exportAnalyticsToPDF(
      test?.name || 'Advanced Analytics Report', 
      coachingName,
      testData.batchPerformance, 
      testData.questionDifficulty
    );
    toast.success('Generated PDF Report');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Loading Analytics Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-600" /> Advanced Analytics
          </h1>
          <p className="text-slate-500 mt-1">Deep insights into student performance and batch trends.</p>
        </div>
        
        {testData && tests.length > 0 && (
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm text-sm">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]">
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Needs Attention Section */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-rose-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> Needs Attention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 6).map((alert, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{alert.studentName}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">{alert.batch}</span>
                  </div>
                  <p className="text-sm text-rose-600 font-medium">{alert.reason}</p>
                </div>
              </div>
            ))}
          </div>
          {alerts.length > 6 && (
            <p className="text-sm text-rose-500 font-semibold mt-4 text-center">
              + {alerts.length - 6} more students require attention.
            </p>
          )}
        </div>
      )}

      {/* Test Selector */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Analyze Test Performance</label>
        <div className="relative max-w-md">
          <select 
            value={selectedTestId} 
            onChange={e => setSelectedTestId(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-slate-800"
          >
            {tests.length === 0 ? (
              <option value="">No completed tests available</option>
            ) : (
              tests.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.exam_type}) - {t.participations} Attempts</option>
              ))
            )}
          </select>
          <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {isTestLoading ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-3" />
          <p className="text-slate-500 font-medium">Crunching numbers...</p>
        </div>
      ) : testData && tests.length > 0 ? (
        <div className="space-y-8">
          
          {/* Batch Performance Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> Batch Performance Overview
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Name</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Attempts</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Score</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Accuracy</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Score Comparison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testData.batchPerformance.map((batch: any, i: number) => {
                    const maxScore = Math.max(...testData.batchPerformance.map((b: any) => b.avgScore), 1);
                    const widthPercent = Math.max(5, (batch.avgScore / maxScore) * 100);
                    
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-sm">{batch.batchName}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600">{batch.totalAttempts}</td>
                        <td className="py-4 px-4 font-black text-indigo-700">{batch.avgScore} <span className="text-xs font-medium text-slate-400">pts</span></td>
                        <td className="py-4 px-4">
                          <span className={`font-bold text-sm ${batch.avgAccuracy >= 70 ? 'text-emerald-600' : batch.avgAccuracy >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {batch.avgAccuracy}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${widthPercent}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {testData.batchPerformance.length === 0 && (
              <p className="text-center text-slate-500 py-6 font-medium">No batch data available for this test.</p>
            )}
          </div>

          {/* Question Difficulty Intelligence */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Question Difficulty Intelligence
            </h2>
            <p className="text-slate-500 text-sm mb-6">Top questions answered incorrectly across all batches for this test.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testData.questionDifficulty.map((q: any, i: number) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden group hover:border-amber-200 transition">
                  <div className="absolute top-0 right-0 bg-rose-100 text-rose-700 text-xs font-black px-2 py-1 rounded-bl-lg">
                    {q.incorrectPercentage}% Failed
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="w-6 h-6 rounded bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase text-blue-600 mt-1">{q.subject}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 line-clamp-3 leading-relaxed mb-4" dangerouslySetInnerHTML={{__html: q.text.replace(/<[^>]*>?/gm, '')}} />
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-200 pt-3">
                    <span>ID: {q.id.substring(0, 8)}...</span>
                    <span className="text-rose-600">{q.incorrectCount} Incorrect Attempts</span>
                  </div>
                </div>
              ))}
            </div>
            {testData.questionDifficulty.length === 0 && (
              <p className="text-center text-slate-500 py-6 font-medium">No incorrect answers recorded yet.</p>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Completed Tests</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">Assign tests to students and wait for them to complete to see advanced analytics here.</p>
        </div>
      )}

    </div>
  );
}
