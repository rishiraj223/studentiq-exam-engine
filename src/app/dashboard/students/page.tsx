'use client';

import React, { useEffect, useState } from 'react';
import { UserPlus, Search, Filter, Loader2, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

type Student = {
  id: string;
  name: string;
  standard: string;
  batch_id: string;
  created_at: string;
  profiles: {
    name: string;
  };
  batches: {
    name: string;
  };
};

type Batch = {
  id: string;
  name: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', batch_id: '', standard: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('id, name');
    if (data) setBatches(data);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        profiles!inner(name),
        batches(name)
      `)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setStudents(data as any);
    }
    setIsLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const { data: profile } = await supabase.from('profiles').select('coaching_id').single();
    if (!profile?.coaching_id) {
      toast.error('Could not verify workspace');
      setIsAdding(false);
      return;
    }

    const response = await fetch('/api/students/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newStudent,
        coaching_id: profile.coaching_id
      })
    });

    const result = await response.json();

    if (response.ok) {
      toast.success('Student added successfully!');
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', batch_id: '', standard: '' });
      fetchStudents();
    } else {
      toast.error('Failed to add student', { description: result.error });
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 ">Students</h2>
          <p className="text-slate-500 ">Manage all registered students in your coaching.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <UserPlus className="w-4 h-4 mr-2" /> Bulk Invite
          </Button>
          <Button variant="primary" className="flex-1 sm:flex-none" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      {showAddModal && (
        <Card className="border-primary-200 bg-primary-50 relative animate-in fade-in slide-in-from-top-4 duration-200">
          <button 
            onClick={() => setShowAddModal(false)}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Student Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required placeholder="John Doe" />
                <Input label="Email Address" type="email" value={newStudent.email} onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} required placeholder="john@example.com" />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Assign to Batch</label>
                  <select 
                    value={newStudent.batch_id} 
                    onChange={(e) => setNewStudent({...newStudent, batch_id: e.target.value})}
                    className="flex h-11 w-full rounded-lg bg-white border border-slate-200 px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <option value="">Select a batch (Optional)</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Standard/Grade" value={newStudent.standard} onChange={(e) => setNewStudent({...newStudent, standard: e.target.value})} placeholder="e.g. 12th" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isAdding}>Create Student Account</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="p-4 border-slate-200 bg-white ">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search students by name or email..." 
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 ">
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Student Name</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Batch</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Standard</th>
                <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                    <p className="text-slate-500">Loading students...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900 ">No students yet</p>
                    <p className="text-slate-500 mb-6">Invite students to join your exam engine.</p>
                    <Button variant="outline" onClick={() => setShowAddModal(true)}>Add First Student</Button>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 :bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900 ">
                      {student.profiles?.name || 'Unknown User'}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="info" className="text-xs">
                        {student.batches?.name || 'Unassigned'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-slate-600 ">
                      {student.standard || '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 :text-white transition-colors rounded-lg hover:bg-slate-100 :bg-white/10">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
