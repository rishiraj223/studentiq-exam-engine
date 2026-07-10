'use client';

import React, { useState } from 'react';
import { X, Building2, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<'institute' | 'student' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    students_count: '',
    standard: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_type: userType }),
      });

      if (res.ok) {
        toast.success('Demo request submitted successfully!');
        onClose();
        // Reset form
        setTimeout(() => {
          setStep(1);
          setUserType(null);
          setFormData({ name: '', email: '', phone: '', city: '', students_count: '', standard: '' });
        }, 500);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {step === 1 ? (
            <div className="animate-slide-up">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Who are you?</h2>
              <p className="text-slate-500 text-center mb-8">Select your profile to continue with the demo request.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setUserType('institute'); setStep(2); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900">Institute</h3>
                  <p className="text-sm text-slate-500 text-center mt-1">For coaching centers & schools</p>
                </button>

                <button
                  onClick={() => { setUserType('student'); setStep(2); }}
                  className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900">Student</h3>
                  <p className="text-sm text-slate-500 text-center mt-1">For individual learners</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 font-medium"
              >
                ← Back
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {userType === 'institute' ? <Building2 className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-purple-600" />}
                  {userType === 'institute' ? 'Institute Demo Request' : 'Student Demo Request'}
                </h2>
                <p className="text-slate-500 mt-1">Fill in the details below and we'll get back to you.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {userType === 'institute' ? 'Institute Name' : 'Name of Student'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone No</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                    />
                  </div>
                  {userType === 'institute' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No of Students</label>
                      <input
                        type="text"
                        name="students_count"
                        required
                        value={formData.students_count}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Standard / Class</label>
                      <input
                        type="text"
                        name="standard"
                        required
                        value={formData.standard}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 mt-4 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
