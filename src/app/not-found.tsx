import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-12">
        <Logo size="lg" />
      </div>
      
      <h1 className="text-9xl font-black bg-gradient-to-b from-primary-400 to-accent-purple bg-clip-text text-transparent mb-6">
        404
      </h1>
      
      <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
      
      <p className="text-slate-400 max-w-md mx-auto mb-10 text-lg">
        The page you're looking for doesn't exist or has been moved to a new location.
      </p>
      
      <Link href="/">
        <Button variant="primary" size="lg" className="px-8">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
        </Button>
      </Link>
    </div>
  );
}
