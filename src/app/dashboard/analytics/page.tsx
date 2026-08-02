'use client';

import React, { useState } from 'react';
import { BarChart3, Filter, AlertTriangle, Lightbulb } from 'lucide-react';

const mockMicroConcepts = [
  { concept: 'Gauss Law Applications', score: '35%', status: 'weak', studentsAffected: 24 },
  { concept: 'Electric Dipole Moment', score: '42%', status: 'weak', studentsAffected: 18 },
  { concept: 'Work done by Electric Field', score: '55%', status: 'average', studentsAffected: 10 },
  { concept: 'Coulomb Force Vector Form', score: '85%', status: 'strong', studentsAffected: 2 },
];

export default function AnalyticsPage() {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [selectedTest, setSelectedTest] = useState('All Tests');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Advanced Analytics
          </h1>
          <p className="text-slate-500 mt-1">Deep dive into performance metrics and identify learning gaps.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        
        <select 
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="All Tests">All Tests</option>
          <option value="Electrostatics mock">Electrostatics mock</option>
          <option value="Auto JEE Main Test">Auto JEE Main Test</option>
        </select>

        <select 
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="All Batches">All Batches</option>
          <option value="Batch A - Morning">Batch A - Morning</option>
          <option value="Batch B - Evening">Batch B - Evening</option>
        </select>
      </div>

      {/* Micro-Concept Weakness Detection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Micro-Concept Weakness Detection
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              AI-identified specific sub-topics where students in {selectedBatch} are struggling the most.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMicroConcepts.map((concept, idx) => (
            <div key={idx} className={`border rounded-xl p-4 flex items-start gap-4 ${concept.status === 'weak' ? 'border-rose-200 bg-rose-50/50' : concept.status === 'average' ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
              <div className={`p-2 rounded-lg ${concept.status === 'weak' ? 'bg-rose-100 text-rose-600' : concept.status === 'average' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{concept.concept}</h3>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-slate-600">Average Score: <strong className={concept.status === 'weak' ? 'text-rose-600' : ''}>{concept.score}</strong></span>
                  <span className="text-slate-500">{concept.studentsAffected} students affected</span>
                </div>
                {concept.status === 'weak' && (
                  <div className="mt-3 text-xs text-rose-600 bg-rose-100/50 px-3 py-2 rounded-lg font-medium">
                    Recommendation: Assign remedial material or schedule a doubt session for this micro-concept.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
