'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, PlusCircle, Download, MessageCircle, Filter } from 'lucide-react';

const mockTests = [
  { id: '101', title: 'Auto JEE Main Test - 01 Aug 2026', batch: 'Batch A - Morning', status: 'completed', date: '01 Aug 2026', students: 45 },
  { id: '102', title: 'Electrostatics mock', batch: 'All Batches', status: 'published', date: '03 Aug 2026', students: 120 },
  { id: '103', title: 'Integration Weekly', batch: 'Batch B - Evening', status: 'draft', date: '-', students: 0 },
];

export default function AssignedTestsPage() {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');

  const filteredTests = selectedBatch === 'All Batches' 
    ? mockTests 
    : mockTests.filter(t => t.batch === selectedBatch || t.batch === 'All Batches');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Assigned Tests
          </h1>
          <p className="text-slate-500 mt-1">Manage tests assigned to your batches.</p>
        </div>
        
        <Link 
          href="/dashboard/tests/create"
          className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Assign New Test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
          <Filter className="w-4 h-4" />
          Filter by Batch:
        </div>
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

      {/* Tests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTests.map(test => (
          <div key={test.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-slate-800 text-lg">{test.title}</h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  test.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                  test.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-500'
                }`}>{test.status}</span>
              </div>
              <div className="text-sm text-slate-500 flex items-center gap-4">
                <span>Batch: <strong className="text-slate-700">{test.batch}</strong></span>
                <span>•</span>
                <span>Date: {test.date}</span>
                <span>•</span>
                <span>Students: {test.students}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {test.status === 'completed' && (
                <>
                  <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" />
                    Result PDF
                  </button>
                  <a 
                    href={`https://wa.me/?text=Results for ${test.title} are now available. Please check the portal.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Send WhatsApp Notification"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </>
              )}
              <Link href={`/dashboard/tests/${test.id}`} className="px-4 py-2 border border-slate-200 hover:border-primary-500 hover:text-primary-600 rounded-xl transition-colors text-sm font-medium text-slate-600">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
