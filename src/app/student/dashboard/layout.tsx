'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import {
  LogOut, Home, ClipboardList, Zap, BarChart2, BrainCircuit, Menu, X, History
} from 'lucide-react';
import { DoubtChatbot } from '@/components/student/DoubtChatbot';

const NAV_ITEMS = [
  {
    href: '/student/dashboard',
    label: 'Home',
    icon: Home,
    activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
    inactiveClass: 'text-slate-500 hover:bg-blue-50 hover:text-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    href: '/student/dashboard/assigned',
    label: 'Assigned',
    icon: ClipboardList,
    activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',
    inactiveClass: 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700',
    dotColor: 'bg-indigo-500',
  },
  {
    href: '/student/dashboard/practice',
    label: 'Practice',
    icon: Zap,
    activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-200',
    inactiveClass: 'text-slate-500 hover:bg-amber-50 hover:text-amber-700',
    dotColor: 'bg-amber-500',
  },
  {
    href: '/student/dashboard/analytics',
    label: 'Analytics',
    icon: BarChart2,
    activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    inactiveClass: 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    href: '/student/dashboard/ai-planner',
    label: 'AI Planner',
    icon: BrainCircuit,
    activeClass: 'bg-violet-600 text-white shadow-lg shadow-violet-200',
    inactiveClass: 'text-slate-500 hover:bg-violet-50 hover:text-violet-700',
    dotColor: 'bg-violet-500',
  },
];

// Mobile bottom nav active colors per item
const MOBILE_ACTIVE_COLORS: Record<string, string> = {
  '/student/dashboard': 'text-blue-600',
  '/student/dashboard/assigned': 'text-indigo-600',
  '/student/dashboard/practice': 'text-amber-500',
  '/student/dashboard/analytics': 'text-emerald-600',
  '/student/dashboard/ai-planner': 'text-violet-600',
};

const MOBILE_ACTIVE_DOTS: Record<string, string> = {
  '/student/dashboard': 'bg-blue-600',
  '/student/dashboard/assigned': 'bg-indigo-600',
  '/student/dashboard/practice': 'bg-amber-500',
  '/student/dashboard/analytics': 'bg-emerald-600',
  '/student/dashboard/ai-planner': 'bg-violet-600',
};

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

  const activeItem = NAV_ITEMS.find(n => isActive(n.href));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navbar ─────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left: Logo + Desktop Nav */}
            <div className="flex items-center gap-4 min-w-0">
              <Logo size="sm" />
              <div className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon, activeClass, inactiveClass }) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive(href) ? activeClass : inactiveClass
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 shrink-0">
              {coachingName && (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  🏫 {coachingName}
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${activeItem?.activeClass?.includes('bg-') ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                  {userInitial}
                </div>
                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-28 truncate">
                  {userName}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors border border-rose-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top duration-200">
            {NAV_ITEMS.map(({ href, label, icon: Icon, activeClass, inactiveClass }) => (
              <button
                key={href}
                onClick={() => { router.push(href); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive(href) ? activeClass : `text-slate-600 hover:bg-slate-100`
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 mt-2">
              {coachingName && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-700 font-bold bg-indigo-50 rounded-xl mb-1">
                  🏫 {coachingName}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
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

      {/* ── Mobile Bottom Tab Bar ─── COLORFUL ─────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center">
          {NAV_ITEMS.map(({ href, label, icon: Icon, dotColor }) => {
            const active = isActive(href);
            const activeColor = MOBILE_ACTIVE_COLORS[href] || 'text-blue-600';
            const dotBg = MOBILE_ACTIVE_DOTS[href] || 'bg-blue-600';
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-all relative ${
                  active ? activeColor : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {active && (
                  <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full ${dotBg}`} />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-black">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global AI Chatbot */}
      <DoubtChatbot />
    </div>
  );
}
