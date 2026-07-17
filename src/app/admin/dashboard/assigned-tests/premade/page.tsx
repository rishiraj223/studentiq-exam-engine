'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Globe, BookOpen, Layers, CheckSquare, Plus, Minus, Search, Clock, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';
import { MathRenderer } from '@/components/ui/MathRenderer';


const BOARDS = [
  { id: 'NCERT', label: 'NCERT (JEE/NEET)' },
  { id: 'MH Board', label: 'Maharashtra Board (MHT-CET)' },
];

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'MHT-CET A', 'MHT-CET B'];
const ALL_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

type Question = {
  id: string;
  question_text: string;
  subject: string;
  chapter_name: string;
  difficulty_level: string;
};

export default function PremadeTestCreator() {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  // Test Config State (Right Pane)
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState('180');
  const [dueDate, setDueDate] = useState('');

  // Syllabus Filter State (Left Pane)
  const [board, setBoard] = useState('NCERT');
  const [exam, setExam] = useState('JEE Main');
  const [activeSubject, setActiveSubject] = useState<string>('Physics');
  const [chapters, setChapters] = useState<{name: string, subject: string, standard: string}[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<{name: string, subject: string, standard: string}[]>([]);

  // Questions State (Middle Pane)
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Chapters when active subject changes
  useEffect(() => {
    if (!activeSubject) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('name, subject, standard')
        .eq('exam_type', exam)
        .eq('subject', activeSubject)
        .order('standard')
        .order('chapter_number');
      if (error) console.error('Chapter fetch error:', error);
      setChapters(data || []);
    };
    fetchChapters();
  }, [activeSubject, exam, supabase]);

  // 2. Fetch Questions instantly when selected chapters change
  useEffect(() => {
    const fetchQ = async () => {
      if (selectedChapters.length === 0) {
        setAvailableQuestions([]);
        return;
      }
      setIsLoadingQuestions(true);
      try {
        const subjList = Array.from(new Set(selectedChapters.map(c => c.subject)));
        const chapList = Array.from(new Set(selectedChapters.map(c => c.name)));

        const res = await fetch('/api/admin/questions/filter', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam,
            subjects: subjList,
            chapters: chapList
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'API Error');
        }
        const { questions } = await res.json();
        
        // Exact matches only
        const exactMatches = (questions || []).filter((q: any) => 
          selectedChapters.some(sc => sc.subject === q.subject && sc.name === q.chapter_name)
        );

        setAvailableQuestions(exactMatches);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load questions');
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    fetchQ();
  }, [selectedChapters, exam]);

  const toggleChapter = (chapter: {name: string, subject: string, standard: string}) => {
    const exists = selectedChapters.find(c => c.name === chapter.name && c.subject === chapter.subject);
    if (exists) {
      setSelectedChapters(selectedChapters.filter(c => !(c.name === chapter.name && c.subject === chapter.subject)));
    } else {
      setSelectedChapters([...selectedChapters, chapter]);
    }
  };

  const toggleQuestion = (q: Question) => {
    if (selectedQuestions.find(x => x.id === q.id)) {
      setSelectedQuestions(selectedQuestions.filter(x => x.id !== q.id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  const handlePublish = async () => {
    if (!testName || selectedQuestions.length === 0) {
      return toast.error('Please enter a test name and select at least one question.');
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/assigned-tests/premade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          examType: exam,
          durationMinutes: Number(duration),
          dueDate: dueDate || null,
          questionIds: selectedQuestions.map(q => q.id),
          subjects: Array.from(new Set(selectedQuestions.map(q => q.subject)))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Test assigned successfully!');
      router.push('/admin/dashboard/assigned-tests');
    } catch (err: any) {
      toast.error(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-white -mx-6 -my-6">
      
      {/* PANE 1: LEFT SIDEBAR (Filters & Syllabus) */}
      <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-blue-600" /> Syllabus Filter
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Board</label>
              <select value={board} onChange={(e) => setBoard(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                {BOARDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Type</label>
              <select value={exam} onChange={(e) => {setExam(e.target.value); setSelectedChapters([]);}} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="flex flex-wrap gap-1 p-3 border-b border-slate-200 bg-white">
          {ALL_SUBJECTS.map(s => {
            const count = selectedChapters.filter(c => c.subject === s).length;
            return (
              <button key={s} onClick={() => setActiveSubject(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition relative ${activeSubject === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s}
                {count > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5"/> {activeSubject} Chapters</label>
          
          {chapters.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No chapters found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {['11th', '12th'].map(standard => {
                const stdChapters = chapters.filter(c => c.standard === standard);
                if (stdChapters.length === 0) return null;
                return (
                  <div key={standard} className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-2">
                      <span className="text-xs font-black text-slate-700 uppercase">{standard} Class</span>
                    </div>
                    {stdChapters.map(c => (
                      <label key={`${c.subject}-${c.name}`} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${selectedChapters.some(sc => sc.name === c.name && sc.subject === c.subject) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}>
                        <input type="checkbox" checked={selectedChapters.some(sc => sc.name === c.name && sc.subject === c.subject)} onChange={() => toggleChapter(c)} className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-slate-700 leading-tight">{c.name}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PANE 2: MIDDLE PANE (Global Bank) */}
      <div className="flex-1 flex flex-col bg-slate-100 min-w-0">
        <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" /> Global Bank
          </h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search questions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {selectedChapters.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Select Chapters to Begin</h3>
              <p className="text-slate-500 max-w-sm">Use the left sidebar to select chapters. Questions from the global bank will instantly appear here.</p>
            </div>
          ) : isLoadingQuestions ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Fetching global questions...</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {availableQuestions.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No questions found for the selected chapters in the global bank.</p>
                </div>
              )}
              
              {availableQuestions.filter(q => q.question_text.toLowerCase().includes(searchTerm.toLowerCase())).map(q => {
                const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                return (
                  <div key={q.id} className={`p-5 rounded-2xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-transparent bg-white hover:border-slate-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md uppercase tracking-wider">{q.subject}</span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">{q.chapter_name}</span>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase ${q.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty_level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {q.difficulty_level}
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleQuestion(q)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition ${isSelected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {isSelected ? <><Minus className="w-4 h-4"/> Remove</> : <><Plus className="w-4 h-4"/> Add to Test</>}
                      </button>
                    </div>
                    <div className="text-sm text-slate-800 font-medium leading-relaxed">
                      <MathRenderer text={q.question_text} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PANE 3: RIGHT SIDEBAR (Test Config & Cart) */}
      <div className="w-full md:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 relative">
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white">
          <h2 className="text-lg font-black flex items-center gap-2 mb-1">
            <Save className="w-5 h-5 text-blue-400" /> Test Configuration
          </h2>
          <p className="text-xs text-slate-400">Configure and publish your test</p>
        </div>

        <div className="p-5 space-y-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Test Name</label>
            <input type="text" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Weekly Mock Test 1" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Duration (Min)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar p-3">
          <div className="flex items-center justify-between px-2 mb-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Cart</label>
            <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{selectedQuestions.length} Qs</span>
          </div>
          
          {selectedQuestions.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Cart is empty.</p>
              <p className="text-xs text-slate-400 mt-1">Add questions from the middle pane.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 group relative overflow-hidden">
                  <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase text-blue-600">{q.subject}</span>
                    </div>
                    <span className="text-xs text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{__html: q.question_text.replace(/<[^>]*>?/gm, '')}} />
                  </div>
                  <button onClick={() => toggleQuestion(q)} className="w-7 h-7 rounded bg-red-50 text-red-600 hover:bg-red-500 hover:text-white flex items-center justify-center shrink-0 transition opacity-0 group-hover:opacity-100 absolute right-2 top-2">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Marks</span>
            <span className="text-xl font-black text-slate-800">{selectedQuestions.length * 4} <span className="text-sm font-bold text-slate-400">Pts</span></span>
          </div>
          <button 
            onClick={handlePublish}
            disabled={isSaving || selectedQuestions.length === 0}
            className="w-full py-3.5 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-600/20"
          >
            {isSaving ? <><Loader2 className="w-5 h-5 animate-spin"/> Publishing...</> : <><Save className="w-5 h-5"/> Publish & Assign Test</>}
          </button>
        </div>
      </div>
      
    </div>
  );
}

function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
