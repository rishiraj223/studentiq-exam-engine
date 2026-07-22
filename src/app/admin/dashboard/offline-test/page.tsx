'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Printer, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';
import { generateQuestionPaperPDF, generateAnswerKeyPDF, generateOMRPDF } from '@/features/offline-test/pdfUtils';

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'MHT-CET A', 'MHT-CET B'];
const STANDARDS = ['11th', '12th'];
const ALL_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const DIFFICULTIES = [
  { id: 'all', label: 'All Difficulties' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
];

export default function OfflineTestGenerator() {
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [pdfConfig, setPdfConfig] = useState<any>(null);

  // Form State
  const [exam, setExam] = useState('JEE Main');
  const [standard, setStandard] = useState('11th');
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [numQuestions, setNumQuestions] = useState('20');


  // Dynamic Chapters
  const [chaptersList, setChaptersList] = useState<{name: string}[]>([]);

  useEffect(() => {
    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('name')
        .eq('exam_type', exam)
        .eq('subject', subject)
        .eq('standard', standard)
        .order('chapter_number');
      
      if (error) console.error('Chapter fetch error:', error);
      
      const fetched = data || [];
      setChaptersList(fetched);
      if (fetched.length > 0) {
        setChapter(fetched[0].name);
      } else {
        setChapter('');
      }
    };
    fetchChapters();
  }, [exam, subject, standard, supabase]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter) return toast.error('Please select a chapter');
    if (!numQuestions || parseInt(numQuestions) <= 0) return toast.error('Invalid number of questions');
    
    setIsGenerating(true);
    setGeneratedQuestions([]);
    
    try {
      const res = await fetch('/api/admin/offline-test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam,
          subject,
          chapter,
          difficulty,
          count: parseInt(numQuestions)
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate test');
      
      if (data.questions.length === 0) {
        toast.error('No questions found matching these criteria');
        setIsGenerating(false);
        return;
      }
      
      if (data.questions.length < parseInt(numQuestions)) {
        toast.warning(`Only found ${data.questions.length} questions.`);
      } else {
        toast.success(`Generated test with ${data.questions.length} questions`);
      }

      const calculatedMarks = parseInt(numQuestions) * 4; // Assuming 4 marks per question for typical JEE/NEET patterns
      setPdfConfig({
        coachingName: data.coachingName,
        examName: exam,
        subject: subject,
        standard: standard,
        date: new Date().toLocaleDateString(),
        totalMarks: calculatedMarks,
        numberOfQuestions: data.questions.length
      });
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Printer className="w-7 h-7 text-blue-600" /> Offline Test Generator
        </h1>
        <p className="text-slate-500 mt-1">Generate print-ready Question Papers, Answer Keys, and OMR sheets instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Test Configuration</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exam Type</label>
              <select value={exam} onChange={e => setExam(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500">
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standard</label>
                <select value={standard} onChange={e => setStandard(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500">
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500">
                  {ALL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chapter</label>
              <select value={chapter} onChange={e => setChapter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-50" disabled={chaptersList.length === 0}>
                {chaptersList.length === 0 ? <option value="">No chapters found</option> : chaptersList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500">
                  {DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">No. of Questions</label>
                <input type="number" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500" min="1" max="100" />
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center mt-2">
              <span className="text-sm font-bold text-slate-600">Calculated Total Marks</span>
              <span className="text-xl font-black text-blue-700">{parseInt(numQuestions || '0') * 4}</span>
            </div>

            <button type="submit" disabled={isGenerating || !chapter} className="w-full mt-6 py-3.5 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] disabled:opacity-50 disabled:shadow-none">
              {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing Package...</> : 'Generate Test Package'}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {generatedQuestions.length === 0 ? (
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No Test Generated Yet</h3>
              <p className="max-w-xs text-sm">Configure your test parameters on the left and click generate to create print-ready PDFs.</p>
            </div>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-black text-emerald-800 mb-2">Test Successfully Generated!</h3>
                <p className="text-emerald-700 text-sm mb-6">Generated a paper with {generatedQuestions.length} questions. You can now download the required PDFs below.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => generateQuestionPaperPDF(generatedQuestions, pdfConfig)} className="flex flex-col items-center p-4 bg-white border border-emerald-200 rounded-xl hover:shadow-md hover:border-emerald-400 transition group">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Question Paper</span>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-semibold"><Download className="w-3 h-3"/> Download PDF</span>
                  </button>
                  
                  <button onClick={() => generateAnswerKeyPDF(generatedQuestions, pdfConfig)} className="flex flex-col items-center p-4 bg-white border border-emerald-200 rounded-xl hover:shadow-md hover:border-emerald-400 transition group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Answer Key</span>
                    <span className="flex items-center gap-1 text-xs text-blue-600 mt-1 font-semibold"><Download className="w-3 h-3"/> Download PDF</span>
                  </button>
                  
                  <button onClick={() => generateOMRPDF(pdfConfig)} className="flex flex-col items-center p-4 bg-white border border-emerald-200 rounded-xl hover:shadow-md hover:border-emerald-400 transition group">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ListDots className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">OMR Sheet</span>
                    <span className="flex items-center gap-1 text-xs text-purple-600 mt-1 font-semibold"><Download className="w-3 h-3"/> Download PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden flex-1">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Test Preview (First 5 Questions)</h3>
                <div className="space-y-4">
                  {generatedQuestions.slice(0, 5).map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex gap-2">
                        <span className="font-bold text-slate-800">Q{idx + 1}.</span>
                        <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{__html: (q.question_text || q.text || '').replace(/<[^>]*>?/gm, '')}} />
                      </div>
                    </div>
                  ))}
                  {generatedQuestions.length > 5 && (
                    <div className="text-center pt-2">
                      <span className="text-sm font-semibold text-slate-400">+ {generatedQuestions.length - 5} more questions in the PDF</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckSquare(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}

function ListDots(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/><line x1="10" x2="20" y1="6" y2="6"/><line x1="10" x2="20" y1="12" y2="12"/><line x1="10" x2="20" y1="18" y2="18"/></svg>;
}
