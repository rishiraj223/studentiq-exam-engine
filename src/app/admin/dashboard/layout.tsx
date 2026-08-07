'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, Settings, LogOut,
  Loader2, Printer, BarChart2, Activity, Sparkles, GraduationCap
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    exact: true,
    gradient: 'from-indigo-500 to-blue-600',
    activeBg: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-indigo-50',
    inactiveText: 'text-slate-500 hover:text-indigo-700',
    dot: 'bg-indigo-500',
    shadow: 'shadow-indigo-200',
    badge: null,
  },
  {
    label: 'My Students',
    href: '/admin/dashboard/students',
    icon: Users,
    exact: false,
    gradient: 'from-sky-500 to-cyan-500',
    activeBg: 'bg-gradient-to-r from-sky-500 to-cyan-500',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-sky-50',
    inactiveText: 'text-slate-500 hover:text-sky-700',
    dot: 'bg-sky-500',
    shadow: 'shadow-sky-200',
    badge: null,
  },
  {
    label: 'Assigned Tests',
    href: '/admin/dashboard/assigned-tests',
    icon: FileText,
    exact: false,
    gradient: 'from-amber-500 to-orange-500',
    activeBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-amber-50',
    inactiveText: 'text-slate-500 hover:text-amber-700',
    dot: 'bg-amber-500',
    shadow: 'shadow-amber-200',
    badge: null,
  },
  {
    label: 'Advanced Analytics',
    href: '/admin/dashboard/analytics',
    icon: BarChart2,
    exact: false,
    gradient: 'from-emerald-500 to-teal-500',
    activeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-emerald-50',
    inactiveText: 'text-slate-500 hover:text-emerald-700',
    dot: 'bg-emerald-500',
    shadow: 'shadow-emerald-200',
    badge: null,
  },
  {
    label: 'Live Monitor',
    href: '/admin/dashboard/live-monitor',
    icon: Activity,
    exact: false,
    gradient: 'from-rose-500 to-pink-500',
    activeBg: 'bg-gradient-to-r from-rose-500 to-pink-500',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-rose-50',
    inactiveText: 'text-slate-500 hover:text-rose-700',
    dot: 'bg-rose-500',
    shadow: 'shadow-rose-200',
    badge: 'LIVE',
  },
  {
    label: 'Offline Tests',
    href: '/admin/dashboard/offline-test',
    icon: Printer,
    exact: false,
    gradient: 'from-violet-500 to-purple-600',
    activeBg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    activeText: 'text-white',
    activeIconBg: 'bg-white/20',
    activeIconColor: 'text-white',
    inactiveBg: 'hover:bg-violet-50',
    inactiveText: 'text-slate-500 hover:text-violet-700',
    dot: 'bg-violet-500',
    shadow: 'shadow-violet-200',
    badge: null,
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-yellow-400 flex items-center justify-center shadow-xl shadow-indigo-200 animate-bounce">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-slate-500 text-sm font-medium">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="w-[260px] bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-20 shadow-lg">

        {/* Brand */}
        <div className="h-[72px] flex items-center px-5 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-black text-base tracking-tight leading-none">StudentIQ</span>
              <p className="text-blue-200 text-[10px] font-bold leading-none mt-0.5 uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3 mt-1">Main Menu</p>
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group relative overflow-hidden ${
                  active
                    ? `${item.activeBg} ${item.activeText} shadow-md ${item.shadow}`
                    : `text-slate-500 ${item.inactiveBg} ${item.inactiveText}`
                }`}
              >
                {/* Active glow effect */}
                {active && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl" />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all relative z-10 ${
                  active
                    ? item.activeIconBg
                    : 'bg-slate-100 group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <item.icon className={`w-4 h-4 transition-colors ${active ? item.activeIconColor : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
                <span className="flex-1 leading-tight relative z-10">{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                    {item.badge}
                  </span>
                )}
                {active && (
                  <div className="w-2 h-2 rounded-full bg-white/70 shrink-0 animate-pulse relative z-10" />
                )}
              </Link>
            );
          })}

          {/* Account section */}
          <div className="pt-4 mt-3 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Account</p>
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

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center font-black text-sm text-white shrink-0 border border-white/20">
              {coachingName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate leading-tight">{coachingName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-blue-200 font-bold">Active · Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors border border-rose-100 hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="flex-1 ml-[260px] min-h-screen flex flex-col">

        {/* Top bar */}
        <header className="h-[72px] bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {activeItem && (
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeItem.gradient} flex items-center justify-center shadow-sm`}>
                <activeItem.icon className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <span className="font-black text-slate-900 text-base leading-tight block">
                {activeItem?.label ?? 'Dashboard'}
              </span>
              <span className="text-xs text-slate-400 font-medium leading-tight block">
                StudentIQ Admin Portal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-gradient-to-r ${activeItem?.gradient ? `${activeItem.gradient} border-transparent` : 'from-indigo-500 to-blue-600 border-transparent'}`}>
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              <span className="text-xs font-bold text-white">{coachingName}</span>
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
