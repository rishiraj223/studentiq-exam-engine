'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { FileText, Users, CheckCircle2, TrendingUp, PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, completed: 0, submissions: 0 });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [coachingName, setCoachingName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coaching } = await supabase.from('coaching_centers').select('name').eq('id', user.id).single();
      if (coaching) setCoachingName(coaching.name);

      const { data: tests } = await supabase.from('tests').select('*').eq('coaching_id', user.id).order('created_at', { ascending: false });
      if (tests) {
        setRecentTests(tests.slice(0, 5));
        setStats({
          total: tests.length,
          published: tests.filter(t => t.status === 'published').length,
          completed: tests.filter(t => t.status === 'completed').length,
          submissions: 0,
        });
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Tests', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Published', value: stats.published, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Submissions', value: stats.submissions, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back{coachingName ? `, ${coachingName}` : ''}!</h1>
        <p className="text-slate-500 mt-1">Manage and conduct tests for your students.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Action */}
      <Link
        href="/dashboard/tests/create"
        className="flex items-center gap-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl p-6 shadow-lg shadow-primary-100 hover:shadow-primary-200 transition-shadow"
      >
        <PlusCircle className="w-8 h-8 shrink-0" />
        <div>
          <div className="font-bold text-lg">Create New Test</div>
          <div className="text-primary-100 text-sm">Build and publish a test for your students</div>
        </div>
        <ArrowRight className="w-6 h-6 ml-auto" />
      </Link>

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Tests</h2>
            <Link href="/dashboard/tests" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentTests.map(test => (
              <div key={test.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <div className="font-medium text-slate-800">{test.title}</div>
                  <div className="text-xs text-slate-400">{test.duration_minutes} min</div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  test.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                  test.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-500'
                }`}>{test.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
