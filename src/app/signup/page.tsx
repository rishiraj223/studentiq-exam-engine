'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  securityCode: z.string().min(6, 'Security code must be at least 6 characters'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = (data: SignUpFormValues) => {
    setIsLoading(true);
    
    // Simulate sign up process and security code validation
    setTimeout(() => {
      console.log('Sign Up data:', data);
      
      // Basic mock validation for security code
      if (data.securityCode.toLowerCase().includes('demo') || data.securityCode.length >= 6) {
        toast.success('Account created successfully!', {
          description: 'Welcome to StudentIQ Exam Engine.',
        });
      } else {
        toast.error('Invalid Security Code', {
          description: 'Please enter the valid security code provided to you after purchase.',
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Half - Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-500 via-accent-cyan to-primary-600 p-12 flex-col justify-between overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10">
          <Logo size="lg" className="mb-16" />
          
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Activate Your <br />
            Account
          </h1>
          <p className="text-primary-50 text-lg mb-10 max-w-md leading-relaxed">
            Enter your email, password, and the security code provided to you after purchasing StudentIQ to set up your account.
          </p>
          
          <div className="space-y-5">
            {[
              'Secure, isolated data storage',
              'Access to premium features',
              'Instant setup and onboarding',
            ].map((text, i) => (
              <div key={i} className="flex items-center text-white/90">
                <CheckCircle2 className="w-5 h-5 text-white mr-3 shrink-0" />
                <span className="text-lg">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Half - Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 bg-white relative">
        <Link href="/" className="absolute top-8 left-6 lg:left-8 flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="w-full max-w-md mx-auto mt-16 lg:mt-0">
          <div className="lg:hidden mb-10 flex justify-center">
            <Logo size="md" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign Up</h2>
          <p className="text-slate-600 mb-8">Create your account using your security code.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              placeholder="you@example.com"
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

            <Input
              label="Security Code"
              placeholder="e.g. STIQ-1234-ABCD"
              type="text"
              icon={<KeyRound className="w-5 h-5" />}
              error={errors.securityCode?.message}
              {...register('securityCode')}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Activate Account
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/student/login" className="font-medium text-primary-600 hover:text-primary-500 mr-4">
              Student Login
            </Link>
            <Link href="/coaching/login" className="font-medium text-primary-600 hover:text-primary-500">
              Coaching Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
