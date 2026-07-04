'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Lock, Building2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CoachingLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    // Simulate login for now
    setTimeout(() => {
      console.log('Login data:', data);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Half - Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-800 via-dark-surface to-accent-purple/50 p-12 flex-col justify-between overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Logo size="lg" className="mb-16" />
          
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Coaching <br />
            Admin Portal
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-md leading-relaxed">
            Manage your exam engine ecosystem. Create tests, organize your question bank, and analyze batch-wise performance in one place.
          </p>
          
          <div className="space-y-5">
            {[
              'Create & distribute mock tests instantly',
              'View batch-wise performance analytics',
              'Manage your question bank',
              'Track student progress in real-time'
            ].map((text, i) => (
              <div key={i} className="flex items-center text-white/90">
                <div className="w-2 h-2 rounded-full bg-primary-400 mr-4 shrink-0"></div>
                <span className="text-lg">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Half - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 bg-dark-bg relative">
        <Link href="/" className="absolute top-8 left-6 lg:left-8 flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="w-full max-w-md mx-auto mt-16 lg:mt-0">
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo size="md" />
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary-500" />
            <h2 className="text-3xl font-bold text-white">Coaching Login</h2>
          </div>
          <p className="text-slate-400 mb-8">Sign in to your coaching administration dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Admin Email"
              placeholder="admin@coaching.com"
              type="email"
              icon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email')}
            />
            
            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              icon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-bg focus:ring-offset-2 transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-400">
            Want to get started? <Link href="/request-demo" className="font-medium text-primary-400 hover:text-primary-300">Request a Demo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
