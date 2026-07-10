'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Database, Users, Building2, PlusCircle, Settings2, ChevronDown, ChevronUp, User } from 'lucide-react';

const dashboardCards = [
  {
    icon: Database,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Question Management',
    desc: 'Add, modify, and delete questions from the central question bank.',
    href: '/superadmin/dashboard/questions',
    btnLabel: 'Manage Questions',
    btnClass: 'border-blue-300 text-blue-700 hover:bg-blue-50',
    variant: 'outline' as const,
  },
  {
    icon: Users,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Lead Management',
    desc: 'View demo requests from Institutes and Students. Convert leads to accounts.',
    href: '/superadmin/dashboard/leads',
    btnLabel: 'View Leads',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    variant: 'primary' as const,
  },
  {
    icon: PlusCircle,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Create New',
    desc: 'Onboard a new institute or student with a subscription plan and access code.',
    href: '/superadmin/dashboard/institutes/create',
    btnLabel: 'Create New',
    btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    variant: 'primary' as const,
  },
  {
    icon: Settings2,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Manage Accounts',
    desc: 'Edit, suspend, or review all registered subscribers and their plan details.',
    href: '/superadmin/dashboard/institutes/manage',
    btnLabel: 'Manage Accounts',
    btnClass: 'border-orange-300 text-orange-700 hover:bg-orange-50',
    variant: 'outline' as const,
  },
];

export default function SuperAdminDashboard() {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isStatsOpen && !stats) {
      fetch('/api/superadmin/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error(err));
    }
  }, [isStatsOpen, stats]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
        </div>
        <p className="text-slate-500 ml-[52px]">
          Manage the exam engine, subscribers, and leads — all in one place.
        </p>
      </div>

      {/* Stats Dropdown */}
      <div className="mb-10">
        <button
          onClick={() => setIsStatsOpen(!isStatsOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
        >
          {isStatsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Subscriber Statistics
        </button>

        {isStatsOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            {stats ? (
              <>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Institutes</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalInstitutes}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{stats.activeInstitutes} active right now</p>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-purple-600 tracking-wider">Students</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <User className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{stats.activeStudents} active right now</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">Active Plans</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.trialCount + stats.standardCount}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <p className="text-sm text-slate-500">{stats.trialCount} Trials</p>
                      <p className="text-sm text-slate-500">{stats.standardCount} Standard</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="col-span-3 text-slate-500 text-sm py-4">Loading stats...</div>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} hover className="border-slate-200 flex flex-col">
              <CardHeader className="flex-1">
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{card.desc}</p>
              </CardHeader>
              <CardContent>
                <Link href={card.href}>
                  <button className={`w-full py-2.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${card.btnClass}`}>
                    {card.btnLabel}
                  </button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
