'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddQuestionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: 'Physics',
    chapter: '',
    topic: '',
    difficulty: 'medium',
    exam_type: 'JEE Main',
    year: new Date().getFullYear().toString(),
    marks: '4',
    negative_marks: '1',
    text: '',
    explanation: '',
  });

  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // 1. Validation
    if (!formData.text.trim()) {
      toast.error('Question text is required');
      setIsSaving(false);
      return;
    }
    if (options.some(opt => !opt.trim())) {
      toast.error('All options must be filled');
      setIsSaving(false);
      return;
    }

    // 2. Get Coaching ID
    const { data: profile } = await supabase.from('profiles').select('coaching_id').single();
    if (!profile?.coaching_id) {
      toast.error('Could not verify your workspace.');
      setIsSaving(false);
      return;
    }

    // 3. Save Question
    const questionData = {
      ...formData,
      year: parseInt(formData.year) || null,
      marks: parseInt(formData.marks) || 4,
      negative_marks: parseInt(formData.negative_marks) || 1,
      options,
      correct_answer: correctAnswer,
      coaching_id: profile.coaching_id
    };

    const { error } = await supabase.from('questions').insert(questionData);

    if (error) {
      toast.error('Failed to save question', { description: error.message });
    } else {
      toast.success('Question added successfully!');
      router.push('/dashboard/questions');
    }
    
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/questions">
          <Button variant="outline" className="px-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Add New Question</h2>
          <p className="text-slate-500">Create a new question manually for your question bank.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Metadata Card */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <select 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>
              <Input label="Chapter" name="chapter" value={formData.chapter} onChange={handleInputChange} required placeholder="e.g. Kinematics" />
              <Input label="Topic (Optional)" name="topic" value={formData.topic} onChange={handleInputChange} placeholder="e.g. Projectile Motion" />
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Exam Type</label>
                <select 
                  name="exam_type" 
                  value={formData.exam_type} 
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET">NEET</option>
                  <option value="MHT CET">MHT CET</option>
                  <option value="Boards">Boards</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Difficulty</label>
                <select 
                  name="difficulty" 
                  value={formData.difficulty} 
                  onChange={handleInputChange}
                  className="flex h-11 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <Input label="Year (Optional)" name="year" type="number" value={formData.year} onChange={handleInputChange} placeholder="2024" />
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Question Content</h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Question Text</label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="flex w-full rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
                  placeholder="Type your question here..."
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700">Options & Correct Answer</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === idx}
                      onChange={() => setCorrectAnswer(idx)}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-slate-300 cursor-pointer"
                    />
                    <Input 
                      placeholder={`Option ${idx + 1}`} 
                      value={opt} 
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Explanation (Optional)</label>
                <textarea
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  rows={3}
                  className="flex w-full rounded-lg bg-white border border-slate-200 p-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-y"
                  placeholder="Explain the correct answer..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Card */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 border-b pb-2">Scoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Marks for Correct Answer" name="marks" type="number" value={formData.marks} onChange={handleInputChange} required />
              <Input label="Negative Marks for Wrong Answer" name="negative_marks" type="number" value={formData.negative_marks} onChange={handleInputChange} required />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Link href="/dashboard/questions">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" isLoading={isSaving} className="px-8">
            <Save className="w-4 h-4 mr-2" /> Save Question
          </Button>
        </div>
      </form>
    </div>
  );
}
