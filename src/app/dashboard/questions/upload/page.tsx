import React from 'react';
import { QuestionUploader } from '@/features/questions/QuestionUploader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UploadQuestionsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/questions">
          <Button variant="ghost" size="sm" className="-ml-4 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Question Bank
          </Button>
        </Link>
      </div>
      <QuestionUploader />
    </div>
  );
}
