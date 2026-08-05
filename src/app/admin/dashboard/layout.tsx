'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, Settings, LogOut,
  Loader2, Printer, BarChart2, Activity, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  {
    label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, exact: true,
    activeBg: 'bg-indigo-50', activeText: 'text-indigo-700', activeIcon: 'text-indigo-600',
    activeBorder: 'border-l-4 border-indigo-500',
    dot: 'bg-indigo-500',
  },
  {
    label: 'My Students', href: '/admin/dashboard/students', icon: Users, exact: false,
    activeBg: 'bg-sky-50', activeText: 'text-sky-700', activeIcon: 'text-sky-600',
    activeBorder: 'border-l-4 border-sky-500',
    dot: 'bg-sky-500',
  },
  {
    label: 'Assigned Tests', href: '/admin/dashboard/assigned-tests', icon: FileText, exact: false,
    activeBg: 'bg-orange-50', activeText: 'text-orange-700', activeIcon: 'text-orange-600',
    activeBorder: 'border-l-4 border-orange-500',
    dot: 'bg-orange-500',
  },
  {
    label: 'Advanced Analytics', href: '/admin/dashboard/analytics', icon: BarChart2, exact: false,
    activeBg: 'bg-emerald-50', activeText: 'text-emerald-700', activeIcon: 'text-emerald-600',
    activeBorder: 'border-l-4 border-emerald-500',
    dot: 'bg-emerald-500',
  },
  {
    label: 'Live Monitor', href: '/admin/dashboard/live-monitor', icon: Activity, exact: false,
    activeBg: 'bg-rose-50', activeText: 'text-rose-700', activeIcon: 'text-rose-600',
    activeBorder: 'border-l-4 border-rose-500',
    dot: 'bg-rose-500',
  },
  {
    label: 'Offline Tests', href: '/admin/dashboard/offline-test', icon: Printer, exact: false,
    activeBg: 'bg-violet-50', activeText: 'text-violet-700', activeIcon: 'text-violet-600',
    activeBorder: 'border-l-4 border-violet-500',
    dot: 'bg-violet-500',
  },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [coachingName, setCoachingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('exam_coaching_session='));
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          setCoachingName(sessionData.coaching_name || 'Coaching Admin');
          setIsLoading(false);
        } catch (e) {
          router.push('/admin/login');
        }
      } else {
        router.push('/admin/login');
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'exam_coaching_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/admin/login');
  };

  const isActive = (item: typeof navItems[0]) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href);

  const activeItem = navItems.find(n => isActive(n));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-yellow-400 flex items-center justify-center shadow-xl shadow-indigo-200">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-[256px] bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-20 shadow-sm">

        {/* Brand */}
        <div className="h-[70px] flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-yellow-400 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-slate-900 font-black text-base tracking-tight leading-none">StudentIQ</span>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3 mt-1">Main Menu</p>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  active
                    ? `${item.activeBg} ${item.activeText}`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  active ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <item.icon className={`w-4 h-4 transition-colors ${active ? item.activeIcon : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
                <span className="flex-1 leading-tight">{item.label}</span>
                {active && <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0 animate-pulse`} />}
              </Link>
            );
          })}

          <div className="pt-4 mt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Account</p>
            <button
              disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4 text-slate-300" />
              </div>
              Settings
              <span className="ml-auto text-[9px] font-black bg-amber-100 text-amber-500 px-1.5 py-0.5 rounded-md uppercase">Soon</span>
            </button>
          </div>
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0">
              {coachingName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900 truncate leading-tight">{coachingName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-slate-500 font-medium">Active · Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[256px] min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-[70px] bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${activeItem?.dot ?? 'bg-slate-400'}`} />
            <span className="font-bold text-slate-800 text-base">
              {activeItem?.label ?? 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-sky-50 rounded-xl border border-indigo-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-700">{coachingName}</span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
