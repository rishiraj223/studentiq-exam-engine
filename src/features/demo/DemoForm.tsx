'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, MapPin, Building2, Users, MessageSquare, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { submitDemoRequest } from '@/services/demo.service';

const demoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  institute_name: z.string().min(2, 'Institute name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().email('Please enter a valid email address'),
  city: z.string().min(2, 'City is required'),
  student_strength: z.coerce.number().min(1, 'Please enter a valid number of students'),
  message: z.string().optional(),
});

type DemoFormValues = z.infer<typeof demoSchema>;

export function DemoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoSchema) as any,
  });

  const onSubmit = async (data: DemoFormValues) => {
    setIsSubmitting(true);
    try {
      await submitDemoRequest(data);
      toast.success('Demo request submitted!', {
        description: 'Our team will reach out to you within 24 hours.',
      });
      reset();
    } catch (error: any) {
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Full Name"
          placeholder="John Doe"
          icon={<User className="w-5 h-5" />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Institute Name"
          placeholder="Apex Classes"
          icon={<Building2 className="w-5 h-5" />}
          error={errors.institute_name?.message}
          {...register('institute_name')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Phone Number"
          placeholder="9876543210"
          type="tel"
          icon={<Phone className="w-5 h-5" />}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Email Address"
          placeholder="john@example.com"
          type="email"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="City"
          placeholder="Mumbai"
          icon={<MapPin className="w-5 h-5" />}
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Number of Students"
          placeholder="500"
          type="number"
          icon={<Users className="w-5 h-5" />}
          error={errors.student_strength?.message}
          {...register('student_strength')}
        />
      </div>

      <div className="w-full flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">Message (Optional)</label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
            <MessageSquare className="w-5 h-5" />
          </div>
          <textarea
            className="flex min-h-[120px] w-full rounded-lg bg-white border border-slate-200 px-3 py-2 pl-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 resize-y"
            placeholder="Tell us about your requirements..."
            {...register('message')}
          />
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full text-base" isLoading={isSubmitting}>
        Submit Demo Request <Send className="ml-2 w-5 h-5" />
      </Button>
    </form>
  );
}
