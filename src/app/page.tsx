import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, Monitor, Database, BarChart3, Building2, Shield, Users, 
  FileText, Target, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
          {/* Animated Background Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] bg-accent-purple/15 rounded-full blur-3xl animate-float"
              style={{ animationDelay: '2s' }}
            />
            <div 
              className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl animate-float"
              style={{ animationDelay: '4s' }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
            <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
              <Badge variant="info" className="mb-8 py-1.5 px-4 text-sm gap-2">
                <Sparkles className="w-4 h-4" /> Built for Coaching Centers
              </Badge>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              The Exam Engine That <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary-400 via-accent-purple-light to-accent-cyan-light bg-clip-text text-transparent">
                Makes Coaching Unstoppable
              </span>
            </h1>
            
            <p className="mt-4 text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '200ms' }}>
              Deploy NTA-identical mock tests for JEE, NEET & MHT-CET in seconds. Our powerful platform syncs student analytics directly to your coaching dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link href="/request-demo" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-10">
                  Request Demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-10">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/5 w-full max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '500ms' }}>
              {[
                { label: 'Questions in Bank', value: '10,000+' },
                { label: 'Supported Exams', value: '3 Types' },
                { label: 'Analytics Sync', value: 'Real-time' },
                { label: 'Platform Security', value: '100%' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-white mb-1">{stat.value}</span>
                  <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 sm:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge variant="default" className="mb-4">Capabilities</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything Your Coaching Needs</h2>
              <p className="text-lg text-slate-400">
                A complete ecosystem designed to give your coaching institute the technical edge over generic learning apps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Monitor, title: 'NTA Exam Simulator', desc: 'Identical interface to the real JEE and NEET exams. Timer, palette, review marks, and auto-submit.', color: 'from-primary-500 to-primary-600' },
                { icon: Database, title: 'Smart Question Bank', desc: 'Pre-loaded with thousands of PYQs tagged by chapter, topic, and difficulty. No manual typing required.', color: 'from-accent-purple to-purple-600' },
                { icon: BarChart3, title: 'Live Analytics', desc: 'Detailed insights on weak areas, time spent per question, and batch-wise performance trends.', color: 'from-accent-cyan to-cyan-600' },
                { icon: Building2, title: 'Multi-Coaching Ready', desc: 'Completely isolated data per coaching center. Your students and tests are securely yours.', color: 'from-emerald-500 to-emerald-600' },
                { icon: Shield, title: 'Secure CBT', desc: 'Advanced tab-switch detection, window monitoring, and copy-paste prevention to maintain test integrity.', color: 'from-amber-500 to-amber-600' },
                { icon: Users, title: 'Parent Portal Sync', desc: 'Results automatically flow back to the main StudentIQ parent app for complete transparency.', color: 'from-rose-500 to-rose-600' },
              ].map((f, i) => (
                <Card key={i} hover className="border-white/5">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 border-t border-white/5 bg-dark-surface/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-slate-400">Launch a professional online test in three simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Desktop connector line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

              {[
                { step: '01', icon: FileText, title: 'Create Test', desc: 'Select exam type, subjects, and chapters. Let the engine auto-generate a balanced paper, or pick manually.' },
                { step: '02', icon: Target, title: 'Students Attempt', desc: 'Generate a secure link. Students take the exam in our NTA-identical interface with strict anti-cheat monitoring.' },
                { step: '03', icon: BarChart3, title: 'Get Analytics', desc: 'Scores and deep insights are instantly calculated and synced back to your coaching dashboard.' },
              ].map((s, i) => (
                <Card key={i} glass={false} className="relative z-10 bg-dark-bg border border-white/10 p-8 flex flex-col items-center text-center">
                  <div className="absolute top-4 right-6 text-6xl font-black text-primary-500/5 select-none">{s.step}</div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dark-surface to-dark-card border border-white/10 flex items-center justify-center mb-6 shadow-xl relative z-10">
                    <s.icon className="w-8 h-8 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 relative z-10">{s.title}</h3>
                  <p className="text-slate-400 relative z-10">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="benefits" className="py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="warning" className="mb-4">Why StudentIQ</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Not Just Another Testing App</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Other apps bypass the coaching center. We empower it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Coaching-Connected', desc: 'When a student struggles with Thermodynamics online, the teacher gets an alert on their dashboard to adjust offline teaching the next day.' },
                { title: 'Zero Data Entry', desc: 'Don\'t waste hours typing math equations. Our system comes pre-loaded with thousands of verified previous year questions.' },
                { title: 'Familiar Interface', desc: 'We mimic the exact color scheme, button placement, and rules of the real exams so students don\'t panic on exam day.' },
              ].map((b, i) => (
                <div key={i} className="bg-dark-card rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-purple opacity-50 group-hover:opacity-100 transition-opacity" />
                  <CheckCircle2 className="w-8 h-8 text-primary-500 mb-6" />
                  <h3 className="text-xl font-bold mb-4 text-white">{b.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-br from-primary-800 via-primary-700 to-accent-purple p-10 sm:p-16 text-center shadow-2xl shadow-primary-900/50 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to Transform Your Coaching?</h2>
                <p className="text-primary-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                  Join forward-thinking institutes providing the ultimate online testing experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/request-demo">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                      Request a Free Demo
                    </Button>
                  </Link>
                  <Link href="/coaching/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-black/20 hover:bg-black/40 border-white/30">
                      Coaching Login
                    </Button>
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
