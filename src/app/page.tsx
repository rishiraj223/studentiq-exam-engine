import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DemoRequestButton } from '@/components/ui/DemoRequestButton';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles, Monitor, Database, BarChart3, Building2, Shield, Users,
  FileText, Target, CheckCircle2, ArrowRight, Zap, Trophy, Clock, Star
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-grow">

        {/* ─── HERO ───────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">

          {/* Multi-layer background */}
          <div className="absolute inset-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-violet-900" />
            {/* Overlay blobs */}
            <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-indigo-600/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-600/25 rounded-full translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-amber-500/15 rounded-full translate-y-1/2 blur-3xl" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* Hero image — right side */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-indigo-950/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent z-10" />
            <Image
              src="/hero-student-v4.png"
              alt="Student taking exam on StudentIQ platform"
              fill
              className="object-cover object-center opacity-60"
              priority
            />
          </div>

          {/* Content */}
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 w-full">
            <div className="max-w-3xl">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-bold mb-8">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Built for Serious Coaching Centers</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                <span className="text-white">The Exam Engine</span>
                <br />
                <span className="text-white">That Makes</span>
                <br />
                <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Coaching Unstoppable
                </span>
              </h1>

              {/* Sub */}
              <p className="text-lg sm:text-xl text-blue-200 max-w-xl mb-10 leading-relaxed font-medium">
                Deploy NTA-identical mock tests for <span className="text-yellow-300 font-bold">JEE</span>, <span className="text-emerald-300 font-bold">NEET</span> &amp; <span className="text-violet-300 font-bold">MHT-CET</span> in seconds. Powerful analytics synced directly to your coaching dashboard.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 items-center mb-14">
                <Link href="/student/login">
                  <button className="flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-black text-lg rounded-2xl transition-all shadow-[0_6px_0_rgb(217,119,6)] hover:shadow-[0_3px_0_rgb(217,119,6)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]">
                    Student Login <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/admin/login">
                  <button className="flex items-center gap-2 px-7 py-4 bg-white/10 text-white font-bold text-lg rounded-2xl border border-white/20 hover:bg-white/15 transition-all shadow-[0_6px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_0_rgba(255,255,255,0.2)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] backdrop-blur-sm">
                    Admin Login
                  </button>
                </Link>
                <DemoRequestButton />
              </div>

              {/* Trust stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: Database, value: '10,000+', label: 'Questions', color: 'text-yellow-400' },
                  { icon: Clock,    value: '3 Types',  label: 'Exams',    color: 'text-emerald-400' },
                  { icon: Zap,      value: 'Real-time',label: 'Analytics',color: 'text-violet-400' },
                  { icon: Shield,   value: '100%',     label: 'Secure',   color: 'text-sky-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <div>
                      <p className={`text-xl font-black ${s.color} leading-tight`}>{s.value}</p>
                      <p className="text-xs text-blue-300 font-semibold">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ──────────────────────────────────── */}
        <section id="features" className="py-24 sm:py-32 bg-white relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-50 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mb-5 border border-indigo-200">
                <Star className="w-4 h-4 text-indigo-500 fill-indigo-400" />
                Platform Capabilities
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-5 text-slate-900 leading-tight">
                Everything Your Coaching{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Needs</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                A complete ecosystem designed to give your coaching institute the technical edge over generic apps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Monitor, title: 'NTA Exam Simulator',
                  desc: 'Identical interface to the real JEE and NEET exams. Timer, palette, review marks, and auto-submit.',
                  gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-200',
                  border: 'border-indigo-100', accent: 'bg-indigo-50'
                },
                {
                  icon: Database, title: 'Smart Question Bank',
                  desc: 'Pre-loaded with thousands of PYQs tagged by chapter, topic, and difficulty. No manual entry.',
                  gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200',
                  border: 'border-violet-100', accent: 'bg-violet-50'
                },
                {
                  icon: BarChart3, title: 'Live Analytics',
                  desc: 'Detailed insights on weak areas, time spent per question, and batch-wise performance trends.',
                  gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-200',
                  border: 'border-emerald-100', accent: 'bg-emerald-50'
                },
                {
                  icon: Building2, title: 'Multi-Coaching Ready',
                  desc: 'Completely isolated data per coaching center. Your students and tests are securely yours.',
                  gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200',
                  border: 'border-amber-100', accent: 'bg-amber-50'
                },
                {
                  icon: Shield, title: 'Secure CBT',
                  desc: 'Advanced tab-switch detection, window monitoring, and copy-paste prevention for test integrity.',
                  gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-200',
                  border: 'border-rose-100', accent: 'bg-rose-50'
                },
                {
                  icon: Users, title: 'Parent Portal Sync',
                  desc: 'Results automatically flow back to the StudentIQ parent app for complete transparency.',
                  gradient: 'from-sky-500 to-cyan-500', shadow: 'shadow-sky-200',
                  border: 'border-sky-100', accent: 'bg-sky-50'
                },
              ].map((f, i) => (
                <div key={i} className={`group border ${f.border} ${f.accent} rounded-2xl p-6 hover:shadow-xl hover:${f.shadow} transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg shadow-current/20`}>
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-3 text-slate-900 group-hover:text-slate-800">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ───────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black mb-4 text-white">How It Works</h2>
              <p className="text-lg text-blue-300 font-medium">Launch a professional online test in three simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 -translate-y-1/2 z-0" />
              {[
                { step: '01', icon: FileText, title: 'Create Test', desc: 'Select exam type, subjects, and chapters. Let the engine auto-generate a balanced paper or pick questions manually.', color: 'from-indigo-500 to-blue-600' },
                { step: '02', icon: Target,   title: 'Students Attempt', desc: 'Share a secure link. Students take the exam in our NTA-identical interface with strict anti-cheat monitoring.', color: 'from-violet-500 to-purple-600' },
                { step: '03', icon: BarChart3, title: 'Get Analytics', desc: 'Scores and deep insights are instantly calculated and synced back to your coaching dashboard in real-time.', color: 'from-emerald-500 to-teal-500' },
              ].map((s, i) => (
                <div key={i} className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="absolute top-4 right-5 text-7xl font-black text-white/5 select-none">{s.step}</div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                    <s.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-4 text-white">{s.title}</h3>
                  <p className="text-blue-300 leading-relaxed text-sm font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY STUDENTIQ ──────────────────────────────── */}
        <section id="benefits" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold mb-5 border border-amber-200">
                <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                Why StudentIQ?
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-5 text-slate-900">
                Not Just Another{' '}
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Testing App</span>
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">Other apps bypass the coaching center. We empower it.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Coaching-Connected',
                  desc: 'When a student struggles with Thermodynamics online, the teacher gets an alert on their dashboard to adjust offline teaching.',
                  color: 'from-indigo-500 to-blue-600', lightBg: 'bg-indigo-50', border: 'border-indigo-100'
                },
                {
                  title: 'Zero Data Entry',
                  desc: "Don't waste hours typing math equations. Our system comes pre-loaded with thousands of verified previous year questions.",
                  color: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', border: 'border-amber-100'
                },
                {
                  title: 'Familiar Interface',
                  desc: "We mimic the exact color scheme, button placement, and rules of the real exams so students don't panic on exam day.",
                  color: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50', border: 'border-emerald-100'
                },
              ].map((b, i) => (
                <div key={i} className={`${b.lightBg} ${b.border} border rounded-2xl p-8 relative overflow-hidden group`}>
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${b.color}`} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-6 shadow-md`}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-4 text-slate-900">{b.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />

              <div className="relative z-10 py-16 px-10 text-center">
                <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-4">Get Started Today</p>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                  Ready to Transform<br />
                  <span className="text-yellow-400">Your Coaching?</span>
                </h2>
                <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto font-medium leading-relaxed">
                  Join forward-thinking institutes providing the ultimate online testing experience to their students.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/student/login">
                    <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-black text-lg rounded-2xl transition-all shadow-[0_6px_0_rgb(217,119,6)] hover:shadow-[0_3px_0_rgb(217,119,6)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]">
                      Student Login
                    </button>
                  </Link>
                  <Link href="/admin/login">
                    <button className="px-8 py-4 bg-white/15 text-white font-bold text-lg rounded-2xl border border-white/25 hover:bg-white/25 transition-all shadow-[0_6px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_0_rgba(255,255,255,0.2)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px]">
                      Admin Login
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
