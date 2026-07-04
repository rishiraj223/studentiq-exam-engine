'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Benefits', href: '/#benefits' },
    { label: 'Contact', href: '/request-demo' },
  ];

  return (
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
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signup">
              <Button variant="secondary" size="sm">Sign Up</Button>
            </Link>
            <Link href="/student/login">
              <Button variant="ghost" size="sm">Student Login</Button>
            </Link>
            <Link href="/coaching/login">
              <Button variant="primary" size="sm">Coaching Login</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
              <Button variant="outline" className="w-full">Student Login</Button>
            </Link>
            <Link href="/coaching/login" onClick={() => setIsOpen(false)}>
              <Button variant="primary" className="w-full">Coaching Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
