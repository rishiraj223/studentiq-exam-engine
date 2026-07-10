'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function TestSubmittedPage({ searchParams }: { searchParams: Promise<{ score?: string }> }) {
  const [score, setScore] = React.useState<string | null>(null);

  React.useEffect(() => {
    searchParams.then(p => setScore(p.score || null));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Test Submitted!</h1>
        <p className="text-slate-400 mb-6">Your responses have been recorded successfully.</p>
        {score !== null && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
            <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Your Score</p>
            <p className="text-6xl font-bold text-white">{score}</p>
          </div>
        )}
        <p className="text-slate-500 text-sm">Results and detailed analysis will be shared by your instructor.</p>
      </div>
    </div>
  );
}
