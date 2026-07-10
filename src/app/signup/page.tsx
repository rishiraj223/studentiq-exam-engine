'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft, Mail, Lock, User as UserIcon,
  KeyRound, CheckCircle2, Building2, Loader2
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/browser';
import { toast } from 'sonner';

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accessCode: z.string().length(6, 'Access code must be exactly 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeInfo, setCodeInfo] = useState<{ valid: boolean; institute?: any } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const accessCodeValue = watch('accessCode', '');

  // Validate access code as user finishes typing 6 chars
  const handleCodeBlur = async () => {
    const code = accessCodeValue?.trim().toUpperCase();
    if (code?.length !== 6) return;

    setIsValidatingCode(true);
    setCodeInfo(null);
    try {
      const res = await fetch(`/api/superadmin/institutes/validate?code=${code}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCodeInfo({ valid: true, institute: data.institute });
      } else {
        setCodeInfo({ valid: false });
        toast.error(data.error || 'Invalid access code.');
      }
    } catch {
      setCodeInfo({ valid: false });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!codeInfo?.valid) {
      toast.error('Please enter a valid access code first.');
      return;
    }

    setIsLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: codeInfo.institute?.subscriber_type || 'institute',
          institute_id: codeInfo.institute?.id,
          institute_name: codeInfo.institute?.name,
          access_code: data.accessCode.toUpperCase(),
        },
      },
    });

    if (error) {
      toast.error('Signup failed', { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success('Account created successfully!');
    if (authData.session) {
      const role = codeInfo.institute?.subscriber_type;
      router.push(role === 'student' ? '/student/dashboard' : '/student/dashboard');
    } else {
      toast.info('Please check your email to verify your account.');
      router.push('/student/login');
    }
  };

  const subscriberType = codeInfo?.institute?.subscriber_type;

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-20 bg-gradient-to-br from-slate-50 to-slate-100 relative">
      <Link
        href="/"
        className="absolute top-8 left-6 lg:left-8 flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="mb-8 flex justify-center">
          <Logo size="md" />
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-1 text-center">Create Account</h2>
        <p className="text-slate-500 mb-8 text-center text-sm">
          Enter your access code to get started.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Access Code — first & prominent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Access Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                {...register('accessCode')}
                onBlur={handleCodeBlur}
                maxLength={6}
                className={`block w-full pl-10 pr-10 py-3 border rounded-xl font-mono text-lg tracking-[0.3em] uppercase focus:outline-none focus:ring-2 transition-colors ${
                  codeInfo?.valid
                    ? 'border-green-400 bg-green-50 focus:ring-green-300'
                    : codeInfo?.valid === false
                    ? 'border-red-400 bg-red-50 focus:ring-red-300'
                    : 'border-slate-300 focus:ring-primary-500'
                }`}
                placeholder="ABC123"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isValidatingCode && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                {codeInfo?.valid && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
            </div>
            {errors.accessCode && (
              <p className="mt-1 text-sm text-red-600">{errors.accessCode.message}</p>
            )}
            {/* Subscriber type info */}
            {codeInfo?.valid && (
              <div className={`mt-2 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                subscriberType === 'student'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {subscriberType === 'student'
                  ? <UserIcon className="w-4 h-4" />
                  : <Building2 className="w-4 h-4" />
                }
                <span className="font-medium">
                  {codeInfo.institute?.name}
                </span>
                <span className="text-xs opacity-75 capitalize">
                  · {subscriberType || 'Institute'} · {codeInfo.institute?.plan} plan
                </span>
              </div>
            )}
          </div>

          <Input
            label="Full Name"
            placeholder="Your full name"
            icon={<UserIcon className="w-5 h-5" />}
            error={errors.name?.message}
            {...register('name')}
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            isLoading={isLoading}
            disabled={!codeInfo?.valid || isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/student/login" className="font-medium text-primary-600 hover:text-primary-500">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
