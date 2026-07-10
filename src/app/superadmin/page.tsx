'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

export default function SuperAdminLogin() {
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey }),
      });

      if (res.ok) {
        toast.success('Access granted.');
        router.push('/superadmin/dashboard');
      } else {
        toast.error('Invalid secret key.');
        setSecretKey('');
      }
    } catch (error) {
      toast.error('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin Portal</h1>
          <p className="text-slate-500 mt-2">Restricted Access. Enter secret key to continue.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-slate-700 mb-2">
                Secret Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  id="secretKey"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-red-500 focus:border-red-500 sm:text-sm bg-slate-50"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
