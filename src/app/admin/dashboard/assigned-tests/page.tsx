'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Users, Calendar, Loader2 } from 'lucide-react';

type AssignedTest = {
  id: string;
  name: string;
  exam_type: string;
  total_marks: number;
  duration_minutes: number;
  due_date: string | null;
  created_at: string;
  participations: number;
};

export default function AdminAssignedTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<AssignedTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ name: '', examType: 'JEE Main', subject: 'Physics', duration: 60 as number | string, questions: 30 as number | string, dueDate: '' });

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/admin/assigned-tests');
      const data = await res.json();
      setTests(data.tests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/assigned-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          examType: form.examType,
          subject: form.subject,
          durationMinutes: form.duration,
          totalQuestions: form.questions,
          dueDate: form.dueDate || null,
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIsModalOpen(false);
        setForm({ ...form, name: '' });
        fetchTests();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assigned Tests</h1>
          <p className="text-slate-500 mt-1">Create and track global tests for your batch.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Assign New Test
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tests assigned yet</p>
          <p className="text-sm text-slate-400 mt-1">Assign your first test to start tracking performance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map(test => (
            <div key={test.id} onClick={() => router.push(`/admin/dashboard/assigned-tests/${test.id}/analytics`)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{test.exam_type}</span>
                {test.due_date && <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Calendar className="w-3 h-3 mr-1"/> Due: {new Date(test.due_date).toLocaleDateString()}</span>}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{test.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{test.duration_minutes} Mins • {test.total_marks} Marks</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center text-slate-600 text-sm font-medium">
                  <Users className="w-4 h-4 mr-1.5" />
                  {test.participations} Attempts
                </div>
                <span className="text-blue-600 text-sm font-bold">View Analytics &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">Assign New Test</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 mb-4">Choose how you want to create your test. You can either use our verified global question bank or write your own custom questions.</p>
              
              <div 
                onClick={() => router.push('/admin/dashboard/assigned-tests/premade')}
                className="p-5 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Premade Test (Global Bank)</h3>
                  <p className="text-xs text-slate-500 mt-1">Select specific chapters and manually hand-pick questions from our verified global database.</p>
                </div>
              </div>

              <div 
                onClick={() => router.push('/admin/dashboard/assigned-tests/custom')}
                className="p-5 border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl cursor-pointer transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Custom Test (Manual Entry)</h3>
                  <p className="text-xs text-slate-500 mt-1">Type your own proprietary questions, upload images, and set custom marks from scratch.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
