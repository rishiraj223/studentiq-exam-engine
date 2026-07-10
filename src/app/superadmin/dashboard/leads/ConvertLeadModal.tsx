'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, Building2, CalendarDays, ShieldCheck, KeyRound, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PLANS = [
  { id: 'trial', label: 'Trial Plan', days: 5, desc: '5 days of free access', color: 'border-amber-400', selected: 'border-amber-500 bg-amber-50 ring-2 ring-amber-400' },
  { id: 'standard', label: 'Standard Plan', days: 365, desc: '365 days of full access', color: 'border-blue-400', selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' },
];

export default function ConvertLeadModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: any;
  onClose: () => void;
  onConverted: (leadId: string) => void;
}) {
  const [plan, setPlan] = useState<'trial' | 'standard'>('trial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: lead.name,
        city: lead.city || '',
        phone: lead.phone || '',
        email: lead.email || '',
        plan,
        is_active: true,
        converted_from_lead: lead.id,
        subscriber_type: lead.user_type === 'student' ? 'student' : 'institute',
      };
      
      if (lead.user_type === 'student') {
        payload.standard = lead.standard || '';
      } else {
        payload.student_strength = lead.students_count || 0;
      }

      const res = await fetch('/api/superadmin/institutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert');
      setCreated(data);
      onConverted(lead.id);
      toast.success(`Lead converted to ${lead.user_type === 'student' ? 'student' : 'institute'} successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-xl text-slate-900">Convert to {lead.user_type === 'student' ? 'Student' : 'Institute'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!created ? (
            <>
              {/* Lead info summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  {lead.user_type === 'student' ? <Building2 className="w-4 h-4 text-purple-600 hidden" /> : <Building2 className="w-4 h-4 text-blue-600" />}
                  <span className="font-semibold text-slate-900">{lead.name}</span>
                </div>
                <p className="text-sm text-slate-500">{lead.email} · {lead.phone}</p>
                {lead.city && <p className="text-sm text-slate-500">{lead.city}</p>}
              </div>

              {/* Plan selection */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select Subscription Plan</p>
                <div className="space-y-3">
                  {PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id as 'trial' | 'standard')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${plan === p.id ? p.selected : `bg-white ${p.color}`}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{p.label}</span>
                        <span className="text-xs font-medium text-slate-500">{p.days} days</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <KeyRound className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">A unique <strong>6-character access code</strong> will be generated. Share it with the {lead.user_type === 'student' ? 'student' : 'institute'} for signup.</p>
              </div>

              <Button
                variant="primary"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleConvert}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Converting...' : 'Convert & Generate Code'}
              </Button>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Conversion Complete!</h3>
              <p className="text-slate-500 text-sm mb-5">Share this access code with the {lead.user_type === 'student' ? 'student' : 'institute'}:</p>

              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-5">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Access Code</p>
                <p className="text-5xl font-extrabold font-mono tracking-[0.3em] text-green-700">
                  {created.access_code}
                </p>
              </div>

              <div className="text-sm text-slate-500 mb-5 space-y-1">
                <p><span className="font-medium">Plan:</span> {created.plan === 'trial' ? 'Trial (5 days)' : 'Standard (365 days)'}</p>
                <p><span className="font-medium">Status:</span> Active</p>
              </div>

              <Button variant="primary" className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
