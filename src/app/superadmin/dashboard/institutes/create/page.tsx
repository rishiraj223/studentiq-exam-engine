'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Building2, User, Mail, Phone, MapPin, Users, CalendarDays,
  Save, ArrowLeft, KeyRound, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';

const PLANS = [
  { id: 'trial', label: 'Trial Plan', days: 5, desc: '5 days free access.', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-400 bg-amber-50 border-amber-400' },
  { id: 'standard', label: 'Standard Plan', days: 365, desc: '365 days full access.', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-400 bg-blue-50 border-blue-400' },
];

type SubscriberType = 'institute' | 'student';

export default function CreateNewPage() {
  const [subscriberType, setSubscriberType] = useState<SubscriberType | null>(null);
  const [plan, setPlan] = useState<'trial' | 'standard'>('trial');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const [form, setForm] = useState({
    name: '', city: '', phone: '', contact_number: '',
    email: '', address: '', student_strength: '', recovery_phone: '',
    standard: '', // for student subscriber
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/institutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan, is_active: isActive, subscriber_type: subscriberType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setCreated(data);
      toast.success(`${subscriberType === 'student' ? 'Student' : 'Institute'} created successfully!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──
  if (created) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {created.subscriber_type === 'student' ? 'Student' : 'Institute'} Created!
          </h1>
          <p className="text-slate-500 mt-2">Share the unique access code for signup.</p>
        </div>

        <Card className="border-2 border-green-300 bg-green-50 mb-6">
          <CardContent className="py-8 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Access Code</p>
            <div className="text-6xl font-extrabold tracking-[0.3em] text-green-700 mb-3 font-mono">{created.access_code}</div>
            <p className="text-slate-500 text-sm">Enter this code in the Sign Up form to activate the account.</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 mb-6">
          <CardContent className="py-4 space-y-2.5">
            <Row label="Name" value={created.name} />
            <Row label="Type" value={created.subscriber_type === 'student' ? '👤 Student' : '🏢 Institute'} />
            <Row label="Plan" value={`${created.plan} (${created.plan_days} days)`} />
            <Row label="Status" value={created.is_active ? '✅ Active' : '⏸ Pending'} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/superadmin/dashboard/institutes/manage" className="flex-1">
            <Button variant="outline" className="w-full">View All</Button>
          </Link>
          <Button variant="primary" className="flex-1" onClick={() => {
            setCreated(null); setSubscriberType(null);
            setForm({ name: '', city: '', phone: '', contact_number: '', email: '', address: '', student_strength: '', recovery_phone: '', standard: '' });
          }}>
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  // ── Type selection screen ──
  if (!subscriberType) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/superadmin/dashboard">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New</h1>
            <p className="text-slate-500 text-sm">Select who you are onboarding.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            onClick={() => setSubscriberType('institute')}
            className="group flex flex-col items-center p-8 border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">Institute</h3>
            <p className="text-sm text-slate-500 text-center">Coaching centers, schools, academies</p>
            <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
              Select <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => setSubscriberType('student')}
            className="group flex flex-col items-center p-8 border-2 border-slate-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
          >
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">Student</h3>
            <p className="text-sm text-slate-500 text-center">Individual learners buying a subscription</p>
            <div className="mt-4 flex items-center gap-1 text-purple-600 text-sm font-medium">
              Select <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isInstitute = subscriberType === 'institute';
  const accentColor = isInstitute ? 'blue' : 'purple';

  // ── Form screen ──
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setSubscriberType(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            {isInstitute
              ? <Building2 className="w-5 h-5 text-blue-600" />
              : <User className="w-5 h-5 text-purple-600" />
            }
            <h1 className="text-2xl font-bold text-slate-900">
              Create {isInstitute ? 'Institute' : 'Student'} Account
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Fill in the details and assign a plan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="border-slate-200">
          <CardHeader>
            <h2 className="font-semibold text-slate-900">
              {isInstitute ? 'Institute Information' : 'Student Information'}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isInstitute ? 'Institute Name' : 'Student Full Name'} <span className="text-red-500">*</span>
                </label>
                <input name="name" required value={form.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isInstitute ? 'e.g. Apex Coaching Center' : 'e.g. Rahul Sharma'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="city" value={form.city} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mumbai" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={isInstitute ? 'director@institute.com' : 'student@example.com'} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="phone" value={form.phone} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 9XXXXXXXXX" />
                </div>
              </div>

              {isInstitute ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="contact_number" value={form.contact_number} onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Office number" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Student Strength</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="student_strength" type="number" min="0" value={form.student_strength} onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. 200" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Full street address..." />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Standard / Class</label>
                  <input name="standard" value={form.standard} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 12th / JEE Dropper" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recovery Phone <span className="text-slate-400 text-xs">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="recovery_phone" value={form.recovery_phone} onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 9XXXXXXXXX" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-slate-900">Subscription Plan</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLANS.map(p => (
                <button type="button" key={p.id}
                  onClick={() => setPlan(p.id as 'trial' | 'standard')}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${plan === p.id ? `${p.ring} ring-2` : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-900">{p.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badge}`}>{p.days}d</span>
                  </div>
                  <p className="text-sm text-slate-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Toggle */}
        <Card className="border-slate-200">
          <CardContent className="py-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Activate Immediately</p>
              <p className="text-sm text-slate-500">Plan countdown starts now if toggled on.</p>
            </div>
            <button type="button" onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <KeyRound className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">A <strong>unique 6-character access code</strong> will be generated and shown after creation. This code is required for signup.</p>
        </div>

        <Button type="submit" variant="primary" className="w-full py-3 text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : <span className="flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Create {isInstitute ? 'Institute' : 'Student'} Account</span>}
        </Button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
