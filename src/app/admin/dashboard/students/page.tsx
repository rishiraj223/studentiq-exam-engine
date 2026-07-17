'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, ChevronRight, Loader2, BookOpen, Award, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Student = {
  id: string;
  name: string;
  roll_no: string;
  parent_phone: string;
  batch: string;
  standard: string;
  created_at: string;
  testsTaken: number;
  avgScore: number;
  lastActive: string | null;
};

const BATCH_COLORS: Record<string, string> = {
  JEE:    'bg-blue-100 text-blue-700 border-blue-200',
  NEET:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  'CET A': 'bg-violet-100 text-violet-700 border-violet-200',
  'CET B': 'bg-amber-100 text-amber-700 border-amber-200',
};

function getBatchColor(batch: string) {
  return BATCH_COLORS[batch] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStandard, setActiveStandard] = useState<'11th' | '12th'>('11th');
  const [activeBatch, setActiveBatch] = useState<string>('All');

  const fetchStudents = useCallback(async (standard: string) => {
    setIsLoading(true);
    setSearchTerm('');
    setActiveBatch('All');
    try {
      const res = await fetch(`/api/admin/students?standard=${standard}`);
      const data = await res.json();
      setStudents(data.students || []);
      setBatches(data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(activeStandard);
  }, [activeStandard, fetchStudents]);

  const filtered = students.filter(s => {
    const matchesBatch = activeBatch === 'All' || s.batch === activeBatch;
    const matchesSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batch?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
          <p className="text-slate-500 mt-1">Track performance and manage your enrolled students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll, batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-60 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Standard Tabs + Batch Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Standard Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['11th', '12th'] as const).map(std => (
            <button
              key={std}
              onClick={() => setActiveStandard(std)}
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                activeStandard === std
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Class {std}
            </button>
          ))}
        </div>

        {/* Batch Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {['All', ...batches].map(batch => (
            <button
              key={batch}
              onClick={() => setActiveBatch(batch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeBatch === batch
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {batch}
            </button>
          ))}
        </div>
      </div>

      {/* Student Count Badge */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-4 h-4" />
          <span>
            Showing <span className="font-bold text-slate-900">{filtered.length}</span> students
            {activeBatch !== 'All' && <> in <span className="font-bold text-blue-700">{activeBatch}</span></>}
            {' '}• Class <span className="font-bold text-slate-900">{activeStandard}</span>
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-400 font-medium">Loading students...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <AlertCircle className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No students found</p>
          <p className="text-sm text-slate-400">
            {searchTerm ? `No results for "${searchTerm}"` : `No students in Class ${activeStandard}${activeBatch !== 'All' ? ` (${activeBatch})` : ''}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 w-16">Roll No</th>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4 text-center">Tests Taken</th>
                  <th className="px-5 py-4">Avg Score</th>
                  <th className="px-5 py-4">Last Active</th>
                  <th className="px-5 py-4 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/admin/dashboard/students/${student.id}`)}
                  >
                    {/* Roll No */}
                    <td className="px-5 py-4">
                      <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-sm">
                        {student.roll_no}
                      </span>
                    </td>

                    {/* Name + Avatar */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {student.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.parent_phone || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Batch */}
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getBatchColor(student.batch)}`}>
                        {student.batch || 'N/A'}
                      </span>
                    </td>

                    {/* Tests Taken */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{student.testsTaken}</span>
                      </div>
                    </td>

                    {/* Avg Score */}
                    <td className="px-5 py-4">
                      {student.testsTaken > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                student.avgScore >= 80 ? 'bg-emerald-500' :
                                student.avgScore >= 60 ? 'bg-blue-500' :
                                student.avgScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${student.avgScore}%` }}
                            />
                          </div>
                          <span className={`font-bold text-sm ${
                            student.avgScore >= 80 ? 'text-emerald-600' :
                            student.avgScore >= 60 ? 'text-blue-600' :
                            student.avgScore >= 40 ? 'text-amber-600' : 'text-rose-500'
                          }`}>
                            {student.avgScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium">—</span>
                      )}
                    </td>

                    {/* Last Active */}
                    <td className="px-5 py-4 text-xs font-medium">
                      {student.lastActive ? (
                        <span className="text-slate-500">{timeAgo(student.lastActive)}</span>
                      ) : (
                        <span className="text-slate-300">Never</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-5 py-4">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
