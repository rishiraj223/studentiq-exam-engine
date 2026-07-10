'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Play, Clock, Award, FileText, Plus, X, Loader2, Zap } from 'lucide-react';
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

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    const { data: testData } = await supabase
      .from('mock_test_templates')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: { user } } = await supabase.auth.getUser();
    const { data: attemptData } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('student_id', user?.id);

    if (testData) setTests(testData);
    if (attemptData) {
      const attemptMap: Record<string, TestAttempt> = {};
      attemptData.forEach(att => { attemptMap[att.test_template_id] = att; });
      setAttempts(attemptMap);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAutoCreate = async (examType: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/student/create-auto-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      toast.success(`Test ready! ${data.totalQuestions} questions loaded.`);
      setShowCreateModal(false);
      await fetchDashboardData();
      router.push(`/exam/${data.testId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate test';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
          <p className="text-slate-500 mt-1">Select a test to begin, or auto-generate a new one.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Test
        </Button>
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48 bg-slate-100 rounded-xl" />
            </Card>
          ))
        ) : tests.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Tests Available</h3>
            <p className="text-slate-500 mt-1 mb-4">Click &quot;Create Test&quot; to auto-generate your first mock test.</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Test
            </Button>
          </div>
        ) : (
          tests.map((test) => {
            const attempt = attempts[test.id];
            const isCompleted = !!attempt;
            return (
              <Card key={test.id} className={`border-slate-200 transition-all hover:shadow-md ${isCompleted ? 'bg-slate-50' : 'bg-white'}`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mb-2">
                      {test.exam_type}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2">{test.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />{test.duration_minutes} mins
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4" />{test.total_marks} marks
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Score</p>
                          <p className="text-2xl font-bold text-primary-600">{attempt.total_score}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/exam/${test.id}/results`)}>
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <Button variant="primary" className="w-full" onClick={() => router.push(`/exam/${test.id}`)}>
                        <Play className="w-4 h-4 mr-2 fill-white" /> Start Exam Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ===== CREATE TEST MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create Auto Test</h2>
                <p className="text-sm text-slate-500 mt-0.5">Select an exam — we&apos;ll auto-pick questions by official weightage.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Exam Options */}
            <div className="p-6 space-y-3">
              {EXAM_OPTIONS.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => handleAutoCreate(exam.id)}
                  disabled={isGenerating}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-blue-700">{exam.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{exam.desc}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${exam.badge}`}>Auto</span>
                </button>
              ))}
            </div>

            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-slate-400">Questions are randomly picked from our premium PYQ bank every time.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
