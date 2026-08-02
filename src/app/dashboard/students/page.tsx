'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Search, ChevronRight } from 'lucide-react';

const mockStudents = [
  { id: '1', name: 'Atharv Jadhav', batch: 'Batch A - Morning', testsTaken: 12, avgScore: '78%' },
  { id: '2', name: 'Rohan Shinde', batch: 'Batch B - Evening', testsTaken: 8, avgScore: '65%' },
  { id: '3', name: 'Siddhesh Patil', batch: 'Batch A - Morning', testsTaken: 15, avgScore: '92%' },
];

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            My Students
          </h1>
          <p className="text-slate-500 mt-1">Manage and track your enrolled students.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Student Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Batch</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Tests Taken</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Avg Score</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                <td className="px-6 py-4 text-slate-500">{student.batch}</td>
                <td className="px-6 py-4 text-slate-500">{student.testsTaken}</td>
                <td className="px-6 py-4 text-slate-800 font-medium">{student.avgScore}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/dashboard/students/${student.id}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View Profile <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
