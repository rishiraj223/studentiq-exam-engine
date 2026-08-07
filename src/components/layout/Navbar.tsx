'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { DemoRequestModal } from '@/components/ui/DemoRequestModal';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Benefits', href: '/#benefits' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <Logo size="sm" />
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Old website link */}
              <a
                href="https://studentiq.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white text-sm font-black transition-all shadow-[0_4px_0_rgb(79,70,229)] hover:shadow-[0_2px_0_rgb(79,70,229)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-[10px] font-black tracking-tighter text-white">V1</span>
                </div>
                <span>Coaching Management Software</span>
              </a>

              {/* Request Demo — highlighted */}
              <button
                onClick={() => setIsDemoOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-black transition-all shadow-[0_4px_0_rgb(168,85,247)] hover:shadow-[0_2px_0_rgb(168,85,247)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Request Demo
              </button>
              
              <Link href="/admin/login">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-black transition-all shadow-[0_4px_0_rgb(16,185,129)] hover:shadow-[0_2px_0_rgb(16,185,129)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]">
                  Admin Login
                </button>
              </Link>
              
              <Link href="/student/login">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-black transition-all shadow-[0_4px_0_rgb(245,158,11)] hover:shadow-[0_2px_0_rgb(245,158,11)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]">
                  Student Login
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setIsDemoOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-accent-purple text-white text-xs font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                Demo
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none p-2 rounded-md bg-slate-100 border border-slate-200"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-[500px] opacity-100 border-b border-slate-200" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 pt-2 pb-6 space-y-1 bg-white/95 backdrop-blur-xl shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3 px-3">
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" className="w-full">Sign Up</Button>
              </Link>
              <Link href="/student/login" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <DemoRequestModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
