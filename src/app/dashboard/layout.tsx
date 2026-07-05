'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, PlusCircle, Settings, LogOut, ChevronRight, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/tests', label: 'My Tests', icon: FileText },
  { href: '/dashboard/tests/create', label: 'Create Test', icon: PlusCircle },
  { href: '/dashboard/questions', label: 'Question Bank', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [coachingName, setCoachingName] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/coaching/login'); return; }
      const { data } = await supabase.from('coaching_centers').select('name').eq('id', user.id).single();
      if (data) setCoachingName(data.name);
    };
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/coaching/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div>
            <span className="text-base font-bold text-primary-600 block">IQ Exam Engine</span>
            {coachingName && <span className="text-xs text-slate-400 truncate block max-w-[160px]">{coachingName}</span>}
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-medium group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 mr-3 shrink-0 ${ isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600' }`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-primary-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
