'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Logo } from '@/components/ui/Logo';
import { LogOut } from 'lucide-react';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/student-me');
        const data = await res.json();
        if (data.ok && data.student) {
          setUserName(data.student.name || 'Student');
        } else {
          router.push('/student/login');
        }
      } catch (err) {
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
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {userName}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors bg-rose-50 px-3 py-1.5 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
