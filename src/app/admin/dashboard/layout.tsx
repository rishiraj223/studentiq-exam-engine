'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [coachingName, setCoachingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read cookie for session data (since this is client side)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Logo />
        </div>
        
        <div className="p-4">
          <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          <nav className="space-y-1">
            <Link href="/admin/dashboard" className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${pathname === '/admin/dashboard' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <LayoutDashboard className={`w-5 h-5 mr-3 ${pathname === '/admin/dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
              Dashboard
            </Link>
            <Link href="/admin/dashboard/students" className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${pathname?.startsWith('/admin/dashboard/students') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <Users className={`w-5 h-5 mr-3 ${pathname?.startsWith('/admin/dashboard/students') ? 'text-blue-600' : 'text-slate-400'}`} />
              My Students
            </Link>
            <Link href="/admin/dashboard/assigned-tests" className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${pathname?.startsWith('/admin/dashboard/assigned-tests') ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <FileText className={`w-5 h-5 mr-3 ${pathname?.startsWith('/admin/dashboard/assigned-tests') ? 'text-blue-600' : 'text-slate-400'}`} />
              Assigned Tests
            </Link>
            <button disabled className="w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 transition-colors opacity-50 cursor-not-allowed text-left">
              <Settings className="w-5 h-5 mr-3 text-slate-400" />
              Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="flex items-center px-3 py-3 mb-2 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
              {coachingName.substring(0, 2)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{coachingName}</p>
              <p className="text-xs text-slate-500 truncate">Admin Portal</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center px-3 py-2 text-sm font-semibold rounded-xl text-rose-600 hover:bg-rose-50 transition-colors">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
