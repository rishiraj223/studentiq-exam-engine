'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/browser';

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'MHT-CET A', 'MHT-CET B'];
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

type CustomQuestion = {
  id: string; // usually q1, q2...
  subject: string;
  text: string;
  imageUrl?: string | null;
  options: {
    A: string; B: string; C: string; D: string;
  };
  correctOption: 'A' | 'B' | 'C' | 'D';
  positiveMarks: number;
  negativeMarks: number;
};

// Client-side image compression utility using Canvas
async function compressImage(file: File, maxSizeKB: number = 150): Promise<File> {
  if (file.size / 1024 <= maxSizeKB) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        // Scale down to max 800px width
        const maxWidth = 800;
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * (scale > 1 ? 1 : scale);
        if (scale > 1) {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let quality = 0.9;
        const attemptCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            if (blob.size / 1024 <= maxSizeKB || quality <= 0.3) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              quality -= 0.1;
              attemptCompress();
            }
          }, 'image/jpeg', quality);
        };
        attemptCompress();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function CustomTestCreator() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Structural State
  const [testName, setTestName] = useState('');
  const [exam, setExam] = useState('JEE Main');
  const [duration, setDuration] = useState<number | string>(60);
  const [dueDate, setDueDate] = useState('');
  
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number>>({
    'Physics': 10,
    'Chemistry': 10,
  });

  // Editor State
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [activeQIndex, setActiveQIndex] = useState(0);

  // Initialize questions array when generating test structure
  const handleGenerateWorkspace = () => {
    if (!testName) return toast.error('Enter a test name');
    const totalQ = Object.values(subjectCounts).reduce((a,b) => a+b, 0);
    if (totalQ === 0) return toast.error('Add at least 1 question count to a subject.');

    const newQuestions: CustomQuestion[] = [];
    let qCounter = 1;

    // Default marks based on exam type (rough estimate)
    const pos = exam.includes('JEE') || exam.includes('NEET') ? 4 : 1;
    const neg = exam.includes('NEET') || exam.includes('JEE Main') ? -1 : 0;

    Object.entries(subjectCounts).forEach(([subj, count]) => {
      for (let i = 0; i < count; i++) {
        newQuestions.push({
          id: `q${qCounter++}`,
          subject: subj,
          text: '',
          options: { A: '', B: '', C: '', D: '' },
          correctOption: 'A',
          positiveMarks: pos,
          negativeMarks: neg,
        });
      }
    });

    setQuestions(newQuestions);
    setStep(2);
  };

  // Image Upload Handler
  const handleImageUpload = async (file: File) => {
    try {
      toast.loading('Compressing & Uploading image...');
      const compressed = await compressImage(file, 150);
      
      const fileName = `${Date.now()}_${compressed.name.replace(/\s+/g, '_')}`;
      const { data, error } = await supabase.storage.from('test-assets').upload(fileName, compressed);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('test-assets').getPublicUrl(data.path);
      toast.dismiss();
      toast.success('Image attached successfully');
      return publicUrl;
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Image upload failed');
      return null;
    }
  };

  const updateActiveQuestion = (data: Partial<CustomQuestion>) => {
    const updated = [...questions];
    updated[activeQIndex] = { ...updated[activeQIndex], ...data };
    setQuestions(updated);
  };

  const handlePublish = async () => {
    // Validate
    const incomplete = questions.find(q => !q.text && !q.imageUrl);
    if (incomplete) return toast.error(`Question ${incomplete.id.toUpperCase()} is empty!`);
    
    setIsSaving(true);
    toast.loading('Generating JSON payload...');

    try {
      const payload = {
        meta: { testName, exam, duration, totalQuestions: questions.length },
        questions
      };

      const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const fileName = `batch_tests/${Date.now()}_${testName.replace(/\s+/g, '_')}.json`;

      // Upload JSON
      toast.loading('Uploading to Storage Bucket...');
      const { data: storageData, error: storageErr } = await supabase.storage.from('custom-tests').upload(fileName, jsonBlob);
      if (storageErr) throw storageErr;

      const { data: { publicUrl } } = supabase.storage.from('custom-tests').getPublicUrl(storageData.path);

      // Save to DB
      toast.loading('Finalizing in Database...');
      const totalMarks = questions.reduce((sum, q) => sum + q.positiveMarks, 0);

      const res = await fetch('/api/admin/assigned-tests/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          examType: exam,
          durationMinutes: Number(duration),
          dueDate: dueDate || null,
          storageUrl: publicUrl,
          totalMarks
        })
      });

      const dbData = await res.json();
      if (!res.ok) throw new Error(dbData.error);

      toast.dismiss();
      toast.success('Custom test created and assigned!');
      router.push('/admin/dashboard/assigned-tests');

    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Publish failed');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mb-1 inline-block">JSON Engine</span>
          <h1 className="text-2xl font-bold text-slate-900">Custom Test Creator</h1>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Test Name</label>
            <input type="text" value={testName} onChange={e => setTestName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Weekly Full Mock 1" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
              <select value={exam} onChange={e => setExam(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                {EXAMS.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Min)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Questions Structural Layout</h3>
            <div className="space-y-3">
              {SUBJECTS.map(subj => (
                <div key={subj} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="font-bold text-slate-700">{subj}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSubjectCounts(prev => ({...prev, [subj]: Math.max(0, (prev[subj]||0)-1)}))} className="w-8 h-8 flex justify-center items-center rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100">-</button>
                    <span className="w-8 text-center font-bold">{subjectCounts[subj] || 0}</span>
                    <button onClick={() => setSubjectCounts(prev => ({...prev, [subj]: (prev[subj]||0)+1}))} className="w-8 h-8 flex justify-center items-center rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={handleGenerateWorkspace} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition">
            Generate Workspace ({Object.values(subjectCounts).reduce((a,b)=>a+b,0)} Questions)
          </button>
        </div>
      )}

      {step === 2 && questions.length > 0 && (
        <div className="flex h-[800px] gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-white font-bold text-lg">Test Layout</h3>
              <p className="text-slate-400 text-xs mt-1">{questions.length} Questions</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {questions.map((q, idx) => (
                <button 
                  key={q.id} 
                  onClick={() => setActiveQIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeQIndex === idx ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  <span>Q{idx + 1} <span className="text-[10px] font-normal opacity-70 uppercase ml-1 block">{q.subject}</span></span>
                  {q.text || q.imageUrl ? <Check className="w-4 h-4 text-emerald-200" /> : <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <button disabled={isSaving} onClick={handlePublish} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5"/> Publish Test</>}
              </button>
            </div>
          </div>

          {/* Editor Workspace */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-black text-xl text-slate-800">Editing Q{activeQIndex + 1}</h2>
              <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">{questions[activeQIndex].subject}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Question Text */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                <textarea 
                  value={questions[activeQIndex].text}
                  onChange={e => updateActiveQuestion({ text: e.target.value })}
                  placeholder="Type the question here..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] resize-y"
                />
              </div>

              {/* Question Image Attachment */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Attach Image (Optional, compressed under 150KB)</label>
                {questions[activeQIndex].imageUrl ? (
                  <div className="relative inline-block border-2 border-slate-200 rounded-xl overflow-hidden group">
                    <img src={questions[activeQIndex].imageUrl!} alt="Question attachment" className="max-h-48 object-contain" />
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateActiveQuestion({ imageUrl: null })} className="px-4 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full md:w-1/2 p-6 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 hover:border-emerald-500 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm font-bold text-slate-600">Upload Image</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      if(e.target.files && e.target.files[0]) {
                        const url = await handleImageUpload(e.target.files[0]);
                        if(url) updateActiveQuestion({ imageUrl: url });
                      }
                    }} />
                  </label>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">Options</label>
                {['A','B','C','D'].map(opt => (
                  <div key={opt} className="flex items-center gap-3">
                    <span className="font-bold text-slate-500 w-6">{opt}.</span>
                    <input 
                      type="text" 
                      value={questions[activeQIndex].options[opt as keyof typeof questions[0]['options']]} 
                      onChange={e => updateActiveQuestion({ options: { ...questions[activeQIndex].options, [opt]: e.target.value }})}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Correct Answer</label>
                  <select 
                    value={questions[activeQIndex].correctOption} 
                    onChange={e => updateActiveQuestion({ correctOption: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 font-bold outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Positive Marks</label>
                  <input 
                    type="number" 
                    value={questions[activeQIndex].positiveMarks} 
                    onChange={e => updateActiveQuestion({ positiveMarks: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Negative Marks</label>
                  <input 
                    type="number" 
                    value={questions[activeQIndex].negativeMarks} 
                    onChange={e => updateActiveQuestion({ negativeMarks: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between">
              <button disabled={activeQIndex === 0} onClick={() => setActiveQIndex(p => p-1)} className="px-6 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 disabled:opacity-50">Previous</button>
              <button disabled={activeQIndex === questions.length - 1} onClick={() => setActiveQIndex(p => p+1)} className="px-6 py-2 bg-slate-900 rounded-lg font-bold text-white disabled:opacity-50">Next Question</button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for custom scrollbar in sidebar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}} />
    </div>
  );
}
