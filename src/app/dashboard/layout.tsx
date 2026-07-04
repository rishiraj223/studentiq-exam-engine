'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Database, LayoutDashboard, Settings, LogOut, Users, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: Users },
  { href: '/dashboard/batches', label: 'Batches', icon: BookOpen },
  { href: '/dashboard/questions', label: 'Question Bank', icon: Database },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/students': 'Students',
  '/dashboard/batches': 'Batches',
  '/dashboard/questions': 'Question Bank',
  '/dashboard/questions/upload': 'Upload Questions',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/coaching/login');
  };

  const pageTitle = pageTitles[pathname] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-primary-600">Exam Engine</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${ isActive ? 'text-primary-600' : 'text-slate-400' }`} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
