'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft, Loader2, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [testId, setTestId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    params.then(p => setTestId(p.id));
  }, [params]);

  useEffect(() => {
    if (!testId) return;
    
    const fetchResults = async () => {
      try {
        const [res, lbRes] = await Promise.all([
          fetch('/api/student/dashboard-data'),
          fetch(`/api/student/leaderboard/${testId}`)
        ]);
        
        if (!res.ok) throw new Error('Failed to load results');
        const data = await res.json();
        
        let lbData = [];
        if (lbRes.ok) {
          const json = await lbRes.json();
          lbData = json.leaderboard || [];
        }
        
        const attempt = (data.attempts || []).find((a: any) => a.test_template_id === testId);
        
        // Try to find the test in assigned tests first, then generic tests
        let test = null;
        const assignRes = await fetch('/api/student/assigned-tests');
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          test = (assignData.assignments || []).find((t: any) => t.id === testId);
        }
        if (!test) {
          test = (data.tests || []).find((t: any) => t.id === testId);
        }
        
        if (attempt && test) {
          setResults({ attempt, test });
          setLeaderboard(lbData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Results Not Found</h2>
          <p className="text-slate-500 mb-6">We couldn't find your submission for this test.</p>
          <Button onClick={() => router.push('/student/dashboard')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const { attempt, test } = results;
  const accuracy = attempt.correct_count + attempt.incorrect_count > 0
    ? Math.round((attempt.correct_count / (attempt.correct_count + attempt.incorrect_count)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <Button variant="outline" onClick={() => router.push('/student/dashboard')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        
        <Card className="overflow-hidden border-0 shadow-xl shadow-blue-900/5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
            <p className="text-blue-100">{test.name}</p>
          </div>
          
          <CardContent className="p-8">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Final Score</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-6xl font-black text-slate-900">{attempt.total_score}</span>
                <span className="text-xl font-medium text-slate-400">/ {test.total_marks}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{attempt.correct_count}</p>
                <p className="text-xs font-medium text-green-600 uppercase">Correct</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                <XCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-rose-700">{attempt.incorrect_count}</p>
                <p className="text-xs font-medium text-rose-600 uppercase">Incorrect</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-700">{attempt.unanswered_count}</p>
                <p className="text-xs font-medium text-slate-500 uppercase">Skipped</p>
              </div>
              
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                <div className="w-6 h-6 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg font-bold text-blue-500">%</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{accuracy}%</p>
                <p className="text-xs font-medium text-blue-600 uppercase">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LEADERBOARD SECTION */}
        {leaderboard && leaderboard.length > 0 && (
          <Card className="overflow-hidden border-0 shadow-xl shadow-blue-900/5 mt-8">
            <div className="bg-white p-6 border-b border-slate-100 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900">Class Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4 text-right">Score</th>
                    <th className="px-6 py-4 text-center">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leaderboard.map((student: any, i: number) => {
                    const isMe = student.id === attempt.id;
                    return (
                      <tr key={student.id} className={isMe ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {i + 1}
                          {i === 0 && <span className="ml-2">🥇</span>}
                          {i === 1 && <span className="ml-2">🥈</span>}
                          {i === 2 && <span className="ml-2">🥉</span>}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {student.student_name || 'Unknown'} {isMe && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">YOU</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">{student.total_score}</td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">
                          {Math.floor(student.time_taken_seconds / 60)}m {student.time_taken_seconds % 60}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
