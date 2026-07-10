'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DemoRequestModal } from '@/components/ui/DemoRequestModal';
import { Sparkles } from 'lucide-react';

export function DemoRequestButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="lg" 
        className="w-full sm:w-auto text-lg px-10 border-primary-500 text-primary-600 hover:bg-primary-50"
        onClick={() => setIsModalOpen(true)}
      >
        <Sparkles className="mr-2 w-5 h-5" /> Request Demo
      </Button>
      
      <DemoRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
