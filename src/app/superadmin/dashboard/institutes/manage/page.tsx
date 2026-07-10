'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Building2, Phone, Mail, MapPin, Users, Search, User,
  PencilLine, Trash2, CalendarDays, CheckCircle2, XCircle,
  KeyRound, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import EditInstituteModal from './EditInstituteModal';

function daysRemaining(startDate: string | null, totalDays: number): number | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - elapsed);
}

function PlanBadge({ plan }: { plan: string }) {
  return plan === 'trial'
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Trial</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Standard</span>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function ManageInstitutesPage() {
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<any>(null);

  const fetchInstitutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/superadmin/institutes');
      const data = await res.json();
      setInstitutes(data || []);
      setFiltered(data || []);
    } catch {
      toast.error('Failed to load institutes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstitutes(); }, [fetchInstitutes]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(institutes.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.city?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q)
    ));
  }, [search, institutes]);

  const handleToggle = async (inst: any) => {
    try {
      const res = await fetch(`/api/superadmin/institutes/${inst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !inst.is_active }),
      });
      if (!res.ok) throw new Error();
      toast.success(inst.is_active ? 'Institute suspended.' : 'Institute activated.');
      setInstitutes(prev => prev.map(i => i.id === inst.id ? { ...i, is_active: !i.is_active } : i));
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institute? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/superadmin/institutes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Institute deleted.');
      setInstitutes(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleSaveEdit = (updated: any) => {
    setInstitutes(prev => prev.map(i => i.id === updated.id ? updated : i));
    setEditTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">View, edit, and manage all registered subscribers.</p>
        </div>
        <Link href="/superadmin/dashboard/institutes/create">
          <Button variant="primary" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Create New
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Search by name, city, or email..."
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center text-slate-500">
          No accounts found.{' '}
          <Link href="/superadmin/dashboard/institutes/create" className="text-blue-600 font-medium underline">Create one?</Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(inst => {
            const remaining = daysRemaining(inst.plan_start_date, inst.plan_days);
            const isExpired = remaining !== null && remaining === 0;

            return (
              <Card key={inst.id} className={`border ${isExpired ? 'border-red-200 bg-red-50' : 'border-slate-200'} overflow-hidden`}>
                <CardContent className="py-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 py-5">
                    {/* Color stripe */}
                    <div className={`hidden md:block w-1 self-stretch rounded-full ${inst.plan === 'trial' ? 'bg-amber-400' : 'bg-blue-500'}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {inst.subscriber_type === 'student' ? (
                          <User className="w-5 h-5 text-purple-500 mr-1" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-500 mr-1" />
                        )}
                        <h3 className="font-bold text-lg text-slate-900 truncate">{inst.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inst.subscriber_type === 'student' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {inst.subscriber_type === 'student' ? 'Student' : 'Institute'}
                        </span>
                        <PlanBadge plan={inst.plan} />
                        {isExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Expired</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {inst.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{inst.city}</span>}
                        {inst.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{inst.email}</span>}
                        {inst.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{inst.phone}</span>}
                        {inst.subscriber_type !== 'student' && inst.student_strength > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{inst.student_strength} students</span>}
                        {inst.subscriber_type === 'student' && inst.standard && <span className="flex items-center gap-1 px-1.5 bg-slate-100 rounded text-slate-600">{inst.standard}</span>}
                      </div>
                    </div>

                    {/* Plan Status */}
                    <div className="flex flex-col items-center text-center min-w-[100px]">
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Plan Days
                      </div>
                      {remaining !== null ? (
                        <span className={`text-2xl font-bold ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>{remaining}</span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Not started</span>
                      )}
                      {remaining !== null && <span className="text-xs text-slate-400">of {inst.plan_days} days</span>}
                    </div>

                    {/* Access Code */}
                    <div className="flex flex-col items-center text-center min-w-[100px]">
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        Access Code
                      </div>
                      <span className="font-mono font-bold text-lg tracking-widest text-slate-800">{inst.access_code}</span>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <span className="text-xs text-slate-500">{inst.is_active ? 'Active' : 'Suspended'}</span>
                      <Toggle value={inst.is_active} onChange={() => handleToggle(inst)} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(inst)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilLine className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inst.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditInstituteModal
          institute={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
