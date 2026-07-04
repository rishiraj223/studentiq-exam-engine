import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Logo } from '@/components/ui/Logo';
import { DemoForm } from '@/features/demo/DemoForm';

export const metadata: Metadata = {
  title: 'Request Demo | StudentIQ Exam Engine',
  description: 'Request a free demo of the StudentIQ Exam Engine. See how our NTA-identical interface and powerful analytics can transform your coaching.',
};

export default function RequestDemo() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Side - Info */}
          <div className="lg:sticky lg:top-32 h-fit">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Request a{' '}
              <span className="bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent">
                Free Demo
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Experience the power of a dedicated exam engine built specifically for coaching centers. Fill out the form, and our team will get back to you within 24 hours to schedule a personalized walkthrough.
            </p>

            <div className="space-y-6 mb-12">
              {[
                'Free setup and onboarding',
                'Pre-loaded PYQ question bank',
                'Dedicated support team',
                'No commitment required'
              ].map((highlight, i) => (
                <div key={i} className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-4 shrink-0" />
                  <span className="text-lg font-medium text-white/90">{highlight}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 flex items-center gap-6">
              <Logo size="lg" showText={false} />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">Trusted Platform</h4>
                <p className="text-slate-400 text-sm">
                  Join hundreds of forward-thinking coaching institutes across India upgrading their testing infrastructure.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-8">Fill in your details</h2>
            <DemoForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
