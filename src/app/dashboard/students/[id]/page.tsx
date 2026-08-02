'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Activity, Target } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;
  
  // Mock Data based on ID
  const studentName = studentId === '1' ? 'Atharv Jadhav' : studentId === '2' ? 'Rohan Shinde' : 'Siddhesh Patil';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/students" className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{studentName}'s Profile</h1>
          <p className="text-slate-500 mt-1">Detailed performance and behavioral analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Spent Analysis */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Time Spent Analysis
            </h2>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Recent Mock Test (Physics)</option>
              <option>Electrostatics Weekly</option>
            </select>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Question Category</span>
              <span>Average Time Spent</span>
            </div>
            {/* Mock Chart Bars */}
            {[
              { label: 'Easy Questions', time: '45s', width: '30%', color: 'bg-emerald-400' },
              { label: 'Medium Questions', time: '1m 20s', width: '50%', color: 'bg-blue-400' },
              { label: 'Hard Questions', time: '3m 15s', width: '85%', color: 'bg-rose-400' },
              { label: 'Unattempted (Reading Time)', time: '10s', width: '10%', color: 'bg-slate-300' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                  <span>{stat.label}</span>
                  <span>{stat.time}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color} rounded-full`} style={{ width: stat.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Overall Accuracy</div>
                <div className="text-xl font-bold text-slate-800">68%</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Pace (vs Batch Avg)</div>
                <div className="text-xl font-bold text-slate-800 text-rose-500">12% Slower</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
