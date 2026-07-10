'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, Save, Building2, User, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PLANS = [
  { id: 'trial', label: 'Trial', days: 5 },
  { id: 'standard', label: 'Standard', days: 365 },
];

export default function EditInstituteModal({
  institute,
  onClose,
  onSave,
}: {
  institute: any;
  onClose: () => void;
  onSave: (updated: any) => void;
}) {
  const isStudent = institute.subscriber_type === 'student';
  
  const [form, setForm] = useState({
    name: institute.name || '',
    city: institute.city || '',
    phone: institute.phone || '',
    contact_number: institute.contact_number || '',
    email: institute.email || '',
    address: institute.address || '',
    student_strength: institute.student_strength?.toString() || '',
    recovery_phone: institute.recovery_phone || '',
    standard: institute.standard || '',
    plan: institute.plan || 'trial',
    plan_days: institute.plan_days?.toString() || '5',
    is_active: institute.is_active,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlanChange = (planId: string) => {
    const defaultDays = planId === 'trial' ? 5 : 365;
    setForm(prev => ({ ...prev, plan: planId, plan_days: defaultDays.toString() }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        plan_days: Number(form.plan_days) || 5,
      };
      if (!isStudent) {
        payload.student_strength = Number(form.student_strength) || 0;
      }
      const res = await fetch(`/api/superadmin/institutes/${institute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${isStudent ? 'Student' : 'Institute'} updated successfully!`);
      onSave(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            {isStudent ? <User className="w-5 h-5 text-purple-600" /> : <Building2 className="w-5 h-5 text-blue-600" />}
            <h2 className="font-bold text-xl text-slate-900">
              Edit {isStudent ? 'Student' : 'Institute'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Access Code (read-only) */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">Access Code:</span>
            <span className="font-mono font-bold text-slate-900 tracking-widest">{institute.access_code}</span>
            <span className="ml-auto text-xs text-slate-400">read-only</span>
          </div>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isStudent ? 'Student Name' : 'Institute Name'} *
              </label>
              <input name="name" required value={form.name} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {isStudent ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Standard / Class</label>
                <input name="standard" value={form.standard} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <input name="contact_number" value={form.contact_number} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Strength</label>
                  <input name="student_strength" type="number" min="0" value={form.student_strength} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recovery Phone</label>
              <input name="recovery_phone" value={form.recovery_phone} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {!isStudent && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subscription Plan</label>
            <div className="flex gap-3">
              {PLANS.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePlanChange(p.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.plan === p.id
                      ? p.id === 'trial' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan Days (manual override) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Plan Duration (days)
              <span className="ml-2 text-xs text-slate-400 font-normal">— manually editable</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                name="plan_days"
                type="number"
                min="1"
                max="3650"
                value={form.plan_days}
                onChange={handleChange}
                className="w-32 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
              />
              <span className="text-slate-500 text-sm">days remaining after plan starts</span>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div>
              <p className="font-semibold text-slate-900">Plan Status</p>
              <p className="text-sm text-slate-500">{form.is_active ? 'Plan is currently active.' : 'Plan is suspended.'}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
