'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Lock, KeyRound, CheckCircle2, Building2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

const signUpSchema = z.object({
  coachingName: z.string().min(3, 'Coaching name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  securityCode: z.string().min(6, 'Security code must be at least 6 characters'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register-coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          coachingName: data.coachingName,
          securityCode: data.securityCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error('Signup failed', { description: result.error });
        setIsLoading(false);
        return;
      }

      // Auto login after successful registration
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (loginError) {
        toast.error('Account created, but login failed', { description: loginError.message });
      } else {
        toast.success('Account created successfully!', {
          description: 'Welcome to StudentIQ Exam Engine.',
        });
        router.push('/dashboard/questions');
      }
    } catch (error) {
      toast.error('Something went wrong during registration');
    }
    
    setIsLoading(false);
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
              label="Coaching Name"
              placeholder="e.g. Apex Academy"
              type="text"
              icon={<Building2 className="w-5 h-5" />}
              error={errors.coachingName?.message}
              {...register('coachingName')}
            />

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
