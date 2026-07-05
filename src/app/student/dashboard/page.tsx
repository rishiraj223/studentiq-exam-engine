'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Play, Clock, Award, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // 1. Fetch available mock tests
    const { data: testData } = await supabase
      .from('mock_test_templates')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Fetch student's past attempts
    const { data: { user } } = await supabase.auth.getUser();
    const { data: attemptData } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('student_id', user?.id);

    if (testData) setTests(testData);
    
    if (attemptData) {
      const attemptMap: Record<string, TestAttempt> = {};
      attemptData.forEach(att => {
        attemptMap[att.test_template_id] = att;
      });
      setAttempts(attemptMap);
    }
    
    setIsLoading(false);
  };

  const handleStartTest = (testId: string) => {
    // Navigate to the strict NTA-style simulator
    router.push(`/exam/${testId}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
        <p className="text-slate-500 mt-1">Select a mock test below to begin your exam.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48 bg-slate-100 rounded-xl" />
            </Card>
          ))
        ) : tests.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Tests Available</h3>
            <p className="text-slate-500 mt-1">Your institute hasn't assigned any mock tests yet.</p>
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
                    <h3 className="text-xl font-bold text-slate-900 leading-tight line-clamp-2">
                      {test.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {test.duration_minutes} mins
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      {test.total_marks} marks
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
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={() => handleStartTest(test.id)}
                      >
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
    </div>
  );
}
