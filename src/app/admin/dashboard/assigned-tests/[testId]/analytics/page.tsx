'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BarChart3, Clock, Users, Target, ArrowLeft, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { testId } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/admin/assigned-tests/${testId}/analytics`);
        if (!res.ok) throw new Error('Failed to load analytics');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (testId) fetchAnalytics();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data || !data.test) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Analytics Not Found</h2>
        <p className="text-slate-500 mt-2">Could not load analytics for this test.</p>
        <button onClick={() => router.back()} className="mt-6 text-blue-600 font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const { test, metrics, leaderboard } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <button onClick={() => router.push('/admin/dashboard/assigned-tests')} className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assigned Tests
      </button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            {test.exam_type}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            {test.total_marks} Marks • {test.duration_minutes} Mins
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">{test.name} Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <Users className="w-8 h-8 text-blue-500 mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Attempts</p>
            <p className="text-3xl font-black text-slate-900">{metrics.totalStudents}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-emerald-500 mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Score</p>
            <p className="text-3xl font-black text-slate-900">{metrics.avgScore}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <Target className="w-8 h-8 text-orange-500 mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Accuracy</p>
            <p className="text-3xl font-black text-slate-900">{metrics.avgAccuracy}%</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-purple-500 mb-3" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Time</p>
            <p className="text-3xl font-black text-slate-900">{Math.floor(metrics.avgTimeSeconds / 60)}m</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Student Leaderboard</h2>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No students have attempted this test yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4 text-right">Score</th>
                  <th className="px-6 py-4 text-center">Accuracy</th>
                  <th className="px-6 py-4 text-center">Time Taken</th>
                  <th className="px-6 py-4 text-center">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((student: any, i: number) => {
                  const accuracy = student.correct_count + student.incorrect_count > 0 
                    ? Math.round((student.correct_count / (student.correct_count + student.incorrect_count)) * 100) 
                    : 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {i + 1}
                        {i === 0 && <span className="ml-2 text-amber-500 text-lg leading-none inline-block align-middle">🥇</span>}
                        {i === 1 && <span className="ml-2 text-slate-400 text-lg leading-none inline-block align-middle">🥈</span>}
                        {i === 2 && <span className="ml-2 text-amber-700 text-lg leading-none inline-block align-middle">🥉</span>}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{student.student_name || 'Unknown Student'}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">{student.total_score}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${accuracy >= 80 ? 'bg-emerald-100 text-emerald-700' : accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          {accuracy}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500 font-medium">
                        {Math.floor(student.time_taken_seconds / 60)}m {student.time_taken_seconds % 60}s
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400 text-xs">
                        {new Date(student.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
