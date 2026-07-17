'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, ChevronRight, Loader2 } from 'lucide-react';
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

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/admin/students');
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Students</h1>
          <p className="text-slate-500 mt-1">Track performance and manage your enrolled students.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll, batch..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Tests Taken</th>
                  <th className="px-6 py-4">Avg Score</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/dashboard/students/${student.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {student.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-400">Roll: {student.roll_no}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {student.batch || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {student.testsTaken}
                      </td>
                      <td className="px-6 py-4">
                        {student.testsTaken > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${student.avgScore >= 80 ? 'bg-emerald-500' : student.avgScore >= 60 ? 'bg-blue-500' : student.avgScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${student.avgScore}%` }} />
                            </div>
                            <span className="font-bold text-slate-900">{student.avgScore}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
