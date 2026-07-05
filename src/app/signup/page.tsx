'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, Lock, User as UserIcon } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function StudentSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    // MVP: Direct Supabase Auth Signup
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        }
      }
    });

    if (error) {
      toast.error('Signup failed', { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success('Account created successfully!');
    // If email confirmation is off, they are logged in.
    if (authData.session) {
      router.push('/student/dashboard');
    } else {
      toast.info('Please check your email to verify your account.');
      router.push('/student/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-20 bg-slate-50 relative">
      <Link href="/" className="absolute top-8 left-6 lg:left-8 flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="mb-10 flex justify-center">
          <Logo size="md" />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Create Student Account</h2>
        <p className="text-slate-600 mb-8 text-center">Join to take NTA-style mock tests.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="John Doe"
            icon={<UserIcon className="w-5 h-5" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email Address"
            placeholder="student@example.com"
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

          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-slate-600">
          Already have an account? <Link href="/student/login" className="font-medium text-primary-600 hover:text-primary-500">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
