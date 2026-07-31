'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import {
  LogOut, Home, ClipboardList, Zap, BarChart2, BrainCircuit, Menu, X
} from 'lucide-react';
import { DoubtChatbot } from '@/components/student/DoubtChatbot';

const NAV_ITEMS = [
  { href: '/student/dashboard',          label: 'Home',     icon: Home },
  { href: '/student/dashboard/assigned', label: 'Assigned', icon: ClipboardList },
  { href: '/student/dashboard/practice', label: 'Practice', icon: Zap },
  { href: '/student/dashboard/analytics',label: 'Analytics',icon: BarChart2 },
  { href: '/student/dashboard/ai-planner',label: 'AI Planner',icon: BrainCircuit },
];

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [userName,     setUserName]     = useState('');
  const [userInitial,  setUserInitial]  = useState('S');
  const [coachingName, setCoachingName] = useState('');
  const [mobileOpen,   setMobileOpen]   = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res  = await fetch('/api/auth/student-me');
        const data = await res.json();
        if (data.ok && data.student) {
          const name = data.student.name || 'Student';
          setUserName(name);
          setUserInitial(name[0].toUpperCase());
          if (data.student.coaching_name) setCoachingName(data.student.coaching_name);
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

  const isActive = (href: string) =>
    href === '/student/dashboard'
      ? pathname === '/student/dashboard'
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navbar ─────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-6">

            {/* Left: Logo + Desktop Nav */}
            <div className="flex items-center gap-6 min-w-0">
              <Logo size="sm" />
              <div className="hidden md:flex items-center gap-0.5">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive(href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Coaching badge + User + Sign Out + Mobile Hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Coaching badge — only if student belongs to an academy */}
              {coachingName && (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  🏫 {coachingName}
                </span>
              )}

              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {userInitial}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-28 truncate">
                  {userName}
                </span>
              </div>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top duration-200">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                onClick={() => { router.push(href); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 mt-2">
              {coachingName && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-600 font-bold">
                  🏫 {coachingName}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content ───────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ──────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${
                isActive(href)
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
              {isActive(href) && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Global AI Chatbot */}
      <DoubtChatbot />
    </div>
  );
}
