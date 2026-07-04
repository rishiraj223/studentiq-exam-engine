'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

type Batch = {
  id: string;
  name: string;
  created_at: string;
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setBatches(data);
    }
    setIsLoading(false);
  };

  const createBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    setIsCreating(true);
    
    // Get current user's coaching_id from profile
    const { data: profile } = await supabase.from('profiles').select('coaching_id').single();
    
    if (!profile?.coaching_id) {
      toast.error('Could not find your coaching workspace');
      setIsCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('batches')
      .insert({
        name: newBatchName,
        coaching_id: profile.coaching_id
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create batch');
    } else if (data) {
      toast.success('Batch created successfully');
      setBatches([data, ...batches]);
      setNewBatchName('');
    }
    
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 ">Manage Batches</h2>
          <p className="text-slate-500 ">Organize your students into batches or classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Batch Form */}
        <Card className="p-6 border-slate-200 bg-white h-fit">
          <h3 className="text-lg font-semibold mb-4">Create New Batch</h3>
          <form onSubmit={createBatch} className="space-y-4">
            <Input
              label="Batch Name"
              placeholder="e.g., Target JEE 2025"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={isCreating}>
              <Plus className="w-4 h-4 mr-2" /> Add Batch
            </Button>
          </form>
        </Card>

        {/* Batches List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 border-slate-200 bg-white ">
            <Input 
              placeholder="Search batches..." 
              icon={<Search className="w-4 h-4" />}
            />
          </Card>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 ">
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Batch Name</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600 ">Created At</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600 text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                      <p className="text-slate-500">Loading batches...</p>
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 ">No batches found</p>
                      <p className="text-slate-500">Create your first batch using the form.</p>
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50 :bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 ">
                        {batch.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 ">
                          0
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
