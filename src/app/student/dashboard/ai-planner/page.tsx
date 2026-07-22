'use client';

import React, { useEffect, useState } from 'react';
import { BrainCircuit, Target, TrendingUp, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface StudyPlanItem {
  day: number;
  title: string;
  description: string;
}

export default function AIPlannerPage() {
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [weakChapters, setWeakChapters] = useState<string[]>([]);
  const [estimatedRank, setEstimatedRank] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch('/api/student/ai?action=study-plan');
        if (res.ok) {
          const data = await res.json();
          setStudyPlan(data.studyPlan || []);
          setWeakChapters(data.weakChapters || []);
          setEstimatedRank(data.estimatedRank || 'N/A');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAI();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Analyzing your test history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <BrainCircuit className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">AI Intelligence Center</h1>
          <p className="text-indigo-100 font-medium max-w-lg">
            Personalized insights and study plans generated dynamically from your historical test performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rank Predictor */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-800">
            <Target className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight">Predictive Rank</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Based on your historical accuracy and standardized bell-curve models, your estimated JEE rank is:
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
            <div className="text-4xl font-black text-emerald-600 tracking-tighter">
              {estimatedRank}
            </div>
            <p className="text-emerald-700 text-sm font-bold mt-2 uppercase tracking-widest">Expected Rank</p>
          </div>
        </div>

        {/* Weak Chapters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-slate-800">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <h2 className="text-xl font-bold tracking-tight">Focus Areas</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            The AI has identified these chapters as your weakest areas based on your recent test mistakes:
          </p>
          {weakChapters.length === 0 ? (
            <div className="text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl p-4 text-center">
              Not enough data to determine weak chapters.
            </div>
          ) : (
            <div className="space-y-3">
              {weakChapters.map((chap, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 text-rose-800 font-bold text-sm">
                  <div className="w-6 h-6 bg-rose-200 rounded-full flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  {chap}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Study Plan */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 text-slate-800">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight">Your 7-Day Action Plan</h2>
          </div>
          <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 rounded-full border border-indigo-100">
            AI Generated
          </span>
        </div>

        {studyPlan.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">Not enough data to generate a plan. Take a few tests first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {studyPlan.map(item => (
              <div key={item.day} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-slate-200 z-10">
                    D{item.day}
                  </div>
                  {item.day !== 7 && <div className="w-0.5 bg-slate-100 flex-1 my-1"></div>}
                </div>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 pb-5 mb-2 hover:border-indigo-200 hover:shadow-sm transition-all group">
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{item.title}</h3>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
