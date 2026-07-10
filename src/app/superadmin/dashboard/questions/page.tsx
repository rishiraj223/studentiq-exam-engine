'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  ChevronRight, ChevronLeft, Save, RotateCcw,
  Atom, FlaskConical, Calculator, Leaf, X, CheckCircle2, Eye, UploadCloud, PlusCircle, BarChart3
} from 'lucide-react';
import { BulkUploader } from '@/components/admin/BulkUploader';
import { useRouter } from 'next/navigation';

// ==================== CONSTANTS ====================
const EXAMS = [
  { id: 'JEE Main', label: 'JEE Main', color: 'from-blue-500 to-blue-700', desc: 'NCERT Based · PCM' },
  { id: 'JEE Advanced', label: 'JEE Advanced', color: 'from-indigo-500 to-indigo-700', desc: 'Advanced Level · PCM' },
  { id: 'NEET', label: 'NEET', color: 'from-emerald-500 to-emerald-700', desc: 'NCERT Based · PCB' },
  { id: 'MHT-CET A', label: 'MHT-CET A', color: 'from-orange-500 to-orange-700', desc: 'Maharashtra Board · PCM' },
  { id: 'MHT-CET B', label: 'MHT-CET B', color: 'from-rose-500 to-rose-700', desc: 'Maharashtra Board · PCB' },
];

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom className="w-6 h-6" />,
  Chemistry: <FlaskConical className="w-6 h-6" />,
  Mathematics: <Calculator className="w-6 h-6" />,
  Biology: <Leaf className="w-6 h-6" />,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'from-blue-400 to-blue-600',
  Chemistry: 'from-green-400 to-green-600',
  Mathematics: 'from-purple-400 to-purple-600',
  Biology: 'from-emerald-400 to-emerald-600',
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// ==================== MAIN PAGE ====================
export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  // Step state (1=exam, 2=subject, 3=chapter, 4=question entry)
  const [step, setStep] = useState(1);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // Available subjects/chapters (fetched from DB)
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<{ name: string; chapter_number: number }[]>([]);

  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [year, setYear] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [marks, setMarks] = useState('4');
  const [negativeMarks, setNegativeMarks] = useState('1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Tab state for step 4
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [storedQuestions, setStoredQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // ==================== FETCH SUBJECTS ====================
  useEffect(() => {
    if (!selectedExam) return;
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('subject')
        .eq('exam_type', selectedExam)
        .eq('is_active', true);
      if (data) {
        const unique = [...new Set(data.map(d => d.subject))];
        setSubjects(unique);
      }
    };
    fetchSubjects();
  }, [selectedExam]);

  // ==================== AUTO-SET MARKS BASED ON EXAM + SUBJECT ====================
  useEffect(() => {
    if (!selectedExam || !selectedSubject) return;
    const isCET = selectedExam === 'MHT-CET A' || selectedExam === 'MHT-CET B';
    if (isCET) {
      setNegativeMarks('0');
      if (selectedExam === 'MHT-CET A' && selectedSubject === 'Mathematics') {
        setMarks('2');
      } else {
        setMarks('1');
      }
    } else {
      setMarks('4');
      setNegativeMarks('1');
    }
  }, [selectedExam, selectedSubject]);

  // ==================== FETCH CHAPTERS ====================
  useEffect(() => {
    if (!selectedExam || !selectedSubject || !selectedStandard) return;
    const fetchChapters = async () => {
      const { data } = await supabase
        .from('chapters')
        .select('name, chapter_number')
        .eq('exam_type', selectedExam)
        .eq('subject', selectedSubject)
        .eq('standard', selectedStandard)
        .eq('is_active', true)
        .order('chapter_number');
      if (data) setChapters(data);
    };
    fetchChapters();
  }, [selectedExam, selectedSubject, selectedStandard]);

  // ==================== FETCH STORED QUESTIONS ====================
  const fetchStoredQuestions = async () => {
    setIsLoadingQuestions(true);
    const { data } = await supabase
      .from('questions')
      .select('id, question_text, options, correct_answer_index, difficulty, year')
      .eq('exam_type', selectedExam)
      .eq('subject', selectedSubject)
      .eq('standard', selectedStandard)
      .eq('chapter', selectedChapter)
      .order('created_at', { ascending: false });
    if (data) setStoredQuestions(data);
    setIsLoadingQuestions(false);
  };

  // ==================== IMAGE HANDLER ====================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024) {
      toast.error('Image too large!', { description: `${(file.size / 1024).toFixed(1)}KB uploaded. Max is 25KB.` });
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ==================== RESET FORM (Keep Context) ====================
  const getDefaultMarks = () => {
    const isCET = selectedExam === 'MHT-CET A' || selectedExam === 'MHT-CET B';
    if (isCET) {
      return {
        marks: selectedExam === 'MHT-CET A' && selectedSubject === 'Mathematics' ? '2' : '1',
        neg: '0',
      };
    }
    return { marks: '4', neg: '1' };
  };

  const resetForm = () => {
    const defaults = getDefaultMarks();
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(null);
    setExplanation('');
    setYear('');
    setDifficulty('medium');
    setMarks(defaults.marks);
    setNegativeMarks(defaults.neg);
    clearImage();
  };

  // ==================== SAVE QUESTION ====================
  const handleSave = async () => {
    if (!questionText.trim()) { toast.error('Question text is required'); return; }
    if (options.some(o => !o.trim())) { toast.error('All 4 options must be filled'); return; }
    if (correctIndex === null) { toast.error('Please select the correct answer'); return; }

    setIsSaving(true);
    let imageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const filename = `${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('question_images')
        .upload(filename, imageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        toast.error('Image upload failed', { description: uploadError.message });
        setIsSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('question_images').getPublicUrl(uploadData.path);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('questions').insert({
      exam_type: selectedExam,
      standard: selectedStandard,
      subject: selectedSubject,
      chapter: selectedChapter,
      difficulty,
      year: year ? parseInt(year) : null,
      marks: parseFloat(marks) || 4,
      negative_marks: parseFloat(negativeMarks) || 0,
      question_text: questionText,
      options,
      correct_answer_index: correctIndex,
      explanation: explanation || null,
      image_url: imageUrl,
    });

    if (error) {
      toast.error('Failed to save question', { description: error.message });
    } else {
      setSavedCount(c => c + 1);
      toast.success('Question saved! Add the next one.', { duration: 2000 });
      resetForm();
    }
    setIsSaving(false);
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {savedCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> {savedCount} saved this session
            </span>
          )}
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold tracking-widest uppercase">
            Super Admin
          </span>
          <Button variant="outline" size="sm" onClick={() => setIsBulkMode(true)} className="ml-2 bg-white">
            <UploadCloud className="w-4 h-4 mr-2" /> Bulk CSV Upload
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push('/admin/create-test')}>
            <PlusCircle className="w-4 h-4 mr-2" /> Create Test
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/manage-tests')} className="bg-white">
            <BarChart3 className="w-4 h-4 mr-2" /> Manage Tests
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {isBulkMode ? (
          <BulkUploader onBack={() => setIsBulkMode(false)} />
        ) : (
          <>
            {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 flex-wrap">
          <button onClick={() => { setStep(1); setSelectedExam(''); setSelectedSubject(''); setSelectedStandard(''); setSelectedChapter(''); setSavedCount(0); setActiveTab('add'); }} className="font-medium text-primary-600 hover:text-primary-700">Exam</button>
          {selectedExam && <><ChevronRight className="w-4 h-4" /><button onClick={() => { setStep(2); setSelectedSubject(''); setSelectedStandard(''); setSelectedChapter(''); }} className="font-medium text-primary-600 hover:text-primary-700">{selectedExam}</button></>}
          {selectedSubject && <><ChevronRight className="w-4 h-4" /><button onClick={() => { setStep(3); setSelectedChapter(''); }} className="font-medium text-primary-600 hover:text-primary-700">{selectedSubject}</button></>}
          {selectedChapter && <><ChevronRight className="w-4 h-4" /><span className="text-slate-800 font-semibold">{selectedChapter}</span></>}
        </div>

        {/* ===== STEP 1: SELECT EXAM ===== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Select Exam</h1>
              <p className="text-slate-500 mt-1">Choose the exam for which you are adding questions.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXAMS.map(exam => (
                <button key={exam.id} onClick={() => { setSelectedExam(exam.id); setStep(2); }}
                  className="text-left group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`bg-gradient-to-br ${exam.color} p-6`}>
                    <h3 className="text-2xl font-bold text-white">{exam.label}</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-500">{exam.desc}</p>
                    <div className="flex items-center text-primary-600 text-sm font-medium mt-2">
                      Select <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 2: SELECT SUBJECT ===== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Select Subject</h1>
                <p className="text-slate-500 mt-1">Which subject is this question from?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subjects.map(subject => (
                <button key={subject} onClick={() => { setSelectedSubject(subject); setStep(3); }}
                  className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[subject] || 'from-slate-400 to-slate-600'} flex items-center justify-center text-white shadow-lg`}>
                    {SUBJECT_ICONS[subject] || <Atom className="w-6 h-6" />}
                  </div>
                  <span className="font-semibold text-slate-800">{subject}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== STEP 3: SELECT STANDARD + CHAPTER ===== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(2)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Select Chapter</h1>
                <p className="text-slate-500 mt-1">Pick the standard and chapter for this batch of questions.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Standard</p>
              <div className="flex gap-3">
                {['11th', '12th'].map(std => (
                  <button key={std} onClick={() => setSelectedStandard(std)}
                    className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all ${selectedStandard === std ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'}`}>
                    Class {std}
                  </button>
                ))}
              </div>
            </div>
            {selectedStandard && (
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Chapter</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chapters.map(ch => (
                    <button key={ch.name} onClick={() => { setSelectedChapter(ch.name); setActiveTab('add'); setStep(4); }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50 transition-all text-left group">
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 text-sm font-bold group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors flex-shrink-0">
                        {ch.chapter_number}
                      </span>
                      <span className="text-slate-800 font-medium text-sm">{ch.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 ml-auto transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: ADD / VIEW QUESTIONS ===== */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => setStep(3)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900">{selectedChapter}</h1>
                <p className="text-slate-500 text-sm mt-0.5">{selectedExam} · {selectedSubject} · Class {selectedStandard}</p>
              </div>
              {savedCount > 0 && (
                <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {savedCount} saved ✓
                </span>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              <button onClick={() => setActiveTab('add')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'add' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                + Add Question
              </button>
              <button onClick={() => { setActiveTab('view'); fetchStoredQuestions(); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                📋 View Stored Questions
              </button>
            </div>

            {/* ===== VIEW TAB ===== */}
            {activeTab === 'view' && (
              <div className="space-y-4">
                {isLoadingQuestions ? (
                  <div className="text-center py-12 text-slate-500">Loading questions...</div>
                ) : storedQuestions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <p className="text-slate-500">No questions added yet for this chapter.</p>
                    <button onClick={() => setActiveTab('add')} className="mt-3 text-primary-600 text-sm font-medium hover:underline">Add the first one →</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 font-medium">{storedQuestions.length} question{storedQuestions.length !== 1 ? 's' : ''} stored in this chapter</p>
                    {storedQuestions.map((q, idx) => (
                      <Card key={q.id} className="border-slate-200 bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Q{idx + 1}</span>
                            <div className="flex gap-2">
                              {q.year && <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded">{q.year}</span>}
                              <span className={`text-xs font-medium px-2 py-1 rounded ${q.difficulty === 'hard' ? 'bg-rose-50 text-rose-700' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-slate-800 leading-relaxed mb-4">
                            <MathRenderer text={q.question_text} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(q.options as string[]).map((opt: string, oi: number) => (
                              <div key={oi} className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${oi === q.correct_answer_index ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
                                <span className="font-bold flex-shrink-0 text-slate-500">{String.fromCharCode(65 + oi)}.</span>
                                <span className={oi === q.correct_answer_index ? 'text-emerald-800' : 'text-slate-700'}><MathRenderer text={opt} /></span>
                                {oi === q.correct_answer_index && <span className="ml-auto text-emerald-600 flex-shrink-0 font-bold">✓</span>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== ADD TAB ===== */}
            {activeTab === 'add' && (
              <>
                <Card className="border-slate-200 bg-white">
                  <CardContent className="p-6 space-y-6">

                    {/* Question Text */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Question Text <span className="text-slate-400 font-normal">(use $...$ for inline math, $$...$$ for block math)</span>
                      </label>
                      <textarea
                        value={questionText}
                        onChange={e => setQuestionText(e.target.value)}
                        rows={4}
                        placeholder="e.g. 5 moles of $AB_2$ weigh $125 \times 10^{-3}$ kg. Find molar mass."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-y font-mono"
                      />
                      {questionText && (
                        <div className="flex items-start gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <Eye className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-slate-800 leading-relaxed">
                            <MathRenderer text={questionText} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">
                        Options <span className="text-slate-400 font-normal">(click the circle to mark correct answer)</span>
                      </label>
                      {options.map((opt, idx) => (
                        <div key={idx} className={`rounded-xl border-2 p-3 transition-all ${correctIndex === idx ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setCorrectIndex(idx)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${correctIndex === idx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-primary-400'}`}>
                              {correctIndex === idx && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </button>
                            <span className="text-sm font-bold text-slate-400 w-6">{String.fromCharCode(65 + idx)}.</span>
                            <input
                              value={opt}
                              onChange={e => { const n = [...options]; n[idx] = e.target.value; setOptions(n); }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)} — use $...$ for math`}
                              className="flex-1 text-sm text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 font-mono"
                            />
                          </div>
                          {opt && (
                            <div className="mt-2 ml-12 text-sm text-slate-700 border-t border-slate-100 pt-2">
                              <MathRenderer text={opt} />
                            </div>
                          )}
                        </div>
                      ))}
                      {correctIndex === null && <p className="text-xs text-amber-600">⚠ Click a circle to select the correct answer</p>}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Diagram Image <span className="text-slate-400 font-normal">(optional · max 25KB · JPG or PNG)</span>
                      </label>
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img src={imagePreview} alt="preview" className="h-32 rounded-xl border border-slate-200 object-contain bg-slate-50" />
                          <button onClick={clearImage} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => imageInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 text-sm font-medium transition-all">
                          🖼 Upload Diagram Image
                        </button>
                      )}
                      <input type="file" accept="image/jpeg,image/png" className="hidden" ref={imageInputRef} onChange={handleImageSelect} />
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Explanation <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={explanation}
                        onChange={e => setExplanation(e.target.value)}
                        rows={2}
                        placeholder="Explain the correct answer... (LaTeX supported)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors resize-y font-mono"
                      />
                      {explanation && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                          <Eye className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-slate-700 leading-relaxed">
                            <MathRenderer text={explanation} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</label>
                        <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2023"
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty</label>
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marks</label>
                        <input type="number" value={marks} onChange={e => setMarks(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Neg. Marks</label>
                        <input type="number" step="0.25" value={negativeMarks} onChange={e => setNegativeMarks(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex gap-4">
                  <Button variant="primary" size="lg" onClick={handleSave} isLoading={isSaving} className="flex-1 md:flex-none md:px-12">
                    <Save className="w-4 h-4 mr-2" /> Save &amp; Add Next
                  </Button>
                  <Button variant="outline" size="lg" onClick={resetForm}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Clear Form
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
