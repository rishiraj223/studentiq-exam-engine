'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { LogOut, LayoutDashboard, ClockIcon, BarChart2, BrainCircuit } from 'lucide-react';
import { DoubtChatbot } from '@/components/student/DoubtChatbot';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/dashboard/history', label: 'My Tests', icon: ClockIcon },
  { href: '/student/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/student/dashboard/ai-planner', label: 'AI Planner', icon: BrainCircuit },
];

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('S');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/student-me');
        const data = await res.json();
        if (data.ok && data.student) {
          setUserName(data.student.name || 'Student');
          setUserInitial((data.student.name || 'S')[0].toUpperCase());
        } else {
          router.push('/student/login');
        }
      } catch {
        router.push('/student/login');
      }
    };
    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/student-logout', { method: 'POST' });
    router.push('/student/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo + Nav tabs */}
            <div className="flex items-center gap-8">
              <Logo size="sm" />
              <div className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = href === '/student/dashboard'
                    ? pathname === '/student/dashboard'
                    : pathname.startsWith(href);
                  return (
                    <button
                      key={href}
                      onClick={() => router.push(href)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: User + Sign out */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="flex sm:hidden gap-1 pb-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/student/dashboard'
                ? pathname === '/student/dashboard'
                : pathname.startsWith(href);
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Global AI Chatbot */}
      <DoubtChatbot />
    </div>
  );
}
