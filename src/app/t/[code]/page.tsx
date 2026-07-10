'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Loader2, BookOpen, Clock, Award } from 'lucide-react';

interface TestTemplate {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  access_code: string;
}

export default function PublicTestEntryPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const supabase = createClient();

  const [code, setCode] = useState('');
  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    params.then(p => {
      setCode(p.code);
      loadTest(p.code);
    });
  }, [params]);

  const loadTest = async (code: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('mock_test_templates')
      .select('id, name, exam_type, duration_minutes, total_marks, access_code')
      .eq('access_code', code)
      .single();

    if (!data) setNotFound(true);
    else setTemplate(data);
    setIsLoading(false);
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) { setCodeError('Please enter your name.'); return; }
    if (enteredCode.trim() !== code) { setCodeError('Invalid code. Please check and try again.'); return; }
    setCodeError('');
    setIsStarting(true);
    // Pass name via sessionStorage so the exam page can read it
    sessionStorage.setItem(`exam_student_${template!.id}`, studentName.trim());
    router.push(`/t/${code}/exam`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-blue-400" />
          <p className="text-slate-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Test Not Found</h1>
          <p className="text-slate-400">The test link you followed may be invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" /> StudentIQ Exam Engine
          </div>
          <h1 className="text-3xl font-bold text-white">{template!.name}</h1>
          <p className="text-slate-400 mt-2">{template!.exam_type}</p>
        </div>

        {/* Test Info */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{template!.duration_minutes}</p>
            <p className="text-xs text-slate-400">Minutes</p>
          </div>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{template!.total_marks}</p>
            <p className="text-xs text-slate-400">Total Marks</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleStart} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Your Full Name</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-500 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">4-Digit Access Code</label>
            <input
              type="text"
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit code"
              maxLength={4}
              className="w-full h-12 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-500 px-4 text-2xl tracking-[0.5em] font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {codeError && <p className="text-red-400 text-sm">{codeError}</p>}
          <button
            type="submit"
            disabled={isStarting || !studentName.trim() || enteredCode.length !== 4}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isStarting ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</> : 'Start Exam →'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300 text-center">
          ⚠️ Do not switch tabs or open other apps during the exam — your test will be auto-submitted.
        </div>
      </div>
    </div>
  );
}
