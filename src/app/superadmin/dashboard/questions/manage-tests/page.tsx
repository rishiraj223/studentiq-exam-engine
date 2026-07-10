'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { BarChart3, Copy, ArrowLeft, PlusCircle, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TestTemplate {
  id: string;
  name: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  access_code: string;
  question_ids: string[];
  created_at: string;
}

const EXAM_COLORS: Record<string, string> = {
  'JEE Main':     'bg-blue-100 text-blue-800',
  'JEE Advanced': 'bg-indigo-100 text-indigo-800',
  'NEET':         'bg-emerald-100 text-emerald-800',
  'MHT-CET A':   'bg-orange-100 text-orange-800',
  'MHT-CET B':   'bg-rose-100 text-rose-800',
};

export default function ManageTestsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tests, setTests] = useState<TestTemplate[]>([]);
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('mock_test_templates')
      .select('*')
      .not('access_code', 'is', null)
      .order('created_at', { ascending: false });

    if (data) {
      setTests(data as TestTemplate[]);
      // Fetch session counts for each test
      const counts: Record<string, number> = {};
      await Promise.all(data.map(async (t) => {
        const { count } = await supabase
          .from('test_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('test_template_id', t.id);
        counts[t.id] = count || 0;
      }));
      setSessionCounts(counts);
    }
    setIsLoading(false);
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/t/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </button>
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold tracking-widest uppercase">Super Admin</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Tests</h1>
            <p className="text-slate-500 mt-1">All created tests with their share codes and student results.</p>
          </div>
          <Button variant="primary" onClick={() => router.push('/admin/create-test')}>
            <PlusCircle className="w-4 h-4 mr-2" /> Create New Test
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Tests Created Yet</h3>
            <p className="text-slate-500 mt-1 mb-4">Create your first test to get a shareable link and code.</p>
            <Button variant="primary" onClick={() => router.push('/admin/create-test')}>
              <PlusCircle className="w-4 h-4 mr-2" /> Create Test
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map(test => (
              <div key={test.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-5 flex-wrap">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EXAM_COLORS[test.exam_type] || 'bg-slate-100 text-slate-700'}`}>{test.exam_type}</span>
                    <span className="text-xs text-slate-400">{new Date(test.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg truncate">{test.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{test.duration_minutes} min</span>
                    <span>{test.question_ids?.length || 0} Questions</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{sessionCounts[test.id] || 0} Attempted</span>
                  </div>
                </div>

                {/* Code */}
                <div className="text-center flex-shrink-0">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Code</p>
                  <div className="font-mono text-3xl font-bold text-slate-900 tracking-widest">{test.access_code}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => copyLink(test.access_code)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    <Copy className="w-4 h-4" /> Copy Link
                  </button>
                  <button onClick={() => router.push(`/admin/results/${test.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">
                    <BarChart3 className="w-4 h-4" /> View Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
