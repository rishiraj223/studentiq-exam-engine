'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
