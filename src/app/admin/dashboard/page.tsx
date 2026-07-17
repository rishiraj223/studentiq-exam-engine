'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Users, FileText, Activity, ShieldAlert, Sparkles } from 'lucide-react';

export default function AdminDashboardOverview() {
  const [coachingName, setCoachingName] = useState('');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('exam_coaching_session='));
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        setCoachingName(sessionData.coaching_name || 'Coaching Admin');
      } catch (e) {
        // Ignored, layout handles redirect
      }
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {coachingName}!</h1>
        <p className="text-slate-500 mt-1">This is your dedicated Exam Engine portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg shadow-blue-100 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <h3 className="text-lg text-blue-100 font-medium flex justify-between items-center">
              Total Students
              <Users className="w-5 h-5 text-blue-200" />
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-blue-200 mt-1">Syncing from main portal</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="text-lg text-slate-500 font-medium flex justify-between items-center">
              Tests Conducted
              <FileText className="w-5 h-5 text-indigo-400" />
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">--</div>
            <p className="text-sm text-slate-400 mt-1">Data coming soon</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <h3 className="text-lg text-slate-500 font-medium flex justify-between items-center">
              Platform Health
              <Activity className="w-5 h-5 text-emerald-400" />
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">100%</div>
            <p className="text-sm text-slate-400 mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-8">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Restricted Access</h3>
            <p className="text-slate-600 leading-relaxed">
              For security reasons, your access to the global Question Bank has been temporarily paused. 
              We are building a secure isolated environment where you can manage your own coaching's questions without affecting the global database.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-32 h-32 text-indigo-600" />
          </div>
          <CardContent className="p-8">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Coming Soon: Student Analytics</h3>
            <p className="text-slate-600 leading-relaxed">
              Soon you will be able to track every student's performance on the Exam Engine directly from this dashboard.
              You will see their strongest subjects, weakest chapters, and overall accuracy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
