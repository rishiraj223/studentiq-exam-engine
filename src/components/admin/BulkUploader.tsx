'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react';

interface ParsedQuestion {
  exam_type: string;
  standard: string;
  subject: string;
  chapter: string;
  difficulty: string;
  year: number | null;
  marks: number;
  negative_marks: number;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation: string | null;
  image_url: string | null;
  _rowNumber: number;
}

export function BulkUploader({ onBack }: { onBack: () => void }) {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file.');
      return;
    }
    setFile(file);
    setUploadSuccess(false);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    setIsParsing(true);
    setErrors([]);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const validQuestions: ParsedQuestion[] = [];
        const foundErrors: string[] = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +2 because header is 1, and 0-index
          
          // Basic validation
          if (!row.Exam || !row.Subject || !row.Standard || !row.Chapter || !row.Question) {
            foundErrors.push(`Row ${rowNum}: Missing critical taxonomy (Exam, Subject, Standard, Chapter, Question)`);
            return;
          }

          if (!row.Option_A || !row.Option_B || !row.Option_C || !row.Option_D) {
            foundErrors.push(`Row ${rowNum}: Missing one or more options (A, B, C, D)`);
            return;
          }

          const ansMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          let correct_answer_index = -1;
          const rawAns = row.Correct_Answer?.trim().toUpperCase();
          if (ansMap[rawAns] !== undefined) {
            correct_answer_index = ansMap[rawAns];
          } else {
            foundErrors.push(`Row ${rowNum}: Invalid Correct_Answer "${rawAns}". Must be A, B, C, or D.`);
            return;
          }

          // Defaults
          const isCET = row.Exam === 'MHT-CET A' || row.Exam === 'MHT-CET B';
          let defaultMarks = 4;
          let defaultNeg = 1;
          if (isCET) {
            defaultNeg = 0;
            defaultMarks = (row.Exam === 'MHT-CET A' && row.Subject === 'Mathematics') ? 2 : 1;
          }

          const yearParsed = parseInt(row.Year);

          validQuestions.push({
            exam_type: row.Exam,
            standard: row.Standard,
            subject: row.Subject,
            chapter: row.Chapter,
            difficulty: row.Difficulty ? row.Difficulty.toLowerCase() : 'medium',
            year: isNaN(yearParsed) ? null : yearParsed,
            marks: parseFloat(row.Marks) || defaultMarks,
            negative_marks: parseFloat(row.Negative_Marks) || defaultNeg,
            question_text: row.Question,
            options: [row.Option_A, row.Option_B, row.Option_C, row.Option_D],
            correct_answer_index,
            explanation: row.Explanation || null,
            image_url: row.Image_URL && row.Image_URL !== '[NEEDS IMAGE]' ? row.Image_URL : null,
            _rowNumber: rowNum
          });
        });

        setParsedData(validQuestions);
        setErrors(foundErrors);
        setIsParsing(false);
      },
      error: (error: Error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
        setIsParsing(false);
      }
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    try {
      // 1. Fetch existing questions to prevent duplicates
      const questionTexts = parsedData.map(q => q.question_text);
      
      // We chunk the query if there are too many questions, but for normal CSVs (e.g. 50-100) this is fine.
      const { data: existingData, error: fetchError } = await supabase
        .from('questions')
        .select('question_text')
        .in('question_text', questionTexts);

      if (fetchError) throw fetchError;

      const existingTexts = new Set(existingData?.map(q => q.question_text) || []);

      // 2. Filter out duplicates
      const uniqueQuestions = parsedData.filter(q => !existingTexts.has(q.question_text));
      const duplicateCount = parsedData.length - uniqueQuestions.length;

      if (uniqueQuestions.length === 0) {
        toast.error(`All ${duplicateCount} questions already exist in the database!`);
        setIsUploading(false);
        return;
      }

      // 3. Clean out _rowNumber before insert
      const insertData = uniqueQuestions.map(q => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _rowNumber, ...dbData } = q;
        return dbData;
      });

      // 4. Insert unique questions
      const { error: insertError } = await supabase.from('questions').insert(insertData);

      if (insertError) throw insertError;

      toast.success(
        `Successfully added ${uniqueQuestions.length} questions!` +
        (duplicateCount > 0 ? ` (Skipped ${duplicateCount} duplicates)` : '')
      );
      
      setUploadSuccess(true);
      setParsedData([]);
      setFile(null);
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bulk Upload CSV</h1>
          <p className="text-slate-500 mt-1">Upload a CSV file containing multiple questions to sort and save instantly.</p>
        </div>
        <Button variant="outline" onClick={onBack}>Cancel / Go Back</Button>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-primary-400 cursor-pointer transition-all m-6 rounded-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-500 mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Click to upload or drag and drop</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm text-center">
                CSV file only. Please ensure it follows the strict columns required by the database.
              </p>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && processFile(e.target.files[0])} 
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setParsedData([]); setErrors([]); }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isParsing ? (
                <div className="text-center py-8 text-slate-500">Parsing CSV...</div>
              ) : (
                <div className="space-y-6">
                  {errors.length > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                      <div className="flex items-center gap-2 text-rose-800 font-bold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        Found {errors.length} error(s) in the CSV
                      </div>
                      <ul className="list-disc pl-5 text-sm text-rose-700 space-y-1 max-h-40 overflow-y-auto">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                      <p className="text-xs text-rose-600 mt-3 font-semibold">Please fix these rows in your CSV and re-upload. Valid rows will still be imported.</p>
                    </div>
                  )}

                  {parsedData.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                        Ready to import {parsedData.length} valid questions
                      </div>
                      <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-semibold text-slate-700">
                            <tr>
                              <th className="p-3">Exam</th>
                              <th className="p-3">Subject</th>
                              <th className="p-3">Chapter</th>
                              <th className="p-3">Preview</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.map(q => (
                              <tr key={q._rowNumber} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="p-3">{q.exam_type}</td>
                                <td className="p-3">{q.subject}</td>
                                <td className="p-3">{q.chapter}</td>
                                <td className="p-3 truncate max-w-xs">{q.question_text.substring(0, 50)}...</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <Button variant="primary" size="lg" onClick={handleUpload} isLoading={isUploading}>
                          <UploadCloud className="w-4 h-4 mr-2" />
                          Import {parsedData.length} Questions to Database
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
