'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, LogOut, TrendingUp, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/parent/dashboard');
        if (!res.ok) {
          if (res.status === 401) router.push('/parent/login');
          throw new Error('Failed to load data');
        }
        
        const data = await res.json();
        setStudents(data.students || []);
        setAttempts(data.attempts || []);
        
        if (data.students && data.students.length > 0) {
          setSelectedStudentId(data.students[0].id);
        }
      } catch (e) {
        toast.error('Could not load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'exam_parent_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/parent/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading Student Data...</p>
      </div>
    );
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentAttempts = attempts.filter(a => a.student_id === selectedStudentId);
  
  // Calculate Aggregates
  const totalTests = studentAttempts.length;
  const avgScore = totalTests > 0 
    ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.total_score, 0) / totalTests) 
    : 0;
  const avgAccuracy = totalTests > 0 
    ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xl tracking-tight">
            <Users className="w-6 h-6" /> Parent Portal
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-600 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Student Selector */}
        {students.length > 1 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedStudentId === s.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800">{selectedStudent?.name}'s Progress</h1>
          <p className="text-slate-500 font-medium mt-1">Batch: {selectedStudent?.batch} | Std: {selectedStudent?.standard}</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Tests Completed</p>
              <p className="text-2xl font-black text-slate-800">{totalTests}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Avg Score</p>
              <p className="text-2xl font-black text-slate-800">{avgScore} <span className="text-sm text-slate-400 font-medium">pts</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Avg Accuracy</p>
              <p className="text-2xl font-black text-slate-800">{avgAccuracy}%</p>
            </div>
          </div>
        </div>

        {/* Test History */}
        <h2 className="text-xl font-black text-slate-800 mb-4">Test History</h2>
        {studentAttempts.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Tests Yet</h3>
            <p className="text-slate-500 text-sm mt-1">Check back later when tests are completed.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {studentAttempts.map(att => (
              <div key={att.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-blue-200">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{att.test_name}</h3>
                  <div className="flex gap-3 text-sm font-medium text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{att.exam_type}</span>
                    <span>{new Date(att.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Score</p>
                    <p className="font-black text-lg text-indigo-700">{att.total_score} <span className="text-sm text-slate-400 font-medium">/ {att.total_test_marks}</span></p>
                  </div>
                  <div className="flex gap-3 text-sm font-bold">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-4 h-4" /> {att.correct_count}
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                      <XCircle className="w-4 h-4" /> {att.incorrect_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
