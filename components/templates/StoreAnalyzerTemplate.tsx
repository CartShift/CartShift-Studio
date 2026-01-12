'use client';

import React from 'react';
import { StoreAnalyzerContent } from '@/components/sections/StoreAnalyzerContent';

export const StoreAnalyzerTemplate: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <StoreAnalyzerContent />
    </div>
  );
};
