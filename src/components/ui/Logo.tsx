import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 rounded-md',
      icon: 'w-4 h-4',
      text: 'text-lg',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-10 h-10 rounded-lg',
      icon: 'w-5 h-5',
      text: 'text-xl',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12 rounded-xl',
      icon: 'w-6 h-6',
      text: 'text-3xl',
      sub: 'text-[12px]',
    },
  };

  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-purple shadow-lg shadow-primary-500/20 flex-shrink-0",
        s.box
      )}>
        <Zap className={cn("text-white fill-white", s.icon)} />
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={cn("font-bold tracking-tight", s.text)}>
            <span className="text-slate-900">Student</span>
            <span className="text-primary-600">IQ</span>
          </div>
          <div className={cn("font-semibold tracking-wider text-slate-500 uppercase mt-0.5", s.sub)}>
            Exam Engine
          </div>
        </div>
      )}
    </div>
  );
}
