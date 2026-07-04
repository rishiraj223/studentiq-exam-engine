import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  
  // Fetch current user profile
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, coachings(name)')
    .eq('id', user?.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.name || 'Admin'} 👋</h2>
          <p className="text-slate-500">Here is what is happening at {profile?.coachings?.name || 'your institute'} today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Total Students</h3>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Active Batches</h3>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Questions Available</h3>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
