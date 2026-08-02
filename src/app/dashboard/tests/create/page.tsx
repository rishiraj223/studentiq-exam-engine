'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Shield, Users } from 'lucide-react';

export default function CreateTestPage() {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    batch: 'All Batches',
    proctoring: {
      fullScreen: false,
      tabSwitch: false,
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    alert('Test saved and assigned to ' + formData.batch);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tests" className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assign New Test</h1>
          <p className="text-slate-500 mt-1">Configure test details, batches, and security settings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Test Title</label>
            <input 
              type="text" 
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Weekly Physics Mock Test"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <input 
              type="number" 
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="180"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            />
          </div>
        </div>

        {/* Batch Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            Assign to Batch
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Batch</label>
            <select 
              className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
            >
              <option value="All Batches">All Batches</option>
              <option value="Batch A - Morning">Batch A - Morning</option>
              <option value="Batch B - Evening">Batch B - Evening</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Selecting 'All Batches' will make this test available to every enrolled student.</p>
          </div>
        </div>

        {/* Proctoring & Security Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-500" />
            Proctoring & Security
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                checked={formData.proctoring.fullScreen}
                onChange={(e) => setFormData({...formData, proctoring: {...formData.proctoring, fullScreen: e.target.checked}})}
              />
              <div>
                <div className="font-medium text-slate-800">Enforce Full Screen</div>
                <div className="text-sm text-slate-500">Students will be forced to enter full screen to start the test. Exiting full screen will pause or submit the test.</div>
              </div>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                checked={formData.proctoring.tabSwitch}
                onChange={(e) => setFormData({...formData, proctoring: {...formData.proctoring, tabSwitch: e.target.checked}})}
              />
              <div>
                <div className="font-medium text-slate-800">Tab Switch & Focus Detection</div>
                <div className="text-sm text-slate-500">Warn students if they switch tabs or minimize the browser window during the test.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-sm">
            <Save className="w-5 h-5" />
            Save & Assign Test
          </button>
        </div>
      </form>
    </div>
  );
}
