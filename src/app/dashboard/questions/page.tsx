'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload, Plus, Search, Filter, Loader2, MoreVertical, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/browser';
import { Question } from '@/types';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setQuestions(data as Question[]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 ">Question Bank</h2>
          <p className="text-slate-500 ">Manage your entire repository of PYQs and mock test questions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/dashboard/questions/upload" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Bulk Upload
            </Button>
          </Link>
          <Link href="/dashboard/questions/new" className="flex-1 sm:flex-none">
            <Button variant="primary" className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-slate-200 bg-white ">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search questions by text, subject, or chapter..." 
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 ">
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Question</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Subject</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Exam Type</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Difficulty</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                    <p className="text-slate-500">Loading questions...</p>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900 ">No questions found</p>
                    <p className="text-slate-500 mb-6">Your question bank is empty. Start by uploading some PYQs.</p>
                    <Link href="/dashboard/questions/upload">
                      <Button variant="outline">Bulk Upload Now</Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50 :bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="line-clamp-2 text-sm text-slate-800 max-w-md">
                        {q.text}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-900 ">{q.subject}</span>
                        <span className="text-xs text-slate-500">{q.chapter}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="info" className="text-xs">{q.exam_type}</Badge>
                      {q.year && <span className="ml-2 text-xs text-slate-500">{q.year}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <Badge 
                        variant="default" 
                        className={
                          q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700 ' :
                          q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 ' :
                          'bg-amber-100 text-amber-700 '
                        }
                      >
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 :text-white transition-colors rounded-lg hover:bg-slate-100 :bg-white/10">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
