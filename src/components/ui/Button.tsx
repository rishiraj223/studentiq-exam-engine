'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/25 border border-primary-400/20',
      secondary: 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm',
      outline: 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-8 text-base font-medium',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
