'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/browser';
import { UploadCloud, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { Question } from '@/types';

type ParsedQuestion = Omit<Question, 'id'>;

export function QuestionUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ total: number; success: number; failed: number; duplicates: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const downloadTemplate = () => {
    const template = "subject,chapter,topic,difficulty,exam_type,year,marks,negative_marks,text,option_1,option_2,option_3,option_4,correct_answer,explanation,image_url\nPhysics,Mechanics,Kinematics,medium,JEE Main,2023,4,1,A car travels at 20m/s...,10,20,30,40,2,Because v=d/t,";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'question_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as any[];
        let successCount = 0;
        let duplicateCount = 0;
        let failCount = 0;

        // Get current user's coaching_id first
        const { data: profile } = await supabase
          .from('profiles')
          .select('coaching_id')
          .single();

        if (!profile?.coaching_id) {
          toast.error('Could not find your coaching workspace. Please log in again.');
          setIsUploading(false);
          return;
        }

        const coachingId = profile.coaching_id;

        for (const row of rawData) {
          try {
            // Basic validation
            if (!row.subject || !row.chapter || !row.text || !row.exam_type || !row.difficulty) {
              failCount++;
              continue;
            }

            // Construct options array
            const options = [row.option_1, row.option_2, row.option_3, row.option_4].filter(Boolean);
            if (options.length < 2) {
              failCount++;
              continue; // Need at least 2 options
            }

            // Duplicate detection: check if question with exact text and subject exists
            const { data: existing } = await supabase
              .from('questions')
              .select('id')
              .eq('subject', row.subject)
              .eq('text', row.text)
              .single();

            if (existing) {
              duplicateCount++;
              continue; // Skip duplicate
            }

            // Insert new question with coaching_id
            const questionData = {
              subject: row.subject,
              chapter: row.chapter,
              topic: row.topic || null,
              difficulty: row.difficulty,
              exam_type: row.exam_type,
              year: row.year ? parseInt(row.year) : null,
              text: row.text,
              options: options,
              correct_answer: parseInt(row.correct_answer) - 1,
              explanation: row.explanation || null,
              image_url: row.image_url || null,
              marks: parseInt(row.marks) || 4,
              negative_marks: parseInt(row.negative_marks) || 1,
              coaching_id: coachingId,
            };

            const { error } = await supabase.from('questions').insert(questionData);
            if (error) {
              console.error('Insert error:', error);
              failCount++;
            } else {
              successCount++;
            }
          } catch (err) {
            failCount++;
          }
        }

        setIsUploading(false);
        setResults({ total: rawData.length, success: successCount, failed: failCount, duplicates: duplicateCount });
        
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} questions`);
        } else if (successCount === 0 && rawData.length > 0) {
          toast.error("No questions were imported. Please check the CSV format.");
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error: any) => {
        toast.error('Failed to parse CSV file: ' + error.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Questions</h2>
          <p className="text-slate-500 ">Import hundreds of PYQs instantly via CSV or Excel.</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV Template
        </Button>
      </div>

      <Card className="border-2 border-dashed border-slate-300 bg-slate-50 hover:border-primary-500 transition-colors">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="text-lg font-medium text-slate-700 ">Processing Upload...</p>
                <p className="text-sm text-slate-500">Checking for duplicates and validating fields</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-8 h-8 text-primary-600 " />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Drag & Drop CSV</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                  Upload your questions using the provided template format. Duplicates will be safely skipped.
                </p>
                
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                
                <Button onClick={() => fileInputRef.current?.click()} size="lg" className="px-8">
                  Browse Files
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8 animate-slide-up">
          <Card className="border-slate-200 ">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-slate-800 ">{results.total}</span>
              <span className="text-sm text-slate-500 mt-1">Total Found</span>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50 ">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> {results.success}
              </span>
              <span className="text-sm text-emerald-600 mt-1">Imported</span>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 ">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" /> {results.duplicates}
              </span>
              <span className="text-sm text-amber-600 mt-1">Skipped (Duplicate)</span>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50 ">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <span className="text-3xl font-bold text-rose-600 ">{results.failed}</span>
              <span className="text-sm text-rose-600 mt-1">Failed (Invalid)</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
