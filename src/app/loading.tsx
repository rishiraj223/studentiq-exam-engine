import React from 'react';
import { Logo } from '@/components/ui/Logo';

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary-500/30 blur-2xl rounded-full animate-pulse-glow"></div>
        
        {/* Logo box */}
        <div className="relative bg-dark-card border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          <Logo size="lg" showText={false} className="mb-6 animate-float" />
          
          <div className="flex items-center gap-2 text-primary-400 font-medium tracking-widest uppercase text-sm">
            <span>Loading</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
